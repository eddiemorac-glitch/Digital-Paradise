
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';

async function truncateAll() {
    console.log('🚮 Truncating all data tables...');

    const config = {
        ...typeOrmConfig,
        host: '::1',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const dataSource = new DataSource(config as any);
    await dataSource.initialize();

    try {
        await dataSource.query('TRUNCATE TABLE products, events, merchants CASCADE;');
        console.log('✨ Database is now EMPTY of stores, products and events.');

    } catch (error) {
        console.error('❌ Truncate failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

truncateAll();
