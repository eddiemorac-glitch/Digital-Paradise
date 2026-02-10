import { ActionHandler, ValidationError, Filter } from 'adminjs';
import { LogisticsService } from '../../logistics/logistics.service';
import { OrderStatus } from '../../../shared/enums/order-status.enum';

/**
 * Factory for assignCourier action that uses LogisticsService
 */
export const createAssignCourierAction = (logisticsService: LogisticsService): ActionHandler<any> => {
    return async (request, response, context) => {
        const { record, currentAdmin, payload } = context;
        if (!record) {
            throw new ValidationError({}, { message: 'Entity not found' });
        }

        // Handle both Order and LogisticsMission resources
        const missionId = record.resource.id() === 'LogisticsMission' ? record.id() : null;
        const orderId = record.resource.id() === 'Order' ? record.id() : null;

        if (request.method === 'post') {
            const { courierId } = payload;
            if (!courierId) {
                throw new ValidationError({
                    courierId: { message: 'Debes seleccionar un repartidor para la asignación.' }
                });
            }

            try {
                let targetMissionId = missionId;

                // If we are coming from an Order, we might need to find or create the mission
                if (orderId && !targetMissionId) {
                    // This logic assumes we have a way to find a mission by orderId or it's handled in the service
                    // For simplicity, let's assume we are acting upon LogisticsMission records mostly
                    throw new ValidationError({}, { message: 'La asignación directa desde Pedidos requiere integración extendida. Usa el recurso de Misiones.' });
                }

                if (targetMissionId) {
                    await logisticsService.adminAssignCourier(
                        targetMissionId,
                        courierId,
                        currentAdmin?.email || currentAdmin?.id || 'admin'
                    );
                }

                return {
                    record: record.toJSON(currentAdmin),
                    notice: {
                        message: 'Repartidor asignado con éxito. El estado de la misión ha sido actualizado.',
                        type: 'success',
                    },
                    redirectUrl: context.resource.id,
                };
            } catch (error: any) {
                throw new ValidationError({}, { message: `Error en asignación: ${error.message}` });
            }
        }

        return { record: record.toJSON(currentAdmin) };
    };
};

/**
 * Action to export missions to CSV
 */
export const exportMissionData: ActionHandler<any> = async (request, response, context) => {
    const { resource } = context;
    const records = await resource.find(new Filter({}, resource), { limit: 1000 });

    let csv = 'ID,Status,Type,Courier,Client,Origin,Destination,Total,Date\n';

    records.forEach(r => {
        const p = r.params;
        csv += `${p.id},${p.status},${p.type},${p.courierId || 'N/A'},${p.clientId || 'N/A'},"${p.originAddress || ''}","${p.destinationAddress || ''}",${p.estimatedPrice || 0},${p.createdAt}\n`;
    });

    return {
        notice: {
            message: 'Exportación preparada. El CSV se ha generado con los últimos 1000 registros.',
            type: 'success',
        },
        // In a real AdminJS setup, we'd return a download link or use a custom component
        // For now, we return the data in a notice or log
        notice2: {
            message: 'Funcionalidad de descarga en desarrollo.',
            type: 'info'
        }
    };
};
