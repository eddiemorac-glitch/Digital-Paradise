import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from './entities/notification.entity';

import { EmailsModule } from '../emails/emails.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        EmailsModule,
    ],
    providers: [NotificationsService, NotificationsGateway],
    controllers: [NotificationsController],
    exports: [NotificationsService],
})
export class NotificationsModule { }
