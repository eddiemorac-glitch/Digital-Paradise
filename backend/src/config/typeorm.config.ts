// Trigger new deployment for SNI fix
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserLocationSubscriber } from '../modules/users/subscribers/user-location.subscriber';
import { URL } from 'url';

const entities = [__dirname + '/../**/*.entity{.ts,.js}'];
const subscribers = [UserLocationSubscriber];
const synchronize = process.env.NODE_ENV !== 'production' || process.env.DB_SYNCHRONIZE === 'true';
const logging = process.env.NODE_ENV !== 'production' || process.env.DB_LOGGING === 'true';

let config: TypeOrmModuleOptions;

if (process.env.DATABASE_URL) {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const isProd = process.env.NODE_ENV === 'production';

    config = {
        type: 'postgres',
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port || '5432'),
        username: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1), // Remove leading slash
        entities,
        subscribers,
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        migrationsRun: process.env.NODE_ENV === 'production', // Auto-run in prod
        // CRITICAL: specific prod settings to prevent data loss
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
        logging: process.env.DB_LOGGING === 'true' ? true : ['error', 'warn'],
        ssl: {
            rejectUnauthorized: false, // Required for Render
            servername: dbUrl.hostname, // SNI Requirement
        } as any,
        extra: {
            ssl: {
                rejectUnauthorized: false,
                servername: dbUrl.hostname,
            },
            max: isProd ? 50 : 10, // Optimize connection pool
            idleTimeoutMillis: 30000,
        },
    };
} else {
    config = {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'caribe_digital',
        entities,
        subscribers,
        synchronize: true, // Dev mode: auto-sync allowed
        logging: true,     // Dev mode: verbose logging
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
}

export const typeOrmConfig = config;
