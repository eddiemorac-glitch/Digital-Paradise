import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

/**
 * Global Cache Module.
 * Uses Redis if REDIS_URL is set (Production/Scalable).
 * Falls back to Memory if not (Dev/Simple).
 */
@Global()
@Module({
    imports: [
        NestCacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.get<string>('REDIS_URL');
                if (redisUrl) {
                    return {
                        store: await redisStore({
                            url: redisUrl,
                            ttl: 60000,
                        }),
                        isGlobal: true,
                    } as any;
                }
                return {
                    ttl: 60000,
                    max: 100,
                    isGlobal: true,
                };
            },
        }),
    ],
    exports: [NestCacheModule],
})
export class CacheModule { }
