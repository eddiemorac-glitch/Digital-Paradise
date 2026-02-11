import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { Merchant } from './entities/merchant.entity';
import { Review } from '../reviews/entities/review.entity';
import { MerchantStatus, MerchantCategory } from '../../shared/enums/merchant.enum';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { MerchantResponseDto } from './dto/merchant-response.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../../shared/enums/order-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MerchantStatusChangedEvent } from './events/merchant-status-changed.event';
import { calculateDistance } from '../../shared/utils/geography';

@Injectable()
export class MerchantsService {
    private readonly logger = new Logger(MerchantsService.name);
    constructor(
        @InjectRepository(Merchant)
        private merchantRepository: Repository<Merchant>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async create(createMerchantDto: CreateMerchantDto) {
        const { latitude, longitude, userId, ...rest } = createMerchantDto;

        const merchant = this.merchantRepository.create({
            ...rest,
            userId,
            latitude,
            longitude,
        });

        const savedMerchant = await this.merchantRepository.save(merchant);

        // Force location update via raw SQL
        await this.merchantRepository.query(
            `UPDATE merchants SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
            [longitude, latitude, savedMerchant.id],
        );



        await this.clearCache();
        return savedMerchant;
    }

    async findAll(status?: MerchantStatus, category?: MerchantCategory, sortBy: 'rating' | 'distance' | 'name' = 'name', lat?: number, lng?: number, isSustainable?: boolean, isActive: boolean = true): Promise<MerchantResponseDto[]> {
        // Cache key: Only for non-distance queries (distance depends on user location)
        const useCache = sortBy !== 'distance';
        const cacheKey = useCache ? `merchants:${status || 'all'}:${category || 'all'}:${sortBy}:${isSustainable || 'any'}:${isActive}` : null;

        if (cacheKey) {
            const cached = await this.cacheManager.get<MerchantResponseDto[]>(cacheKey);
            if (cached) {
                this.logger.debug(`Cache HIT: ${cacheKey}`);
                return cached;
            }
        }

        const query = this.merchantRepository
            .createQueryBuilder('merchant')
            .leftJoin('merchant.reviews', 'review');

        if (status) query.andWhere('merchant.status = :status', { status });
        if (category) query.andWhere('merchant.category = :category', { category });
        if (isSustainable !== undefined) query.andWhere('merchant.isSustainable = :isSustainable', { isSustainable });
        if (isActive !== undefined) query.andWhere('merchant.isActive = :isActive', { isActive });

        query.groupBy('merchant.id')
            .addSelect('AVG(review.rating)', 'avgRating')
            .addSelect('COUNT(review.id)', 'reviewCount');

        if (sortBy === 'rating') {
            query.orderBy('AVG(review.rating)', 'DESC');
        } else if (sortBy === 'distance' && lat && lng) {
            query.addSelect(`ST_Distance(merchant.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`, 'distance')
                .setParameters({ lat, lng })
                .orderBy('distance', 'ASC');
        } else {
            query.orderBy('merchant.name', 'ASC');
        }

        const result = await query
            .getRawAndEntities()
            .then(({ entities, raw }) => {
                if (raw.length > 0) {
                    this.logger.debug('First Raw Row:', JSON.stringify(raw[0]));
                }
                return entities.map((entity, index) => new MerchantResponseDto({
                    ...entity,
                    avgRating: parseFloat(raw[index].avgRating || raw[index].avgrating) || 0,
                    reviewCount: parseInt(raw[index].reviewCount || raw[index].reviewcount) || 0,
                    distance: raw[index].distance ? parseFloat(raw[index].distance) : null,
                }));
            });

        // Store in cache for 60 seconds
        if (cacheKey) {
            await this.cacheManager.set(cacheKey, result, 60000);
            this.logger.debug(`Cache SET: ${cacheKey}`);
        }

        return result;
    }

    async findOne(id: string) {
        const merchant = await this.merchantRepository.findOne({ where: { id } });
        if (!merchant) throw new NotFoundException('Merchant not found');
        return merchant;
    }

    async radar(): Promise<any[]> {
        return this.merchantRepository.find({
            where: { isActive: true, status: MerchantStatus.ACTIVE },
            select: ['id', 'name', 'latitude', 'longitude', 'category', 'isSustainable']
        });
    }

    async findNearby(lat: number, lng: number, radiusKm: number): Promise<MerchantResponseDto[]> {
        const radiusMeters = radiusKm * 1000; // Convert km to meters

        const query = this.merchantRepository
            .createQueryBuilder('merchant')
            .leftJoin('reviews', 'review', 'review.merchantId = merchant.id')
            .select([
                'merchant.id',
                'merchant.name',
                'merchant.description',
                'merchant.address',
                'merchant.phone',
                'merchant.category',
                'merchant.bannerUrl',
                'merchant.status',
                'merchant.isActive',
                'merchant.latitude',
                'merchant.longitude',
                'merchant.isSustainable',
            ])
            .addSelect('AVG(review.rating)', 'avgRating')
            .addSelect('COUNT(review.id)', 'reviewCount')
            .addSelect(
                `ST_Distance(merchant.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)`,
                'distance',
            )
            .where(
                `ST_DWithin(merchant.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)`,
                { lng, lat, radiusMeters },
            )
            .andWhere('merchant.status = :status', { status: MerchantStatus.ACTIVE })
            .andWhere('merchant.isActive = :isActive', { isActive: true })
            .groupBy('merchant.id')
            .orderBy('distance', 'ASC');

        return query
            .getRawAndEntities()
            .then(({ entities, raw }) => {
                return entities.map((entity, index) => new MerchantResponseDto({
                    ...entity,
                    avgRating: parseFloat(raw[index].avgRating || raw[index].avgrating) || 0,
                    reviewCount: parseInt(raw[index].reviewCount || raw[index].reviewcount) || 0,
                    distance: raw[index].distance ? parseFloat(raw[index].distance) : null,
                }));
            });
    }

    async update(id: string, updateMerchantDto: Partial<CreateMerchantDto>) {
        const merchant = await this.findOne(id);
        const updated = await this.merchantRepository.save({ ...merchant, ...updateMerchantDto });

        if (updateMerchantDto.latitude !== undefined || updateMerchantDto.longitude !== undefined) {
            await this.merchantRepository.query(
                `UPDATE merchants SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
                [updated.longitude, updated.latitude, updated.id],
            );
        }

        await this.clearCache();
        return updated;
    }

    async findByUser(userId: string) {
        const merchant = await this.merchantRepository.findOne({ where: { userId } });
        if (!merchant) throw new NotFoundException('No merchant associated with this user');
        return merchant;
    }

    // ==================== ADMIN VERIFICATION METHODS ====================

    /**
     * Find all merchants pending approval
     */
    async findPendingApproval(): Promise<Merchant[]> {
        return this.merchantRepository.find({
            where: { status: MerchantStatus.PENDING_APPROVAL },
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Approve a merchant - changes status to ACTIVE
     */
    async approveMerchant(merchantId: string, adminUserId: string): Promise<Merchant> {
        const merchant = await this.findOne(merchantId);
        const oldStatus = merchant.status;

        if (merchant.status !== MerchantStatus.PENDING_APPROVAL) {
            throw new NotFoundException(`Merchant is not pending approval (current status: ${merchant.status})`);
        }

        merchant.status = MerchantStatus.ACTIVE;
        merchant.isActive = true; // New merchants approved are set to active
        merchant.verifiedBy = adminUserId;
        merchant.verifiedAt = new Date();
        merchant.rejectionReason = null;

        const updated = await this.merchantRepository.save(merchant);

        // Invalidate cache
        await this.clearCache();

        // Emit Event for Audit and Notifications
        this.eventEmitter.emit(
            'merchant.status.changed',
            new MerchantStatusChangedEvent(updated.id, updated.userId, updated.name, adminUserId, oldStatus, updated.status)
        );

        return updated;
    }


    /**
     * Reject a merchant - changes status to SUSPENDED with reason
     */
    async rejectMerchant(merchantId: string, adminUserId: string, rejectionReason: string): Promise<Merchant> {
        const merchant = await this.findOne(merchantId);
        const oldStatus = merchant.status;

        if (merchant.status !== MerchantStatus.PENDING_APPROVAL) {
            throw new NotFoundException(`Merchant is not pending approval (current status: ${merchant.status})`);
        }

        merchant.status = MerchantStatus.SUSPENDED;
        merchant.isActive = false; // Set inactive on rejection
        merchant.verifiedBy = adminUserId;
        merchant.verifiedAt = new Date();
        merchant.rejectionReason = rejectionReason;

        const updated = await this.merchantRepository.save(merchant);

        // Invalidate cache
        await this.clearCache();

        // Emit Event for Audit and Notifications
        this.eventEmitter.emit(
            'merchant.status.changed',
            new MerchantStatusChangedEvent(updated.id, updated.userId, updated.name, adminUserId, oldStatus, updated.status, rejectionReason)
        );

        return updated;
    }


    /**
     * Suspend an active merchant
     */
    async suspendMerchant(merchantId: string, adminUserId: string, reason?: string): Promise<Merchant> {
        const merchant = await this.findOne(merchantId);
        const oldStatus = merchant.status;

        if (merchant.status === MerchantStatus.SUSPENDED) {
            // Already suspended, update reason if provided
            if (reason) {
                merchant.rejectionReason = reason;
                await this.merchantRepository.save(merchant);
            }
            await this.clearCache();
            return merchant;
        }

        merchant.status = MerchantStatus.SUSPENDED;
        merchant.isActive = false; // Disable merchant operations on suspension
        merchant.verifiedBy = adminUserId;
        merchant.verifiedAt = new Date();
        if (reason) merchant.rejectionReason = reason;

        const updated = await this.merchantRepository.save(merchant);

        // Invalidate cache
        await this.clearCache();

        // Emit Event for Audit and Notifications
        this.eventEmitter.emit(
            'merchant.status.changed',
            new MerchantStatusChangedEvent(updated.id, updated.userId, updated.name, adminUserId, oldStatus, updated.status, reason)
        );

        return updated;
    }


    /**
     * Reactivate a suspended merchant
     */
    async reactivateMerchant(merchantId: string, adminUserId: string): Promise<Merchant> {
        const merchant = await this.findOne(merchantId);
        const oldStatus = merchant.status;

        if (merchant.status === MerchantStatus.ACTIVE && merchant.isActive) {
            // Already fully active
            await this.clearCache();
            return merchant;
        }

        merchant.status = MerchantStatus.ACTIVE;
        merchant.isActive = true; // Ensure the merchant is visible and active on the platform
        merchant.verifiedBy = adminUserId;
        merchant.verifiedAt = new Date();
        merchant.rejectionReason = null;

        const updated = await this.merchantRepository.save(merchant);

        // Invalidate cache
        await this.clearCache();

        // Emit Event for Audit and Notifications
        this.eventEmitter.emit(
            'merchant.status.changed',
            new MerchantStatusChangedEvent(updated.id, updated.userId, updated.name, adminUserId, oldStatus, updated.status)
        );

        return updated;
    }


    public async clearCache() {
        try {
            // Use reset if available (common in memory/redis stores)
            if (typeof (this.cacheManager as any).reset === 'function') {
                await (this.cacheManager as any).reset();
            } else {
                // Fallback to manual key deletion if we can list keys
                const store = (this.cacheManager as any).store;
                if (store && typeof store.keys === 'function') {
                    const keys = await store.keys();
                    const merchantKeys = keys.filter((key: string) => key.startsWith('merchants:'));
                    if (merchantKeys.length > 0) {
                        await Promise.all(merchantKeys.map((key: string) => this.cacheManager.del(key)));
                    }
                }
            }
            this.logger.debug('Cache cleared successfully');
        } catch (e) {
            this.logger.error('Cache clearing failed:', e);
        }
    }

    /**
     * Get tactical stats for a merchant
     */
    async getMerchantStats(merchantId: string, startDate?: string, endDate?: string) {
        try {
            // Default to last 7 days if not provided
            const end = endDate ? new Date(endDate) : new Date();
            const start = startDate ? new Date(startDate) : new Date();
            if (!startDate) start.setDate(end.getDate() - 6); // 7 days inclusive

            // Ensure end date covers the full day
            end.setHours(23, 59, 59, 999);
            start.setHours(0, 0, 0, 0);

            // 1. Efficient SQL Aggregation for KPI Cards (Filtered by Date Range)
            // CALCULATE REAL EARNINGS: Subtotal - Platform Fee
            const { grossSubtotal, totalPlatformFees } = await this.merchantRepository.manager
                .createQueryBuilder(Order, 'order')
                .select('SUM(order.subtotal)', 'grossSubtotal')
                .addSelect('SUM(order.platformFee)', 'totalPlatformFees')
                .where('order.merchantId = :merchantId', { merchantId })
                .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
                .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
                .getRawOne();

            const pendingOrders = await this.merchantRepository.manager.count(Order, {
                where: { merchantId, status: OrderStatus.PENDING }
            });

            const totalOrders = await this.merchantRepository.manager.count(Order, {
                where: {
                    merchantId,
                    createdAt: Between(start, end)
                }
            });

            const { avgRating, reviewCount } = await this.merchantRepository.manager
                .createQueryBuilder(Review, 'review')
                .select('AVG(review.rating)', 'avgRating')
                .addSelect('COUNT(review.id)', 'reviewCount')
                .where('review.merchantId = :merchantId', { merchantId })
                .getRawOne();

            const invoiceCount = await this.merchantRepository.manager.count(Order, {
                where: {
                    merchantId,
                    createdAt: Between(start, end),
                    haciendaKey: Not(IsNull())
                }
            });

            // 2. Optimized Chart Data (Dynamic Range)
            // Fetch relevant orders
            const ordersInRange = await this.merchantRepository.manager.find(Order, {
                where: {
                    merchantId,
                    createdAt: Between(start, end)
                },
                select: ['subtotal', 'platformFee', 'createdAt', 'status']
            });

            // Group by Date (Costa Rica Timezone)
            const chartDataMap = new Map<string, number>();

            // Initialize all days in range with 0
            const currentDate = new Date(start);
            while (currentDate <= end) {
                // Format: YYYY-MM-DD in CR Time
                const dateKey = currentDate.toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
                chartDataMap.set(dateKey, 0);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Aggregate orders
            ordersInRange.forEach(o => {
                if (o.status !== OrderStatus.CANCELLED && o.createdAt) {
                    const dateKey = o.createdAt.toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
                    // NET REVENUE FOR CHART: Subtotal - PlatformFee
                    const netVal = (Number(o.subtotal) || 0) - (Number(o.platformFee) || 0);

                    if (chartDataMap.has(dateKey)) {
                        chartDataMap.set(dateKey, (chartDataMap.get(dateKey) || 0) + netVal);
                    }
                }
            });

            // Convert map to array for frontend
            const chartData = Array.from(chartDataMap.entries()).map(([dateStr, total]) => {
                // Parse specifically for display formatting
                // We add "T12:00:00" to prevent timezone shifts when parsing back to Date object for formatting
                const dateObj = new Date(dateStr + 'T12:00:00');
                return {
                    date: dateObj.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric' }), // e.g. "lun 27"
                    fullDate: dateStr,
                    total
                };
            });

            // Final Calculations
            const gross = Number(grossSubtotal) || 0;
            const fees = Number(totalPlatformFees) || 0;
            const netRevenue = gross - fees;

            return {
                netRevenue, // The REAL money for the merchant
                grossSubtotal: gross,
                totalFees: fees,
                pendingOrders: Number(pendingOrders) || 0,
                totalOrders: Number(totalOrders) || 0,
                avgRating: Number(avgRating) || 5.0,
                reviewCount: Number(reviewCount) || 0,
                chartData,
                invoicesEmitted: Number(invoiceCount) || 0,
                dateRange: { start, end }
            };

        } catch (error) {
            this.logger.error(`Error calculating stats for merchant ${merchantId}:`, error);
            // Return safe defaults
            return {
                netRevenue: 0,
                grossSubtotal: 0,
                totalFees: 0,
                pendingOrders: 0,
                totalOrders: 0,
                avgRating: 5.0,
                reviewCount: 0,
                chartData: [],
                invoicesEmitted: 0
            };
        }
    }

    /**
     * Calculate delivery fee and distance (Phase 16)
     */
    async calculateDelivery(merchantId: string, lat: number, lng: number) {
        const merchant = await this.findOne(merchantId);

        if (!merchant.latitude || !merchant.longitude) {
            throw new NotFoundException('Comercio no tiene ubicación configurada para entregas.');
        }

        const distance = calculateDistance(
            merchant.latitude,
            merchant.longitude,
            lat,
            lng
        );

        const inRange = distance <= merchant.deliveryRadius;

        // Fee calculation logic
        const fee = Number(merchant.baseDeliveryFee) + (distance * Number(merchant.kmFee));

        // Dynamic ETA expectation (Phase 16, Gap 4)
        // Simple heuristic: Prep time + 2 minutes per KM
        const estimatedTime = merchant.prepTimeMinutes + Math.round(distance * 2);

        return {
            fee: Math.round(fee),
            distance: parseFloat(distance.toFixed(2)),
            inRange,
            estimatedTime,
            merchantName: merchant.name,
            address: merchant.address
        };
    }

    /**
     * Checks if a merchant is currently open and accepting orders
     */
    async isAvailable(merchantId: string): Promise<{ available: boolean; reason?: string }> {
        const merchant = await this.findOne(merchantId);

        // 1. Check strict Active status (Lifecycle + Operational)
        if (!merchant.isActive || merchant.status !== MerchantStatus.ACTIVE) {
            return { available: false, reason: 'MERCHANT_INACTIVE' };
        }

        // 2. Check Busy Mode
        if (merchant.operationalSettings?.isBusy) {
            return { available: false, reason: 'MERCHANT_BUSY' };
        }

        // 3. Check Opening Hours
        if (merchant.openingHours) {
            const isOpen = this.checkSchedule(merchant.openingHours);
            if (!isOpen) {
                return { available: false, reason: 'MERCHANT_CLOSED' };
            }
        }

        return { available: true };
    }

    /**
     * Helper to compare current Costa Rica time with merchant schedule
     */
    private checkSchedule(openingHours: any): boolean {
        // Costa Rica is UTC-6
        const now = new Date();
        // Adjust for UTC-6 (Costa Rica doesn't have DST)
        // Note: This logic assumes the server has a correct UTC time.
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const crTime = new Date(utc + (3600000 * -6));

        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const currentDay = days[crTime.getDay()];
        const schedule = openingHours[currentDay];

        if (!schedule || schedule.closed) return false;

        const currentTimeStr = `${String(crTime.getHours()).padStart(2, '0')}:${String(crTime.getMinutes()).padStart(2, '0')}`;

        return currentTimeStr >= schedule.open && currentTimeStr <= schedule.close;
    }

    /**
     * Updates the Merchant with Hacienda Credentials (P12, PIN, User)
     */
    async setHaciendaCredentials(
        merchantId: string,
        username: string,
        password: string,
        pin: string,
        p12Buffer: Buffer
    ) {
        const merchant = await this.findOne(merchantId);

        merchant.haciendaUsername = username;
        merchant.haciendaPassword = password;
        merchant.haciendaPin = pin;
        merchant.haciendaP12 = p12Buffer;
        merchant.haciendaStatus = 'ACTIVE'; // Optimistic

        // TODO: Validate credentials against Hacienda IDP immediately to confirm Validity?
        // For now, just save.

        await this.merchantRepository.save(merchant);

        // Clear cache so emitInvoice picks up new creds if it was cached (it's not but safe practice)
        await this.clearCache();

        return { message: 'Hacienda credentials updated successfully', status: 'ACTIVE' };
    }

    /**
     * Seeds a default merchant if none exist.
     * Used by EventsService to ensure seeded events have a valid merchant.
     */
    async seed() {
        const count = await this.merchantRepository.count();
        if (count > 0) {
            // Return the first merchant to be used as default
            return this.merchantRepository.findOne({ where: {} });
        }

        const defaultMerchant = await this.create({
            name: 'Caribe Digital System',
            description: 'Platform Admin Merchant for System Events',
            category: MerchantCategory.OTHER,
            address: 'Puerto Viejo, Limon',
            phone: '8888-8888',
            latitude: 9.65,
            longitude: -82.75,
            isActive: true,
            email: 'system@caribedigital.cr'
        });

        this.logger.log(`Default merchant seeded: ${defaultMerchant.id}`);
        return defaultMerchant;
    }

    async updateOperationalSettings(id: string, settings: Partial<Merchant['operationalSettings']>) {
        const merchant = await this.findOne(id);
        merchant.operationalSettings = {
            ...(merchant.operationalSettings || {}),
            ...settings
        };
        const saved = await this.merchantRepository.save(merchant);
        await this.clearCache();
        return saved;
    }
}
