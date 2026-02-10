
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Merchant } from '../modules/merchants/entities/merchant.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../shared/enums/user-role.enum';
import * as argon2 from 'argon2';

async function linkMerchants() {
    console.log('🔗 Starting Merchant-User Linkage Audit...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const merchantRepo = dataSource.getRepository(Merchant);
    const userRepo = dataSource.getRepository(User);

    const merchants = await merchantRepo.find();
    console.log(`🔍 Found ${merchants.length} merchants to audit.`);

    for (const merchant of merchants) {
        if (!merchant.userId) {
            console.log(`⚠️ Merchant "${merchant.name}" is orphaned. Finding/Creating owner...`);

            // Try to find a user with the merchant name as a base for email
            const slug = merchant.name.toLowerCase().replace(/\s+/g, '.');
            const email = `${slug}@caribedigital.cr`;

            let user = await userRepo.findOne({ where: { email } });

            if (!user) {
                console.log(`👤 Creating new merchant account: ${email}`);
                const hashedPassword = await argon2.hash('MerchantPass2026!');
                user = userRepo.create({
                    email,
                    password: hashedPassword,
                    fullName: `Encargado ${merchant.name}`,
                    role: UserRole.MERCHANT,
                    isActive: true,
                    agreedToPrivacyPolicy: true,
                    privacyPolicyVersion: 'v1.0',
                    privacyPolicyAgreedAt: new Date(),
                });
                await userRepo.save(user);
            }

            merchant.userId = user.id;
            await merchantRepo.save(merchant);
            console.log(`✅ Linked "${merchant.name}" to user ${email}`);
        } else {
            console.log(`✔ Merchant "${merchant.name}" already linked to userId: ${merchant.userId}`);
        }
    }

    console.log('✨ Linkage Audit Completed.');
    await app.close();
}

linkMerchants().catch(err => {
    console.error('❌ Linkage failed:', err);
    process.exit(1);
});
