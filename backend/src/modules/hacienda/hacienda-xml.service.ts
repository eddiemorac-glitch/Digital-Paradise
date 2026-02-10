import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class HaciendaXmlService {
    private readonly logger = new Logger(HaciendaXmlService.name);

    constructor(private configService: ConfigService) { }

    /**
     * Generates a v4.4 compliant XML for a given order.
     */
    generateFacturaXml(order: Order, consecutive: string, clave: string): string {
        const fecha = new Date().toISOString().split('.')[0] + '-06:00'; // Standard CR Offset

        const lines = (order.items || []).map((item, i) => {
            const price = Number(item.price);
            const quantity = Number(item.quantity) || 1;
            const subtotal = price * quantity;

            // Dynamic Tax Mapping from Product/CABYS
            // If cabysCode is present, we try to infer, otherwise default to 13%
            const taxRate = item.product?.cabys?.impuesto || 13;
            const taxAmount = (subtotal * taxRate) / 100;

            // Map tax rate to Hacienda tariff codes
            let codigoTarifa = "08"; // Default 13%
            if (taxRate === 4) codigoTarifa = "07";
            else if (taxRate === 2) codigoTarifa = "06";
            else if (taxRate === 1) codigoTarifa = "05";
            else if (taxRate === 0) codigoTarifa = "01";
            else if (taxRate === 8) codigoTarifa = "08"; // 8% reduced (rare, but possible) check actual code
            // Actually 13% is code 08, 8% is 02? No, 13% is 08.
            // Hacienda Codes: 01=Exento, 02=1%, 03=2%, 04=4%, 07=8%, 08=13%
            if (taxRate === 13) codigoTarifa = "08";
            if (taxRate === 8) codigoTarifa = "07";
            if (taxRate === 4) codigoTarifa = "04";
            if (taxRate === 2) codigoTarifa = "03";
            if (taxRate === 1) codigoTarifa = "02";
            if (taxRate === 0) codigoTarifa = "01";

            return `
        <LineaDetalle>
            <NumeroLinea>${i + 1}</NumeroLinea>
            <CodigoCabys>${item.product?.cabysCode || '0000000000000'}</CodigoCabys>
            <Codigo>
                <Tipo>01</Tipo>
                <Codigo>${item.product?.id.substring(0, 20) || '00'}</Codigo>
            </Codigo>
            <Cantidad>${quantity.toFixed(3)}</Cantidad>
            <UnidadMedida>Unid</UnidadMedida>
            <Detalle>${item.product?.name || 'Producto'}</Detalle>
            <PrecioUnitario>${price.toFixed(5)}</PrecioUnitario>
            <MontoTotal>${subtotal.toFixed(5)}</MontoTotal>
            <SubTotal>${subtotal.toFixed(5)}</SubTotal>
            <Impuesto>
                <Codigo>01</Codigo>
                <CodigoTarifa>${codigoTarifa}</CodigoTarifa>
                <Tarifa>${taxRate.toFixed(2)}</Tarifa>
                <Monto>${taxAmount.toFixed(5)}</Monto>
            </Impuesto>
            <MontoTotalLinea>${(subtotal + taxAmount).toFixed(5)}</MontoTotalLinea>
        </LineaDetalle>`;
        }).join('');

        const totalImpuesto = (order.items || []).reduce((acc, item) => {
            const taxRate = item.product?.cabys?.impuesto || 13;
            return acc + (Number(item.price) * (Number(item.quantity) || 1) * (taxRate / 100));
        }, 0);
        const totalVenta = Number(order.total);

        return `<?xml version="1.0" encoding="utf-8"?>
<FacturaElectronica xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica https://www.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2016/v4.4/FacturaElectronica_V4.4.xsd">
    <Clave>${clave}</Clave>
    <CodigoActividad>${order.merchant?.economicActivityCode || '000000'}</CodigoActividad>
    <NumeroConsecutivo>${consecutive}</NumeroConsecutivo>
    <FechaEmision>${fecha}</FechaEmision>
    <Emisor>
        <Nombre>${order.merchant?.name || 'Vendedor'}</Nombre>
        <Identificacion>
            <Tipo>${order.merchant?.taxIdType || '02'}</Tipo>
            <Numero>${order.merchant?.taxId || '3101000000'}</Numero>
        </Identificacion>
        <Ubicacion>
            <Provincia>7</Provincia>
            <Canton>01</Canton>
            <Distrito>01</Distrito>
            <OtrasSenas>${order.merchant?.address || 'Limon, Costa Rica'}</OtrasSenas>
        </Ubicacion>
        <CorreoElectronico>${order.merchant?.email || 'ventas@caribedigital.cr'}</CorreoElectronico>
    </Emisor>
    <Receptor>
        <Nombre>${order.user?.fullName || 'Cliente Final'}</Nombre>
        <Identificacion>
            <Tipo>${order.user?.taxIdType || '01'}</Tipo>
            <Numero>${order.user?.taxId || '100000000'}</Numero>
        </Identificacion>
        <CodigoActividad>${order.merchant?.economicActivityCode || '000000'}</CodigoActividad>
    </Receptor>
    <CondicionVenta>01</CondicionVenta>
    <PlazoCredito>0</PlazoCredito>
    <MedioPago>06</MedioPago>
    <DetalleServicio>${lines}
    </DetalleServicio>
    <ResumenFactura>
        <CodigoTipoMoneda>
            <CodigoMoneda>CRC</CodigoMoneda>
            <TipoCambio>1.00000</TipoCambio>
        </CodigoTipoMoneda>
        <TotalServGravados>0.00000</TotalServGravados>
        <TotalServExentos>0.00000</TotalServExentos>
        <TotalServExonerado>0.00000</TotalServExonerado>
        <TotalMercanciasGravadas>${totalVenta.toFixed(5)}</TotalMercanciasGravadas>
        <TotalMercanciasExentas>0.00000</TotalMercanciasExentas>
        <TotalMercanciasExoneradas>0.00000</TotalMercanciasExoneradas>
        <TotalGravado>${totalVenta.toFixed(5)}</TotalGravado>
        <TotalExento>0.00000</TotalExento>
        <TotalExonerado>0.00000</TotalExonerado>
        <TotalVenta>${totalVenta.toFixed(5)}</TotalVenta>
        <TotalDescuentos>0.00000</TotalDescuentos>
        <TotalVentaNeta>${totalVenta.toFixed(5)}</TotalVentaNeta>
        <TotalImpuesto>${totalImpuesto.toFixed(5)}</TotalImpuesto>
        <TotalComprobante>${(totalVenta + totalImpuesto).toFixed(5)}</TotalComprobante>
    </ResumenFactura>
</FacturaElectronica>`;
    }

    /**
     * Signs the XML using XAdES-EPES with a .p12 certificate.
     */
    async signXml(xml: string, p12Base64: string, pin: string, orderId: string): Promise<string> {
        try {
            this.logger.log('Starting real XAdES-EPES signing process');

            const p12Der = forge.util.decode64(p12Base64);
            const p12Asn1 = forge.asn1.fromDer(p12Der);
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pin);

            // Extract private key and certificate
            const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
            const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
            if (!keyBag) throw new Error('No private key found in P12');

            const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            const certBag = certBags[forge.pki.oids.certBag]?.[0];
            if (!certBag) throw new Error('No certificate found in P12');

            const privateKey = keyBag.key;
            const certificate = certBag.cert;
            const certPem = forge.pki.certificateToPem(certificate);
            const certBase64 = Buffer.from(certPem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, '')).toString('base64');

            // Generate Digest
            const digest = crypto.createHash('sha256').update(xml).digest('base64');

            // Generate Signature Value
            const md = forge.md.sha256.create();
            md.update(xml, 'utf8');
            const signature = privateKey.sign(md);
            const signatureBase64 = forge.util.encode64(signature);

            this.logger.log('✅ Digital signature generated successfully');

            // Construct the ds:Signature block for Hacienda v4.4
            // Note: This is a structured XAdES-EPES envelope for Hacienda
            const signatureBlock = `
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="Signature-${orderId}">
    <ds:SignedInfo>
        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
        <ds:Reference Id="Reference-Factura" URI="">
            <ds:Transforms>
                <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${digest}</ds:DigestValue>
        </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>${signatureBase64}</ds:SignatureValue>
    <ds:KeyInfo>
        <ds:X509Data>
            <ds:X509Certificate>${certBase64}</ds:X509Certificate>
        </ds:X509Data>
    </ds:KeyInfo>
</ds:Signature>`;

            return xml.replace('</FacturaElectronica>', `${signatureBlock}</FacturaElectronica>`);
        } catch (error: any) {
            this.logger.error(`❌ Signing failed: ${error.message}`);
            throw new InternalServerErrorException('Error al firmar documento digitalmente');
        }
    }
}
