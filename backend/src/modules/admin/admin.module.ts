import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '@adminjs/nestjs';
import { Database, Resource as TypeOrmResource } from '@adminjs/typeorm';
import AdminJS from 'adminjs';
import { User } from '../users/entities/user.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Cabys } from '../products/entities/cabys.entity';
import { LogisticsMission } from '../logistics/entities/logistics-mission.entity';
import { ActionHandler, ValidationError } from 'adminjs';
import { approveMerchant, rejectMerchant, suspendMerchant } from './handlers/merchant-actions';
import { openDispute, resolveDispute, createRefundOrderAction } from './handlers/order-actions';
import { createAssignCourierAction, exportMissionData } from './handlers/logistics-actions';
import { AdminStatsService } from './admin-stats.service';
import { AdminStatsController } from './admin-stats.controller';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { TilopayService } from '../payments/tilopay.service';
import { PaymentsModule } from '../payments/payments.module';
import { LogisticsService } from '../logistics/logistics.service';
import { LogisticsModule } from '../logistics/logistics.module';
import { UserRole } from '../../shared/enums/user-role.enum';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Register the TypeORM adapter
AdminJS.registerAdapter({ Database, Resource: TypeOrmResource });

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Merchant, Order, Product, Cabys, LogisticsMission]),
        AuthModule,
        PaymentsModule,
        LogisticsModule,
        AdminModule.createAdminAsync({
            imports: [AuthModule, ConfigModule, PaymentsModule, LogisticsModule],
            inject: [AuthService, ConfigService, TilopayService, LogisticsService],
            useFactory: (authService: AuthService, configService: ConfigService, tilopayService: TilopayService, logisticsService: LogisticsService) => ({
                adminJsOptions: {
                    rootPath: '/admin',
                    dashboard: {
                        component: AdminJS.bundle('./components/dashboard'),
                    },
                    branding: {
                        companyName: 'Caribe Digital Tactical',
                        logo: 'https://caribedigital.cr/logo-compact.png',
                        theme: {
                            colors: {
                                primary100: '#00ff66',
                                bg: '#050a06',
                                border: '#1a331e',
                                text: '#ffffff',
                            },
                        },
                    },
                    resources: [
                        {
                            resource: User,
                            options: {
                                navigation: { name: 'Comunidad', icon: 'User' },
                                listProperties: ['id', 'email', 'role', 'isActive', 'isEmailVerified'],
                                filterProperties: ['email', 'role', 'isActive'],
                                actions: {
                                    edit: { isAccessible: true },
                                    delete: { isAccessible: true },
                                },
                            },
                        },
                        {
                            resource: Merchant,
                            options: {
                                navigation: { name: 'Marketplace', icon: 'Store' },
                                listProperties: ['id', 'name', 'status', 'category', 'isActive'],
                                showProperties: ['id', 'name', 'status', 'category', 'address', 'phone', 'email', 'taxId', 'verifiedBy', 'verifiedAt', 'rejectionReason', 'isActive', 'isSustainable'],
                                editProperties: ['name', 'category', 'address', 'phone', 'email', 'taxId', 'logoUrl', 'bannerUrl', 'isSustainable'],
                                actions: {
                                    approveMerchant: {
                                        actionType: 'record',
                                        icon: 'CheckCircle',
                                        isVisible: (ctx) => ctx.record.params.status === 'pending_approval',
                                        handler: approveMerchant,
                                    },
                                    rejectMerchant: {
                                        actionType: 'record',
                                        icon: 'XCircle',
                                        isVisible: (ctx) => ctx.record.params.status === 'pending_approval',
                                        handler: rejectMerchant,
                                    },
                                    suspendMerchant: {
                                        actionType: 'record',
                                        icon: 'AlertTriangle',
                                        isVisible: (ctx) => ctx.record.params.status === 'active',
                                        handler: suspendMerchant,
                                    }
                                }
                            },
                        },
                        {
                            resource: Product,
                            options: {
                                navigation: { name: 'Marketplace', icon: 'Package' },
                                listProperties: ['id', 'name', 'price', 'isActive', 'merchantId'],
                            },
                        },
                        {
                            resource: Order,
                            options: {
                                navigation: { name: 'Operaciones', icon: 'ShoppingCart' },
                                listProperties: ['id', 'status', 'total', 'paymentStatus', 'createdAt', 'disputeStatus'],
                                showProperties: ['id', 'status', 'total', 'paymentStatus', 'userId', 'merchantId', 'deliveryId', 'deliveryAddress', 'haciendaKey', 'isElectronicInvoice', 'disputeStatus', 'disputeReason', 'disputeResolvedBy', 'disputeResolvedAt', 'createdAt'],
                                actions: {
                                    openDispute: {
                                        actionType: 'record',
                                        icon: 'AlertCircle',
                                        isVisible: (ctx) => !ctx.record.params.disputeStatus || ctx.record.params.disputeStatus === '',
                                        handler: openDispute,
                                    },
                                    resolveDispute: {
                                        actionType: 'record',
                                        icon: 'CheckCircle',
                                        isVisible: (ctx) => ctx.record.params.disputeStatus === 'open',
                                        handler: resolveDispute,
                                    },
                                    refundOrder: {
                                        actionType: 'record',
                                        icon: 'DollarSign',
                                        isVisible: (ctx) => ctx.record.params.paymentStatus === 'PAID',
                                        handler: createRefundOrderAction(tilopayService),
                                    },
                                    assignCourier: {
                                        actionType: 'record',
                                        icon: 'Truck',
                                        isVisible: (ctx) => ctx.record.params.status === 'CONFIRMED' || ctx.record.params.status === 'READY',
                                        handler: createAssignCourierAction(logisticsService),
                                    }
                                }
                            },
                        },
                        {
                            resource: LogisticsMission,
                            options: {
                                navigation: { name: 'Operaciones', icon: 'Map' },
                                listProperties: ['id', 'status', 'type', 'courierId', 'updatedAt'],
                                actions: {
                                    assignCourier: {
                                        actionType: 'record',
                                        icon: 'UserPlus',
                                        isVisible: (ctx) => ctx.record.params.status === 'pending' || !ctx.record.params.courierId,
                                        handler: createAssignCourierAction(logisticsService),
                                    },
                                    exportCSV: {
                                        actionType: 'resource',
                                        icon: 'Download',
                                        handler: exportMissionData,
                                    }
                                }
                            },
                        },
                    ],
                },
                auth: {
                    authenticate: async (email, password) => {
                        const user = await authService.validateUser(email, password);
                        if (user && user.role === UserRole.ADMIN) {
                            return user;
                        }
                        return null;
                    },
                    cookieName: 'adminjs_session',
                    cookiePassword: configService.getOrThrow<string>('JWT_SECRET'),
                },
            }),
        }),
    ],
    controllers: [AdminStatsController],
    providers: [AdminStatsService],
})
export class AdminPanelModule { }
