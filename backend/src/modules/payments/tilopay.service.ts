import { Injectable, Logger, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { OrdersService } from '../orders/orders.service';
import { CircuitBreaker } from '../../shared/utils/circuit-breaker.util';

interface TilopayConfig {
    apiKey: string;
    apiUser: string;
    apiPassword: string;
    sandbox: boolean;
    baseUrl?: string;
}

export interface PaymentSessionResult {
    success: boolean;
    redirectUrl?: string;
    environment: string;
    error?: string;
}

@Injectable()
export class TilopayService {
    private readonly logger = new Logger(TilopayService.name);
    private readonly config: TilopayConfig;
    private readonly baseUrl: string;
    private readonly circuitBreaker: CircuitBreaker;
    private readonly frontendUrl: string;
    private readonly backendUrl: string;

    constructor(
        private configService: ConfigService,
        @Inject(forwardRef(() => OrdersService))
        private readonly ordersService: OrdersService
    ) {
        this.config = {
            apiKey: this.configService.getOrThrow<string>('TILOPAY_API_KEY'),
            apiUser: this.configService.getOrThrow<string>('TILOPAY_API_USER'),
            apiPassword: this.configService.getOrThrow<string>('TILOPAY_API_PASSWORD'),
            sandbox: this.configService.get('TILOPAY_SANDBOX', 'true') === 'true',
            baseUrl: this.configService.get<string>('TILOPAY_BASE_URL'),
        };

        this.baseUrl = this.config.baseUrl || 'https://app.tilopay.com/api/v1';

        // CRITICAL: Fail fast if URLs are missing in production. 
        // In dev, we can fallback, but we should be explicit.
        this.frontendUrl = this.configService.get('FRONTEND_URL') || 'https://digital-paradise-v2.vercel.app';
        this.backendUrl = this.configService.get('BACKEND_URL') || 'https://digital-paradise.onrender.com';

        if (!this.frontendUrl.startsWith('http')) {
            this.logger.error('FRONTEND_URL environment variable is invalid');
        }

        // Initialize Circuit Breaker
        this.circuitBreaker = new CircuitBreaker('Tilopay', {
            failureThreshold: 3,
            recoveryTimeout: 30000
        });

        this.logger.log(`TILOPAY initialized in ${this.config.sandbox ? 'SANDBOX' : 'PRODUCTION'} mode — REDIRECT flow`);
    }

    /**
     * Internal authentication to get a JWT from Tilopay
     */
    private async authenticate(): Promise<string> {
        return this.circuitBreaker.execute(async () => {
            try {
                const response = await axios.post(`${this.baseUrl}/login`, {
                    apiuser: this.config.apiUser,
                    password: this.config.apiPassword,
                    key: this.config.apiKey
                }, { timeout: 5000 });

                if (response.data?.access_token) {
                    return response.data.access_token;
                }
                throw new Error('No access_token in response');
            } catch (error: any) {
                throw error;
            }
        }).catch(error => {
            this.logger.error(`Tilopay Auth Failed (Circuit Controlled): ${error.message}`);
            throw new InternalServerErrorException('Error de comunicación con Tilopay (Auth)');
        });
    }

    /**
     * Create a payment session with Tilopay via processPayment.
     * Returns the Tilopay hosted payment page URL for redirect.
     * 
     * Flow:
     * 1. Backend authenticates → JWT
     * 2. Backend calls processPayment → gets redirect URL
     * 3. Frontend redirects user to Tilopay's hosted payment page
     * 4. User completes payment on Tilopay
     * 5. Tilopay redirects back to our callback URL
     * 6. Webhook notifies backend of payment result
     */
    async createPaymentSession(
        orderId: string,
        amount: number,
        currency: string = 'CRC'
    ): Promise<PaymentSessionResult> {
        try {
            // Duplicate payment protection
            try {
                const order = await this.ordersService.findOne(orderId);
                if (order.paymentStatus === 'PAID') {
                    this.logger.warn(`[TILOPAY] Order ${orderId} already PAID — blocking duplicate session`);
                    return {
                        success: false,
                        environment: this.config.sandbox ? 'TEST' : 'PROD',
                        error: 'Este pedido ya fue pagado.'
                    };
                }
            } catch (e) {
                // Order not found — let processPayment handle it
            }

            const jwt = await this.authenticate();
            const formattedAmount = (amount / 100).toFixed(2);

            this.logger.log(`[TILOPAY] Creating payment session: order=${orderId}, amount=${formattedAmount} ${currency}`);

            const response = await axios.post(`${this.baseUrl}/processPayment`, {
                key: this.config.apiKey,
                amount: formattedAmount,
                currency,
                orderNumber: orderId,
                redirect: `${this.frontendUrl}/payment/callback`,
                callbackUrl: `${this.backendUrl}/api/payments/tilopay-webhook`,
                billToFirstName: 'Cliente',
                billToLastName: 'Caribe Digital',
                billToEmail: 'pagos@caribedigital.cr',
                billToAddress: 'Puerto Viejo, Limón',
                billToCity: 'Limón',
                billToCountry: 'CR',
                billToState: 'LI',
                billToTelephone: '00000000',
                capture: '1',
                language: 'es',
            }, {
                headers: { 'Authorization': `bearer ${jwt}` },
                timeout: 15000
            });

            const data = response.data;
            this.logger.log(`[TILOPAY] processPayment response: type=${data.type}, url=${data.url}`);

            // processPayment returns: { type: "100", html: "Use url redirect", url: "https://securepayment.tilopay.com/?code=..." }
            if (data.url) {
                return {
                    success: true,
                    redirectUrl: data.url,
                    environment: this.config.sandbox ? 'TEST' : 'PROD',
                };
            }

            throw new Error(data.message || data.html || 'No redirect URL in Tilopay response');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            this.logger.error(`[TILOPAY] Payment session error: ${errorMessage}`);

            return {
                success: false,
                environment: this.config.sandbox ? 'TEST' : 'PROD',
                error: `Error Tilopay: ${errorMessage}`
            };
        }
    }

    /**
     * Verify webhook signature to prevent spoofing
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const expectedSignature = createHmac('sha256', this.config.apiKey)
            .update(payload)
            .digest('hex');

        try {
            return timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );
        } catch (e) {
            return false;
        }
    }

    /**
     * Process a refund for a transaction.
     * @param transactionId - Tilopay transaction ID
     * @param amountInColones - Amount to refund in COLONES (e.g. 15000 for ₡15,000)
     */
    async refund(transactionId: string, amountInColones: number): Promise<{ success: boolean; message: string }> {
        try {
            const jwt = await this.authenticate();
            const formattedAmount = amountInColones.toFixed(2);
            this.logger.log(`[TILOPAY] Processing refund: txn=${transactionId}, amount=${formattedAmount} CRC`);

            const response = await axios.post(`${this.baseUrl}/refund`, {
                transactionId,
                amount: formattedAmount,
                key: this.config.apiKey
            }, {
                headers: { 'Authorization': `bearer ${jwt}` }
            });

            return {
                success: response.data?.success || false,
                message: response.data?.message || 'Refund process initiated'
            };
        } catch (error: any) {
            this.logger.error(`Tilopay Refund Error: ${error.response?.data?.error || error.message}`);
            return {
                success: false,
                message: error.response?.data?.error || 'Error processing refund'
            };
        }
    }
}
