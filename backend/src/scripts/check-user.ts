import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Load .env from root

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { User } from '../modules/users/entities/user.entity';

async function checkUser() {
    console.log('🔍 Checking User Status...');
    console.log('🔌 Config:', {
        host: process.env.DB_HOST,
        db: process.env.DB_NAME,
        user: process.env.DB_USERNAME,
        pass: process.env.DB_PASSWORD ? '******' : 'MISSING'
    });

    // Override config with env vars explicitly to be sure
    const config = {
        ...typeOrmConfig,
        host: '::1', // FORCE IPv6 to see if there is another DB there
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const dataSource = new DataSource(config as any);
    await dataSource.initialize();

    const [{ current_database, inet_server_addr, inet_server_port }] = await dataSource.query('SELECT current_database(), inet_server_addr(), inet_server_port()');
    console.log(`✅ Connected to DB: ${current_database} on ${inet_server_addr}:${inet_server_port}`);

    try {
        const userRepo = dataSource.getRepository(User);
        const users = await userRepo.find({
            select: ['id', 'email', 'role', 'isActive']
        });

        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

checkUser();
