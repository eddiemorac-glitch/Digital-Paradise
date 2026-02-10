import { Expose, Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatus } from '../../../shared/enums/order-status.enum';

export class OrderResponseDto {
    @Expose()
    id: string;

    @Expose()
    status: OrderStatus;

    @Expose()
    total: number;

    @Expose()
    userId: string;

    @Expose()
    @Type(() => User)
    user: User;

    @Expose()
    merchantId: string;

    @Expose()
    @Type(() => Merchant)
    merchant: Merchant;

    @Expose()
    @Type(() => OrderItem)
    items: OrderItem[];

    @Expose()
    deliveryAddress: string;

    @Expose()
    deliveryLat: number;

    @Expose()
    deliveryLng: number;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    // Mask sensitive Hacienda fields
    @Expose()
    get isElectronicInvoiceEmitted(): boolean {
        return !!this.haciendaKey; // Expose simplistic status, not key
    }

    // Internal fields to exclude:
    // haciendaKey
    // electronicSequence
    // metadata (unless sanitized)

    constructor(partial: Partial<OrderResponseDto>) {
        Object.assign(this, partial);
    }

    private haciendaKey: string; // Keep specifically private to this class access if needed, or just don't expose
}
