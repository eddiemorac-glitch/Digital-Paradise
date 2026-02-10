
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MerchantsService } from '../modules/merchants/merchants.service';
import { DataSource, IsNull } from 'typeorm';
import { Event } from '../modules/events/entities/event.entity';
import { NotificationsService } from '../modules/notifications/notifications.service';

async function repairCartData() {
    console.log('🔧 Starting Cart Data Repair...');

    let app;
    try {
        app = await NestFactory.createApplicationContext(AppModule);

        const merchantsService = app.get(MerchantsService);
        const dataSource = app.get(DataSource);
        const eventRepo = dataSource.getRepository(Event);

        // 1. Ensure Default Merchant Exists
        console.log('Checking for Default Merchant...');
        const defaultMerchant = await merchantsService.seed();
        console.log(`✅ Default Merchant Active: ${defaultMerchant.name} (${defaultMerchant.id})`);

        // 2. Fix Orphans
        console.log('Checking for Orphaned Events (No Merchant)...');
        const orphans = await eventRepo.find({ where: { merchantId: IsNull() } });

        if (orphans.length > 0) {
            console.log(`⚠️ Found ${orphans.length} orphaned events. Fixing...`);
            await eventRepo.update({ merchantId: IsNull() }, { merchantId: defaultMerchant.id });
            console.log(`✅ Fixed ${orphans.length} events. Assigned to Default Merchant.`);
        } else {
            console.log('✅ No orphaned events found.');
        }

        console.log('🎉 DATA REPAIR SUCCESSFUL');

    } catch (error) {
        console.error('❌ REPAIR FAILED:', error);
        process.exit(1);
    } finally {
        if (app) await app.close();
        process.exit(0);
    }
}

repairCartData();
