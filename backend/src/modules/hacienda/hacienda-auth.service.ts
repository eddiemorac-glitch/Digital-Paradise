import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as qs from 'qs';
import { Merchant } from '../merchants/entities/merchant.entity';

interface TokenCache {
    accessToken: string;
    expiresAt: number;
}

@Injectable()
export class HaciendaAuthService {
    private readonly logger = new Logger(HaciendaAuthService.name);
    private readonly tokenUrl: string;
    private readonly clientId: string;

    // Cache map: merchantId -> TokenCache
    // Key 'PLATFORM' is used for the platform's own token
    private tokenCache = new Map<string, TokenCache>();

    constructor(private configService: ConfigService) {
        const isSandbox = this.configService.get('HACIENDA_SANDBOX', 'true') === 'true';

        this.tokenUrl = isSandbox
            ? 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token'
            : 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token';

        this.clientId = isSandbox ? 'api-stag' : 'api-prod';
    }

    /**
     * Get Access Token for a specific Merchant (or Platform if no merchant provided)
     */
    async getAccessToken(merchant?: Merchant): Promise<string> {
        const cacheKey = merchant ? merchant.id : 'PLATFORM';
        const cached = this.tokenCache.get(cacheKey);

        if (cached && Date.now() < cached.expiresAt - 30000) {
            return cached.accessToken;
        }

        return this.refreshToken(merchant);
    }

    private async refreshToken(merchant?: Merchant): Promise<string> {
        try {
            // Determine credentials
            let username = '';
            let password = '';

            if (merchant) {
                if (!merchant.haciendaUsername || !merchant.haciendaPassword) {
                    throw new Error(`Merchant ${merchant.name} missing Hacienda credentials`);
                }
                username = merchant.haciendaUsername;
                password = merchant.haciendaPassword;
            } else {
                username = this.configService.getOrThrow<string>('HACIENDA_IDP_USER');
                password = this.configService.getOrThrow<string>('HACIENDA_IDP_PIN');
            }

            this.logger.log(`Refreshing Hacienda Access Token for ${username} (${merchant ? 'Merchant' : 'Platform'})`);

            const data = {
                grant_type: 'password',
                client_id: this.clientId,
                username: username,
                password: password,
            };

            const response = await axios.post(this.tokenUrl, qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 10000
            });

            const accessToken = response.data.access_token;
            const expiresAt = Date.now() + (response.data.expires_in * 1000);

            // Update Cache
            this.tokenCache.set(merchant ? merchant.id : 'PLATFORM', {
                accessToken,
                expiresAt
            });

            this.logger.log(`✅ Hacienda Token refreshed for ${username}`);
            return accessToken;
        } catch (error: any) {
            this.logger.error(`❌ Failed to refresh Hacienda Token: ${error.response?.data?.error_description || error.message}`);
            // If merchant login fails, we should update their status
            if (merchant) {
                // Ideally emit an event or update DB here, but to avoid circular deps we just log for now
                this.logger.warn(`Merchant ${merchant.id} credentials might be invalid`);
            }
            throw new InternalServerErrorException('Error de autenticación con Hacienda');
        }
    }
}
