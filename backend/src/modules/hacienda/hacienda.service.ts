import { Injectable, Logger, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Order } from '../orders/entities/order.entity';
import { HaciendaAuthService } from './hacienda-auth.service';
import { HaciendaXmlService } from './hacienda-xml.service';
import { OrdersService } from '../orders/orders.service';
import { TaxIdType } from '../../shared/enums/tax-id-type.enum';
import { CircuitBreaker } from '../../shared/utils/circuit-breaker.util';
import { OrderPaidEvent } from '../orders/events/order-paid.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HaciendaSequence } from './entities/hacienda-sequence.entity';

@Injectable()
export class HaciendaService {
    private readonly logger = new Logger(HaciendaService.name);
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly circuitBreaker: CircuitBreaker;

    constructor(
        private configService: ConfigService,
        private authService: HaciendaAuthService,
        private xmlService: HaciendaXmlService,
        @InjectRepository(HaciendaSequence)
        private sequenceRepository: Repository<HaciendaSequence>,
        private dataSource: DataSource,
        @Inject(forwardRef(() => OrdersService))
        private readonly ordersService: OrdersService,
    ) {
        this.apiKey = this.configService.get<string>('HACIENDA_API_KEY', '');

        this.baseUrl = this.configService.get<string>('HACIENDA_RECEPCION_URL') ||
            (this.configService.get('HACIENDA_SANDBOX') === 'true'
                ? 'https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1'
                : 'https://api.comprobanteselectronicos.go.cr/recepcion/v1');

        this.circuitBreaker = new CircuitBreaker('Hacienda', {
            failureThreshold: 5, // More tolerant than payment
            recoveryTimeout: 60000 // 1 minute
        });

        this.logger.log(`Hacienda API Key: ${this.apiKey ? 'CONFIGURED' : 'MISSING — emitREP/emitCreditNote will fail'}`);
    }

    /**
     * Emits an electronic invoice to the HaciendaCore system.
     * Supports Multi-Issuer (Marketplace) logic.
     */
    @OnEvent('order.paid')
    async handleOrderPaid(event: OrderPaidEvent) {
        const { order } = event;
        // Only emit if it's an electronic invoice order
        if (order.isElectronicInvoice) {
            this.logger.log(`[HACIENDA] Auto-triggering invoice emission for PAID order ${order.id}`);
            try {
                await this.emitInvoice(order);
            } catch (error) {
                this.logger.error(`[HACIENDA] Auto-emission failed for order ${order.id}: ${error.message}`);
            }
        }
    }

    async emitInvoice(order: Order): Promise<any> {
        return this.circuitBreaker.execute(async () => {
            try {
                this.logger.log(`Starting v4.4 emission for order ${order.id}`);

                if (!order.merchant) {
                    throw new Error('Order does not have an associated merchant');
                }

                // 1. Validate Merchant Credentials (MARKETPLACE MODEL)
                // Use explicit check or fallback to platform keys only if necessary (not recommended for legal comp)
                if (!order.merchant.haciendaP12 || !order.merchant.haciendaPin) {
                    throw new Error(`Merchant ${order.merchant.name} is not configured for Electronic Invoicing (Msising P12/PIN)`);
                }

                // 2. Generate robust identifiers (or reuse if already exist)
                let consecutive = order.electronicSequence;
                let clave = order.haciendaKey;

                if (!consecutive || !clave) {
                    this.logger.log(`Order ${order.id} missing identifiers. Generating new ones...`);
                    const identifiers = await this.generateClaveAndConsecutive(order, '01');
                    consecutive = identifiers.consecutive;
                    clave = identifiers.clave;

                    // Proactively save to order
                    await this.ordersService.updateOrderMetadata(order.id, {
                        haciendaKey: clave,
                        electronicSequence: consecutive,
                        haciendaStatus: 'GENERATED'
                    });
                }

                // 3. Generate and Sign XML (Using Merchant's P12)
                const xml = this.xmlService.generateFacturaXml(order, consecutive, clave);

                // Convert Buffer to Base64 for forge util if needed, or pass buffer directly if service handles it
                // forge.util.decode64 expects a base64 string
                const p12Base64 = order.merchant.haciendaP12.toString('base64');
                const p12Pin = order.merchant.haciendaPin;

                const signedXml = await this.xmlService.signXml(xml, p12Base64, p12Pin, order.id);

                // 4. Get Auth Token (Using Merchant's Credentials)
                const token = await this.authService.getAccessToken(order.merchant);

                // 5. Submit to Hacienda
                const payload = {
                    clave,
                    fecha: new Date().toISOString(),
                    emisor: {
                        tipoIdentificacion: order.merchant.taxIdType || '02',
                        numeroIdentificacion: order.merchant.taxId || '3000000000'
                    },
                    receptor: {
                        tipoIdentificacion: order.user?.taxIdType || '01',
                        numeroIdentificacion: order.user?.taxId || '100000000'
                    },
                    comprobanteXml: Buffer.from(signedXml).toString('base64')
                };

                const response = await axios.post(`${this.baseUrl}/recepcion`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                this.logger.log(`✅ Hacienda v4.4 receipt accepted for ${order.merchant.name}. Status: ${response.status}`);

                // 6. Update order metadata
                await this.ordersService.updateOrderMetadata(order.id, {
                    haciendaStatus: 'EMITTED',
                    haciendaClave: clave,
                    haciendaEmittedAt: new Date().toISOString(),
                    haciendaResponse: response.data
                });

                return { status: 'success', clave, response: response.data };

            } catch (error: any) {
                // Rethrow to trigger circuit breaker failure counting
                throw error;
            }
        }).catch(error => {
            this.logger.error(`❌ Hacienda v4.4 emission failed (Circuit): ${error.response?.data?.message || error.message}`);
            // Return null or fallback to avoid breaking the order flow completely
            return null;
        });
    }

    /**
     * Generates a robust Clave and Consecutive by incrementing the merchant's sequence.
     */
    async generateClaveAndConsecutive(order: Order, docType: string, manager?: any): Promise<{ clave: string; consecutive: string }> {
        const terminal = '001';
        const puntoVenta = '00001';

        // 1. Get and increment sequence transactionally
        const secuencialNumber = await this.getNextSequence(order.merchantId, docType, terminal, puntoVenta, manager);
        const secuencial = secuencialNumber.toString().padStart(10, '0');

        const consecutive = `${terminal}${puntoVenta}${docType}${secuencial}`;

        // 2. Build Clave
        const pais = '506';
        const fecha = new Date();
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear().toString().slice(-2);
        const cedula = (order.merchant?.taxId || '3000000000').padStart(12, '0');
        const situacion = '1'; // 1=Normal
        const seguridad = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

        const clave = `${pais}${dia}${mes}${anio}${cedula}${consecutive}${situacion}${seguridad}`;

        return { clave, consecutive };
    }

    private async getNextSequence(merchantId: string, documentType: string, terminal: string, puntoVenta: string, manager?: any): Promise<number> {
        const work = async (m: any) => {
            let sequence = await m.findOne(HaciendaSequence, {
                where: { merchantId, documentType, terminal, puntoVenta },
                lock: { mode: 'pessimistic_write' }
            });

            if (!sequence) {
                sequence = m.create(HaciendaSequence, {
                    merchantId,
                    documentType,
                    terminal,
                    puntoVenta,
                    currentValue: 1
                });
            } else {
                sequence.currentValue = Number(sequence.currentValue) + 1;
            }

            await m.save(HaciendaSequence, sequence);
            return Number(sequence.currentValue);
        };

        if (manager) {
            return await work(manager);
        } else {
            return await this.dataSource.transaction(work);
        }
    }

    private generateConsecutive(docType: string): string {
        const terminal = '001';
        const puntoVenta = '00001';
        // SECUENCIAL: Ideally this should be a DB sequence. 
        // For now, we use a nano-timestamp based approach to ensure uniqueness and increase over time.
        const now = Date.now().toString(); // ms since epoch
        const secuencial = now.slice(-10).padStart(10, '0');

        this.logger.warn(`⚠️ Using timestamp-based secuencial (${secuencial}). Real production should use a database sequence!`);
        return `${terminal}${puntoVenta}${docType}${secuencial}`;
    }

    private generateClave(order: Order, consecutive: string): string {
        const pais = '506';
        const fecha = new Date();
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear().toString().slice(-2);
        const cedula = (order.merchant?.taxId || '3000000000').padStart(12, '0');
        const situacion = '1'; // 1=Normal
        const seguridad = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        return `${pais}${dia}${mes}${anio}${cedula}${consecutive}${situacion}${seguridad}`;
    }

    private mapOrderToFactura(order: Order) {
        // Prepare line items
        const items = (order.items || []).map((item, index) => {
            const price = Number(item.price);
            const quantity = Number(item.quantity) || 1;
            const subtotal = price * quantity;

            // Tax calculation based on CABYS data
            const taxRate = item.product?.cabys?.impuesto || 13;
            const taxAmount = (subtotal * taxRate) / 100;

            // Map tax rate to Hacienda tariff codes
            let codigoTarifa = "08"; // Default 13%
            if (taxRate === 4) codigoTarifa = "07";
            else if (taxRate === 2) codigoTarifa = "06";
            else if (taxRate === 1) codigoTarifa = "05";
            else if (taxRate === 0) codigoTarifa = "01";

            return {
                numeroLinea: index + 1,
                codigoCabys: item.product?.cabysCode || "0000000000000",
                detalle: item.product?.name || "Articulo sin nombre",
                cantidad: quantity,
                unidadMedida: "Unid",
                precioUnitario: price,
                montoTotal: subtotal,
                subTotal: subtotal,
                montoTotalLinea: subtotal,
                impuesto: {
                    codigo: "01", // IVA
                    codigoTarifa: codigoTarifa,
                    tarifa: taxRate,
                    monto: taxAmount
                }
            };
        });

        const totalImpuesto = items.reduce((acc, item) => acc + item.impuesto.monto, 0);
        const totalVenta = items.reduce((acc, item) => acc + item.montoTotal, 0);

        // Build Hacienda docData payload
        return {
            emisor: {
                nombre: order.merchant?.name || "Comercio DIGITAL PARADISE",
                tipoIdentificacion: order.merchant?.taxIdType || TaxIdType.LEGAL,
                numeroIdentificacion: order.merchant?.taxId || "3101000000",
                correo: order.merchant?.email || "facturacion@digitalparadise.cr",
                ubicacion: {
                    provincia: "7", // Limon
                    canton: "01",
                    distrito: "01",
                    senas: order.merchant?.address || "Costa Rica, Limon"
                },
                codigoActividad: order.merchant?.economicActivityCode || "000000" // Mandatory in v4.4
            },
            receptor: {
                nombre: order.user?.fullName || "Cliente Final",
                tipoIdentificacion: order.user?.taxIdType || TaxIdType.PHYSICAL,
                numeroIdentificacion: order.user?.taxId || "100000000",
                correo: order.user?.email || ""
            },
            condicionVenta: "01", // Contado
            medioPago: ["06"], // Default to SINPE for CDCR payments v4.4
            detalles: items,
            resumen: {
                codigoMoneda: "CRC",
                totalGravado: totalVenta,
                totalExento: 0,
                totalExonerado: 0,
                totalVenta: totalVenta,
                totalDescuentos: 0,
                totalVentaNeta: totalVenta,
                totalImpuesto: totalImpuesto,
                totalComprobante: totalVenta + totalImpuesto
            },
            version: "4.4" // Explicit version for CDCR backend v4.4
        };
    }

    /**
     * Generates a REP (Recibo Electrónico de Pago) for credit operations or state institutions.
     * OBLIGATORY in v4.4 when receiving the actual payment for a previously issued credit invoice.
     */
    async emitREP(order: Order, originalInvoiceKey: string): Promise<any> {
        this.logger.log(`Generating REP for order ${order.id} (Ref: ${originalInvoiceKey})`);

        // REP Payload structure for v4.4
        const repPayload = {
            clave: originalInvoiceKey,
            fechaEmision: new Date().toISOString(),
            montoTotalImpuesto: 0, // Simplified for this implementation
            totalFactura: order.total,
            mensaje: 1, // Aceptado
            detalleMensaje: "Pago recibido vía Tilopay SINPE"
        };

        return await axios.post(`${this.baseUrl}/rep/emision`, repPayload, {
            headers: { 'x-api-key': this.apiKey }
        });
    }

    async emitCreditNote(order: Order, originalKey: string, reason: string): Promise<any> {
        try {
            this.logger.log(`Emitting Credit Note for order ${order.id}, referencing ${originalKey}`);
            const docData = this.mapOrderToFactura(order);

            // Reference the original invoice
            const infoReferencia = [{
                tipoDoc: '01', // Factura Electrónica
                numero: originalKey,
                fechaEmision: new Date(), // Ideally current date
                codigo: '01', // Anula documento de referencia
                razon: reason || 'Cancelación de pedido'
            }];

            const response = await axios.post(
                `${this.baseUrl}/factura/emision`,
                {
                    type: 'NC', // Nota de Crédito
                    docData: { ...docData, infoReferencia }
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 20000
                }
            );

            return response.data;
        } catch (error: any) {
            this.logger.error(`❌ Credit Note emission failed for order ${order.id}: ${error.message}`);
            return null;
        }
    }
}
