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
    config = {
        type: 'postgres',
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port || '5432'),
        username: dbUrl.username,
        password: dbUrl.password,
        database: dbUrl.pathname.slice(1), // Remove leading slash
        entities,
        subscribers,
        synchronize: true, // Force sync to fix missing tables
        logging,
        ssl: {
            rejectUnauthorized: false, // Required for Render
            servername: dbUrl.hostname, // SNI Requirement
        } as any, // Cast to any to avoid TlsOptions type error
        extra: {
            ssl: {
                rejectUnauthorized: false,
                servername: dbUrl.hostname,
            },
        },
    };
    // console.log('Using MANUAL parsing for DATABASE_URL');
    // console.log('Hostname:', dbUrl.hostname);
    // console.log('SSL Config:', JSON.stringify(config.ssl));
    // console.log('Extra Config:', JSON.stringify(config.extra));

    // CRASH FOR DEBUGGING to ensure we see the values
    throw new Error(`DEBUG CRASH: Hostname=${dbUrl.hostname}, SSL=${JSON.stringify(config.ssl)}`);
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
        synchronize: true, // Force sync local
        logging,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
}

export const typeOrmConfig = config;
