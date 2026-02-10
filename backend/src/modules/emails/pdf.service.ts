import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDoc = require('pdfkit');
import * as QRCode from 'qrcode';
import { Order } from '../orders/entities/order.entity';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    /**
     * Generates an attractive Digital Event Ticket with a QR code.
     */
    async generateEventTicketPdf(order: Order, event: Event): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDoc({ size: 'A6', margin: 20 });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', (err) => reject(err));

                // Aesthetic: Dark background (simulated with a rect)
                doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0B1015');

                // Primary Green Accent at Top
                doc.rect(0, 0, doc.page.width, 10).fill('#00FF66');

                // Header
                doc.fillColor('#00FF66')
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text('DIGITAL PARADISE', 20, 30, { characterSpacing: 2 });

                doc.fillColor('#FFFFFF')
                    .fontSize(18)
                    .text('EVENT TICKET', 20, 45, { characterSpacing: 1 });

                // Event Title
                doc.fillColor('#FFFFFF')
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text(event.title.toUpperCase(), 20, 80);

                doc.fillColor('#00FF66')
                    .fontSize(10)
                    .text(event.category || 'EVENTO', 20, 98);

                // Dividers
                doc.moveTo(20, 115).lineTo(doc.page.width - 20, 115).strokeColor('#FFFFFF22').stroke();

                // Details Grid
                doc.fillColor('#FFFFFF66').fontSize(8).text('FECHA Y HORA', 20, 130);
                doc.fillColor('#FFFFFF').fontSize(10).text(`${event.date || 'TBD'} - ${event.time || 'TBD'}`, 20, 140);

                doc.fillColor('#FFFFFF66').fontSize(8).text('LUGAR', 20, 165);
                doc.fillColor('#FFFFFF').fontSize(10).text(event.locationName || event.venue || 'Costa Rica', 20, 175);

                doc.fillColor('#FFFFFF66').fontSize(8).text('CLIENTE', 20, 200);
                doc.fillColor('#FFFFFF').fontSize(10).text(order.user?.fullName || 'Visitante', 20, 210);

                // QR Code Generation
                const qrData = JSON.stringify({
                    ticketId: `${order.id.slice(0, 8)}-${event.id.slice(0, 8)}`,
                    orderId: order.id,
                    eventId: event.id,
                    userId: order.userId,
                    type: 'EVENT_ACCESS'
                });

                const qrBuffer = await QRCode.toBuffer(qrData, {
                    color: {
                        dark: '#00FF66',
                        light: '#0B1015'
                    },
                    margin: 1,
                    width: 120
                });

                doc.image(qrBuffer, (doc.page.width - 120) / 2, 240, { width: 120 });

                // Footer
                doc.fillColor('#FFFFFF33')
                    .fontSize(7)
                    .text(`TICKET ID: ${order.id}`, 0, 380, { align: 'center' });

                doc.text('Presente este QR en la entrada del evento.', 0, 390, { align: 'center' });

                doc.end();
            } catch (err) {
                this.logger.error('Error generating event ticket PDF', err.stack);
                reject(err);
            }
        });
    }

    /**
     * Generates a standard Electronic Invoice PDF (Factura Electrónica).
     */
    async generateInvoicePdf(order: Order, haciendaData: any): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDoc({ size: 'A4', margin: 40 });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', (err) => reject(err));

                // Header section
                doc.fillColor('#000000').fontSize(20).font('Helvetica-Bold').text('FACTURA ELECTRÓNICA', { align: 'right' });
                doc.fontSize(10).text(`Clave: ${haciendaData?.clave || 'PENDING'}`, { align: 'right' });
                doc.text(`Consecutivo: ${haciendaData?.consecutive || 'PENDING'}`, { align: 'right' });
                doc.moveDown();

                // Emisor
                doc.fontSize(12).text('EMISOR', { underline: true });
                doc.fontSize(10).font('Helvetica-Bold').text(order.merchant?.name || 'Comercio Registrado');
                doc.font('Helvetica').text(`Cédula: ${order.merchant?.taxId || 'N/A'}`);
                doc.text(`Email: ${order.merchant?.email || 'N/A'}`);
                doc.text(`Dirección: ${order.merchant?.address || 'Costa Rica'}`);
                doc.moveDown();

                // Receptor
                doc.fontSize(12).text('RECEPTOR', { underline: true });
                doc.fontSize(10).font('Helvetica-Bold').text(order.user?.fullName || 'Cliente Final');
                doc.font('Helvetica').text(`Cédula: ${order.user?.taxId || 'N/A'}`);
                doc.text(`Email: ${order.user?.email || 'N/A'}`);
                doc.moveDown();

                // Table Header
                const tableTop = 320;
                doc.rect(40, tableTop, 515, 20).fill('#F0F0F0');
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
                doc.text('DESCRIPCION', 50, tableTop + 5);
                doc.text('CANT', 350, tableTop + 5);
                doc.text('PRECIO', 420, tableTop + 5);
                doc.text('TOTAL', 500, tableTop + 5);

                // Table Items
                let currentY = tableTop + 30;
                order.items.forEach(item => {
                    doc.font('Helvetica').fontSize(9);
                    doc.text(item.product?.name || item.event?.title || 'Producto/Servicio', 50, currentY);
                    doc.text(item.quantity.toString(), 350, currentY);
                    doc.text(`₡${Number(item.price).toLocaleString()}`, 420, currentY);
                    doc.text(`₡${(item.quantity * Number(item.price)).toLocaleString()}`, 500, currentY);
                    currentY += 20;
                });

                // Summary
                doc.moveTo(40, currentY + 10).lineTo(555, currentY + 10).stroke();
                currentY += 25;

                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Subtotal:', 400, currentY);
                doc.font('Helvetica').text(`₡${Number(order.subtotal || 0).toLocaleString()}`, 500, currentY);

                currentY += 15;
                doc.font('Helvetica-Bold').text('IVA:', 400, currentY);
                doc.font('Helvetica').text(`₡${Number(order.tax || 0).toLocaleString()}`, 500, currentY);

                currentY += 20;
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#00FF66');
                doc.text('TOTAL:', 400, currentY);
                doc.text(`₡${Number(order.total || 0).toLocaleString()}`, 500, currentY);

                // Footer
                doc.fillColor('#999999').fontSize(8).font('Helvetica').text(
                    'Documento generado electrónicamente. Autorizado mediante resolución DGT-R-48-2016.',
                    40, 750, { align: 'center' }
                );

                doc.end();
            } catch (err) {
                this.logger.error('Error generating invoice PDF', err.stack);
                reject(err);
            }
        });
    }
}
