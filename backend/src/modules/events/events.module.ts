import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { EventRequest } from './entities/event-request.entity';
import { EventRequestsService } from './event-requests.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MerchantsModule } from '../merchants/merchants.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Event, EventRequest]),
        TypeOrmModule.forFeature([Event, EventRequest]),
        NotificationsModule,
        MerchantsModule
    ],
    providers: [EventsService, EventRequestsService],
    controllers: [EventsController],
    exports: [EventsService, EventRequestsService],
})
export class EventsModule { }
