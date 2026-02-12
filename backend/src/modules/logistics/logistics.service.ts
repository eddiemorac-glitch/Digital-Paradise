import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { LogisticsMission } from './entities/logistics-mission.entity';
import { MissionType } from '../../shared/enums/mission-type.enum';
import { OrderStatus } from '../../shared/enums/order-status.enum';
import { calculateDistance, haversineDistanceMeters } from '../../shared/utils/geography';
import { calculateCourierEarnings, calculateEstimatedMinutes, isSurgePricing } from '../../shared/utils/delivery-pricing';
import { Order } from '../orders/entities/order.entity';
import { LogisticsGateway } from './logistics.gateway';
import { Interval } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LogisticsService {
    private readonly logger = new Logger(LogisticsService.name);

    private static readonly ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
        [OrderStatus.READY]: [OrderStatus.ON_WAY, OrderStatus.CANCELLED],
        [OrderStatus.ON_WAY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    };

    constructor(
        @InjectRepository(LogisticsMission)
        private readonly missionRepository: Repository<LogisticsMission>,
        private readonly logisticsGateway: LogisticsGateway,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly eventEmitter: EventEmitter2,
        private readonly dataSource: DataSource,
    ) { }

    async createMission(data: Partial<LogisticsMission>): Promise<LogisticsMission> {
        const mission = this.missionRepository.create(data);
        const savedMission = await this.missionRepository.save(mission);

        this.logisticsGateway.emitNewMission(savedMission);
        return savedMission;
    }

    async findByCourier(courierId: string): Promise<LogisticsMission[]> {
        return this.missionRepository.find({
            where: { courierId },
            relations: ['order', 'order.merchant'],
            order: { updatedAt: 'DESC' },
        });
    }

    async findAllAvailable(type?: MissionType): Promise<LogisticsMission[]> {
        const where: any = { courierId: IsNull() };
        if (type) {
            where.type = type;
        }

        return this.missionRepository.find({
            where,
            relations: ['order', 'order.merchant'],
            order: { createdAt: 'DESC' },
        });
    }

    async findNearby(lat: number, lng: number, radiusMeters: number = 5000): Promise<LogisticsMission[]> {
        // Real PostGIS spatial search
        // Filters missions that are:
        // 1. Unassigned (courierId IS NULL)
        // 2. READY status
        // 3. Within 'radiusMeters' from the provided (lat, lng)
        return this.missionRepository.createQueryBuilder('mission')
            .leftJoinAndSelect('mission.order', 'order')
            .leftJoinAndSelect('order.merchant', 'merchant')
            .where('mission.courierId IS NULL')
            .andWhere('mission.status = :status', { status: OrderStatus.READY })
            .andWhere(
                'ST_DWithin(mission.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
                { lng, lat, radius: radiusMeters }
            )
            .orderBy('mission.createdAt', 'DESC')
            .getMany();
    }

    async claimMission(missionId: string, courierId: string): Promise<LogisticsMission> {
        const courier = await this.userRepository.findOne({ where: { id: courierId } });
        if (!courier || courier.courierStatus !== 'VERIFIED') {
            throw new BadRequestException('Solo repartidores VERIFICADOS pueden aceptar misiones');
        }

        // Use a transaction with pessimistic locking to prevent race conditions
        return await this.dataSource.transaction(async (manager) => {
            const mission = await manager.findOne(LogisticsMission, {
                where: { id: missionId },
                lock: { mode: 'pessimistic_write' } // SELECT ... FOR UPDATE
            });

            if (!mission) throw new NotFoundException('Mission not found');

            // Re-check unassigned status inside the lock
            if (mission.courierId) {
                this.logger.warn(`Race condition avoided: Courier ${courierId} tried to claim already claimed mission ${missionId}`);
                throw new BadRequestException('Esta misión ya ha sido aceptada por otro repartidor');
            }

            mission.courierId = courierId;
            if (mission.status === OrderStatus.PENDING) {
                mission.status = OrderStatus.CONFIRMED;
            }

            const savedMission = await manager.save(mission);
            this.logisticsGateway.emitMissionUpdate(savedMission);
            return savedMission;
        });
    }

    async releaseMission(missionId: string, courierId: string): Promise<LogisticsMission> {
        const mission = await this.missionRepository.findOne({ where: { id: missionId } });
        if (!mission) throw new NotFoundException('Mission not found');

        if (mission.courierId !== courierId) {
            throw new BadRequestException('Cannot release a mission you do not own');
        }

        if (mission.status !== OrderStatus.CONFIRMED && mission.status !== OrderStatus.ON_WAY && mission.status !== OrderStatus.READY) {
            throw new BadRequestException('Cannot release mission in current state');
        }

        mission.courierId = null;
        mission.status = OrderStatus.READY; // Return to pool
        const savedMission = await this.missionRepository.save(mission);

        this.logisticsGateway.emitMissionUpdate(savedMission);
        return savedMission;
    }

    async createMissionFromOrder(order: Order): Promise<LogisticsMission> {
        const existing = await this.missionRepository.findOne({ where: { orderId: order.id } });
        if (existing) return existing;

        // Ensure merchant is loaded to get coordinates
        let merchant = order.merchant;
        if (!merchant && order.merchantId) {
            merchant = await this.dataSource.getRepository('Merchant').findOne({ where: { id: order.merchantId } }) as any;
        }

        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Calculate real distance and pricing
        const originLat = merchant?.latitude || 0;
        const originLng = merchant?.longitude || 0;
        const destLat = order.deliveryLat || 0;
        const destLng = order.deliveryLng || 0;

        const distanceKm = (originLat && destLat)
            ? calculateDistance(originLat, originLng, destLat, destLng)
            : 3; // Default 3km if coordinates missing

        // Determine surge from current pool size
        const poolSize = await this.missionRepository.count({ where: { courierId: IsNull() } });
        const surge = isSurgePricing(poolSize);

        const courierTip = Number(order.courierTip) || 0;
        const earnings = calculateCourierEarnings(distanceKm, surge, courierTip);
        const estimatedMinutes = calculateEstimatedMinutes(distanceKm);

        return this.createMission({
            orderId: order.id,
            clientId: order.userId,
            merchantId: order.merchantId,
            type: MissionType.FOOD_DELIVERY,
            status: OrderStatus.READY,
            originAddress: merchant?.address || 'Comercio',
            originLat,
            originLng,
            destinationAddress: order.deliveryAddress || 'Cliente Desconocido',
            destinationLat: destLat,
            destinationLng: destLng,
            estimatedDistanceKm: parseFloat(distanceKm.toFixed(2)),
            estimatedPrice: earnings,
            estimatedMinutes,
            metadata: { deliveryOtp, isSurge: surge }
        });
    }

    async updateStatus(missionId: string, status: OrderStatus, metadata?: any): Promise<LogisticsMission> {
        const mission = await this.missionRepository.findOne({ where: { id: missionId } });
        if (!mission) throw new NotFoundException('Mission not found');

        const allowed = LogisticsService.ALLOWED_TRANSITIONS[mission.status];
        if (allowed && !allowed.includes(status)) {
            const msg = `Transición de estado inválida: de ${mission.status} a ${status}`;
            this.logger.error(msg);
            throw new BadRequestException(msg);
        }

        if (status === OrderStatus.ON_WAY) {
            mission.pickedUpAt = new Date();
            mission.metadata = { ...(mission.metadata || {}), ...metadata, startedAt: new Date(), tripState: 'ON_WAY' };
        } else if (metadata) {
            mission.metadata = { ...(mission.metadata || {}), ...metadata };
        }

        mission.status = status;
        const savedMission = await this.missionRepository.save(mission);
        this.logisticsGateway.emitMissionUpdate(savedMission);
        return savedMission;
    }

    async updateMissionStatusByOrderId(orderId: string, status: OrderStatus, metadata?: any): Promise<LogisticsMission | null> {
        const mission = await this.missionRepository.findOne({ where: { orderId } });
        if (!mission) return null;

        // Idempotency check
        if (mission.status === status) return mission;

        mission.status = status;
        if (metadata) {
            mission.metadata = { ...(mission.metadata || {}), ...metadata };
        }

        const savedMission = await this.missionRepository.save(mission);
        this.logisticsGateway.emitMissionUpdate(savedMission);
        return savedMission;
    }

    async cancelMissionByOrderId(orderId: string): Promise<void> {
        const mission = await this.missionRepository.findOne({ where: { orderId } });
        if (mission && mission.status !== OrderStatus.CANCELLED) {
            mission.status = OrderStatus.CANCELLED;
            mission.metadata = { ...(mission.metadata || {}), cancelledAt: new Date(), cancelReason: 'Order Cancelled' };
            await this.missionRepository.save(mission);
            this.logisticsGateway.emitMissionUpdate(mission);
        }
    }

    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        return haversineDistanceMeters(lat1, lon1, lat2, lon2);
    }

    @Interval(5000)
    async simulateDroneMovement() {
        const activeMissions = await this.missionRepository.find({
            where: { status: OrderStatus.ON_WAY }
        });

        for (const mission of activeMissions) {
            const currentLat = parseFloat(mission.metadata?.currentLat || mission.originLat as any);
            const currentLng = parseFloat(mission.metadata?.currentLng || mission.originLng as any);
            const destLat = parseFloat(mission.destinationLat as any);
            const destLng = parseFloat(mission.destinationLng as any);

            const distMeters = this.haversineDistance(currentLat, currentLng, destLat, destLng);

            if (distMeters < 300 && !mission.metadata?.arrivalNotified) {
                mission.metadata = {
                    ...(mission.metadata || {}),
                    arrivalNotified: true,
                    arrivalTimestamp: new Date(),
                    tripState: 'NEAR_DESTINATION'
                };

                this.logisticsGateway.server.to(`mission_${mission.id}`).emit('driver_arriving', {
                    missionId: mission.id,
                    orderId: mission.orderId,
                    metersRemaining: Math.round(distMeters)
                });
            }

            if (distMeters > 50) {
                const speedFactor = 0.15;
                const newLat = currentLat + (destLat - currentLat) * speedFactor;
                const newLng = currentLng + (destLng - currentLng) * speedFactor;

                mission.metadata = {
                    ...(mission.metadata || {}),
                    currentLat: newLat,
                    currentLng: newLng,
                    metersToDestination: Math.round(distMeters)
                };

                await this.missionRepository.save(mission);
                this.logisticsGateway.emitDriverLocation(
                    mission.id,
                    newLat,
                    newLng,
                    mission.status,
                    mission.metadata.metersToDestination,
                    mission.metadata.tripState
                );
            } else {
                if (mission.metadata?.tripState !== 'ARRIVED') {
                    mission.metadata = { ...(mission.metadata || {}), tripState: 'ARRIVED' };
                    await this.missionRepository.save(mission);
                }
            }
        }
    }

    async findAllMissions(status?: OrderStatus): Promise<LogisticsMission[]> {
        const query: any = {};
        if (status) query.status = status;
        return this.missionRepository.find({
            where: query,
            relations: ['courier', 'client', 'order', 'order.merchant'],
            order: { updatedAt: 'DESC' },
        });
    }

    async adminAssignCourier(missionId: string, courierId: string, adminUserId: string): Promise<LogisticsMission> {
        const mission = await this.missionRepository.findOne({ where: { id: missionId } });
        if (!mission) throw new NotFoundException('Mission not found');

        mission.courierId = courierId;
        if (mission.status === OrderStatus.PENDING) mission.status = OrderStatus.CONFIRMED;
        mission.metadata = { ...(mission.metadata || {}), assignedByAdmin: adminUserId, assignedAt: new Date() };

        const savedMission = await this.missionRepository.save(mission);
        this.logisticsGateway.emitMissionUpdate(savedMission);
        return savedMission;
    }

    async forceCancelMission(missionId: string, adminUserId: string, reason?: string): Promise<LogisticsMission> {
        const mission = await this.missionRepository.findOne({ where: { id: missionId } });
        if (!mission) throw new NotFoundException('Mission not found');

        mission.status = OrderStatus.CANCELLED;
        mission.metadata = { ...(mission.metadata || {}), cancelledByAdmin: adminUserId, cancelReason: reason, cancelledAt: new Date() };

        const savedMission = await this.missionRepository.save(mission);
        this.logisticsGateway.emitMissionUpdate(savedMission);
        return savedMission;
    }

    async findAllPendingCouriers(): Promise<User[]> {
        return this.userRepository.find({
            where: { courierStatus: 'PENDING' }
        });
    }

    async verifyCourier(id: string, status: 'VERIFIED' | 'REJECTED', reason?: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        user.courierStatus = status;
        // Optionally store reason in metadata or a dedicated field
        return this.userRepository.save(user);
    }

    async verifyDelivery(missionId: string, courierId: string, otp: string, metadata?: any): Promise<LogisticsMission> {
        const mission = await this.missionRepository.findOne({ where: { id: missionId } });
        if (!mission) throw new NotFoundException('Mission not found');
        if (mission.courierId !== courierId) throw new BadRequestException('Solo el transportista asignado puede verificar la entrega');

        const savedOtp = mission.metadata?.deliveryOtp;
        if (!savedOtp || savedOtp !== otp) {
            throw new BadRequestException('Código OTP inválido para la entrega');
        }

        // Calculate actual distance traveled (origin → destination)
        const actualDistanceKm = calculateDistance(
            Number(mission.originLat), Number(mission.originLng),
            Number(mission.destinationLat), Number(mission.destinationLng)
        );

        // Compute final courier earnings based on actual distance
        const isSurge = mission.metadata?.isSurge || false;
        const courierTip = mission.metadata?.courierTip || 0;
        const finalEarnings = calculateCourierEarnings(actualDistanceKm, isSurge, courierTip);

        mission.status = OrderStatus.DELIVERED;
        mission.actualDistanceKm = parseFloat(actualDistanceKm.toFixed(2));
        mission.courierEarnings = finalEarnings;
        mission.completedAt = new Date();
        mission.metadata = {
            ...(mission.metadata || {}),
            ...(metadata || {}),
            verifiedAt: new Date(),
            tripState: 'DELIVERED',
            actualDistanceKm: parseFloat(actualDistanceKm.toFixed(2)),
            courierEarnings: finalEarnings
        };

        const savedMission = await this.missionRepository.save(mission);

        // Event-driven completion — listeners handle Order + User updates
        this.eventEmitter.emit('mission.delivered', { mission: savedMission });

        this.logisticsGateway.emitMissionUpdate(savedMission);
        return savedMission;
    }
}
