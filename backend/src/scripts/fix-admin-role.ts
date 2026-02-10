
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Load .env from root

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { User } from '../modules/users/entities/user.entity';

async function fixAdminRole() {
    console.log('🔧 Fixing Admin Role for admin@cx.com...');

    // Override config with env vars explicitly to be sure
    const config = {
        ...typeOrmConfig,
        host: '::1', // FORCE IPv6 to match check-user.ts success
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    const dataSource = new DataSource(config as any);
    await dataSource.initialize();

    try {
        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { email: 'admin@cx.com' } });

        if (user) {
            console.log('✅ User Found:', user.email, 'Role:', user.role);
            if (user.role !== 'admin') {
                user.role = 'admin' as any;
                await userRepo.save(user);
                console.log('🚀 Role updated to ADMIN successfully!');
            } else {
                console.log('ℹ️ Use is already an ADMIN.');
            }
        } else {
            console.log('❌ User admin@cx.com NOT FOUND');
        }

    } catch (error) {
        console.error('❌ Update failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

fixAdminRole();
