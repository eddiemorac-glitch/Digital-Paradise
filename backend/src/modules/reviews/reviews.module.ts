import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entities/review.entity';
import { CourierReview } from './entities/courier-review.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Review, CourierReview, Order])],
    providers: [ReviewsService],
    controllers: [ReviewsController],
    exports: [ReviewsService]
})
export class ReviewsModule { }
