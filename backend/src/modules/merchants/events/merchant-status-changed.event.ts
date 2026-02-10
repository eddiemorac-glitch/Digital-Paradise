import { MerchantStatus } from '../../../shared/enums/merchant.enum';

export class MerchantStatusChangedEvent {
    constructor(
        public readonly merchantId: string,
        public readonly userId: string,
        public readonly merchantName: string,
        public readonly adminUserId: string,
        public readonly oldStatus: MerchantStatus,
        public readonly newStatus: MerchantStatus,
        public readonly reason?: string,
    ) { }
}
