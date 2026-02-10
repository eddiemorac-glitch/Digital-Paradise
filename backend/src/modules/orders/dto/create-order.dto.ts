import { IsString, IsNotEmpty, IsUUID, IsArray, ValidateNested, IsInt, Min, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsUUID()
    @IsOptional()
    productId?: string;

    @IsUUID()
    @IsOptional()
    eventId?: string;

    @IsUUID()
    @IsOptional()
    eventRequestId?: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsArray()
    selectedOptions?: {
        optionName: string;
        valueName: string;
        addPrice: number;
    }[];
}

export class CreateOrderDto {
    @IsUUID()
    @IsNotEmpty()
    merchantId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsString()
    @IsOptional()
    customerNotes?: string;

    @IsString()
    @IsOptional()
    deliveryAddress?: string;

    @IsNumber()
    @IsOptional()
    deliveryLat?: number;

    @IsNumber()
    @IsOptional()
    deliveryLng?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    courierTip?: number;
}
