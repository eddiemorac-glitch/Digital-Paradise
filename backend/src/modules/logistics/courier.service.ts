import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { LogisticsMission } from './entities/logistics-mission.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../../shared/enums/order-status.enum';

@Injectable()
export class CourierService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(LogisticsMission)
        private readonly missionRepository: Repository<LogisticsMission>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async getStats(courierId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const orders = await this.orderRepository.find({
            where: {
                deliveryId: courierId,
                status: OrderStatus.DELIVERED,
                updatedAt: Between(today, tomorrow)
            }
        });

        const missions = await this.missionRepository.find({
            where: {
                courierId: courierId,
                status: OrderStatus.DELIVERED,
                updatedAt: Between(today, tomorrow)
            }
        });

        const totalOrders = orders.length;
        const totalMissions = missions.length;
        const totalDelivered = totalOrders + totalMissions;

        // Dynamic earnings from food orders (persisted in Order entity)
        const foodEarnings = orders.reduce((sum, o) => sum + (Number(o.courierEarnings) || 0), 0);
        // Logistics missions earnings (now computed via pricing engine)
        const logisticsEarnings = missions.reduce((sum, m) => sum + (Number(m.courierEarnings) || Number(m.estimatedPrice) || 0), 0);

        const weekly = await this.getWeeklyPerformance(courierId);

        // Get courier profile for real cumulative stats
        const courier = await this.userRepository.findOne({ where: { id: courierId } });

        return {
            today: {
                delivered: totalDelivered,
                earnings: foodEarnings + logisticsEarnings,
                breakdown: {
                    food: totalOrders,
                    logistics: totalMissions
                }
            },
            weekly,
            profile: {
                totalEarnings: Number(courier?.totalEarnings) || 0,
                completedDeliveries: courier?.completedDeliveries || 0,
                rating: Number(courier?.courierRating) || 5.0,
                vehicleType: courier?.vehicleType,
                courierStatus: courier?.courierStatus,
            },
            summary: {
                activeMissions: await this.getActiveCount(courierId)
            }
        };
    }

    async getProfile(courierId: string) {
        const courier = await this.userRepository.findOne({ where: { id: courierId } });
        if (!courier) return null;

        return {
            id: courier.id,
            fullName: courier.fullName,
            email: courier.email,
            phoneNumber: courier.phoneNumber,
            vehicleType: courier.vehicleType,
            vehiclePlate: courier.vehiclePlate,
            courierStatus: courier.courierStatus,
            isOnline: courier.isOnline,
            acceptsFood: courier.acceptsFood,
            acceptsParcel: courier.acceptsParcel,
            acceptsRides: courier.acceptsRides,
            totalEarnings: Number(courier.totalEarnings) || 0,
            completedDeliveries: courier.completedDeliveries || 0,
            rating: Number(courier.courierRating) || 5.0,
            points: courier.points,
            avatarId: courier.avatarId,
        };
    }

    async getEarningsHistory(courierId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        const missions = await this.missionRepository.find({
            where: {
                courierId,
                status: OrderStatus.DELIVERED,
            },
            relations: ['order', 'order.merchant'],
            order: { completedAt: 'DESC' },
            take: 100,
        });

        // Filter by date in JS (for simplicity with nullable completedAt)
        const filtered = missions.filter(m => {
            const date = m.completedAt || m.updatedAt;
            return date >= since;
        });

        return filtered.map(m => ({
            id: m.id,
            orderId: m.orderId,
            type: m.type,
            merchantName: m.order?.merchant?.name || 'Misión Independiente',
            originAddress: m.originAddress,
            destinationAddress: m.destinationAddress,
            estimatedDistanceKm: Number(m.estimatedDistanceKm) || 0,
            actualDistanceKm: Number(m.actualDistanceKm) || 0,
            estimatedPrice: Number(m.estimatedPrice) || 0,
            courierEarnings: Number(m.courierEarnings) || 0,
            completedAt: m.completedAt || m.updatedAt,
            pickedUpAt: m.pickedUpAt,
            durationMinutes: m.pickedUpAt && m.completedAt
                ? Math.round((new Date(m.completedAt).getTime() - new Date(m.pickedUpAt).getTime()) / 60000)
                : null,
        }));
    }

    private async getWeeklyPerformance(courierId: string) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Group food orders by day
        const foodStats = await this.orderRepository.createQueryBuilder('order')
            .select("DATE_TRUNC('day', order.updatedAt)", 'date')
            .addSelect('SUM(CAST(order.courierEarnings AS DECIMAL))', 'earnings')
            .addSelect('COUNT(order.id)', 'count')
            .where('order.deliveryId = :courierId', { courierId })
            .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
            .andWhere('order.updatedAt >= :sevenDaysAgo', { sevenDaysAgo })
            .groupBy("DATE_TRUNC('day', order.updatedAt)")
            .getRawMany();

        // Group logistics missions by day
        const logisticsStats = await this.missionRepository.createQueryBuilder('mission')
            .select("DATE_TRUNC('day', mission.updatedAt)", 'date')
            .addSelect('SUM(CAST(mission.courierEarnings AS DECIMAL))', 'earnings')
            .addSelect('COUNT(mission.id)', 'count')
            .where('mission.courierId = :courierId', { courierId })
            .andWhere('mission.status = :status', { status: OrderStatus.DELIVERED })
            .andWhere('mission.updatedAt >= :sevenDaysAgo', { sevenDaysAgo })
            .groupBy("DATE_TRUNC('day', mission.updatedAt)")
            .getRawMany();

        // Combine into a simple 7-day array
        const performance = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dateStr = date.toISOString().split('T')[0];

            const food = foodStats.find(s => new Date(s.date).toISOString().split('T')[0] === dateStr);
            const logistics = logisticsStats.find(s => new Date(s.date).toISOString().split('T')[0] === dateStr);

            performance.push({
                date: dateStr,
                earnings: Number(food?.earnings || 0) + Number(logistics?.earnings || 0),
                deliveries: Number(food?.count || 0) + Number(logistics?.count || 0)
            });
        }

        return performance.reverse();
    }

    private async getActiveCount(courierId: string) {
        const activeStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.ON_WAY];

        const oCount = await this.orderRepository.createQueryBuilder('order')
            .where('order.deliveryId = :courierId', { courierId })
            .andWhere('order.status IN (:...statuses)', { statuses: activeStatuses })
            .getCount();

        const mCount = await this.missionRepository.createQueryBuilder('mission')
            .where('mission.courierId = :courierId', { courierId })
            .andWhere('mission.status IN (:...statuses)', { statuses: activeStatuses })
            .getCount();

        return oCount + mCount;
    }
}
