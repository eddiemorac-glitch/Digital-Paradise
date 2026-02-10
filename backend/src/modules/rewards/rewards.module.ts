import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { Reward, UserRedemption } from './entities/reward.entity';
import { RewardHistory } from './entities/reward-history.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Reward, UserRedemption, RewardHistory])],
    controllers: [RewardsController],
    providers: [RewardsService],
    exports: [RewardsService],
})
export class RewardsModule { }
