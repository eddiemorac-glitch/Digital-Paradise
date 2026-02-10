import { ActionHandler, ValidationError } from 'adminjs';
import { MerchantStatus } from '../../../shared/enums/merchant.enum';

/**
 * Action to approve a merchant, transitioning them to ACTIVE status
 */
export const approveMerchant: ActionHandler<any> = async (request, response, context) => {
    const { record, currentAdmin } = context;
    if (!record) {
        throw new ValidationError({}, { message: 'Merchant not found' });
    }

    await record.update({
        status: MerchantStatus.ACTIVE,
        verifiedBy: currentAdmin?.email || currentAdmin?.id || 'admin',
        verifiedAt: new Date(),
        isActive: true
    });

    return {
        record: record.toJSON(currentAdmin),
        notice: {
            message: 'Comerciante aprobado con éxito y activado en el marketplace.',
            type: 'success',
        },
    };
};

/**
 * Action to reject a merchant, transitioning them to SUSPENDED status
 */
export const rejectMerchant: ActionHandler<any> = async (request, response, context) => {
    const { record, currentAdmin, payload } = context;
    if (!record) {
        throw new ValidationError({}, { message: 'Merchant not found' });
    }

    if (request.method === 'post') {
        const { rejectionReason } = payload;
        if (!rejectionReason) {
            throw new ValidationError({
                rejectionReason: { message: 'La razón de rechazo es obligatoria para informar al comerciante.' }
            });
        }

        await record.update({
            status: MerchantStatus.SUSPENDED,
            rejectionReason,
            verifiedBy: currentAdmin?.email || currentAdmin?.id || 'admin',
            verifiedAt: new Date(),
            isActive: false
        });

        return {
            record: record.toJSON(currentAdmin),
            notice: {
                message: 'Comerciante rechazado. Se ha notificado la razón de suspensión.',
                type: 'error',
            },
            redirectUrl: context.resource.id,
        };
    }

    // Return the current record for the UI to handle (e.g., showing a modal with rejectionReason input)
    return { record: record.toJSON(currentAdmin) };
};

/**
 * Action to suspend an already active merchant
 */
export const suspendMerchant: ActionHandler<any> = async (request, response, context) => {
    const { record, currentAdmin } = context;
    if (!record) {
        throw new ValidationError({}, { message: 'Merchant not found' });
    }

    await record.update({
        status: MerchantStatus.SUSPENDED,
        isActive: false,
    });

    return {
        record: record.toJSON(currentAdmin),
        notice: {
            message: 'Comerciante suspendido temporalmente.',
            type: 'info',
        },
    };
};
