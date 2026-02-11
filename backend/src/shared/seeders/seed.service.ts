import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { MerchantsService } from '../../modules/merchants/merchants.service';
// Force hot-reload: 2026-02-05
import { ProductsService } from '../../modules/products/products.service';
import { MerchantCategory, MerchantStatus } from '../../shared/enums/merchant.enum';
import { UserRole } from '../../shared/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Repository, DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { Merchant } from '../../modules/merchants/entities/merchant.entity';
import { Review } from '../../modules/reviews/entities/review.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        private readonly merchantsService: MerchantsService,
        private readonly productsService: ProductsService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Merchant)
        private readonly merchantRepository: Repository<Merchant>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
        private readonly dataSource: DataSource,
    ) { }

    async onApplicationBootstrap() {
        try {
            console.log('🐢 Checking database seeds...');
            await this.seedUsers();

            const merchants = await this.merchantsService.findAll() as any[];

            // if (merchants.length === 0) {
            console.log('🌱 Seeding sample merchants in Caribe Sur...');
            const sampleMerchants = [
                {
                    name: 'Bread and Chocolate',
                    description: 'Famoso por su desayuno y repostería artesanal en el corazón de Puerto Viejo.',
                    category: MerchantCategory.CAFE,
                    address: 'Calle principal, Puerto Viejo',
                    phone: '+506 2750-0001',
                    latitude: 9.6570,
                    longitude: -82.7540,
                    status: MerchantStatus.ACTIVE,
                    logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200',
                    bannerUrl: 'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?w=1200',
                },
                {
                    name: 'Koki Beach',
                    description: 'Fusión caribeña moderna con arquitectura sostenible y vistas increíbles al mar.',
                    category: MerchantCategory.RESTAURANT,
                    address: 'Frente al mar, Puerto Viejo',
                    phone: '+506 2750-0004',
                    latitude: 9.6580,
                    longitude: -82.7550,
                    status: MerchantStatus.ACTIVE,
                    logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200',
                    bannerUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
                },
                {
                    name: 'The Point',
                    description: 'El mejor lugar para ver el sunset y disfrutar de surf culture en Salsa Brava.',
                    category: MerchantCategory.BAR,
                    address: 'Salsa Brava, Puerto Viejo',
                    phone: '+506 2750-0005',
                    latitude: 9.6590,
                    longitude: -82.7560,
                    status: MerchantStatus.ACTIVE,
                    logoUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=200',
                    bannerUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200',
                },
                {
                    name: 'Soda Lidia',
                    description: 'Auténtico Rice and Beans caribeño con el sazón de Doña Lidia.',
                    category: MerchantCategory.RESTAURANT,
                    address: 'Costado sur de la plaza, Puerto Viejo',
                    phone: '+506 2750-0002',
                    latitude: 9.6550,
                    longitude: -82.7530,
                    status: MerchantStatus.ACTIVE,
                    logoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200',
                    bannerUrl: 'https://images.unsplash.com/photo-1543353071-09705163860d?w=1200',
                },
                {
                    name: 'Selvin\'s Punta Uva',
                    description: 'Comida caribeña tradicional rodeada de selva tropical profunda.',
                    category: MerchantCategory.RESTAURANT,
                    address: 'Punta Uva, carretera a Manzanillo',
                    phone: '+506 2750-0006',
                    latitude: 9.6380,
                    longitude: -82.6850,
                    status: MerchantStatus.ACTIVE,
                    logoUrl: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=200',
                    bannerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200',
                }
            ];

            for (const data of sampleMerchants) {
                let userId: string | undefined;

                if (data.name === 'Bread and Chocolate') {
                    const mUser = await this.userRepository.findOne({ where: { email: 'comercio@caribe.com' } });
                    if (mUser) userId = mUser.id;
                }

                let merchant = await this.merchantRepository.findOne({ where: { name: data.name } });

                if (!merchant) {
                    merchant = await this.merchantsService.create({ ...data, userId } as any);
                    console.log(`✅ Merchant created: ${merchant.name}`);
                } else {
                    console.log(`ℹ️ Merchant already exists: ${merchant.name}`);
                }

                // Seed ratings for Bread and Chocolate to test Spotlight (Avg 5.0, 2 reviews)
                if (merchant.name === 'Bread and Chocolate') {
                    // Try to find a valid user for the reviews, otherwise use the first one available
                    if (!userId) {
                        const anyUser = await this.userRepository.findOne({ where: {} });
                        if (anyUser) userId = anyUser.id;
                    }

                    if (userId) {
                        // Check if reviews already exist to avoid duplicates
                        const existingReviews = await this.reviewRepository.count({ where: { merchantId: merchant.id } });
                        if (existingReviews === 0) {
                            await this.reviewRepository.insert([
                                { merchantId: merchant.id, rating: 5, comment: 'Best breakfast ever!', userId, orderId: null },
                                { merchantId: merchant.id, rating: 5, comment: 'Excellent coffee.', userId, orderId: null }
                            ]);
                            console.log(`⭐ Seeded ratings for ${merchant.name} (Spotlight candidate)`);
                        } else {
                            console.log(`ℹ️ Ratings already exist for ${merchant.name}`);
                        }
                    } else {
                        console.warn(`⚠️ Could not seed reviews for ${merchant.name}: No valid user found`);
                    }
                }

                await this.seedProductsForMerchant(merchant);
            }

            // Clear cache after seeding
            await this.merchantsService.clearCache();

            console.log('🚀 Seeding completed successfully!');
            await this.healMerchants();
            await this.healMissions();
        } catch (error) {
            console.error('❌ Seeding failed, but starting app anyway:', error);
        }
    }

    private async healMerchants() {
        console.log('🏥 Checking for merchants with missing coordinates...');
        const merchants = await this.merchantRepository.find();
        let healedCount = 0;
        console.log(`🏥 Found ${merchants.length} merchants in DB.`);

        for (const merchant of merchants) {
            // Check for missing or invalid coordinates
            const invalid = !merchant.latitude || !merchant.longitude ||
                merchant.latitude === 0 || merchant.longitude === 0 ||
                isNaN(Number(merchant.latitude)) || isNaN(Number(merchant.longitude));

            if (invalid || merchant.name === 'Soda Lidia') {
                console.log(`🏥 Healing Merchant: ${merchant.name} (Current: ${merchant.latitude}, ${merchant.longitude})`);

                // Default to Puerto Viejo Center
                merchant.latitude = 9.6550;
                merchant.longitude = -82.7530;
                await this.merchantRepository.save(merchant);
                healedCount++;
                console.log(`✅ Healed Merchant: ${merchant.name} to 9.6550, -82.7530`);
            }
        }
        if (healedCount > 0) console.log(`✅ Healed ${healedCount} merchants.`);
    }

    private async healMissions() {
        console.log('🩹 Running surgical mission data healing...');
        try {
            // Fetch all missions to check for NaN or 0 manually since SQL for NaN can be tricky across DBs
            const missions = await this.dataSource.getRepository('LogisticsMission').find();
            let healedCount = 0;

            for (const mission of missions as any[]) {
                const lat = Number(mission.originLat);
                const lng = Number(mission.originLng);

                // Check for 0, NaN, or null
                const isInvalid = !lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0;

                if (isInvalid) {
                    if (mission.orderId) {
                        const order = await this.dataSource.getRepository('Order').findOne({
                            where: { id: mission.orderId },
                            relations: ['merchant']
                        });

                        if (order?.merchant) {
                            mission.originLat = order.merchant.latitude;
                            mission.originLng = order.merchant.longitude;
                            mission.merchantId = order.merchant.id;
                            mission.originAddress = order.merchant.address || 'Puerto Viejo';

                            await this.dataSource.getRepository('LogisticsMission').save(mission);
                            console.log(`✅ Repaired mission ${mission.id.slice(0, 8)} with merchant ${order.merchant.name}`);
                            healedCount++;
                        } else {
                            console.warn(`⚠️ Mission ${mission.id.slice(0, 8)} has invalid coords but no linked merchant found via order.`);
                        }
                    } else if (mission.merchantId) {
                        // Try direct merchant link
                        const merchant = await this.merchantRepository.findOne({ where: { id: mission.merchantId } });
                        if (merchant) {
                            mission.originLat = merchant.latitude;
                            mission.originLng = merchant.longitude;
                            await this.dataSource.getRepository('LogisticsMission').save(mission);
                            console.log(`✅ Repaired mission ${mission.id.slice(0, 8)} with direct merchant link ${merchant.name}`);
                            healedCount++;
                        }
                    }
                }
            }
            if (healedCount === 0) console.log('✅ No missions needed healing.');

        } catch (err) {
            console.error('❌ Mission healing failed:', err);
        }
    }

    private async seedProductsForMerchant(merchant: any) {
        console.log(`🍎 Seeding products for ${merchant.name}...`);

        let products = [];

        if (merchant.category === MerchantCategory.CAFE) {
            products = [
                { name: 'Breakfast Sandwich', description: 'Huevo, queso y tocino en pan artesanal', price: 4500, category: 'Breakfast' },
                { name: 'Brownie de Chocolate', description: 'Famoso brownie denso y delicioso', price: 1500, category: 'Bakery' },
                { name: 'Iced Coffee', description: 'Café local filtrado en frío', price: 2000, category: 'Drinks' },
                { name: 'Avocado Toast', description: 'Pan de masa madre con aguacate y semillas', price: 3800, category: 'Breakfast' }
            ];
        } else if (merchant.name === 'Koki Beach') {
            products = [
                { name: 'Pollo al Curry Caribeño', description: 'Con leche de coco y especias locales', price: 7500, category: 'Main' },
                { name: 'Tuna Tartare', description: 'Atún fresco de la zona con aliño tropical', price: 6000, category: 'Appetizer' },
                { name: 'Passion Fruit Cheesecake', description: 'Postre cremoso de maracuyá', price: 3500, category: 'Dessert' }
            ];
        } else if (merchant.category === MerchantCategory.RESTAURANT) {
            products = [
                { name: 'Rice and Beans con Pollo', description: 'Clásico caribeño con leche de coco', price: 5500, category: 'Main' },
                { name: 'Pescado Entero', description: 'Pargo rojo frito con patacones', price: 8500, category: 'Seafood' },
                { name: 'Chifrijo Caribeño', description: 'Con un toque de salsa caribeña', price: 4500, category: 'Appetizer' },
                { name: 'Patacones con Todo', description: 'Con frijoles, queso y guacamole', price: 4000, category: 'Appetizer' }
            ];
        } else if (merchant.category === MerchantCategory.BAR) {
            products = [
                { name: 'Fish Tacos', description: 'Tres tacos de pescado con ensalada de col', price: 5000, category: 'Food' },
                { name: 'Imperial Silver', description: 'Cerveza nacional extremadamente fría', price: 2000, category: 'Drinks' },
                { name: 'Waves Burger', description: 'Hamburgesa especial con piña a la parrilla', price: 6500, category: 'Food' },
                { name: 'Piña Colada', description: 'En piña natural', price: 4500, category: 'Cocktails' }
            ];
        } else {
            products = [
                { name: 'Producto Genérico 1', description: 'Descripción del producto', price: 1000, category: 'General' },
                { name: 'Producto Genérico 2', description: 'Descripción del producto', price: 2000, category: 'General' }
            ];
        }

        for (const p of products) {
            // CRITICAL FIX: Check for existence to prevent duplicates on restart
            const existingProduct = await this.productsService.findOneByNameAndMerchant(p.name, merchant.id).catch(() => null);

            if (!existingProduct) {
                await this.productsService.create({
                    ...p,
                    merchantId: merchant.id
                });
                console.log(`   + Created product: ${p.name}`);
            } else {
                // console.log(`   . Skipped existing: ${p.name}`);
            }
        }
    }

    private async seedUsers() {
        console.log('👥 Seeding/Updating test users...');
        const hashedPassword = await argon2.hash('tortuga123');

        const users = [
            { email: 'cliente@caribe.com', fullName: 'Carlos Cliente', role: UserRole.CLIENT },
            { email: 'comercio@caribe.com', fullName: 'Maria Merchant', role: UserRole.MERCHANT },
            { email: 'repartidor@caribe.com', fullName: 'Rafa Repartidor', role: UserRole.DELIVERY },
            { email: 'admin@caribe.com', fullName: 'Admin Caribe', role: UserRole.ADMIN },
        ];

        for (const u of users) {
            let user = await this.userRepository.findOne({ where: { email: u.email } });
            if (!user) {
                user = this.userRepository.create({ ...u, password: hashedPassword });
            } else {
                user.password = hashedPassword; // Force update password
                user.role = u.role; // Ensure role is correct
            }
            await this.userRepository.save(user);
        }
        console.log('✅ Test users updated. Password: tortuga123');
    }
}
