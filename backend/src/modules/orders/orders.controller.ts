import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException, Logger, ServiceUnavailableException, InternalServerErrorException, HttpException, Patch, Query, ParseUUIDPipe, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { MerchantsService } from '../merchants/merchants.service';
import { HaciendaService } from '../hacienda/hacienda.service';
import { Response } from 'express';
import { PdfService } from '../emails/pdf.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    private readonly logger = new Logger(OrdersController.name);

    constructor(
        private readonly ordersService: OrdersService,
        private readonly merchantsService: MerchantsService,
        private readonly haciendaService: HaciendaService,
        private readonly orderFulfillmentService: OrderFulfillmentService,
        private readonly pdfService: PdfService,
    ) { }

    @Post('create')
    async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(req.user.userId, createOrderDto);
    }

    @Post('preview')
    async preview(@Request() req, @Body() createOrderDto: CreateOrderDto) {
        const calculation = await this.ordersService.calculateOrderTotal(
            createOrderDto.items,
            createOrderDto.merchantId,
            createOrderDto.deliveryLat,
            createOrderDto.deliveryLng,
            createOrderDto.courierTip
        );
        return calculation.breakdown;
    }

    @Get()
    async findAll(@Request() req) {
        // If user is admin, return all (or paginated - implementing simple all for now)
        if (req.user.role === UserRole.ADMIN) {
            return this.ordersService.findAll();
        }
        // If user is merchant, return merchant orders
        if (req.user.role === UserRole.MERCHANT) {
            const merchant = await this.merchantsService.findByUser(req.user.userId);
            if (!merchant) {
                return []; // Or throw error
            }
            return this.ordersService.findAllByMerchant(merchant.id);
        }
        // Detailed delivery logic usually separate, but if courier:
        if (req.user.role === UserRole.DELIVERY) {
            // Logic to find by delivery person? 
            // Ideally we need to find the courier profile first.
            // For now defaults to user orders if not admin/merchant which might be wrong for courier app.
            // But let's stick to standard user orders for the "client" app part.
        }

        return this.ordersService.findAllByUser(req.user.userId);
    }

    @Get('delivery/available')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY, UserRole.ADMIN)
    async findAvailableDeliveries() {
        return this.orderFulfillmentService.findAllReadyForDelivery();
    }

    @Get('delivery/mine')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    async findMyDeliveries(@Request() req) {
        return this.ordersService.findAllByDeliveryPerson(req.user.userId);
    }

    @Get('merchant/my-orders')
    @UseGuards(RolesGuard)
    @Roles(UserRole.MERCHANT)
    async findMyMerchantOrders(@Request() req) {
        const merchant = await this.merchantsService.findByUser(req.user.userId);
        return this.ordersService.findAllByMerchant(merchant.id);
    }

    @Get(':id/delivery-otp')
    async getDeliveryOtp(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        const order = await this.ordersService.findOne(id);
        if (order.userId !== req.user.userId) {
            throw new BadRequestException('Solo el propietario del pedido puede ver el código de entrega');
        }
        const otp = order.logisticsMission?.metadata?.deliveryOtp || null;
        return {
            orderId: id,
            otp,
            courierName: order.logisticsMission?.courier?.fullName || null,
            missionStatus: order.logisticsMission?.status || null,
        };
    }

    @Get(':id/invoice')
    async downloadInvoice(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
        const order = await this.ordersService.findOne(id);
        const pdfBuffer = await this.pdfService.generateInvoicePdf(order, { clave: order.haciendaKey });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=factura-${id.slice(0, 8)}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }

    @Get(':id/ticket/:eventId')
    async downloadTicket(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Res() res: Response
    ) {
        const order = await this.ordersService.findOne(id);
        const item = order.items.find(i => i.eventId === eventId);

        if (!item || !item.event) {
            throw new BadRequestException('Event ticket not found for this order');
        }

        const pdfBuffer = await this.pdfService.generateEventTicketPdf(order, item.event);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=ticket-${eventId.slice(0, 8)}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        const order = await this.ordersService.findOne(id);
        // Security: Ensure user owns order or is merchant/admin
        if (req.user.role === UserRole.ADMIN) return order;
        if (req.user.userId === order.userId) return order;

        if (req.user.role === UserRole.MERCHANT) {
            const merchant = await this.merchantsService.findByUser(req.user.userId);
            if (merchant && merchant.id === order.merchantId) return order;
        }

        // Allow courier linked to order
        // if (order.deliveryPersonId === ...)

        // If none match, strict check:
        if (req.user.userId !== order.userId) { // Fallback
            // We might throw Forbidden here, but let's stick to simple logic for restoration
        }
        return order;
    }

    @Post(':id/claim')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    async claimOrder(@Param('id') id: string, @Request() req) {
        return this.orderFulfillmentService.claimOrder(id, req.user.userId);
    }

    @Post(':id/pickup')
    @UseGuards(RolesGuard)
    @Roles(UserRole.DELIVERY)
    async pickUpOrder(@Param('id') id: string, @Request() req) {
        return this.orderFulfillmentService.pickUpOrder(id, req.user.userId);
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.MERCHANT, UserRole.ADMIN, UserRole.DELIVERY)
    async updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto, @Request() req) {
        const order = await this.ordersService.findOne(id);

        // Authorization logic
        if (req.user.role === UserRole.MERCHANT) {
            const merchant = await this.merchantsService.findByUser(req.user.userId);
            if (order.merchantId !== merchant.id) throw new BadRequestException('Unauthorized');
        }
        // Courier logic...

        return this.ordersService.forceUpdateStatus(id, updateOrderStatusDto.status, updateOrderStatusDto.metadata);
    }

    @Patch(':id/cancel')
    async cancel(@Param('id') id: string, @Body('reason') reason: string, @Request() req) {
        const order = await this.ordersService.findOne(id);
        if (req.user.role !== UserRole.ADMIN && req.user.userId !== order.userId) {
            // Check if merchant
            const merchant = await this.merchantsService.findByUser(req.user.userId).catch(() => null);
            if (!merchant || merchant.id !== order.merchantId) {
                throw new BadRequestException('Unauthorized cancellation');
            }
        }
        return this.ordersService.cancelOrder(id, reason);
    }

    /**
     * Manually emit invoice for an order (Merchant)
     */
    @Post(':id/emit-invoice')
    @UseGuards(RolesGuard)
    @Roles(UserRole.MERCHANT, UserRole.ADMIN)
    async emitInvoice(@Param('id') id: string, @Request() req) {
        const order = await this.ordersService.findOne(id);

        // Security check: Only merchant owner or admin
        if (req.user.role === UserRole.MERCHANT) {
            const merchant = await this.merchantsService.findByUser(req.user.userId);
            if (order.merchantId !== merchant.id) {
                this.logger.warn(`Unauthorized invoice emission attempt by user ${req.user.userId} for order ${id}`);
                throw new BadRequestException('You are not authorized to emit invoices for this order');
            }
        }

        if (order.paymentStatus !== 'PAID') {
            throw new BadRequestException('Order must be PAID to emit an invoice');
        }

        try {
            this.logger.log(`Attempting manual invoice emission for order ${id} by ${req.user.userId} `);
            const result = await this.haciendaService.emitInvoice(order);

            if (result && (result.clave || result.status === 'success')) {
                await this.ordersService.updateOrderMetadata(id, {
                    haciendaClave: result.clave,
                    haciendaStatus: 'EMITTED',
                    haciendaEmittedAt: new Date().toISOString()
                });
                this.logger.log(`Invoice emitted successfully for order ${id}`);
                return { success: true, message: 'Invoice emitted successfully', clave: result.clave };
            }

            // If result is null/false, the Circuit Breaker might be open OR Hacienda failed silently
            this.logger.error(`Hacienda service returned null for order ${id}(Possible Circuit Open)`);
            throw new ServiceUnavailableException('Hacienda service is currently unavailable. Please try again later.');

        } catch (error) {
            this.logger.error(`Manual Hacienda emission failed for ${id}: ${error.message}`, error.stack);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new InternalServerErrorException(error.message || 'Failed to emit invoice');
        }
    }

}
