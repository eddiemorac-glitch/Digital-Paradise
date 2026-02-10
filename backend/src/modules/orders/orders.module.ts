import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrderValidator } from './orders.validator';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { OrdersGateway } from './orders.gateway';
import { OrdersController } from './orders.controller';
import { OrderListenersService } from './listeners/order-listeners.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductsModule } from '../products/products.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { UsersModule } from '../users/users.module';
import { HaciendaModule } from '../hacienda/hacienda.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { RewardsModule } from '../rewards/rewards.module';
import { PaymentsModule } from '../payments/payments.module';
import { EventsModule } from '../events/events.module';
import { EmailsModule } from '../emails/emails.module';
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem]),
        ProductsModule,
        MerchantsModule,
        UsersModule,
        forwardRef(() => HaciendaModule),
        LogisticsModule,
        RewardsModule,
        forwardRef(() => PaymentsModule),
        EventsModule,
        EmailsModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService, OrderValidator, OrderFulfillmentService, OrdersGateway, OrderListenersService],
    exports: [OrdersService],
})
export class OrdersModule { }
