import { Order } from '../entities/order.entity';

export class OrderCancelledEvent {
    constructor(
        public readonly order: Order,
        public readonly reason?: string,
        public readonly adminUserId?: string
    ) { }
}
