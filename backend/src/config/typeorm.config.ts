import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserLocationSubscriber } from '../modules/users/subscribers/user-location.subscriber';
import { URL } from 'url';

const entities = [__dirname + '/../**/*.entity{.ts,.js}'];
const subscribers = [UserLocationSubscriber];
const synchronize = process.env.NODE_ENV !== 'production' || process.env.DB_SYNCHRONIZE === 'true';
const logging = process.env.NODE_ENV !== 'production' || process.env.DB_LOGGING === 'true';

const getSslConfig = (dbUrl?: string) => {
    if (!dbUrl) return undefined;
    try {
        const parsed = new URL(dbUrl);
        return {
            rejectUnauthorized: false,
            servername: parsed.hostname,
        };
    } catch (e) {
        return { rejectUnauthorized: false };
    }
};

export const typeOrmConfig: TypeOrmModuleOptions = process.env.DATABASE_URL
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities,
        subscribers,
        synchronize,
        logging,
        ssl: true,
        extra: {
            ssl: getSslConfig(process.env.DATABASE_URL),
        },
    }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'caribe_digital',
        entities,
        subscribers,
        synchronize,
        logging,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
