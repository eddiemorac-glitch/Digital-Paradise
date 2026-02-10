
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MerchantsService } from '../src/modules/merchants/merchants.service';
import { MerchantStatus, MerchantCategory } from '../src/shared/enums/merchant.enum';
import { DataSource } from 'typeorm';
import { Merchant } from '../src/modules/merchants/entities/merchant.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRole } from '../src/shared/enums/user-role.enum';

async function verifyMerchantFilters() {
    console.log('🔍 VERIFYING MERCHANT FILTERS...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(MerchantsService);
    const dataSource = app.get(DataSource);
    const repo = dataSource.getRepository(Merchant);
    const userRepo = dataSource.getRepository(User);

    try {
        // 1. Create a test user first to avoid FK constraint
        const user = userRepo.create({
            email: `audit-ghost-${Date.now()}@test.com`,
            password: 'Password123!',
            fullName: 'Audit Ghost',
            role: UserRole.MERCHANT,
            isActive: true
        });
        await userRepo.save(user);
        console.log('  ✅ Created Test User:', user.id);

        // 2. Create a test merchant (Inactive)
        const merchant = repo.create({
            name: 'Audit Ghost Store',
            status: MerchantStatus.ACTIVE,
            isActive: false, // Deactivated
            userId: user.id,
            latitude: 9.65,
            longitude: -82.75,
            address: 'Ghost Town',
            phone: '0000',
            category: MerchantCategory.OTHER,
            email: `ghost-store-${Date.now()}@test.com`
        });
        await repo.save(merchant);
        console.log('  ✅ Created Inactive Merchant:', merchant.id);

        // 3. Query Publicly (Should exclude inactive)
        const publicResults = await service.findAll();
        const foundGhostPublic = publicResults.some(m => m.id === merchant.id);
        if (foundGhostPublic) {
            console.error('  ❌ FAIL: Inactive merchant found in public findAll()!');
        } else {
            console.log('  ✅ SUCCESS: Inactive merchant excluded from public findAll()');
        }

        // 4. Query Admin (Should include all)
        const adminResults = await service.findAll(undefined, undefined, 'name', undefined, undefined, undefined, false);
        const foundGhostAdmin = adminResults.some(m => m.id === merchant.id);
        if (!foundGhostAdmin) {
            console.error('  ❌ FAIL: Inactive merchant NOT found in admin findAll()!');
        } else {
            console.log('  ✅ SUCCESS: Inactive merchant included in admin findAll()');
        }

        // 5. Cleanup
        await repo.delete(merchant.id);
        await userRepo.delete(user.id);
        console.log('  ✅ Cleanup complete.');

    } catch (e) {
        console.error('  ❌ ERROR:', e);
    } finally {
        await app.close();
    }
}

verifyMerchantFilters();
