
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { User } from '../modules/users/entities/user.entity';
import * as argon2 from 'argon2';

async function alignAdmins() {
    console.log('🛡️ Aligning Admin Accounts with Documentation...');

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
        const userRepo = dataSource.getRepository(User);

        const admins = [
            { email: 'admin@caribedigital.cr', pass: 'CaribeMaximumSecurity2026!', name: 'Super Admin' },
            { email: 'admin@caribe.com', pass: 'admin123', name: 'Dev Admin' },
            { email: 'admin@cx.com', pass: 'password', name: 'Legacy Admin' }
        ];

        for (const adminData of admins) {
            let user = await userRepo.findOne({ where: { email: adminData.email } });
            const hashedPassword = await argon2.hash(adminData.pass);

            if (user) {
                console.log(`🔄 Updating existing user: ${adminData.email}`);
                user.password = hashedPassword;
                user.role = 'admin' as any;
                user.isActive = true;
                if (!user.fullName) user.fullName = adminData.name;
                await userRepo.save(user);
            } else {
                console.log(`✨ Creating new user: ${adminData.email}`);
                user = userRepo.create({
                    email: adminData.email,
                    password: hashedPassword,
                    fullName: adminData.name,
                    role: 'admin' as any,
                    isActive: true
                });
                await userRepo.save(user);
            }
        }
        console.log('✅ Admin alignment completed!');

    } catch (error) {
        console.error('❌ Alignment failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

alignAdmins();
