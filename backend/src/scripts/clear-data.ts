
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { User } from '../modules/users/entities/user.entity';
import { Merchant } from '../modules/merchants/entities/merchant.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Event } from '../modules/events/entities/event.entity';

async function clearData() {
    console.log('🧹 Clearing Database for Fresh Seed...');

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
        console.log('🗑️ Deleting Products...');
        await dataSource.getRepository(Product).delete({});

        console.log('🗑️ Deleting Events...');
        await dataSource.getRepository(Event).delete({});

        console.log('🗑️ Deleting Merchants...');
        await dataSource.getRepository(Merchant).delete({});

        console.log('✨ Data cleared successfully!');

    } catch (error) {
        console.error('❌ Clear failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

clearData();
