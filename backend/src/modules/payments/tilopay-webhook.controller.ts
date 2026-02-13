import { Body, Controller, Post, Headers, Logger, InternalServerErrorException, BadRequestException, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { TilopayService } from './tilopay.service';
import { OrdersService } from '../orders/orders.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookLog } from './entities/webhook-log.entity';

@Controller('payments')
export class TilopayWebhookController {
    private readonly logger = new Logger(TilopayWebhookController.name);
    private readonly isSandbox: boolean;

    constructor(
        private readonly tilopayService: TilopayService,
        private readonly ordersService: OrdersService,
        private readonly configService: ConfigService,
        @InjectRepository(WebhookLog)
        private readonly webhookLogRepository: Repository<WebhookLog>,
    ) {
        this.isSandbox = this.configService.get('TILOPAY_SANDBOX', 'true') === 'true';
    }

    @Post('tilopay-webhook')
    @SkipThrottle()
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Body() body: any,
        @Headers('x-tilopay-signature') signature: string
    ) {
        this.logger.log(`[WEBHOOK] Received payload: ${JSON.stringify(body)}`);

        // Extract Order ID (Tilopay sends 'orderNumber' or 'order_id' or 'key')
        const orderId = body.orderNumber || body.order_id || body.key;

        // 1. SAVE LOG FIRST FOR AUDIT
        const log = this.webhookLogRepository.create({
            provider: 'TILOPAY',
            payload: JSON.stringify(body),
            orderId: orderId,
            status: 'RECEIVED'
        });
        await this.webhookLogRepository.save(log);

        try {
            // 2. Verify signature
            const rawBody = req.rawBody;
            if (!rawBody) {
                this.logger.error('[WEBHOOK] Received without raw body');
                throw new BadRequestException('Missing raw body');
            }
            const rawBodyString = rawBody.toString('utf8');

            if (signature) {
                if (!this.tilopayService.verifyWebhookSignature(rawBodyString, signature)) {
                    if (this.isSandbox) {
                        this.logger.warn(`[WEBHOOK] Invalid signature in SANDBOX mode — processing anyway.`);
                        log.status = 'WARN_INVALID_SIGNATURE_SANDBOX';
                    } else {
                        log.status = 'ERROR_INVALID_SIGNATURE';
                        await this.webhookLogRepository.save(log);
                        throw new BadRequestException('Invalid signature');
                    }
                } else {
                    log.status = 'SIGNATURE_VERIFIED';
                }
            } else if (this.isSandbox) {
                this.logger.warn(`[WEBHOOK] No signature header in SANDBOX mode — processing anyway.`);
                log.status = 'WARN_NO_SIGNATURE_SANDBOX';
            } else {
                log.status = 'ERROR_MISSING_SIGNATURE';
                await this.webhookLogRepository.save(log);
                throw new BadRequestException('Missing signature');
            }

            // 3. Process Payment
            // Tilopay logic: status === 'approved'
            if (body.status === 'approved') {
                this.logger.log(`[WEBHOOK] Payment authorized for order ${orderId}`);
                await this.ordersService.updatePaymentStatus(orderId, 'PAID', {
                    tilopayResponse: body,
                    authorizationCode: body.auth_code || body.authorizationCode,
                    transactionId: body.transactionId || body.transaction_id
                });

                log.status = 'PROCESSED';
                await this.webhookLogRepository.save(log);

                return { received: true };
            } else {
                this.logger.warn(`[WEBHOOK] Payment failed/declined for order ${orderId}. Status: ${body.status}`);
                log.status = 'FAILED_PAYMENT';
                await this.webhookLogRepository.save(log);
                return { received: true };
            }

        } catch (error: any) {
            this.logger.error(`[WEBHOOK] Error processing webhook: ${error.message}`);

            // Only update status if it wasn't already set to a specific error
            if (!log.status.startsWith('ERROR')) {
                log.status = 'ERROR_PROCESSING';
            }
            log.errorMessage = error.message;
            await this.webhookLogRepository.save(log);

            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Error processing webhook');
        }
    }
}
