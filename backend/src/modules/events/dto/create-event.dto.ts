
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { EventCategory, AdTier, AdSize, EventType } from '../../../shared/enums/event-monetization.enum';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsOptional()
    time?: string;

    @IsString()
    @IsOptional()
    locationName?: string;

    @IsString()
    @IsOptional()
    venue?: string;

    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @IsEnum(EventCategory)
    @IsOptional()
    category?: EventCategory;

    @IsEnum(AdTier)
    @IsOptional()
    adTier?: AdTier;

    @IsEnum(AdSize)
    @IsOptional()
    adSize?: AdSize;

    @IsEnum(EventType)
    @IsOptional()
    type?: EventType;

    @IsUUID()
    @IsOptional()
    merchantId?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    bannerUrl?: string;

    @IsNumber()
    @IsOptional()
    attendees?: number;

    @IsBoolean()
    @IsOptional()
    isEcoFriendly?: boolean;

    @IsOptional()
    startDate?: Date;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsNumber()
    @IsOptional()
    maxCapacity?: number;
}
