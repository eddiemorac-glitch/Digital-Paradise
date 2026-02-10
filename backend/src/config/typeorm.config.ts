import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserLocationSubscriber } from '../modules/users/subscribers/user-location.subscriber';

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'caribe_digital',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    subscribers: [UserLocationSubscriber],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
};
