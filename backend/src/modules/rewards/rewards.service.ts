import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Reward, UserRedemption, RewardType } from './entities/reward.entity';
import { RewardHistory } from './entities/reward-history.entity';

@Injectable()
export class RewardsService {
    private readonly logger = new Logger(RewardsService.name);

    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Reward)
        private readonly rewardRepository: Repository<Reward>,
        @InjectRepository(UserRedemption)
        private readonly redemptionRepository: Repository<UserRedemption>,
        @InjectRepository(RewardHistory)
        private readonly historyRepository: Repository<RewardHistory>,
    ) { }

    async awardPointsForOrder(order: Order): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check for idempotency (Critical read lock)
            // Use query builder to lock this row if it existed, but here we just check existence
            // A better way is to rely on the unique database constraint on (userId, orderId)
            const existingGrant = await queryRunner.manager.findOne(RewardHistory, {
                where: { userId: order.userId, orderId: order.id }
            });

            if (existingGrant) {
                this.logger.warn(`⚠️ Points already awarded for order ${order.id}. Skipping.`);
                await queryRunner.rollbackTransaction();
                return;
            }

            // Logic: Award base 10 points
            let pointsToAward = 10;
            let reason = 'Pedido estándar';

            // 1. Sustainability Bonus (+10 points)
            if (order.merchant?.isSustainable) {
                pointsToAward += 10;
                reason += ' + Bono Sostenible';
            }

            // 2. Eco-Distance Proximity Bonus (+5 points if < 5km)
            const user = await queryRunner.manager.findOne(User, { where: { id: order.userId } });
            if (user && user.lastLat && user.lastLng && order.merchant?.latitude && order.merchant?.longitude) {
                // Calculate distance in meters using raw query for PostGIS efficiency
                const result = await queryRunner.query(
                    `SELECT ST_Distance(
                        ST_SetSRID(ST_Point($1, $2), 4326)::geography,
                        ST_SetSRID(ST_Point($3, $4), 4326)::geography
                    ) as distance`,
                    [user.lastLng, user.lastLat, order.merchant.longitude, order.merchant.latitude]
                );

                const distance = result[0]?.distance;
                if (distance && distance < 5000) { // 5km
                    pointsToAward += 5;
                    reason += ' + Bono Eco-Distance';
                    this.logger.log(`🌱 Eco-Distance Bonus (+5): Distance ${Math.round(distance)}m for user ${user.id}`);
                }
            }

            if (user) {
                user.points = (user.points || 0) + pointsToAward;
                await queryRunner.manager.save(user);

                // Record the grant
                // CRITICAL: Use queryRunner.manager.create to ensure entity is bound to this transaction scope if using listeners
                const historyEntry = queryRunner.manager.create(RewardHistory, {
                    userId: user.id,
                    orderId: order.id,
                    points: pointsToAward,
                    reason
                });
                await queryRunner.manager.save(RewardHistory, historyEntry);

                await queryRunner.commitTransaction();
                this.logger.log(`🏆 Awarded ${pointsToAward} total points to user ${user.id} for order ${order.id}`);
            } else {
                await queryRunner.rollbackTransaction();
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to award points for order ${order.id}: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    async deductPointsForOrder(order: Order): Promise<void> {
        // ... (Similar reversal logic if needed)
    }

    async findAll(): Promise<Reward[]> {
        return this.rewardRepository.find({ where: { isActive: true } });
    }

    async getMyRedemptions(userId: string): Promise<UserRedemption[]> {
        return this.redemptionRepository.find({
            where: { userId },
            relations: ['reward'],
            order: { redeemedAt: 'DESC' }
        });
    }

    async redeem(rewardId: string, userId: string): Promise<any> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
            if (!reward) throw new NotFoundException('Reward not found');

            const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
            if (!user) throw new NotFoundException('User not found');

            if ((user.points || 0) < reward.pointCost) {
                throw new BadRequestException('Puntos insuficientes para este canje');
            }

            // Deduct points
            user.points -= reward.pointCost;
            await queryRunner.manager.save(user);

            // Create redemption
            const redemption = this.redemptionRepository.create({
                userId,
                rewardId,
                code: this.generateCode(),
                isUsed: false
            });
            await queryRunner.manager.save(redemption);

            await queryRunner.commitTransaction();

            // Return full redemption info
            return await this.redemptionRepository.findOne({
                where: { id: redemption.id },
                relations: ['reward']
            });

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private generateCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async seed(): Promise<any> {
        const count = await this.rewardRepository.count();
        if (count > 0) return { message: 'Already seeded' };

        const rewards = [
            {
                title: 'Café Gratis',
                description: 'Canjea este cupón por un café negro o con leche en cualquier comercio asociado.',
                pointCost: 100,
                type: RewardType.FREE_PRODUCT,
                imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400',
            },
            {
                title: 'Donación Tortugas',
                description: 'Donamos ₡1000 al Centro de Rescate de Tortugas en tu nombre.',
                pointCost: 500,
                type: RewardType.DONATION,
                imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=400',
            },
            {
                title: '10% Descuento',
                description: 'Obtén un 10% de descuento en tu próxima compra de comida.',
                pointCost: 200,
                type: RewardType.DISCOUNT,
                imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=400',
            }
        ];

        for (const r of rewards) {
            await this.rewardRepository.save(this.rewardRepository.create(r));
        }

        return { success: true, count: rewards.length };
    }
}
