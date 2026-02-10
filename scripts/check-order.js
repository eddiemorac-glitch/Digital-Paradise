const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../backend/dist/src/app.module');
const { OrdersService } = require('../backend/dist/src/modules/orders/orders.service');
const { HaciendaService } = require('../backend/dist/src/modules/hacienda/hacienda.service');

async function bootstrap() {
    console.log('Initializing NestJS context for Hacienda Test...');
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error', 'log', 'debug'] });

    const ordersService = app.get(OrdersService);
    const haciendaService = app.get(HaciendaService);

    // Order that was previously used (it acts as a good test case despite being PAID)
    const orderId = 'c0e55d4a-7427-4a4c-a8f6-d650f4a1a92d';

    console.log(`Fetching order ${orderId}...`);
    try {
        const order = await ordersService.findOne(orderId);
        console.log('✅ Order found. Emitting Invoice directly...');

        // Directly call the service method
        const result = await haciendaService.emitInvoice(order);

        console.log('--- Emission Result ---');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    await app.close();
}

bootstrap();
