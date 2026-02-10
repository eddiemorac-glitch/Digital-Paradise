
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';
import { Event } from '../modules/events/entities/event.entity';
import { Merchant } from '../modules/merchants/entities/merchant.entity';
import { Product } from '../modules/products/entities/product.entity';
import { Review } from '../modules/reviews/entities/review.entity';

import { EventCategory, AdTier, AdSize } from '../shared/enums/event-monetization.enum';

async function seedEvents() {
    console.log('🌱 Starting Event Seeding...');

    const config = {
        ...typeOrmConfig,
        host: 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        synchronize: false,
        logging: true
    };

    console.log('DEBUG: DB Config:', {
        host: config.host,
        port: config.port,
        username: config.username,
        database: config.database,
        hasPassword: !!config.password
    });

    const dataSource = new DataSource(config as any);
    await dataSource.initialize();

    try {
        const eventRepo = dataSource.getRepository(Event);

        const initialEvents = [
            {
                title: "Sunset Beats @ Playa Negra",
                description: "Música en vivo frente al mar con los mejores DJs locales. Un evento premium con vibra tropical.",
                date: "Hoy, 5:00 PM",
                time: "17:00",
                locationName: "Playa Negra",
                venue: "Beach Bar Sunset",
                latitude: 9.6545,
                longitude: -82.7544,
                category: EventCategory.CONCERT,
                adTier: AdTier.GOLD,
                adSize: AdSize.LARGE,
                startDate: new Date(),
                attendees: 145,
                isEcoFriendly: false,
                isActive: true
            },
            {
                title: "Taller de Tortugas",
                description: "Aprende sobre el desove y protección de tortugas marinas.",
                date: "Mañana, 9:00 AM",
                time: "09:00",
                locationName: "Centro de Rescate",
                venue: "Sea Turtle Conservancy",
                latitude: 9.6412,
                longitude: -82.7632,
                category: EventCategory.CULTURE,
                adTier: AdTier.SILVER,
                adSize: AdSize.MEDIUM,
                startDate: new Date(Date.now() + 86400000),
                attendees: 32,
                isEcoFriendly: true,
                isActive: true
            },
            {
                title: "Noche de Langosta",
                description: "Cena gourmet con mariscos locales y música en vivo.",
                date: "Sábado, 7:00 PM",
                time: "19:00",
                locationName: "Puerto Viejo",
                venue: "Marisquería La Pecera",
                latitude: 9.6560,
                longitude: -82.7540,
                category: EventCategory.RESTAURANT,
                adTier: AdTier.BRONZE,
                adSize: AdSize.SMALL,
                startDate: new Date(Date.now() + 172800000),
                attendees: 80,
                isEcoFriendly: false,
                isActive: true
            }
        ];

        for (const data of initialEvents) {
            console.log(`🎭 Seeding Event: ${data.title}...`);
            const event = eventRepo.create(data as any) as unknown as Event;
            // Manual location string for PostGIS if needed
            // @ts-ignore
            event.location = `POINT(${data.longitude} ${data.latitude})`;
            await eventRepo.save(event);
        }

        console.log('✅ Event Seed Completed!');

    } catch (error) {
        console.error('❌ Event Seed failed:', error);
    } finally {
        await dataSource.destroy();
    }
}

seedEvents();
