import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { Merchant } from './entities/merchant.entity';
import { MerchantActionLog } from './entities/merchant-action-log.entity';
import { MerchantAuditService } from './merchant-audit.service';
import { MerchantAuditListener } from './listeners/merchant-audit.listener';
import { MerchantNotificationListener } from './listeners/merchant-notification.listener';
import { Review } from '../reviews/entities/review.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Merchant, Review, MerchantActionLog]),
        forwardRef(() => NotificationsModule)
    ],
    providers: [
        MerchantsService,
        MerchantAuditService,
        MerchantAuditListener,
        MerchantNotificationListener
    ],
    controllers: [MerchantsController],
    exports: [MerchantsService, MerchantAuditService],
})
export class MerchantsModule { }
