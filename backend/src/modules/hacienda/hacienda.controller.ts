import { Controller, Post, Body, UseGuards, Param, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HaciendaService } from './hacienda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-role.enum';
import { OrdersService } from '../orders/orders.service';

@Controller('hacienda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HaciendaController {
    constructor(
        private readonly haciendaService: HaciendaService,
        private readonly ordersService: OrdersService,
    ) { }

    @Post('process-supplier-xml')
    @Roles(UserRole.MERCHANT, UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('xml'))
    async processSupplierXml(@UploadedFile() file: Express.Multer.File, @Body() body: { action: 'accept' | 'reject' }) {
        if (!file) throw new BadRequestException('XML file is required');

        const xmlContent = file.buffer.toString('utf-8');

        // Regex Extraction (Fast & Lightweight for "Mensaje Receptor" needs)
        const claveMatch = xmlContent.match(/<Clave>(.*?)<\/Clave>/);
        const emisorNombreMatch = xmlContent.match(/<Emisor>[\s\S]*?<Nombre>(.*?)<\/Nombre>/);
        const emisorIdMatch = xmlContent.match(/<Emisor>[\s\S]*?<Numero>(.*?)<\/Numero>/);
        const receptorIdMatch = xmlContent.match(/<Receptor>[\s\S]*?<Numero>(.*?)<\/Numero>/); // To verify it belongs to us
        const totalImpuestoMatch = xmlContent.match(/<TotalImpuesto>(.*?)<\/TotalImpuesto>/);
        const totalFacturaMatch = xmlContent.match(/<TotalComprobante>(.*?)<\/TotalComprobante>/);

        if (!claveMatch) {
            throw new BadRequestException('Invalid XML: Clave not found');
        }

        const extractedData = {
            clave: claveMatch[1],
            emisor: emisorNombreMatch ? emisorNombreMatch[1] : 'Unknown',
            emisorId: emisorIdMatch ? emisorIdMatch[1] : 'Unknown',
            receptorId: receptorIdMatch ? receptorIdMatch[1] : 'Unknown',
            totalImpuesto: totalImpuestoMatch ? parseFloat(totalImpuestoMatch[1]) : 0,
            totalFactura: totalFacturaMatch ? parseFloat(totalFacturaMatch[1]) : 0
        };

        // Here we would call haciendaService.sendMensajeReceptor(...)
        // For now, return the parsed data to prove logic works
        return {
            status: 'processed_locally',
            action: body.action,
            data: extractedData
        };
    }

    @Post('orders/:id/credit-note')
    @Roles(UserRole.ADMIN, UserRole.MERCHANT)
    async emitCreditNote(@Param('id') id: string, @Body() body: { reason: string }) {
        const order = await this.ordersService.findOne(id);
        if (!order) throw new BadRequestException('Order not found');

        // Assuming metadata stores the invoice clave
        const invoiceClave = order.metadata?.invoiceClave;
        if (!invoiceClave) throw new BadRequestException('Order does not have an associated invoice');

        return this.haciendaService.emitCreditNote(order, invoiceClave, body.reason);
    }
}
