import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, IsNull, Not } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { LogisticsMission } from '../logistics/entities/logistics-mission.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../../shared/enums/order-status.enum';
import { UserRole } from '../../shared/enums/user-role.enum';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Merchant)
        private merchantRepository: Repository<Merchant>,
        @InjectRepository(LogisticsMission)
        private missionRepository: Repository<LogisticsMission>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async getAdminSummary() {
        const revenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'total')
            .addSelect('SUM(order.tax)', 'totalTax')
            .addSelect('SUM(order.platformFee)', 'totalPlatformFee')
            .addSelect('SUM(order.transactionFee)', 'totalTransactionFee')
            .addSelect('SUM(order.subtotal)', 'totalSubtotal')
            .where('order.paymentStatus = :status', { status: 'PAID' })
            .getRawOne();

        const totalRevenue = parseFloat(revenueResult?.total || '0');
        const totalTax = parseFloat(revenueResult?.totalTax || '0');
        const platformProfit = parseFloat(revenueResult?.totalPlatformFee || '0') + parseFloat(revenueResult?.totalTransactionFee || '0');
        const netVolume = parseFloat(revenueResult?.totalSubtotal || '0');

        // 2. Total Orders (excluding cancelled)
        const totalOrders = await this.orderRepository.count({
            where: { status: Not(OrderStatus.CANCELLED) }
        });

        // 3. Order Status Distribution
        const statusDistribution = await this.orderRepository
            .createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('order.status')
            .getRawMany();

        // 4. Revenue Trend (Daily for the last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyTrends = await this.orderRepository
            .createQueryBuilder('order')
            .select("DATE_TRUNC('day', order.createdAt)", 'date')
            .addSelect('SUM(order.total)', 'revenue')
            .addSelect('COUNT(*)', 'orders')
            .where('order.createdAt >= :date', { date: sevenDaysAgo })
            .andWhere('order.paymentStatus = :status', { status: 'PAID' })
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        // 5. Top Merchants
        const topMerchants = await this.orderRepository
            .createQueryBuilder('order')
            .leftJoin('order.merchant', 'merchant')
            .select('merchant.id', 'id')
            .addSelect('merchant.name', 'name')
            .addSelect('SUM(order.total)', 'revenue')
            .addSelect('COUNT(*)', 'orders')
            .where('order.paymentStatus = :status', { status: 'PAID' })
            .groupBy('merchant.id')
            .addGroupBy('merchant.name')
            .orderBy('revenue', 'DESC')
            .limit(5)
            .getRawMany();

        // 6. Logistics & Courier KPIs
        const onlineCouriers = await this.userRepository.count({
            where: { role: UserRole.DELIVERY, isOnline: true }
        });

        // 7. OTDR (On-Time Delivery Rate) & Avg Service Time
        // Note: Using raw SQL for JSONB metadata extraction
        const deliveryMetrics = await this.missionRepository
            .createQueryBuilder('mission')
            .select("AVG(EXTRACT(EPOCH FROM ((mission.metadata->>'completedAt')::timestamp - mission.createdAt)) / 60)", 'avgMinutes')
            .addSelect("COUNT(*)", 'totalDelivered')
            .addSelect(
                "COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ((mission.metadata->>'completedAt')::timestamp - mission.createdAt)) / 60 <= mission.estimatedMinutes)",
                'onTimeCount'
            )
            .where("mission.status = :status", { status: OrderStatus.DELIVERED })
            .andWhere("mission.metadata->>'completedAt' IS NOT NULL")
            .getRawOne();

        const totalDelivered = parseInt(deliveryMetrics?.totalDelivered || '0');
        const onTimeCount = parseInt(deliveryMetrics?.onTimeCount || '0');
        const otdr = totalDelivered > 0 ? (onTimeCount / totalDelivered) * 100 : 0;
        const avgServiceTime = parseFloat(deliveryMetrics?.avgMinutes || '0');

        // 8. Hacienda Sync Status
        const paidOrdersCount = await this.orderRepository.count({
            where: { paymentStatus: 'PAID' }
        });
        const syncedOrdersCount = await this.orderRepository.count({
            where: { paymentStatus: 'PAID', haciendaKey: Not(IsNull()) }
        });
        const haciendaSyncRate = paidOrdersCount > 0 ? (syncedOrdersCount / paidOrdersCount) * 100 : 0;

        // 9. Recent Forensic Activity (Last 5 orders)
        const recentOrders = await this.orderRepository.find({
            where: { paymentStatus: 'PAID' },
            order: { createdAt: 'DESC' },
            take: 5,
            relations: ['merchant']
        });

        return {
            summary: {
                totalRevenue,
                totalTax,
                platformProfit,
                netVolume,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                onlineCouriers,
                otdr: Math.round(otdr * 10) / 10,
                avgServiceTime: Math.round(avgServiceTime * 10) / 10,
                haciendaSyncRate: Math.round(haciendaSyncRate * 10) / 10,
            },
            statusDistribution,
            dailyTrends: dailyTrends.map(t => ({
                date: t.date.toISOString().split('T')[0],
                revenue: parseFloat(t.revenue),
                orders: parseInt(t.orders)
            })),
            topMerchants: topMerchants.map(m => ({
                id: m.id,
                name: m.name,
                revenue: parseFloat(m.revenue),
                orders: parseInt(m.orders)
            })),
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                merchantName: o.merchant?.name || 'Unknown',
                subtotal: o.subtotal,
                tax: o.tax,
                transactionFee: o.transactionFee,
                platformFee: o.platformFee,
                total: o.total,
                createdAt: o.createdAt
            }))
        };
    }

    async getMerchantAnalytics(merchantId: string) {
        const stats = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'revenue')
            .addSelect('COUNT(*)', 'totalOrders')
            .where('order.merchantId = :merchantId', { merchantId })
            .andWhere('order.paymentStatus = :status', { status: 'PAID' })
            .getRawOne();

        const statusBreakdown = await this.orderRepository
            .createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('order.merchantId = :merchantId', { merchantId })
            .groupBy('order.status')
            .getRawMany();

        return {
            revenue: parseFloat(stats?.revenue || '0'),
            totalOrders: parseInt(stats?.totalOrders || '0'),
            statusBreakdown
        };
    }

    async getHeatmapData() {
        // Fetch orders with location data
        const heatmapData = await this.orderRepository
            .createQueryBuilder('order')
            .select('order.deliveryLat', 'lat')
            .addSelect('order.deliveryLng', 'lng')
            .addSelect('order.total', 'weight')
            .where('order.deliveryLat IS NOT NULL')
            .andWhere('order.deliveryLng IS NOT NULL')
            .getRawMany();

        return heatmapData.map(d => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lng),
            weight: parseFloat(d.weight)
        }));
    }

    async getRetentionMetrics(days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. New Users (Created in period)
        const newUsers = await this.userRepository.count({
            where: {
                createdAt: MoreThan(startDate),
                role: UserRole.CLIENT
            }
        });

        // 2. Returning Users (Active in period but created BEFORE period)
        const activeUsersResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('DISTINCT(order.userId)', 'userId')
            .where('order.createdAt >= :startDate', { startDate })
            .getRawMany();

        const activeUserIds = activeUsersResult.map(u => u.userId);

        let returningUsers = 0;
        if (activeUserIds.length > 0) {
            returningUsers = await this.userRepository.count({
                where: {
                    id: (activeUserIds as any), // TypeORM In(...) handled automatically if array? No, need In operator import or raw. 
                    // Let's use QueryBuilder for safety with large arrays
                    createdAt: Not(MoreThan(startDate)) // Created BEFORE start date
                }
            });
            // Actually, easier logic:
            // Returning = Count of Users where ID IN (activeUserIds) AND createdAt < startDate
            returningUsers = await this.userRepository
                .createQueryBuilder('user')
                .where('user.id IN (:...ids)', { ids: activeUserIds })
                .andWhere('user.createdAt < :startDate', { startDate })
                .getCount();
        }

        return {
            period: `${days} days`,
            newUsers,
            returningUsers,
            totalActive: newUsers + returningUsers
        };
    }

    async getDeliveryPerformance() {
        // Breakdown by distance buckets (0-2km, 2-5km, 5km+)
        // We use LogisticsMission actualDistanceKm and duration

        const missions = await this.missionRepository.find({
            where: { status: OrderStatus.DELIVERED },
            select: ['actualDistanceKm', 'createdAt', 'metadata', 'estimatedMinutes']
        });

        const buckets = {
            '0-2km': { count: 0, totalTime: 0, totalDistance: 0 },
            '2-5km': { count: 0, totalTime: 0, totalDistance: 0 },
            '5km+': { count: 0, totalTime: 0, totalDistance: 0 }
        };

        for (const m of missions) {
            const dist = m.actualDistanceKm || 0;
            const completedAt = m.metadata?.completedAt ? new Date(m.metadata.completedAt) : null;
            if (!completedAt) continue;

            const durationMinutes = (completedAt.getTime() - m.createdAt.getTime()) / 60000;

            if (dist <= 2) {
                buckets['0-2km'].count++;
                buckets['0-2km'].totalTime += durationMinutes;
                buckets['0-2km'].totalDistance += dist;
            } else if (dist <= 5) {
                buckets['2-5km'].count++;
                buckets['2-5km'].totalTime += durationMinutes;
                buckets['2-5km'].totalDistance += dist;
            } else {
                buckets['5km+'].count++;
                buckets['5km+'].totalTime += durationMinutes;
                buckets['5km+'].totalDistance += dist;
            }
        }

        return Object.keys(buckets).map(key => ({
            zone: key,
            avgTime: buckets[key].count > 0 ? Math.round(buckets[key].totalTime / buckets[key].count) : 0,
            avgDistance: buckets[key].count > 0 ? (buckets[key].totalDistance / buckets[key].count).toFixed(2) : 0,
            count: buckets[key].count
        }));
    }
}
