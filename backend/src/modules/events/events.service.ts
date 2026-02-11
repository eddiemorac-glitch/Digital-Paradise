import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from './entities/event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { EventCategory, AdTier, AdSize } from '../../shared/enums/event-monetization.enum';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { MerchantsService } from '../merchants/merchants.service';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
        private readonly notificationsService: NotificationsService,
        private readonly merchantsService: MerchantsService,
    ) { }

    getPricing() {
        return {
            tiers: {
                [AdTier.GOLD]: 50,
                [AdTier.SILVER]: 25,
                [AdTier.BRONZE]: 10
            },
            sizeMultipliers: {
                [AdSize.LARGE]: 1.5,
                [AdSize.MEDIUM]: 1.2,
                [AdSize.SMALL]: 1.0
            },
            currency: 'USD'
        };
    }

    calculateCost(tier: AdTier, size: AdSize, days: number = 1): number {
        const pricing = this.getPricing();
        const base = pricing.tiers[tier];
        const multiplier = pricing.sizeMultipliers[size];
        return base * multiplier * days;
    }



    async findAll(): Promise<Event[]> {
        try {
            return await this.eventRepository.find({
                where: { isActive: true },
                order: {
                    adTier: 'DESC',
                    startDate: 'ASC'
                }
            });
        } catch (error) {
            console.error('[EventsService] Error in findAll:', error);
            throw error;
        }
    }

    async findOne(id: string): Promise<Event> {
        const event = await this.eventRepository.findOne({ where: { id } });
        if (!event) throw new NotFoundException(`Event ${id} not found`);
        return event;
    }

    async findByIds(ids: string[]): Promise<Event[]> {
        if (!ids || ids.length === 0) return [];
        return this.eventRepository.find({
            where: { id: In(ids) }
        });
    }

    async create(data: CreateEventDto): Promise<Event> {
        this.logger.log(`Creating event: ${data.title}`);
        if (!data.category || data.category === EventCategory.OTHER) {
            const mapped = Object.values(EventCategory).find(c => c === (data.type as any));
            if (mapped) data.category = mapped as EventCategory;
        }

        const event = this.eventRepository.create(data) as Event;

        // Ensure we have a startDate for chronological queries if possible
        if (!event.startDate) {
            event.startDate = new Date();
        }

        const saved = await this.eventRepository.save(event);

        // Force location update via raw SQL to bypass TypeORM/Subscriber issues
        if (data.latitude && data.longitude) {
            await this.eventRepository.query(
                `UPDATE events SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
                [data.longitude, data.latitude, saved.id]
            );
        }

        // Broadcast notification if it's a GOLD event or high category
        if (saved.adTier === AdTier.GOLD || saved.category === EventCategory.FESTIVAL) {
            // Broadcast Notification
            await this.notificationsService.create({
                title: saved.adTier === AdTier.GOLD ? 'Tropico Destacado' : 'Nuevo Evento',
                message: `${saved.title}. No te lo pierdas en ${saved.locationName}!`,
                type: saved.adTier === AdTier.GOLD ? NotificationType.PROMO : NotificationType.INFO,
                actionLink: `/events`
            });

            // Phase 23: Emit Signal for Intelligence Hub
            await this.notificationsService.emitSignal(
                'SOCIAL',
                `HIGH VALUE INTERCEPT: ${saved.title.toUpperCase()} AT ${saved.locationName?.toUpperCase() || 'UNKNOWN LOC'}`
            );
        }

        this.logger.log(`Event saved successfully: ${saved.id}`);
        return saved;
    }

    async update(id: string, data: UpdateEventDto): Promise<Event> {
        const event = await this.findOne(id);
        Object.assign(event, data);



        return await this.eventRepository.save(event);
    }

    async remove(id: string): Promise<{ success: boolean }> {
        const event = await this.findOne(id);
        // Soft delete by setting isActive to false
        event.isActive = false;
        await this.eventRepository.save(event);
        return { success: true };
    }

    async findNearbyEvents(lat: number, lng: number, radiusKm: number = 5): Promise<Event[]> {
        // Limit radius to 50km for performance
        const effectiveRadius = Math.min(radiusKm, 50);

        return this.eventRepository
            .createQueryBuilder('event')
            .where(
                'ST_Distance(event.location, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography) <= :radius',
                { lng, lat, radius: effectiveRadius * 1000 }
            )
            .andWhere('event.isActive = true')
            .andWhere('event.startDate >= :now', { now: new Date() })
            .orderBy('event.adTier = \'GOLD\'', 'DESC')
            .addOrderBy('event.adTier = \'SILVER\'', 'DESC')
            .addOrderBy('ST_Distance(event.location, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography)', 'ASC')
            .limit(50)
            .getMany();
    }

    async findInBounds(minLat: number, maxLat: number, minLng: number, maxLng: number): Promise<any> {
        try {
            // Clamp bounds to avoid PostGIS "World" envelope issues
            const cMinLat = isNaN(Number(minLat)) ? -85 : Number(minLat);
            const cMaxLat = isNaN(Number(maxLat)) ? 85 : Number(maxLat);
            const cMinLng = isNaN(Number(minLng)) ? -175 : Number(minLng);
            const cMaxLng = isNaN(Number(maxLng)) ? 175 : Number(maxLng);

            // Detect if bounds are basically global (zoomed out far)
            const isGlobal = (cMaxLat - cMinLat > 160) || (cMaxLng - cMinLng > 340);

            const queryBuilder = this.eventRepository
                .createQueryBuilder('event')
                .where('event.isActive = true')
                .andWhere('(event.startDate IS NULL OR event.startDate >= :now)', { now: new Date(Date.now() - 3600000) });

            if (!isGlobal) {
                queryBuilder.andWhere(
                    'ST_Intersects(event.location, ST_SetSRID(ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat), 4326)::geography)',
                    { minLng: cMinLng, minLat: cMinLat, maxLng: cMaxLng, maxLat: cMaxLat }
                );
            }

            const events = await queryBuilder
                .orderBy('event.adTier', 'DESC')
                .limit(100)
                .getMany();

            return this.toGeoJSON(events);
        } catch (error) {
            this.logger.error('Error in findInBounds', error instanceof Error ? error.stack : error);
            throw error;
        }
    }

    private toGeoJSON(events: Event[]) {
        return {
            type: 'FeatureCollection',
            features: events.map(event => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [Number(event.longitude), Number(event.latitude)]
                },
                properties: {
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    time: event.time,
                    venue: event.venue,
                    locationName: event.locationName,
                    category: event.category,
                    type: event.type,
                    adTier: event.adTier,
                    adSize: event.adSize,
                    imageUrl: event.imageUrl,
                    bannerUrl: event.bannerUrl,
                    price: Number(event.price),
                    attendees: event.attendees,
                    maxCapacity: event.maxCapacity,
                    isEcoFriendly: event.isEcoFriendly,
                    startDate: event.startDate,
                    lat: Number(event.latitude),
                    lng: Number(event.longitude)
                }
            }))
        };
    }

    // Helper to seed initial events if empty
    async seed() {
        const count = await this.eventRepository.count();
        if (count > 0) return { message: 'Events already seeded' };

        // Ensure we have a merchant for these events
        const defaultMerchant = await this.merchantsService.seed();

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
                price: 15000,
                maxCapacity: 100,
                soldTickets: 85,
                merchantId: defaultMerchant.id
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
                startDate: new Date(Date.now() + 86400000), // Tomorrow
                attendees: 32,
                isEcoFriendly: true,
                price: 5000,
                maxCapacity: 50,
                soldTickets: 12,
                merchantId: defaultMerchant.id
            },
            {
                title: "Noche de Langosta",
                description: "Cena gourmet con mariscos locales y música en vivo.",
                date: "Viernes, 7:00 PM",
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
                price: 12000,
                maxCapacity: 60,
                soldTickets: 45,
                merchantId: defaultMerchant.id
            },
            {
                title: "Rave en la Jungla",
                description: "Deep house y techno en medio de la selva. Experiencia inmersiva.",
                date: "Sábado, 11:00 PM",
                time: "23:00",
                locationName: "Punta Uva",
                venue: "Secret Jungle Spot",
                latitude: 9.6380,
                longitude: -82.7150,
                category: EventCategory.NIGHTLIFE,
                adTier: AdTier.GOLD,
                adSize: AdSize.LARGE,
                startDate: new Date(Date.now() + 259200000),
                attendees: 210,
                isEcoFriendly: true,
                price: 25000,
                maxCapacity: 300,
                soldTickets: 180,
                merchantId: defaultMerchant.id
            },
            {
                title: "Yoga & Mindfulness",
                description: "Sesión de meditación guiada al amanecer.",
                date: "Domingo, 6:00 AM",
                time: "06:00",
                locationName: "Manzanillo",
                venue: "Eco Lodge Roots",
                latitude: 9.6320,
                longitude: -82.6560,
                category: EventCategory.WORKSHOP,
                adTier: AdTier.SILVER,
                adSize: AdSize.SMALL,
                startDate: new Date(Date.now() + 345600000),
                attendees: 15,
                isEcoFriendly: true,
                price: 8000,
                maxCapacity: 25,
                soldTickets: 10,
                merchantId: defaultMerchant.id
            }
        ];

        for (const e of initialEvents) {
            try {
                await this.create(e as any);
            } catch (err) {
                console.error(`[EventsService] Failed to seed event ${e.title}:`, err);
                throw err;
            }
        }

        this.logger.log(`Seed completed! Total: ${initialEvents.length}`);
        return { message: 'Events seeded successfully', count: initialEvents.length };
    }
}

