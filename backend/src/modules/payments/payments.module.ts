import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { TilopayWebhookController } from './tilopay-webhook.controller';
import { ConfigModule } from '@nestjs/config';
import { TilopayService } from './tilopay.service';
import { OrdersModule } from '../orders/orders.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookLog } from './entities/webhook-log.entity';

@Module({
    imports: [
        ConfigModule,
        forwardRef(() => OrdersModule),
        TypeOrmModule.forFeature([WebhookLog])
    ],
    controllers: [PaymentsController, TilopayWebhookController],
    providers: [TilopayService],
    exports: [TilopayService],
})
export class PaymentsModule { }
