import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductsService } from '../products/products.service';
import { MerchantsService } from '../merchants/merchants.service';
import { OrderStatus } from '../../shared/enums/order-status.enum';
import { OrderValidator } from './orders.validator';
import { OrdersGateway } from './orders.gateway'; // Assuming OrdersGateway exists
import { HaciendaService } from '../hacienda/hacienda.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderPaidEvent } from './events/order-paid.event';
import { OrderCancelledEvent } from './events/order-cancelled.event';
import { TilopayService } from '../payments/tilopay.service';
import { EventsService } from '../events/events.service';
import { LogisticsService } from '../logistics/logistics.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../shared/enums/user-role.enum'; // Assuming UsersService is needed for the new constructor

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly productsService: ProductsService,
        private readonly eventsService: EventsService,
        private readonly usersService: UsersService,
        private readonly merchantsService: MerchantsService,
        private readonly orderValidator: OrderValidator,
        private readonly ordersGateway: OrdersGateway,
        private readonly dataSource: DataSource,
        private readonly eventEmitter: EventEmitter2,
        @Inject(forwardRef(() => TilopayService))
        private readonly tilopayService: TilopayService,
        private readonly logisticsService: LogisticsService,
        private readonly haciendaService: HaciendaService,
    ) { }

    /**
     * Centralized Price Calculation (Single Source of Truth)
     * Used by:
     * 1. POST /orders/preview (Frontend/Cart)
     * 2. POST /orders (Order Creation)
     */
    async calculateOrderTotal(
        items: { productId?: string; eventId?: string; eventRequestId?: string; quantity: number; selectedOptions?: any[] }[],
        merchantId: string,
        deliveryLat?: number,
        deliveryLng?: number,
        courierTip: number = 0
    ) {
        const merchant = await this.merchantsService.findOne(merchantId);

        // 1. Fetch Items & Calculate Subtotal
        let itemsSubtotal = 0;
        const validItems: OrderItem[] = [];

        for (const itemDto of items) {
            const orderItem = new OrderItem();
            orderItem.quantity = itemDto.quantity;
            let price = 0;

            if (itemDto.productId) {
                const product = await this.productsService.findOne(itemDto.productId);
                if (product.merchantId !== merchantId) throw new BadRequestException(`Product ${product.name} not from merchant`);
                orderItem.productId = product.id;
                price = product.price;
            } else if (itemDto.eventId) {
                const event = await this.eventsService.findOne(itemDto.eventId);
                if (event.merchantId !== merchantId) throw new BadRequestException(`Event ${event.title} not from merchant`);
                orderItem.eventId = event.id;
                price = event.price;
            } else if (itemDto.eventRequestId) {
                const request = await this.dataSource.getRepository('EventRequest').findOne({ where: { id: itemDto.eventRequestId } }) as any;
                orderItem.eventRequestId = request.id;
                price = request.price;
            }

            if (itemDto.selectedOptions) {
                orderItem.selectedOptions = itemDto.selectedOptions;
                const optionsPrice = itemDto.selectedOptions.reduce((sum: number, opt: any) => sum + (opt.addPrice || 0), 0);
                price += optionsPrice;
            }

            orderItem.price = price;
            orderItem.subtotal = price * itemDto.quantity;
            itemsSubtotal += orderItem.subtotal;
            validItems.push(orderItem);
        }

        // 2. Taxes (IVA 13%)
        const tax = itemsSubtotal * 0.13;

        // 3. Delivery Fee
        let deliveryFee = 0;
        if (deliveryLat && deliveryLng) {
            const deliveryPrep = await this.merchantsService.calculateDelivery(merchantId, deliveryLat, deliveryLng);
            if (!deliveryPrep.inRange) throw new BadRequestException('Out of delivery range');
            deliveryFee = deliveryPrep.fee;
        }

        // 4. Fees
        // Platform Fee: 5% of Subtotal (NOT delivery)
        const PLATFORM_FEE_PERCENT = 0.05;
        const platformFee = itemsSubtotal * PLATFORM_FEE_PERCENT;

        // Courier Earnings: 100% of Delivery Fee (Platform fee is only on items)
        const courierEarnings = deliveryFee;

        // Transaction Fee: 5% + 250 CRC (Applied to FINAL mount the user pays)
        // Formula: Total = (Subtotal + Tax + Delivery + Tip + FlatFee) / (1 - %Fee)
        // But to keep it simple and consistent with current model:
        const TRANSACTION_FEE_FLAT = 250;
        const TRANSACTION_FEE_PERCENT = 0.05;

        const baseAmount = itemsSubtotal + tax + deliveryFee + courierTip;
        const transactionFee = (baseAmount * TRANSACTION_FEE_PERCENT) + TRANSACTION_FEE_FLAT;

        const total = baseAmount + transactionFee;

        return {
            items: validItems,
            breakdown: {
                subtotal: itemsSubtotal,
                tax,
                deliveryFee,
                courierTip,
                platformFee,
                courierEarnings,
                transactionFee,
                total: Math.round(total * 100) / 100 // Round to 2 decimals
            }
        };
    }

    async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
        this.logger.log(`Creating order for user ${userId}: ${JSON.stringify(createOrderDto)}`);
        const { merchantId, items, customerNotes, courierTip } = createOrderDto;

        try {
            // PHASE 1: PRE-TRANSACTION CHECKS & PREPARATION (Fail Fast)
            const merchant = await this.merchantsService.findOne(merchantId);

            // HARDENING: Enforce Merchant Availability (Phase 25)
            const availability = await this.merchantsService.isAvailable(merchantId);
            if (!availability.available) {
                let message = `El comercio "${merchant.name}" no puede aceptar pedidos en este momento.`;
                if (availability.reason === 'MERCHANT_INACTIVE') message = `El comercio "${merchant.name}" está fuera de línea (Offline).`;
                if (availability.reason === 'MERCHANT_BUSY') message = `El comercio "${merchant.name}" está en Modo Saturado (Muy ocupado).`;
                if (availability.reason === 'MERCHANT_CLOSED') message = `El comercio "${merchant.name}" está cerrado actualmente según su horario.`;
                throw new BadRequestException(message);
            }

            const productIds = items.map(i => i.productId).filter(Boolean) as string[];
            const eventIds = items.map(i => i.eventId).filter(Boolean) as string[];
            const eventRequestIds = items.map(i => i.eventRequestId).filter(Boolean) as string[];

            const [products, events, eventRequests] = await Promise.all([
                this.productsService.findByIds(productIds),
                this.eventsService.findByIds(eventIds),
                eventRequestIds.length > 0
                    ? this.dataSource.getRepository('EventRequest').findByIds(eventRequestIds)
                    : Promise.resolve([])
            ]);

            const allFoundItems = [...products, ...events, ...(eventRequests as any[])];
            const allRequestedIds = [...productIds, ...eventIds, ...eventRequestIds];

            this.orderValidator.validateAllExist(allRequestedIds, allFoundItems);
            // Merchant validation might be tricky for requests if they don't have a merchantId in the same way, 
            // but EventRequest has a userId. If the order is for a merchant, the request should theoretically belong to that merchant/user.
            // For simplicity in this phase, we might skip strict merchant match for requests OR ensure the request.userId matches the merchant's owner.
            // But wait, the Order has a merchantId. If I am paying for a request, who is the merchant? 
            // The SYSTEM is the merchant for "Ads". 
            // If I am buying a ticket, the Event Organizer is the merchant.
            // If I am buying an Ad, I am paying the Platform.
            // Implementation Detail: The 'merchantId' in CreateOrderDto usually denotes who receives the money.
            // If it's a Platform fee, merchantId might be a specific System Merchant ID or null?
            // Existing logic requires merchantId. 
            // Let's assume for Ads, we use a specific "Caribe Digital" merchant ID or the user's own merchant ID if it's a self-payment?
            // No, money goes to Platform. 
            // For now, let's keep it simple: The user selects "Caribe Digital" as the merchant for Ads?
            // Or better: The `merchantId` in the order is the Seller. 
            // If I buy an Ad, the Seller is 'Administrator' or 'System'.

            // let's stick to the code flow:

            // PHASE 1: Calculate Financials using Centralized Logic
            const calculation = await this.calculateOrderTotal(
                items,
                merchantId,
                createOrderDto.deliveryLat,
                createOrderDto.deliveryLng,
                courierTip
            );

            const { breakdown, items: preparedItems } = calculation;

            // PHASE 2: TRANSACTION (Persistence Only)
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                const now = new Date();
                const timestampPart = String(now.getTime()).slice(-10);
                const randomSuffix = Math.floor(Math.random() * 999).toString().padStart(3, '0');

                const order = new Order();
                order.userId = userId;
                order.merchantId = merchantId;
                order.status = OrderStatus.PENDING;

                // Map calculated values
                order.subtotal = breakdown.subtotal;
                order.tax = breakdown.tax;
                order.transactionFee = breakdown.transactionFee;
                order.deliveryFee = breakdown.deliveryFee;
                order.platformFee = breakdown.platformFee;
                order.courierEarnings = breakdown.courierEarnings;
                order.total = breakdown.total;
                order.courierEarnings = breakdown.courierEarnings + breakdown.courierTip;

                order.customerNotes = customerNotes;
                order.courierTip = breakdown.courierTip;
                order.deliveryAddress = createOrderDto.deliveryAddress;
                order.deliveryLat = createOrderDto.deliveryLat || 0;
                order.deliveryLng = createOrderDto.deliveryLng || 0;
                order.isElectronicInvoice = true;

                // ... (rest of code)


                order.haciendaKey = this.generateHaciendaKey(now, timestampPart, randomSuffix);
                order.electronicSequence = `0010000101${timestampPart}`;

                await this.logStatusChange(order, OrderStatus.PENDING);

                const savedOrder = await queryRunner.manager.save(Order, order);

                for (const item of preparedItems) {
                    item.orderId = savedOrder.id;
                }

                await queryRunner.manager.save(OrderItem, preparedItems);
                await queryRunner.commitTransaction();

                const finalOrder = await this.findOne(savedOrder.id);
                this.ordersGateway.emitNewOrder(merchantId, finalOrder);

                return finalOrder;

            } catch (err) {
                if (queryRunner.isTransactionActive) {
                    await queryRunner.rollbackTransaction();
                }
                throw err;
            } finally {
                await queryRunner.release();
            }

        } catch (error) {
            this.logger.error(`Order creation failed for user ${userId}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAllByUser(userId: string): Promise<Order[]> {
        return await this.orderRepository.find({
            where: { userId },
            relations: ['merchant', 'items', 'items.product', 'items.event', 'deliveryPerson', 'review', 'logisticsMission', 'logisticsMission.courier'],
            order: { createdAt: 'DESC' },
        });
    }

    async findAllByMerchant(merchantId: string): Promise<Order[]> {
        return await this.orderRepository.find({
            where: { merchantId },
            relations: ['user', 'items', 'items.product', 'items.event', 'deliveryPerson', 'logisticsMission', 'logisticsMission.courier'],
            order: { createdAt: 'DESC' },
            take: 100 // Safety limit for dashboard
        });
    }

    async findAllByDeliveryPerson(deliveryId: string): Promise<Order[]> {
        return await this.orderRepository.find({
            where: { deliveryId },
            relations: ['user', 'merchant', 'items', 'items.product', 'items.event'],
            order: { updatedAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['merchant', 'user', 'items', 'items.product', 'items.event', 'items.product.cabys', 'logisticsMission', 'logisticsMission.courier'],
        });
        if (!order) {
            this.logger.warn(`Order ${id} not found in DB`);
            throw new NotFoundException(`Order ${id} not found`);
        }
        return order;
    }

    async findAll(): Promise<Order[]> {
        return await this.orderRepository.find({
            relations: ['user', 'merchant', 'items', 'items.product', 'items.event', 'deliveryPerson'],
            order: { createdAt: 'DESC' },
        });
    }

    async cancelOrder(id: string, reason?: string): Promise<Order> {
        const order = await this.findOne(id);
        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('Cannot cancel a delivered order');
        }

        await this.logStatusChange(order, OrderStatus.CANCELLED);
        order.metadata = { ...(order.metadata || {}), cancellationReason: reason };
        const savedOrder = await this.orderRepository.save(order);

        // Emit cancellation event for side-effects (Logistics, Credit Note, Rewards)
        this.eventEmitter.emit(
            'order.cancelled',
            new OrderCancelledEvent(savedOrder, reason, 'system') // 'system' or implicitly handled
        );

        // Trigger real-time update
        if (savedOrder.merchantId) {
            this.ordersGateway.emitOrderStatusUpdate(savedOrder.merchantId, savedOrder);
        }

        return savedOrder;
    }

    async forceUpdateStatus(id: string, status: OrderStatus, metadata?: any): Promise<Order> {
        const order = await this.findOne(id);
        await this.logStatusChange(order, status);

        if (metadata) {
            order.metadata = { ...(order.metadata || {}), ...metadata };
        }

        const oldStatus = order.status;
        order.status = status;
        const savedOrder = await this.orderRepository.save(order);

        // Emit event for listeners (Hacienda, Logistics sync, Rewards, etc.)
        this.eventEmitter.emit('order.status_changed', {
            order: savedOrder,
            oldStatus: oldStatus,
            newStatus: status
        });

        // PHASE 18: Auto-trigger logistics mission when READY
        if (status === OrderStatus.READY) {
            try {
                // Ensure merchant details are loaded for the mission
                const fullOrder = await this.orderRepository.findOne({
                    where: { id: savedOrder.id },
                    relations: ['merchant']
                });
                if (fullOrder) {
                    await this.logisticsService.createMissionFromOrder(fullOrder);
                    this.logger.log(`Logistics mission auto-created for order ${id}`);
                }
            } catch (err) {
                this.logger.error(`Failed to auto-create logistics mission for order ${id}: ${err.message}`);
            }
        }

        if (savedOrder.merchantId) {
            this.ordersGateway.emitOrderStatusUpdate(savedOrder.merchantId, savedOrder);
        }

        return savedOrder;
    }

    async updatePaymentStatus(id: string, paymentStatus: string, transactionId?: string): Promise<Order> {
        const order = await this.findOne(id);

        // IDEMPOTENCY GUARD: Exit if already paid or confirmed
        if (order.paymentStatus === 'PAID' || order.status === OrderStatus.CONFIRMED) {
            this.logger.log(`Skipping payment update for order ${id}: Already PAID or CONFIRMED.`);
            return order;
        }

        order.paymentStatus = paymentStatus;
        if (transactionId) {
            order.transactionId = transactionId;
        }

        if (paymentStatus === 'PAID') {
            await this.logStatusChange(order, OrderStatus.CONFIRMED);
            order.metadata = order.metadata || {};

            // Phase 12: Update Event Inventory (Optimized Batch)
            if (order.items && order.items.length > 0) {
                const eventQuantities = new Map<string, number>();
                for (const item of order.items) {
                    if (item.eventId) {
                        eventQuantities.set(item.eventId, (eventQuantities.get(item.eventId) || 0) + item.quantity);
                    }
                }

                for (const [eventId, totalQty] of eventQuantities.entries()) {
                    await this.dataSource.getRepository('Event').increment(
                        { id: eventId },
                        'soldTickets',
                        totalQty
                    );
                }
            }

            // AUTO-UPDATE EVENT REQUESTS (Phase 45: Monetization)
            if (order.items && order.items.length > 0) {
                const requestItems = order.items.filter(i => i.eventRequestId);
                if (requestItems.length > 0) {
                    const requestIds = requestItems.map(i => i.eventRequestId);
                    // Update requests to PAID
                    await this.dataSource.createQueryBuilder()
                        .update('EventRequest')
                        .set({
                            paymentStatus: 'PAID',
                            status: 'PENDING', // Move to PENDING approval queue (or APPROVED if auto-approve enabled)
                            paymentMetadata: {
                                orderId: order.id,
                                paidAt: new Date(),
                                transactionId
                            }
                        })
                        .whereInIds(requestIds)
                        .execute();

                    this.logger.log(`Auto-updated ${requestIds.length} EventRequests to PAID for Order ${order.id}`);
                }
            }

            // Emit event for background tasks (Hacienda, Logistics, Rewards)
            this.eventEmitter.emit(
                'order.paid',
                new OrderPaidEvent(order)
            );
        }

        const savedOrder = await this.orderRepository.save(order);

        if (savedOrder.merchantId) {
            this.ordersGateway.emitOrderStatusUpdate(savedOrder.merchantId, savedOrder);
        }

        return savedOrder;
    }

    async updateOrderMetadata(id: string, partialMetadata: Record<string, any>): Promise<void> {
        try {
            const order = await this.orderRepository.findOne({ where: { id } });
            if (order) {
                order.metadata = { ...(order.metadata || {}), ...partialMetadata };
                await this.orderRepository.save(order);
            }
        } catch (err) {
            this.logger.error(`Failed to update metadata for order ${id}: ${err.message}`);
        }
    }

    private async logStatusChange(order: Order, newStatus: OrderStatus): Promise<void> {
        const oldStatus = order.status;
        const historyEntry = {
            from: oldStatus,
            to: newStatus,
            timestamp: new Date(),
        };
        order.statusHistory = [...(order.statusHistory || []), historyEntry];
        order.status = newStatus;
        // Note: Event emission is handled by the caller (forceUpdateStatus) to avoid double-fire
    }

    // ==================== ADMIN DISPUTE HANDLING ====================

    /**
     * Find all orders with open disputes
     */
    async findOrdersWithDisputes(): Promise<Order[]> {
        const { DisputeStatus } = await import('../../shared/enums/dispute-status.enum');
        return this.orderRepository.find({
            where: [
                { disputeStatus: DisputeStatus.OPEN },
                { disputeStatus: DisputeStatus.INVESTIGATING }
            ],
            relations: ['user', 'merchant', 'items'],
            order: { updatedAt: 'DESC' },
        });
    }

    /**
     * Open a dispute on an order
     */
    async openDispute(orderId: string, reason: string): Promise<Order> {
        const { DisputeStatus } = await import('../../shared/enums/dispute-status.enum');
        const order = await this.findOne(orderId);

        if (order.disputeStatus === DisputeStatus.OPEN || order.disputeStatus === DisputeStatus.INVESTIGATING) {
            throw new BadRequestException('Order already has an open dispute');
        }

        order.disputeStatus = DisputeStatus.OPEN;
        order.disputeReason = reason;
        order.metadata = {
            ...(order.metadata || {}),
            disputeOpenedAt: new Date(),
        };

        this.logger.log(`Dispute opened for order ${orderId}: ${reason}`);
        return this.orderRepository.save(order);
    }

    /**
     * Resolve a dispute
     */
    async resolveDispute(orderId: string, adminUserId: string, resolution: string): Promise<Order> {
        const { DisputeStatus } = await import('../../shared/enums/dispute-status.enum');
        const order = await this.findOne(orderId);

        if (!order.disputeStatus || order.disputeStatus === DisputeStatus.RESOLVED || order.disputeStatus === DisputeStatus.REFUNDED) {
            throw new BadRequestException('No open dispute to resolve');
        }

        order.disputeStatus = DisputeStatus.RESOLVED;
        order.disputeResolvedBy = adminUserId;
        order.disputeResolvedAt = new Date();
        order.metadata = {
            ...(order.metadata || {}),
            disputeResolution: resolution,
            disputeResolvedAt: new Date(),
        };

        this.logger.log(`Dispute resolved for order ${orderId} by admin ${adminUserId}`);
        return this.orderRepository.save(order);
    }

    /**
     * Process refund for an order (marks as refunded, actual refund via payment service)
     */
    async refundOrder(orderId: string, adminUserId: string): Promise<Order> {
        const order = await this.findOne(orderId);
        // Delegate to centralized processRefund method
        return this.processRefund(orderId, order.total, 'Admin requested full refund', adminUserId);
    }

    /**
     * Centralized refund processing (Financial + State Update) - FIXED
     */
    async processRefund(orderId: string, amount: number, reason: string, adminUserId: string): Promise<Order> {
        const order = await this.findOne(orderId);

        if (!order.transactionId) {
            throw new BadRequestException('Order has no transaction ID');
        }

        // 1. Process Financial Refund
        const refundResult = await this.tilopayService.refund(order.transactionId, amount);

        if (!refundResult.success) {
            throw new BadRequestException(`Payment Provider Error: ${refundResult.message}`);
        }

        // 2. Update Order State
        const isFullRefund = amount >= order.total;

        if (isFullRefund) {
            await this.logStatusChange(order, OrderStatus.CANCELLED);
            order.paymentStatus = 'REFUNDED';
        } else {
            order.paymentStatus = 'PARTIALLY_REFUNDED';
        }

        order.metadata = {
            ...(order.metadata || {}),
            lastRefund: {
                amount,
                reason,
                adminId: adminUserId,
                timestamp: new Date(),
                providerMessage: refundResult.message
            }
        };

        const savedOrder = await this.orderRepository.save(order);

        if (savedOrder.merchantId) {
            this.ordersGateway.emitOrderStatusUpdate(savedOrder.merchantId, savedOrder);
        }
        return savedOrder;
    }

    private generateHaciendaKey(now: Date, timestampPart: string, randomSuffix: string): string {
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);

        // Mock Hacienda key structure for Phase 26
        const taxIdMock = '0'.repeat(12);
        const situation = '1';
        const security = (timestampPart + randomSuffix).substring(0, 8);
        const sequence = `0010000101`.padStart(20, '0'); // Corrected to 20 chars

        return `506${day}${month}${year}${taxIdMock}${sequence}${situation}${security}`;
    }

    async emitInvoiceForOrder(orderId: string, userId: string, userRole: UserRole) {
        const order = await this.findOne(orderId);

        if (userRole === UserRole.MERCHANT) {
            const merchant = await this.merchantsService.findByUser(userId);
            if (order.merchantId !== merchant.id) {
                this.logger.warn(`Unauthorized invoice emission attempt by user ${userId} for order ${orderId}`);
                throw new BadRequestException('You are not authorized to emit invoices for this order');
            }
        }

        if (order.paymentStatus !== 'PAID') {
            throw new BadRequestException('Order must be PAID to emit an invoice');
        }

        try {
            this.logger.log(`Attempting manual invoice emission for order ${orderId} by ${userId}`);
            const result = await this.haciendaService.emitInvoice(order);

            if (result && (result.clave || result.status === 'success')) {
                await this.updateOrderMetadata(orderId, {
                    haciendaClave: result.clave,
                    haciendaStatus: 'EMITTED',
                    haciendaEmittedAt: new Date().toISOString()
                });
                return { success: true, message: 'Invoice emitted successfully', clave: result.clave };
            }

            this.logger.error(`Hacienda service returned null for order ${orderId}`);
            throw new Error('Hacienda service unavailable');

        } catch (error) {
            this.logger.error(`Manual Hacienda emission failed for ${orderId}: ${error.message}`, error.stack);
            throw error;
        }
    }
}
