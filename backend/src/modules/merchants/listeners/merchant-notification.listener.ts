import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MerchantStatusChangedEvent } from '../events/merchant-status-changed.event';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { MerchantStatus } from '../../../shared/enums/merchant.enum';

@Injectable()
export class MerchantNotificationListener {
    constructor(private readonly notificationsService: NotificationsService) { }

    @OnEvent('merchant.status.changed')
    async handleMerchantStatusChanged(event: MerchantStatusChangedEvent) {
        let title = '';
        let message = '';
        let type = NotificationType.INFO;

        switch (event.newStatus) {
            case MerchantStatus.ACTIVE:
                if (event.oldStatus === MerchantStatus.PENDING_APPROVAL) {
                    title = '¡Comercio Aprobado! 🌴';
                    message = `Tu comercio "${event.merchantName}" ha sido aprobado. Ya puedes gestionar tus productos y recibir pedidos.`;
                    type = NotificationType.SUCCESS;
                } else {
                    title = 'Comercio Reactivado ✅';
                    message = `Tu comercio "${event.merchantName}" está activo de nuevo en DIGITAL PARADISE.`;
                    type = NotificationType.SUCCESS;
                }
                break;
            case MerchantStatus.SUSPENDED:
                if (event.oldStatus === MerchantStatus.PENDING_APPROVAL) {
                    title = 'Solicitud de Comercio Rechazada ⚠️';
                    message = `Tu solicitud para "${event.merchantName}" no pudo ser aprobada. Motivo: ${event.reason || 'No especificado'}`;
                    type = NotificationType.SYSTEM;
                } else {
                    title = 'Perfil de Comercio Suspendido 🔒';
                    message = `Tu comercio "${event.merchantName}" ha sido suspendido temporalmente. Razón: ${event.reason || 'Revisión técnica'}`;
                    type = NotificationType.SYSTEM;
                }
                break;
        }

        if (title && message) {
            await this.notificationsService.create({
                userId: event.userId,
                title,
                message,
                type,
                sendEmail: true
            });
        }
    }
}
