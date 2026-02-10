import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from '../../shared/enums/order-status.enum';
import { OrdersGateway } from './orders.gateway';
import { UsersService } from '../users/users.service';
import { MerchantsService } from '../merchants/merchants.service';

@Injectable()
export class OrderFulfillmentService {
    private readonly logger = new Logger(OrderFulfillmentService.name);
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly ordersGateway: OrdersGateway,
        private readonly dataSource: DataSource,
        private readonly usersService: UsersService,
        private readonly merchantsService: MerchantsService,
    ) { }


    private async handleLoyaltyPoints(order: Order) {
        const merchant = await this.merchantsService.findOne(order.merchantId);
        if (merchant.isSustainable) {
            // Award 10 points per 1.00 of total (customizable logic)
            const pointsAwarded = Math.floor(Number(order.total) * 10);
            await this.usersService.addPoints(order.userId, pointsAwarded);
            this.logger.log(`🌿 Loyalty System: Awarded ${pointsAwarded} points to user ${order.userId} for sustainable purchase.`);
        }
    }

    async confirmOrder(orderId: string, merchantId: string): Promise<Order> {
        return this.updateStatus(orderId, merchantId, OrderStatus.CONFIRMED);
    }

    async markAsPreparing(orderId: string, merchantId: string): Promise<Order> {
        return this.updateStatus(orderId, merchantId, OrderStatus.PREPARING);
    }

    async markAsReady(orderId: string, merchantId: string): Promise<Order> {
        return this.updateStatus(orderId, merchantId, OrderStatus.READY);
    }

    async completeOrder(orderId: string, merchantId: string): Promise<Order> {
        return this.updateStatus(orderId, merchantId, OrderStatus.DELIVERED);
    }

    async claimOrder(orderId: string, deliveryId: string): Promise<Order> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Lock the order row to prevent race conditions during claim
            const order = await queryRunner.manager.findOne(Order, {
                where: { id: orderId },
                lock: { mode: 'pessimistic_write' }
            });

            if (!order) {
                throw new NotFoundException(`Order ${orderId} not found`);
            }

            const validClaimStatuses = [OrderStatus.PREPARING, OrderStatus.READY];
            if (!validClaimStatuses.includes(order.status)) {
                throw new BadRequestException('Order is not in a claimable state yet');
            }

            if (order.deliveryId) {
                throw new BadRequestException('Order already claimed by another courier');
            }

            order.deliveryId = deliveryId;
            const saved = await queryRunner.manager.save(Order, order);

            await queryRunner.commitTransaction();

            // Notify both merchant and courier after success
            this.ordersGateway.emitOrderStatusUpdate(order.merchantId, saved);

            return saved;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async pickUpOrder(orderId: string, deliveryId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.deliveryId !== deliveryId) throw new ForbiddenException('Not your order');
        if (order.status !== OrderStatus.READY) throw new BadRequestException('Order must be READY to be picked up');

        order.status = OrderStatus.ON_WAY;
        const saved = await this.orderRepository.save(order);
        this.ordersGateway.emitOrderStatusUpdate(order.merchantId, saved);
        return saved;
    }

    async updateStatus(orderId: string, merchantId: string, newStatus: OrderStatus, metadata?: any): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['merchant']
        });

        if (!order) throw new NotFoundException(`Order ${orderId} not found`);

        // TACTICAL STATE MACHINE
        const allowedTransitions: Record<string, string[]> = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
            [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
            [OrderStatus.READY]: [OrderStatus.ON_WAY, OrderStatus.CANCELLED],
            [OrderStatus.ON_WAY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        };

        if (newStatus !== OrderStatus.CANCELLED && !allowedTransitions[order.status]?.includes(newStatus)) {
            throw new BadRequestException(`Cannot move from ${order.status} to ${newStatus}`);
        }

        // POD ENFORCEMENT
        if (newStatus === OrderStatus.DELIVERED) {
            if (!metadata?.podUrl && !metadata?.proofImageUrl) {
                throw new BadRequestException('Proof of Delivery (POD) required for completion');
            }
            order.customerNotes = (order.customerNotes || '') + `\n[POD] Proof provided at ${new Date().toISOString()}`;
        }

        const oldStatus = order.status;
        order.status = newStatus;
        const updatedOrder = await this.orderRepository.save(order);

        if (newStatus === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED) {
            await this.handleLoyaltyPoints(updatedOrder);
        }

        this.ordersGateway.emitOrderStatusUpdate(order.merchantId, updatedOrder);
        return updatedOrder;
    }

    async completeDelivery(orderId: string, deliveryId: string, metadata?: any): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id: orderId } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.deliveryId !== deliveryId) throw new ForbiddenException('Not your order');

        return this.updateStatus(orderId, order.merchantId, OrderStatus.DELIVERED, metadata);
    }

    async findAllReadyForDelivery(): Promise<Order[]> {
        return await this.orderRepository.find({
            where: [
                { status: OrderStatus.PREPARING, deliveryId: null },
                { status: OrderStatus.READY, deliveryId: null }
            ],
            relations: ['merchant', 'items', 'items.product', 'user'],
            order: { createdAt: 'ASC' }
        });
    }
}
