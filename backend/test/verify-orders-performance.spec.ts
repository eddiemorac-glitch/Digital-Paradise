import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../src/modules/orders/orders.service';
import { ProductsService } from '../src/modules/products/products.service';
import { EventsService } from '../src/modules/events/events.service';
import { MerchantsService } from '../src/modules/merchants/merchants.service';
import { UsersService } from '../src/modules/users/users.service';
import { DataSource, In } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../src/modules/orders/entities/order.entity';
import { OrderValidator } from '../src/modules/orders/orders.validator';
import { OrdersGateway } from '../src/modules/orders/orders.gateway';
import { TilopayService } from '../src/modules/payments/tilopay.service';
import { LogisticsService } from '../src/modules/logistics/logistics.service';
import { HaciendaService } from '../src/modules/hacienda/hacienda.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('OrdersService Performance', () => {
    let service: OrdersService;
    let productsService: ProductsService;

    const mockDataSource = {
        getRepository: jest.fn().mockReturnValue({
            findBy: jest.fn().mockResolvedValue([]), // For EventRequest
        }),
        createQueryRunner: jest.fn(),
    };

    const mockMerchantsService = {
        findOne: jest.fn().mockResolvedValue({
            id: 'merchant-1',
            name: 'Test Merchant',
            deliveryRadius: 10,
            baseDeliveryFee: 1000,
            kmFee: 100,
            prepTimeMinutes: 20
        }),
        calculateDelivery: jest.fn().mockResolvedValue({ inRange: true, fee: 1500 }),
    };

    const mockProductsService = {
        findByIds: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: getRepositoryToken(Order), useValue: {} },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: EventsService, useValue: { findByIds: jest.fn().mockResolvedValue([]) } },
                { provide: MerchantsService, useValue: mockMerchantsService },
                { provide: UsersService, useValue: {} },
                { provide: OrderValidator, useValue: {} },
                { provide: OrdersGateway, useValue: {} },
                { provide: DataSource, useValue: mockDataSource },
                { provide: EventEmitter2, useValue: {} },
                { provide: TilopayService, useValue: {} },
                { provide: LogisticsService, useValue: {} },
                { provide: HaciendaService, useValue: {} },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        productsService = module.get<ProductsService>(ProductsService);
    });

    it('should batch product lookups in calculateOrderTotal', async () => {
        const items = [
            { productId: 'p1', quantity: 1 },
            { productId: 'p2', quantity: 2 },
            { productId: 'p3', quantity: 1 }
        ];

        mockProductsService.findByIds.mockResolvedValue([
            { id: 'p1', price: 100, merchantId: 'merchant-1' },
            { id: 'p2', price: 200, merchantId: 'merchant-1' },
            { id: 'p3', price: 300, merchantId: 'merchant-1' },
        ]);

        await service.calculateOrderTotal(items, 'merchant-1');

        // Verify findByIds is called ONCE with all IDs, instead of findOne 3 times
        expect(mockProductsService.findByIds).toHaveBeenCalledTimes(1);
        expect(mockProductsService.findByIds).toHaveBeenCalledWith(['p1', 'p2', 'p3']);
        expect(mockProductsService.findOne).not.toHaveBeenCalled();
    });
});
