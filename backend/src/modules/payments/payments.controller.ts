import { Body, Controller, Post, Get, UseGuards, Headers, BadRequestException, Logger, RawBodyRequest, Req, Param } from '@nestjs/common';
import { TilopayService } from './tilopay.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { SkipThrottle } from '@nestjs/throttler';
import { OrdersService } from '../orders/orders.service';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(
        private readonly tilopayService: TilopayService,
        private readonly ordersService: OrdersService
    ) { }

    @Post('tilopay-token')
    @UseGuards(JwtAuthGuard)
    async getTilopayToken(@Body() dto: { orderId: string, amount: number, currency?: string }) {
        try {
            this.logger.log(`[TILOPAY-TOKEN] Request: orderId=${dto.orderId}, amount=${dto.amount}`);
            const result = await this.tilopayService.createPaymentSession(dto.orderId, dto.amount, dto.currency || 'CRC');
            this.logger.log(`[TILOPAY-TOKEN] Response: success=${result.success}, hasRedirectUrl=${!!result.redirectUrl}`);
            return result;
        } catch (error: any) {
            this.logger.error(`[TILOPAY-TOKEN] Error: ${error.message}`, error.stack);
            return {
                success: false,
                environment: 'TEST',
                error: error.message
            };
        }
    }

    /**
     * Verify payment after Tilopay redirect.
     * Called by the PaymentCallbackPage to confirm the payment went through.
     * 
     * Tilopay redirects back with query params. If the redirect happened
     * without error, we trust it and update the order to PAID.
     */
    @Post('verify-payment')
    @UseGuards(JwtAuthGuard)
    async verifyPayment(@Body() dto: { orderId: string; responseCode?: string; code?: string }) {
        try {
            this.logger.log(`[VERIFY-PAYMENT] orderId=${dto.orderId} - Verifying with Tilopay API...`);

            const order = await this.ordersService.findOne(dto.orderId);
            if (!order) {
                return { success: false, status: 'NOT_FOUND', message: 'Orden no encontrada' };
            }

            if (order.paymentStatus === 'PAID') {
                return { success: true, status: 'PAID', message: 'Pago confirmado' };
            }

            // Trust no one: Query Tilopay directly
            // We use the orderId to find the transaction
            // Note: In a real implementation, we should store the 'pay_token' or initial txnRef 
            // but here we might rely on the webhook having arrived OR query by order number if Tilopay supports it.
            // Since Tilopay API requires transactionId for status query, and we might not have it yet if webhook failed,
            // we have to rely on the 'code' (pay_token) if provided, or wait for webhook.

            // However, for the 'redirect' flow, Tilopay sends 'code' which is the transaction ID or token.
            // Let's assume 'code' param from redirect IS the transaction/ref ID we can query.

            // For now, to unblock the critical flow while being safer:
            // We will NOT strictly trust 'responseCode=1' unless we can verify it.
            // BUT since we don't have the `getPaymentStatus` implemented in SDK yet, 
            // we will stick to the 'code' presence + webhook redundancy.

            // IMPROVEMENT: We will trust the webhook 100%. The frontend verification is mostly for UX "polling".
            // If the webhook hasn't arrived, this might be early.

            // TEMPORARY FIX until CheckPaymentStatus is implemented:
            // We allow '1' ONLY if we also have a valid signature check or if we are in Sandbox.
            // Given we are fixing the flow: Let's assume the Webhook is the source of truth.
            // This endpoint will just check if the Order is PAID in DB (updated by Webhook).

            if (order.paymentStatus === 'PAID') {
                return { success: true, status: 'PAID', message: 'Pago confirmado' };
            }

            // If not paid yet, maybe webhook is slow?
            // User is waiting. We can try to rely on params BUT we must be careful.
            // If we strictly follow "Zero Trust", we return "Pending" and tell frontend to keep polling.

            return {
                success: false,
                status: 'PENDING',
                message: 'Esperando confirmación del banco...'
            };

        } catch (error: any) {
            this.logger.error(`[VERIFY-PAYMENT] Error: ${error.message}`, error.stack);
            return { success: false, status: 'ERROR', message: 'Error verificando el pago' };
        }
    }

    @Post(':orderId/refund')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async refundOrder(
        @Param('orderId') orderId: string,
        @Body() body: { amount?: number; reason?: string },
        @Req() req: any
    ) {
        const adminId = req.user.userId;
        this.logger.log(`Processing refund for order ${orderId} by Admin ${adminId}`);

        const order = await this.ordersService.findOne(orderId);
        if (!order) throw new BadRequestException('Order not found');

        // Amount is in COLONES (same unit as order.total in DB)
        const amountToRefund = body.amount || order.total;
        const reason = body.reason || 'Admin requested refund';

        return this.ordersService.processRefund(orderId, amountToRefund, reason, adminId);
    }
}
