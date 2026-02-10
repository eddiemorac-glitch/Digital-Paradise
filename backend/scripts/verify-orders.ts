import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { OrdersModule } from '../src/modules/orders/orders.module';
import { UsersModule } from '../src/modules/users/users.module';
import { MerchantsModule } from '../src/modules/merchants/merchants.module';
import { ProductsModule } from '../src/modules/products/products.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { LogisticsModule } from '../src/modules/logistics/logistics.module';
import { PaymentsModule } from '../src/modules/payments/payments.module';
import { HaciendaModule } from '../src/modules/hacienda/hacienda.module';
import { EmailsModule } from '../src/modules/emails/emails.module';
import { RewardsModule } from '../src/modules/rewards/rewards.module';
import { CacheModule } from '../src/modules/cache/cache.module';
import { OrdersService } from '../src/modules/orders/orders.service';
import { MerchantsService } from '../src/modules/merchants/merchants.service';
import { ProductsService } from '../src/modules/products/products.service';
import { CreateOrderDto } from '../src/modules/orders/dto/create-order.dto';

// TDT: Critical Path Verification - Order Creation (AdminJS-Free Loop)
async function verifyOrderFlow() {
    console.log('🚀 Starting Critical Path Verification: ORDERS (Clean Context)');

    let app: INestApplication;
    let createdUser = null;
    let createdMerchant = null;
    let createdProduct = null;

    try {
        // 1. Initialize Minimal NestJS Context (No AdminJS)
        console.log('👉 Initializing NestJS...');
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env', // Ensure .env is loaded from root
                }),
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (config_service: ConfigService) => ({
                        type: 'postgres',
                        host: config_service.get<string>('DB_HOST', 'localhost'),
                        port: config_service.get<number>('DB_PORT', 5432),
                        username: config_service.get<string>('DB_USERNAME', 'postgres'),
                        password: config_service.get<string>('DB_PASSWORD', 'postgres'),
                        database: config_service.get<string>('DB_NAME', 'caribe_digital'),
                        // Point to src/ entities for ts-node execution
                        entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
                        synchronize: false,
                        logging: false,
                    }),
                }),
                EventEmitterModule.forRoot(),
                CacheModule,
                AuthModule,
                UsersModule,
                MerchantsModule,
                ProductsModule,
                OrdersModule,
                LogisticsModule,
                PaymentsModule,
                HaciendaModule,
                EmailsModule,
                RewardsModule
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        const ordersService = app.get(OrdersService);
        const merchantsService = app.get(MerchantsService);
        const productsService = app.get(ProductsService);
        const dataSource = app.get(DataSource);
        const userRepository = dataSource.getRepository('User');

        console.log('✅ NestJS Context Initialized');

        // 2. Setup Test Data
        const userEmail = `test.user.${Date.now()}@example.com`;

        // Check if user exists first to allow re-runs slightly safer
        let testUser = await userRepository.findOne({ where: { email: userEmail } });

        if (!testUser) {
            const newUser = userRepository.create({
                email: userEmail,
                password: '$argon2id$v=19$m=65536,t=3,p=4$TEST_HASH_FOR_SPEED',
                firstName: 'TDT',
                lastName: 'Tester',
                fullName: 'TDT Tester', // Added: Required field
                role: 'client', // Fixed: Lowercase 'client' matches DB Enum
                phone: '88888888',
                isActive: true,
                isEmailVerified: true
            });
            testUser = await userRepository.save(newUser);
        }
        createdUser = testUser;
        console.log(`✅ Test User Created: ${createdUser.id}`);

        // Get Merchant
        console.log('👉 Fetching Merchants...');
        const merchants = await merchantsService.findAll();
        console.log(`👉 Fetched ${merchants.length} merchants.`);

        if (merchants.length === 0) throw new Error('No Merchants found in DB. Run seeds first.');
        createdMerchant = merchants[0];
        console.log(`✅ Merchant Selected: ${createdMerchant.name}`);

        // Get Product
        console.log('👉 Fetching Products...');
        const products = await productsService.findAllByMerchant(createdMerchant.id);
        console.log(`👉 Fetched ${products.length} products.`);

        if (products.length === 0) throw new Error('No Products found for Merchant.');
        createdProduct = products[0];
        console.log(`✅ Product Selected: ${createdProduct.name} ($${createdProduct.price})`);

        // 3. Execute Critical Action
        const orderDto: CreateOrderDto = {
            merchantId: createdMerchant.id,
            items: [
                { productId: createdProduct.id, quantity: 2 }
            ],
            customerNotes: 'TDT Verification Order',
            deliveryAddress: 'Test Location',
            deliveryLat: 10.0,
            deliveryLng: -84.0
        };

        const startTime = Date.now();
        const order = await ordersService.create(createdUser.id, orderDto);
        const duration = Date.now() - startTime;

        // 4. Verify Results
        if (!order) throw new Error('Order returned null');
        if (Number(order.total) !== Number(createdProduct.price) * 2) throw new Error(`Price mismatch: Expected ${createdProduct.price * 2}, got ${order.total}`);
        if (order.status !== 'PENDING') throw new Error(`Invalid Status: ${order.status}`);
        if (!order.haciendaKey) throw new Error('Missing Hacienda Key');

        console.log(`✅ ORDER CREATED SUCCESSFULLY in ${duration}ms`);
        console.log(`   - ID: ${order.id}`);
        console.log(`   - Total: ₡${order.total}`);
        console.log(`   - Key: ${order.haciendaKey}`);

        // 5. Cleanup
        await dataSource.query('DELETE FROM "order_items" WHERE "orderId" = $1', [order.id]);
        await dataSource.query('DELETE FROM "orders" WHERE "id" = $1', [order.id]);
        console.log('✅ Test Order Deleted');

    } catch (error) {
        console.error(`❌ VERIFICATION FAILED: ${error.message}`);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    } finally {
        if (createdUser && app) {
            const dataSource = app.get(DataSource);
            await dataSource.query('DELETE FROM "users" WHERE "id" = $1', [createdUser.id]);
            console.log('✅ Test User Cleaned up');
        }
        if (app) await app.close();
        console.log('🏁 Verification Complete');
        process.exit(0);
    }
}

verifyOrderFlow();
