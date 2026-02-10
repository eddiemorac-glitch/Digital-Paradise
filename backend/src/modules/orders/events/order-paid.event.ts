import { Order } from '../entities/order.entity';

export class OrderPaidEvent {
    constructor(public readonly order: Order) { }
}
