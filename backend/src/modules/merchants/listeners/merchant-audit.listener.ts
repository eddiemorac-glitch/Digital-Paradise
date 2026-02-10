import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MerchantStatusChangedEvent } from '../events/merchant-status-changed.event';
import { MerchantAuditService } from '../merchant-audit.service';

@Injectable()
export class MerchantAuditListener {
    constructor(private readonly auditService: MerchantAuditService) { }

    @OnEvent('merchant.status.changed')
    async handleMerchantStatusChanged(event: MerchantStatusChangedEvent) {
        await this.auditService.logAction({
            merchantId: event.merchantId,
            adminUserId: event.adminUserId,
            action: event.newStatus.toUpperCase(),
            reason: event.reason,
            previousState: { status: event.oldStatus },
            newState: { status: event.newStatus }
        });
    }
}
