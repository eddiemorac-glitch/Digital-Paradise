import { IsString, IsEnum, IsOptional, IsEmail, IsNumber, Min, Max, IsUrl, IsBoolean, IsInt, IsObject } from 'class-validator';
import { MerchantCategory } from '../../../shared/enums/merchant.enum';
import { TaxIdType } from '../../../shared/enums/tax-id-type.enum';

export class CreateMerchantDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(MerchantCategory)
    category: MerchantCategory;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsString()
    address: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsEnum(TaxIdType)
    taxIdType?: TaxIdType;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @IsOptional()
    @IsUrl()
    bannerUrl?: string;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;

    @IsOptional()
    @IsBoolean()
    isSustainable?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    economicActivityCode?: string;

    @IsOptional()
    @IsNumber()
    deliveryRadius?: number;

    @IsOptional()
    @IsNumber()
    baseDeliveryFee?: number;

    @IsOptional()
    @IsNumber()
    kmFee?: number;

    @IsOptional()
    @IsInt()
    prepTimeMinutes?: number;

    @IsOptional()
    @IsObject()
    openingHours?: object;

    @IsOptional()
    @IsObject()
    socialLinks?: object;

    @IsOptional()
    @IsObject()
    operationalSettings?: object;
}
