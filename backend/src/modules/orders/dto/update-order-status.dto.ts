import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../../../shared/enums/order-status.enum';

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsOptional()
    metadata?: any;
}
