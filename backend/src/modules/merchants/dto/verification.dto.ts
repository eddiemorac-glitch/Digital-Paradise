import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * DTO for rejecting a merchant with a reason
 */
export class RejectMerchantDto {
    @IsString()
    @MaxLength(500)
    rejectionReason: string;
}

/**
 * DTO for suspending a merchant with a reason
 */
export class SuspendMerchantDto {
    @IsString()
    @IsOptional()
    @MaxLength(500)
    suspensionReason?: string;
}
