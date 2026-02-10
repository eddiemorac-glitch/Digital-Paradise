import { Controller, Post, Body, Headers, BadRequestException, Logger, Req, RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { TilopayService } from './tilopay.service';
import { OrdersService } from '../orders/orders.service';

interface TilopayWebhookPayload {
    orderNumber: string;
    transactionId: string;
    status: 'approved' | 'declined' | 'error';
    amount: number;
    currency: string;
    paymentMethod: string;
    timestamp: string;
    [key: string]: any; // Allow extra fields from Tilopay
}

@Controller('payments')
export class TilopayWebhookController {
    private readonly logger = new Logger(TilopayWebhookController.name);
    private readonly isSandbox: boolean;

    constructor(
        private tilopayService: TilopayService,
        private ordersService: OrdersService,
        private configService: ConfigService
    ) {
        this.isSandbox = this.configService.get('TILOPAY_SANDBOX', 'true') === 'true';
    }

    @Post('tilopay-webhook')
    @SkipThrottle()
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Body() payload: TilopayWebhookPayload,
        @Headers('x-tilopay-signature') signature: string
    ) {
        this.logger.log(`[WEBHOOK] Received: status=${payload.status}, order=${payload.orderNumber}, txn=${payload.transactionId}`);
        this.logger.debug(`[WEBHOOK] Full payload: ${JSON.stringify(payload)}`);

        // 1. Verify signature
        const rawBody = req.rawBody;
        if (!rawBody) {
            this.logger.error('[WEBHOOK] Received without raw body');
            throw new BadRequestException('Missing raw body');
        }

        const rawBodyString = rawBody.toString('utf8');

        if (signature) {
            // Signature present — verify it
            if (!this.tilopayService.verifyWebhookSignature(rawBodyString, signature)) {
                if (this.isSandbox) {
                    // In sandbox: log warning but still process
                    this.logger.warn(`[WEBHOOK] Invalid signature in SANDBOX mode — processing anyway. Order: ${payload.orderNumber}`);
                } else {
                    // In production: reject
                    this.logger.error(`[WEBHOOK] Invalid signature REJECTED for order ${payload.orderNumber}`);
                    throw new BadRequestException('Invalid signature');
                }
            } else {
                this.logger.log(`[WEBHOOK] Signature verified ✅ for order ${payload.orderNumber}`);
            }
        } else if (this.isSandbox) {
            // No signature in sandbox — allow
            this.logger.warn(`[WEBHOOK] No signature header in SANDBOX mode — processing anyway. Order: ${payload.orderNumber}`);
        } else {
            // No signature in production — reject
            this.logger.error(`[WEBHOOK] Missing signature header REJECTED for order ${payload.orderNumber}`);
            throw new BadRequestException('Missing signature');
        }

        // 2. Validate required fields
        if (!payload.orderNumber) {
            this.logger.error('[WEBHOOK] Missing orderNumber in payload');
            throw new BadRequestException('Missing orderNumber');
        }

        // 3. Update order based on status
        const isSuccess = payload.status === 'approved';
        const paymentStatus = isSuccess ? 'PAID' : 'FAILED';

        try {
            await this.ordersService.updatePaymentStatus(
                payload.orderNumber,
                paymentStatus,
                payload.transactionId
            );
            this.logger.log(`[WEBHOOK] Order ${payload.orderNumber} updated to ${paymentStatus}`);
        } catch (error: any) {
            this.logger.error(`[WEBHOOK] Failed to update order ${payload.orderNumber}: ${error.message}`);
            // Don't throw — return 200 to Tilopay so it doesn't retry indefinitely
        }

        return { received: true };
    }
}
