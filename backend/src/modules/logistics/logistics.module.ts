import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { LogisticsMission } from './entities/logistics-mission.entity';
import { LogisticsGateway } from './logistics.gateway';
import { CourierService } from './courier.service';
import { CourierController } from './courier.controller';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([LogisticsMission, Order, User])],
    providers: [LogisticsService, LogisticsGateway, CourierService],
    controllers: [LogisticsController, CourierController],
    exports: [LogisticsService, LogisticsGateway, CourierService],
})
export class LogisticsModule { }
