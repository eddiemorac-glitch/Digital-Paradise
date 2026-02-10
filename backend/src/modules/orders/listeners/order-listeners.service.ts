import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../../../shared/enums/order-status.enum';
import { OrderPaidEvent } from '../events/order-paid.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { HaciendaService } from '../../hacienda/hacienda.service';
import { LogisticsService } from '../../logistics/logistics.service';
import { RewardsService } from '../../rewards/rewards.service';
import { EmailsService } from '../../emails/emails.service';
import { PdfService } from '../../emails/pdf.service';
import { OrdersGateway } from '../orders.gateway';

@Injectable()
export class OrderListenersService {
    private readonly logger = new Logger(OrderListenersService.name);

    constructor(
        private readonly haciendaService: HaciendaService,
        private readonly logisticsService: LogisticsService,
        private readonly rewardsService: RewardsService,
        private readonly emailsService: EmailsService,
        private readonly pdfService: PdfService,
        private readonly ordersGateway: OrdersGateway,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) { }

    @OnEvent('order.paid', { async: true })
    async handleOrderPaid(payload: OrderPaidEvent) {
        const { order } = payload;
        this.logger.log(`Processing 'order.paid' event for Order ID: ${order.id}`);

        // 1. Emit Electronic Invoice via HaciendaCore
        let haciendaResult = null;
        try {
            haciendaResult = await this.haciendaService.emitInvoice(order);
            this.logger.log(`✅ Hacienda invoice emitted for order ${order.id}`);
        } catch (err) {
            this.logger.error(`❌ Hacienda emission failed for order ${order.id}: ${err.message}`);
        }

        // 2. Generate and Send Invoice PDF
        try {
            const invoiceBuffer = await this.pdfService.generateInvoicePdf(order, haciendaResult || {});
            const attachments = [{
                filename: `factura-${order.id.slice(0, 8)}.pdf`,
                content: invoiceBuffer
            }];

            await this.emailsService.sendEmail(
                order.user?.email,
                `Confirmación de Pedido #${order.id.slice(0, 8)} - Caribe Digital`,
                `<p>¡Gracias por tu compra! Adjunto encontrarás tu factura electrónica.</p>`,
                attachments
            );
            this.logger.log(`✅ Invoice PDF sent to ${order.user?.email}`);
        } catch (err) {
            this.logger.error(`❌ Failed to send invoice PDF for order ${order.id}: ${err.message}`);
        }

        // 3. Generate and Send Event Tickets (if applicable)
        if (order.items && order.items.length > 0) {
            const eventItems = order.items.filter(item => item.eventId && item.event);
            for (const item of eventItems) {
                try {
                    const ticketBuffer = await this.pdfService.generateEventTicketPdf(order, item.event);
                    await this.emailsService.sendEmail(
                        order.user?.email,
                        `Tu Entrada: ${item.event.title}`,
                        `<p>¡Hola! Aquí tienes tu entrada digital para <b>${item.event.title}</b>. Por favor, presenta el código QR adjunto en la entrada.</p>`,
                        [{
                            filename: `ticket-${item.event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
                            content: ticketBuffer
                        }]
                    );
                    this.logger.log(`✅ Event ticket sent for ${item.event.title}`);
                } catch (err) {
                    this.logger.error(`❌ Failed to send ticket for event ${item.event?.id}: ${err.message}`);
                }
            }
        }

        // 4. Create Logistics Mission
        try {
            await this.logisticsService.createMissionFromOrder(order);
            this.logger.log(`✅ Logistics mission created for order ${order.id}`);
        } catch (err) {
            this.logger.error(`❌ Logistics mission failed for order ${order.id}: ${err.message}`);
        }

        // 5. Award Sustainability Rewards
        try {
            await this.rewardsService.awardPointsForOrder(order);
            this.logger.log(`✅ Rewards awarded for order ${order.id}`);
        } catch (err) {
            this.logger.error(`❌ Rewards awarding failed for order ${order.id}: ${err.message}`);
        }

        // 6. Notify Merchant (Real-time)
        if (order.merchantId) {
            this.ordersGateway.emitOrderStatusUpdate(order.merchantId, order);
        }
    }

    @OnEvent('order.cancelled', { async: true })
    async handleOrderCancelled(payload: OrderCancelledEvent) {
        const { order, reason } = payload;
        this.logger.log(`Processing 'order.cancelled' event for Order ID: ${order.id}`);

        // 1. Cancel Logistics Mission
        try {
            await this.logisticsService.cancelMissionByOrderId(order.id);
            this.logger.log(`✅ Logistics mission cancelled for order ${order.id}`);
        } catch (err) {
            this.logger.error(`❌ Logging mission cancellation failed for order ${order.id}: ${err.message}`);
        }

        // 2. Emit Credit Note (if applicable)
        if (order.paymentStatus === 'PAID' && order.haciendaKey) {
            try {
                await this.haciendaService.emitCreditNote(order, order.haciendaKey, reason || 'Pedido Cancelado');
                this.logger.log(`✅ Credit Note emitted for order ${order.id}`);
            } catch (err) {
                this.logger.error(`❌ Credit Note emission failed for order ${order.id}: ${err.message}`);
            }
        }

        // 3. Revert Rewards
        try {
            await this.rewardsService.deductPointsForOrder(order);
            this.logger.log(`✅ Rewards deducted for order ${order.id}`);
        } catch (err) {
            this.logger.error(`❌ Rewards deduction failed for order ${order.id}: ${err.message}`);
        }

        // 4. Notify Merchant
        if (order.merchantId) {
            this.ordersGateway.emitOrderStatusUpdate(order.merchantId, order);
        }
    }

    @OnEvent('order.status_changed', { async: true })
    async handleOrderStatusChanged(payload: { order: any, oldStatus: string, newStatus: string }) {
        const { order, newStatus } = payload;

        try {
            await this.logisticsService.updateMissionStatusByOrderId(order.id, newStatus as any, order.metadata);
        } catch (err) {
            // Ignore if mission doesn't exist
        }
    }

    @OnEvent('mission.delivered', { async: true })
    async handleMissionDelivered(payload: { mission: any }) {
        const { mission } = payload;
        this.logger.log(`Mission ${mission.id} delivered. Updating Order ${mission.orderId} to DELIVERED.`);

        try {
            const order = await this.orderRepository.findOne({
                where: { id: mission.orderId },
                relations: ['merchant', 'user']
            });

            if (order && order.status !== OrderStatus.DELIVERED) {
                // 1. Update order status and sync courier earnings
                order.status = OrderStatus.DELIVERED;
                order.courierEarnings = Number(mission.courierEarnings) || Number(order.courierEarnings) || 0;
                order.deliveryId = mission.courierId;
                order.metadata = {
                    ...(order.metadata || {}),
                    deliveredAt: new Date(),
                    deliveredByMissionId: mission.id,
                    actualDistanceKm: mission.actualDistanceKm
                };

                const savedOrder = await this.orderRepository.save(order);

                // 2. Increment courier cumulative stats
                if (mission.courierId) {
                    try {
                        await this.orderRepository.manager.query(
                            `UPDATE "users" SET 
                                "totalEarnings" = COALESCE("totalEarnings", 0) + $1,
                                "completedDeliveries" = COALESCE("completedDeliveries", 0) + 1
                            WHERE "id" = $2`,
                            [Number(mission.courierEarnings) || 0, mission.courierId]
                        );
                        this.logger.log(`✅ Courier ${mission.courierId} stats updated: +₡${mission.courierEarnings}`);
                    } catch (err) {
                        this.logger.error(`❌ Failed to update courier stats: ${err.message}`);
                    }
                }

                // 3. Notify Merchant via Gateway
                if (savedOrder.merchantId) {
                    this.ordersGateway.emitOrderStatusUpdate(savedOrder.merchantId, savedOrder);
                }

                this.logger.log(`✅ Order ${order.id} closed successfully via Mission completion.`);
            }
        } catch (err) {
            this.logger.error(`Failed to handle mission delivery side-effects for order ${mission.orderId}: ${err.message}`);
        }
    }
}
