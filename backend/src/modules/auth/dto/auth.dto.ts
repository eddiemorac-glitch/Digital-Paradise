import { IsString, IsEmail, MinLength, IsBoolean, Equals, IsEnum, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { MerchantCategory } from '../../../shared/enums/merchant.enum';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    fullName: string;

    @IsBoolean()
    @Equals(true, { message: 'You must agree to the privacy policy' })
    agreedToPrivacyPolicy: boolean;

    @IsString()
    privacyPolicyVersion: string;

    @IsString()
    @IsOptional()
    avatarId?: string;
}

export class RegisterMerchantDto extends RegisterDto {
    @IsString()
    merchantName: string;

    @IsString()
    address: string;

    @IsEnum(MerchantCategory)
    category: MerchantCategory;

    @IsString()
    phone: string;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}
