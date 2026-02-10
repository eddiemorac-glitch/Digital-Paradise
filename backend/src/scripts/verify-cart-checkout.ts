
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EventsService } from '../modules/events/events.service';
import { OrdersService } from '../modules/orders/orders.service';
import { MerchantsService } from '../modules/merchants/merchants.service';
import { DataSource, IsNull } from 'typeorm';
import { Event } from '../modules/events/entities/event.entity';
import { NotificationsService } from '../modules/notifications/notifications.service';

// Mock Notification Service to avoid spam/errors
const mockNotificationService = {
    create: () => Promise.resolve(),
    emitSignal: () => Promise.resolve(),
};

async function verifyCartCheckout() {
    console.log('🛒 Starting Cart System Verification & Repair...');

    let app;
    try {
        app = await NestFactory.createApplicationContext(AppModule);

        // Mock Notifications
        const notificationsService = app.get(NotificationsService);
        notificationsService.create = () => Promise.resolve();
        notificationsService.emitSignal = () => Promise.resolve();

        const eventsService = app.get(EventsService);
        const ordersService = app.get(OrdersService);
        const merchantsService = app.get(MerchantsService);
        const dataSource = app.get(DataSource);
        const eventRepo = dataSource.getRepository(Event);

        // 1. Ensure Default Merchant Exists (Repair Step 1)
        console.log('🔧 Checking for Default Merchant...');
        const defaultMerchant = await merchantsService.seed();
        console.log(`✅ Default Merchant Active: ${defaultMerchant.name} (${defaultMerchant.id})`);

        // 2. Fix Orphans (Repair Step 2)
        console.log('🔧 Checking for Orphaned Events (No Merchant)...');
        const orphans = await eventRepo.find({ where: { merchantId: IsNull() } });

        if (orphans.length > 0) {
            console.log(`⚠️ Found ${orphans.length} orphaned events. Fixing...`);
            await eventRepo.update({ merchantId: IsNull() }, { merchantId: defaultMerchant.id });
            console.log(`✅ Fixed ${orphans.length} events. Assigned to Default Merchant.`);
        } else {
            console.log('✅ No orphaned events found.');
        }

        // 3. Verify Cart Checkout Flow
        console.log('🧪 Verifying Checkout Flow...');

        // Pick an event
        const testEvent = await eventRepo.findOne({ where: { merchantId: defaultMerchant.id } });
        if (!testEvent) throw new Error('❌ No test event found even after repair!');

        console.log(`🎫 Testing with Event: "${testEvent.title}" (ID: ${testEvent.id})`);

        // Simulate Cart Payload
        const cartPayload = {
            merchantId: defaultMerchant.id, // CartSidebar uses item.merchantId
            items: [
                {
                    productId: undefined, // Explicit undefined as in frontend
                    eventId: testEvent.id,
                    eventRequestId: undefined,
                    quantity: 2
                }
            ],
            customerNotes: 'Verification Test Order',
            courierTip: 1000
        };

        // Create Order
        console.log('📦 Creating Order...');
        const order = await ordersService.create('test-verifier-user', cartPayload as any);

        console.log(`✅ Order Created Successfully! ID: ${order.id}`);
        console.log(`💰 Total: ₡${order.total}`);
        console.log(`📝 Status: ${order.status}`);

        // Verify Order Items
        if (order.items.length !== 1 || order.items[0].eventId !== testEvent.id) {
            throw new Error('❌ Order Item mismatch!');
        }
        console.log('✅ Order Items Verified.');

        console.log('🎉 CART SYSTEM VERIFICATION SUCCESSFUL');

    } catch (error) {
        console.error('❌ VERIFICATION FAILED:', error);
        // Provide clickable link to error log
        const fs = require('fs');
        fs.writeFileSync('cart_error_log.txt', `ERROR: ${error.message}\nSTACK: ${error.stack}`);
        process.exit(1);
    } finally {
        if (app) await app.close();
        process.exit(0);
    }
}

verifyCartCheckout();
