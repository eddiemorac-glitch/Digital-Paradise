import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

/**
 * DTO for opening a dispute on an order
 */
export class OpenDisputeDto {
    @IsString()
    @MaxLength(1000)
    reason: string;
}

/**
 * DTO for resolving a dispute
 */
export class ResolveDisputeDto {
    @IsString()
    @MaxLength(1000)
    resolution: string;
}

/**
 * DTO for admin assigning a courier to a mission
 */
export class AssignCourierDto {
    @IsUUID()
    courierId: string;
}

/**
 * DTO for force cancelling a mission
 */
export class ForceCancelMissionDto {
    @IsString()
    @IsOptional()
    @MaxLength(500)
    reason?: string;
}
