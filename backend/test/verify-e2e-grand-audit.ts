
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRole } from '../src/shared/enums/user-role.enum';
import { MerchantsService } from '../src/modules/merchants/merchants.service';
import { BlogService } from '../src/modules/blog/blog.service';
import { EventsService } from '../src/modules/events/events.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { MerchantCategory, MerchantStatus } from '../src/shared/enums/merchant.enum';
import { EventCategory, AdTier, AdSize } from '../src/shared/enums/event-monetization.enum';
import * as argon2 from 'argon2';

async function runGrandAudit() {
    console.log('🛡️ INITIATING GRAND AUDIT: CARIBE COMMAND CENTER 🛡️');
    console.log('==================================================');

    const app = await NestFactory.createApplicationContext(AppModule);
    const merchantsService = app.get(MerchantsService);
    const blogService = app.get(BlogService);
    const eventsService = app.get(EventsService);
    const analyticsService = app.get(AnalyticsService);
    const dataSource = app.get(DataSource);
    const userRepository = dataSource.getRepository(User);

    const suffix = Date.now().toString().slice(-6);
    const adminEmail = `commander${suffix}@caribe.cr`;
    const merchantEmail = `partner${suffix}@caribe.cr`;
    const password = await argon2.hash('Password123!');

    try {
        // 1. IDENTITY & ACCESS (Users)
        console.log('\n[1/6] 👤 AUDITING IDENTITY VAULT...');
        // Create Admin
        const admin = userRepository.create({
            email: adminEmail,
            password: password,
            fullName: 'Commander Eddie',
            role: UserRole.ADMIN,
            phoneNumber: '88888888',
            isActive: true
        });
        await userRepository.save(admin);
        console.log('  ✅ Admin Created:', admin.email);

        // Create Merchant User
        const merchantUser = userRepository.create({
            email: merchantEmail,
            password: password,
            fullName: 'Business Partner',
            role: UserRole.MERCHANT,
            phoneNumber: '77777777',
            isActive: true
        });
        await userRepository.save(merchantUser);
        console.log('  ✅ Merchant User Created:', merchantUser.email);


        // 2. MERCHANT NEXUS (Onboarding Flow)
        console.log('\n[2/6] 🏪 AUDITING MERCHANT NEXUS...');
        console.log('  ⏳ Attempting Merchant Creation...');
        // Create Merchant Profile
        const merchant = await merchantsService.create({
            userId: merchantUser.id,
            name: `Grand Audit Bistro ${suffix}`,
            category: MerchantCategory.RESTAURANT,
            address: 'Downtown Limon',
            phone: '77777777',
            latitude: 10.0000,
            longitude: -83.0000,
            description: 'Audit Test Venue'
        });
        console.log('  ✅ Merchant Profile Created (Pending):', merchant.name);

        // Verify Pending List
        const pending = await merchantsService.findPendingApproval();
        const isListed = pending.some(m => m.id === merchant.id);
        if (!isListed) throw new Error('Merchant not found in pending list!');
        console.log('  ✅ Merchant appears in Pending Queue');

        // Approve Merchant
        await merchantsService.approveMerchant(merchant.id, admin.id);
        const approvedMerchant = await merchantsService.findOne(merchant.id);
        if (approvedMerchant.status !== MerchantStatus.ACTIVE) throw new Error('Merchant approval failed!');
        console.log('  ✅ Merchant Approved & Active');


        // 3. CONTENT MANAGER (Blog)
        console.log('\n[3/6] 📝 AUDITING CONTENT MANAGER...');
        const post = await blogService.create({
            title: `Audit Report ${suffix}`,
            content: 'System is fully operational.',
            excerpt: 'Green lights across the board.',
            type: 'BLOG',
            status: 'PUBLISHED'
        }, admin.id);
        console.log('  ✅ Blog Post Created:', post.title);

        const posts = await blogService.findAllAdmin();
        if (!posts.find(p => p.id === post.id)) throw new Error('Blog post retrieval failed!');
        console.log('  ✅ Admin Blog List Verified');


        // 4. EVENT MANAGER (Events)
        console.log('\n[4/6] 📅 AUDITING EVENT MANAGER...');
        const event = await eventsService.create({
            title: `Audit Gala ${suffix}`,
            description: 'Celebration of operational excellence.',
            date: '2026-12-31',
            time: '20:00',
            locationName: 'Limon Hall',
            latitude: 10.0,
            longitude: -83.0,
            category: EventCategory.CULTURE,
            adTier: AdTier.GOLD,
            adSize: AdSize.LARGE,
            merchantId: merchant.id,
            imageUrl: 'https://example.com/gala.jpg'
        });
        console.log('  ✅ Event Created:', event.title);


        // 5. FINANCIAL INTELLIGENCE (Bóveda Caribe)
        console.log('\n[5/6] 💰 AUDITING FINANCIAL INTELLIGENCE (BÓVEDA)...');
        const summary = await analyticsService.getAdminSummary();
        console.log('  ✅ Financial Summary Retrieved Successfully');
        console.log(`     - Gross Volume: ₡${summary.summary.totalRevenue}`);
        console.log(`     - Platform Profit: ₡${summary.summary.platformProfit}`);
        console.log(`     - Tax Collected: ₡${summary.summary.totalTax}`);

        if (!summary.recentOrders) throw new Error('Recent Orders missing from Admin Summary!');
        console.log('  ✅ "Bóveda Caribe" Data Stream Active');


        // 6. CLEANUP
        console.log('\n[6/6] 🧹 CLEANUP & SECURING...');
        await eventsService.remove(event.id);
        await blogService.remove(post.id);
        // Note: We use raw delete for users to ensure test data is gone
        // [6/6] 🧹 CLEANUP & LOGISTIC PURGE
        console.log('\n[6/6] 🧹 CLEANUP & LOGISTIC PURGE');

        // Delete child records first
        await dataSource.getRepository('events').delete({ merchantId: merchant.id });
        await dataSource.getRepository('blog_posts').delete({ authorId: admin.id });

        // Delete merchant logs if any (raw query for tables without explicit repositories in this context)
        await dataSource.query(`DELETE FROM merchant_action_logs WHERE "merchantId" = $1`, [merchant.id]);

        await dataSource.getRepository('merchants').delete(merchant.id);

        // Finally delete the users
        await userRepository.delete(merchantUser.id);
        await userRepository.delete(admin.id);

        console.log('  ✅ Test Artifacts Purged');

        console.log('\n✨ GRAND AUDIT COMPLETE: ALL SYSTEMS NOMINAL ✨');
        console.log('   Happy Birthday, Commander. 🎂');

    } catch (error) {
        console.error('\n❌ AUDIT FAILED:', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

runGrandAudit();
