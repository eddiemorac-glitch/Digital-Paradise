
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AuthService } from '../../modules/auth/auth.service';
import { UserRole } from '../enums/user-role.enum';
import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);

    const adminEmail = 'admin@caribedigital.cr';
    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
        console.log('✅ Admin user (admin@caribedigital.cr) already exists.');
    } else {
        console.log('🚀 Creating Super Admin user...');
        const hashedPassword = await argon2.hash('CaribeMaximumSecurity2026!');

        const admin = userRepository.create({
            email: adminEmail,
            password: hashedPassword,
            fullName: 'Super Admin',
            role: UserRole.ADMIN,
            isActive: true,
            agreedToPrivacyPolicy: true,
            privacyPolicyVersion: 'v1.0',
            privacyPolicyAgreedAt: new Date(),
        });

        await userRepository.save(admin);
        console.log('✅ Super Admin (admin@caribedigital.cr) created successfully.');
    }

    // Requested dev admin
    const devAdminEmail = 'admin@caribe.com';
    const existingDevAdmin = await userRepository.findOne({ where: { email: devAdminEmail } });

    if (existingDevAdmin) {
        console.log('✅ Dev Admin (admin@caribe.com) already exists.');
        // Force reset password and role
        existingDevAdmin.password = await argon2.hash('admin123');
        existingDevAdmin.role = UserRole.ADMIN;
        existingDevAdmin.isActive = true;
        await userRepository.save(existingDevAdmin);
        console.log('🔄 Dev Admin password reset to: admin123 and role set to ADMIN');
    } else {
        console.log('🚀 Creating Dev Admin user...');
        const hashedPassword = await argon2.hash('admin123');

        const devAdmin = userRepository.create({
            email: devAdminEmail,
            password: hashedPassword,
            fullName: 'Dev Admin',
            role: UserRole.ADMIN,
            isActive: true,
            agreedToPrivacyPolicy: true,
            privacyPolicyVersion: 'v1.0',
            privacyPolicyAgreedAt: new Date(),
        });

        await userRepository.save(devAdmin);
        console.log('✅ Dev Admin (admin@caribe.com) created successfully.');
        console.log('📧 Email: admin@caribe.com');
        console.log('🔑 Password: admin123');
    }

    await app.close();
}

bootstrap();
