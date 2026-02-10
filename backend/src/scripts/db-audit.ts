
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { User } from '../modules/users/entities/user.entity';
import { Merchant } from '../modules/merchants/entities/merchant.entity';

async function dbAudit() {
    console.log('🔍 Database Audit Starting...');

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
        console.log('--- USERS ---');
        const users = await dataSource.getRepository(User).find();
        users.forEach(u => console.log(`- ${u.email} [${u.role}] (Active: ${u.isActive})`));

        console.log('\n--- MERCHANTS ---');
        const merchants = await dataSource.getRepository(Merchant).find();
        merchants.forEach(m => console.log(`- ${m.name} [ID: ${m.id}]`));

        console.log('\n--- CONNECTION DETAILS ---');
        console.log(`DB: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);

    } catch (error) {
        console.error('❌ Audit failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

dbAudit();
