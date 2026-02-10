import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { EventCategory, AdTier, AdSize, EventType } from '../../../shared/enums/event-monetization.enum';

export class CreateEventRequestDto {
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

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    bannerUrl?: string;

    @IsBoolean()
    @IsOptional()
    isEcoFriendly?: boolean;

    @IsString()
    @IsOptional()
    contactPhone?: string;

    @IsString()
    @IsOptional()
    contactEmail?: string;
}
