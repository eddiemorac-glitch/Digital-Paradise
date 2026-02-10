import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { MerchantsModule } from '../../modules/merchants/merchants.module';
import { ProductsModule } from '../../modules/products/products.module';
import { User } from '../../modules/users/entities/user.entity';
import { Merchant } from '../../modules/merchants/entities/merchant.entity';

import { Review } from '../../modules/reviews/entities/review.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Merchant, Review]),
        MerchantsModule,
        ProductsModule
    ],
    controllers: [SeedController],
    providers: [SeedService],
})
export class SeedModule { }
