import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Order } from '../orders/entities/order.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { LogisticsMission } from '../logistics/entities/logistics-mission.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Merchant, LogisticsMission, User])],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule { }
