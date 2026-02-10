import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsUUID, Length } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    @Length(13, 13)
    cabysCode?: string;

    @IsBoolean()
    @IsOptional()
    isPopular?: boolean;

    @IsBoolean()
    @IsOptional()
    isEco?: boolean;

    @IsUUID()
    @IsNotEmpty()
    merchantId: string;

    @IsOptional()
    optionsMetadata?: any[];
}
