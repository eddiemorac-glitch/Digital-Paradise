import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

/**
 * Global Cache Module using in-memory store.
 * For production, switch to Redis by installing redis and cache-manager-redis-yet,
 * then update the store configuration.
 */
@Global()
@Module({
    imports: [
        NestCacheModule.register({
            ttl: 60000, // 60 seconds default TTL
            max: 100,   // Maximum number of items in cache
            isGlobal: true,
        }),
    ],
    exports: [NestCacheModule],
})
export class CacheModule { }
