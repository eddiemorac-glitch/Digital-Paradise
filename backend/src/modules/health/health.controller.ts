import { Controller, Get, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CircuitBreaker } from '../../shared/utils/circuit-breaker.util';

@Controller('health')
export class HealthController {
    constructor(
        private readonly dataSource: DataSource,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    @Get()
    async check() {
        const start = Date.now();

        // 1. Database Check
        let dbStatus = 'down';
        try {
            await this.dataSource.query('SELECT 1');
            dbStatus = 'up';
        } catch (e) {
            console.error('Health Check DB Error:', e);
        }

        // 2. Cache Check (Redis)
        let cacheStatus = 'down';
        try {
            await this.cacheManager.set('health_check', 'ok', 10000);
            const val = await this.cacheManager.get('health_check');
            if (val === 'ok') cacheStatus = 'up';
        } catch (e) {
            // Cache might be optional or local
            cacheStatus = 'unknown';
        }

        // 3. Memory & Uptime
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        // 4. Circuit Breakers
        const circuitStatus = CircuitBreaker.getSystemStatus();

        const responseTime = Date.now() - start;

        return {
            status: dbStatus === 'up' ? 'ok' : 'error',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            response_time_ms: responseTime,
            services: {
                database: dbStatus,
                cache: cacheStatus,
                api: 'up'
            },
            circuit_breakers: circuitStatus,
            system: {
                uptime_seconds: Math.floor(uptime),
                memory_rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
                memory_heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
            },
            version: '2.2.0-ANTIFRAGILE'
        };
    }
}
