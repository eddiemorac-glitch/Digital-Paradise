export const generateRepXml = (
    data: {
        clave: string;
        consecutive: string;
        fechaEmision: string;
        emisor: any;
        receptor: any;
        monto: number;
        originalKey: string;
    }
): string => {
    return `<?xml version="1.0" encoding="utf-8"?>
<MensajeReceptor xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/mensajeReceptor" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/mensajeReceptor https://www.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2016/v4.4/MensajeReceptor_V4.4.xsd">
    <Clave>${data.clave}</Clave>
    <NumeroCedulaEmisor>${data.emisor.numeroIdentificacion}</NumeroCedulaEmisor>
    <FechaEmisionDoc>${data.fechaEmision}</FechaEmisionDoc>
    <Mensaje>1</Mensaje>
    <DetalleMensaje>Pago Recibido</DetalleMensaje>
    <MontoTotalImpuesto>0.00</MontoTotalImpuesto>
    <TotalFactura>${data.monto.toFixed(2)}</TotalFactura>
    <NumeroCedulaReceptor>${data.receptor.numeroIdentificacion}</NumeroCedulaReceptor>
    <NumeroConsecutivoReceptor>${data.consecutive}</NumeroConsecutivoReceptor>
</MensajeReceptor>`;
};
