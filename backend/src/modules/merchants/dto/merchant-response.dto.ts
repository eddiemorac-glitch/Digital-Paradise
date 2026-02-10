import { Expose } from 'class-transformer';
import { MerchantStatus, MerchantCategory } from '../../../shared/enums/merchant.enum';

export class MerchantResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    description: string;

    @Expose()
    address: string;

    @Expose()
    phone: string;

    @Expose()
    category: MerchantCategory;

    @Expose()
    status: MerchantStatus;

    @Expose()
    bannerUrl: string;

    @Expose()
    isActive: boolean;

    @Expose()
    isSustainable: boolean;

    @Expose()
    latitude: number;

    @Expose()
    longitude: number;

    @Expose()
    avgRating?: number;

    @Expose()
    reviewCount?: number;

    @Expose()
    distance?: number;

    constructor(partial: Partial<MerchantResponseDto>) {
        Object.assign(this, partial);
    }
}
