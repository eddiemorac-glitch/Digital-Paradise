import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Added for Tasks
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserLocationSubscriber } from './modules/users/subscribers/user-location.subscriber';
import { MerchantLocationSubscriber } from './modules/merchants/subscribers/merchant-location.subscriber';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { ProductsModule } from './modules/products/products.module';
import { SeedModule } from './shared/seeders/seed.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { HealthModule } from './modules/health/health.module';
import { CacheModule } from './modules/cache/cache.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BlogModule } from './modules/blog/blog.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { CocoAiModule } from './modules/coco-ai/coco-ai.module';
import { AdminPanelModule } from './modules/admin/admin.module';
import { HaciendaModule } from './modules/hacienda/hacienda.module';
import { EmailsModule } from './modules/emails/emails.module';
import { LegalModule } from './modules/legal/legal.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(), // Enable Cron/Intervals
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: configService.get<number>('DB_PORT', 5432),
                username: configService.get<string>('DB_USERNAME', 'postgres'),
                password: configService.get<string>('DB_PASSWORD', 'postgres'),
                database: configService.get<string>('DB_NAME', 'caribe_digital'),
                entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
                autoLoadEntities: true,
                subscribers: [UserLocationSubscriber, MerchantLocationSubscriber],
                synchronize: configService.get('NODE_ENV') !== 'production',
                logging: configService.get('NODE_ENV') !== 'production',
                ...(configService.get('NODE_ENV') === 'production' && {
                    ssl: { rejectUnauthorized: false },
                }),
            }),
        }),
        EventEmitterModule.forRoot(),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        AdminPanelModule,
        HaciendaModule,   // Enabled globally
        EmailsModule,
        LegalModule,
        AuthModule,
        UsersModule,
        MerchantsModule,
        ProductsModule,
        OrdersModule,
        MessagesModule,
        ReviewsModule,
        HealthModule,
        CacheModule,
        SeedModule,
        LogisticsModule,
        PaymentsModule,
        EventsModule,
        NotificationsModule,
        BlogModule,
        RewardsModule,
        CocoAiModule,
        AnalyticsModule,
        UploadsModule,
        WinstonModule.forRoot({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.colorize(),
                        winston.format.printf(({ timestamp, level, message, context, trace }) => {
                            return `${timestamp} [${context}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
                        }),
                    ),
                }),
                new winston.transports.DailyRotateFile({
                    filename: 'logs/application-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                }),
            ],
        }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 10,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 50,
            },
            {
                name: 'long',
                ttl: 60000,
                limit: 200,
            },
        ]),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
