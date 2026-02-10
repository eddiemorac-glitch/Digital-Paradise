
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { Merchant } from '../modules/merchants/entities/merchant.entity';
import { Product } from '../modules/products/entities/product.entity';
import { MerchantCategory, MerchantStatus } from '../shared/enums/merchant.enum';

async function officialSeed() {
    console.log('🌱 Starting Official Database Seed...');

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
        const merchantRepo = dataSource.getRepository(Merchant);
        const productRepo = dataSource.getRepository(Product);

        const merchantsData = [
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
            }
        ];

        for (const data of merchantsData) {
            console.log(`🏪 Seeding ${data.name}...`);
            const merchant = merchantRepo.create(data as any);
            await merchantRepo.save(merchant);

            // Add sample products
            const products = [
                { name: 'Rice and Beans con Pollo', description: 'Clásico caribeño con leche de coco', price: 5500, category: 'Main' },
                { name: 'Patacones con Todo', description: 'Con frijoles, queso y guacamole', price: 4000, category: 'Appetizer' }
            ];

            for (const p of products) {
                const product = productRepo.create({ ...p, merchantId: (merchant as any).id, merchant: merchant } as any);
                await productRepo.save(product);
            }
        }

        console.log('✅ Official Seed Completed!');

    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

officialSeed();
