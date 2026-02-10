import { IsString, IsEnum, IsNumber, IsOptional, IsJSON } from 'class-validator';
import { MissionType } from '../../../shared/enums/mission-type.enum';

export class CreateMissionDto {
    @IsEnum(MissionType)
    type: MissionType;

    @IsString()
    originAddress: string;

    @IsNumber()
    originLat: number;

    @IsNumber()
    originLng: number;

    @IsString()
    destinationAddress: string;

    @IsNumber()
    destinationLat: number;

    @IsNumber()
    destinationLng: number;

    @IsNumber()
    estimatedPrice: number;

    @IsOptional()
    @IsNumber()
    estimatedMinutes?: number;

    @IsOptional()
    metadata?: any;
}
