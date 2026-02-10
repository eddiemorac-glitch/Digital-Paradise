import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Request() req, @Body() data: { orderId: string; rating: number; comment?: string }) {
        return this.reviewsService.create(req.user.userId, data);
    }

    @Get('merchant/:merchantId')
    findByMerchant(@Param('merchantId') merchantId: string) {
        return this.reviewsService.findByMerchant(merchantId);
    }

    @Get('merchant/:merchantId/stats')
    getMerchantStats(@Param('merchantId') merchantId: string) {
        return this.reviewsService.getMerchantStats(merchantId);
    }

    @Post('courier')
    @UseGuards(JwtAuthGuard)
    createCourierReview(@Request() req, @Body() data: { orderId: string; rating: number; comment?: string }) {
        return this.reviewsService.createCourierReview(req.user.userId, data);
    }

    @Get('courier/:courierId')
    findByCourier(@Param('courierId') courierId: string) {
        return this.reviewsService.findByCourier(courierId);
    }

    @Get('courier/:courierId/stats')
    getCourierStats(@Param('courierId') courierId: string) {
        return this.reviewsService.getCourierStats(courierId);
    }
}
