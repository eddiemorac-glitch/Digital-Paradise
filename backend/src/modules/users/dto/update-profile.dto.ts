import { IsString, IsOptional, MinLength, IsEnum, IsUrl } from 'class-validator';
import { TaxIdType } from '../../../shared/enums/tax-id-type.enum';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    fullName?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    avatarId?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsEnum(TaxIdType)
    taxIdType?: TaxIdType;

    @IsOptional()
    @IsString()
    currentPassword?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    newPassword?: string;
}
