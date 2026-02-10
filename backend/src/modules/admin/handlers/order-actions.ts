import { ActionHandler, ValidationError } from 'adminjs';
import { DisputeStatus } from '../../../shared/enums/dispute-status.enum';
import { TilopayService } from '../../payments/tilopay.service';

/**
 * Action to open a dispute for an order
 */
export const openDispute: ActionHandler<any> = async (request, response, context) => {
    const { record, currentAdmin, payload } = context;
    if (!record) {
        throw new ValidationError({}, { message: 'Order not found' });
    }

    if (request.method === 'post') {
        const { disputeReason } = payload;
        if (!disputeReason) {
            throw new ValidationError({
                disputeReason: { message: 'Se requiere una razón para abrir la disputa.' }
            });
        }

        await record.update({
            disputeStatus: DisputeStatus.OPEN,
            disputeReason,
            metadata: {
                ...record.params.metadata,
                disputeOpenedBy: currentAdmin?.email || currentAdmin?.id || 'admin',
                disputeOpenedAt: new Date().toISOString()
            }
        });

        return {
            record: record.toJSON(currentAdmin),
            notice: {
                message: 'Disputa abierta. El equipo de soporte revisará el caso.',
                type: 'info',
            },
            redirectUrl: context.resource.id,
        };
    }

    return { record: record.toJSON(currentAdmin) };
};

/**
 * Action to resolve a dispute
 */
export const resolveDispute: ActionHandler<any> = async (request, response, context) => {
    const { record, currentAdmin } = context;
    if (!record) {
        throw new ValidationError({}, { message: 'Order not found' });
    }

    await record.update({
        disputeStatus: DisputeStatus.RESOLVED,
        disputeResolvedBy: currentAdmin?.email || currentAdmin?.id || 'admin',
        disputeResolvedAt: new Date(),
    });

    return {
        record: record.toJSON(currentAdmin),
        notice: {
            message: 'Disputa marcada como resuelta.',
            type: 'success',
        },
    };
};

/**
 * Factory for refundOrder action that uses TilopayService
 */
export const createRefundOrderAction = (tilopayService: TilopayService): ActionHandler<any> => {
    return async (request, response, context) => {
        const { record, currentAdmin } = context;
        if (!record) {
            throw new ValidationError({}, { message: 'Order not found' });
        }

        const transactionId = record.params.transactionId;
        const total = record.params.total;

        if (!transactionId) {
            throw new ValidationError({}, { message: 'No hay Transaction ID asociado a este pedido para reembolsar.' });
        }

        if (request.method === 'post') {
            try {
                const refundResult = await tilopayService.refund(transactionId, total * 100);

                if (refundResult.success) {
                    await record.update({
                        paymentStatus: 'REFUNDED',
                        disputeStatus: DisputeStatus.REFUNDED,
                        metadata: {
                            ...record.params.metadata,
                            refundId: refundResult.message,
                            refundedAt: new Date().toISOString(),
                            refundedBy: currentAdmin?.email || currentAdmin?.id || 'admin'
                        }
                    });

                    return {
                        record: record.toJSON(currentAdmin),
                        notice: {
                            message: `Reembolso procesado con éxito: ${refundResult.message}`,
                            type: 'success',
                        },
                    };
                } else {
                    throw new Error(refundResult.message);
                }
            } catch (error: any) {
                throw new ValidationError({}, { message: `Error en Tilopay: ${error.message}` });
            }
        }

        return { record: record.toJSON(currentAdmin) };
    };
};
