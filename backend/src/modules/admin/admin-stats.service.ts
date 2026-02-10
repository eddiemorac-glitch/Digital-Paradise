import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { LogisticsMission } from '../logistics/entities/logistics-mission.entity';
import { OrderStatus } from '../../shared/enums/order-status.enum';

@Injectable()
export class AdminStatsService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(LogisticsMission)
        private missionRepository: Repository<LogisticsMission>,
    ) { }

    async getSystemLogs(lines: number = 100) {
        const logDir = path.join(process.cwd(), 'logs');
        try {
            if (!fs.existsSync(logDir)) return { logs: [], error: 'Log directory not found' };

            const files = fs.readdirSync(logDir)
                .filter(file => file.startsWith('application-'))
                .sort()
                .reverse();

            if (files.length === 0) return { logs: [], error: 'No logs found' };

            const latestLog = path.join(logDir, files[0]);
            const content = fs.readFileSync(latestLog, 'utf8');

            const logEntries = content
                .trim()
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map((line, index) => {
                    try {
                        const parsed = JSON.parse(line);
                        return { id: index, ...parsed };
                    } catch (e) {
                        return { id: index, message: line, level: 'info', timestamp: new Date().toISOString() };
                    }
                })
                .reverse()
                .slice(0, lines);

            return { logs: logEntries, filename: files[0] };
        } catch (error) {
            return { logs: [], error: 'Failed to read logs', details: error.message };
        }
    }

    async getDashboardStats() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const ordersToday = await this.orderRepository.find({
            where: {
                createdAt: Between(todayStart, todayEnd),
                status: Not(OrderStatus.CANCELLED)
            }
        });

        // 1. Revenue Today (Gross Volume)
        const revenueToday = ordersToday.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        // 2. Financial Split Today
        const totalTaxToday = ordersToday.reduce((sum, order) => sum + (Number(order.tax) || 0), 0);
        const netProfitToday = ordersToday.reduce((sum, order) => sum + (Number(order.platformFee) || 0) + (Number(order.transactionFee) || 0), 0);

        // 3. Active Orders (Not Delivered/Cancelled)
        const activeOrdersCount = await this.orderRepository.count({
            where: {
                status: Not(In([OrderStatus.DELIVERED, OrderStatus.CANCELLED]))
            }
        });

        // 4. Live Missions (Logistics)
        const liveMissionsCount = await this.missionRepository.count({
            where: {
                status: Not(In([OrderStatus.DELIVERED, OrderStatus.CANCELLED]))
            }
        });

        // 5. New Users Today
        const newUsersToday = await this.userRepository.count({
            where: {
                createdAt: Between(todayStart, todayEnd)
            }
        });

        // 6. Courier Metrics
        const totalCouriers = await this.userRepository.count({ where: { role: 'delivery' as any } });
        const onlineCouriers = await this.userRepository.count({ where: { role: 'delivery' as any, isOnline: true } });

        // 7. Advanced Logistics KPIs
        const logisticsKpis = await this.calculateLogisticsKpis();

        return {
            revenueToday,
            totalTaxToday,
            netProfitToday,
            activeOrdersCount,
            liveMissionsCount,
            newUsersToday,
            totalCouriers,
            onlineCouriers,
            ...logisticsKpis,
            timestamp: new Date().toISOString()
        };
    }

    private async calculateLogisticsKpis() {
        // Last 7 days for trend analysis
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // All delivered missions in the last 7 days
        const deliveredMissions = await this.missionRepository.find({
            where: {
                status: OrderStatus.DELIVERED,
                updatedAt: Between(weekAgo, new Date())
            }
        });

        // Cancelled missions (failed deliveries)
        const failedDeliveries = await this.missionRepository.count({
            where: {
                status: OrderStatus.CANCELLED,
                updatedAt: Between(weekAgo, new Date())
            }
        });

        // Calculate average delivery time (in minutes)
        let avgDeliveryTimeMinutes = 0;
        if (deliveredMissions.length > 0) {
            const totalMinutes = deliveredMissions.reduce((sum, mission) => {
                const created = new Date(mission.createdAt).getTime();
                const completed = mission.metadata?.completedAt
                    ? new Date(mission.metadata.completedAt as string).getTime()
                    : new Date(mission.updatedAt).getTime();
                return sum + (completed - created) / (1000 * 60);
            }, 0);
            avgDeliveryTimeMinutes = Math.round(totalMinutes / deliveredMissions.length);
        }

        // On-time delivery rate (missions under 45 min = on-time)
        const ON_TIME_THRESHOLD_MINUTES = 45;
        const onTimeMissions = deliveredMissions.filter(mission => {
            const created = new Date(mission.createdAt).getTime();
            const completed = mission.metadata?.completedAt
                ? new Date(mission.metadata.completedAt as string).getTime()
                : new Date(mission.updatedAt).getTime();
            const durationMinutes = (completed - created) / (1000 * 60);
            return durationMinutes <= ON_TIME_THRESHOLD_MINUTES;
        });

        const onTimeDeliveryRate = deliveredMissions.length > 0
            ? Math.round((onTimeMissions.length / deliveredMissions.length) * 100)
            : 100;

        return {
            avgDeliveryTimeMinutes,
            onTimeDeliveryRate,
            failedDeliveries,
            totalDelivered7d: deliveredMissions.length,
            totalNetProfit7d: deliveredMissions.reduce((sum, m) => {
                const order = (m as any).order;
                return sum + (Number(order?.platformFee) || 0) + (Number(order?.transactionFee) || 0);
            }, 0) || 0
        };
    }
}
