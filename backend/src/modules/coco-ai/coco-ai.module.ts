import { Module } from '@nestjs/common';
import { CocoAiService } from './coco-ai.service';
import { CocoAiController } from './coco-ai.controller';
import { AuthModule } from '../auth/auth.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { ProductsModule } from '../products/products.module';
import { EventsModule } from '../events/events.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        AuthModule,
        MerchantsModule,
        ProductsModule,
        EventsModule,
        OrdersModule
    ],
    controllers: [CocoAiController],
    providers: [CocoAiService],
    exports: [CocoAiService],
})
export class CocoAiModule { }
