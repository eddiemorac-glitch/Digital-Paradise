import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CourierReview } from './entities/courier-review.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../../shared/enums/order-status.enum';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
        @InjectRepository(CourierReview)
        private courierReviewRepository: Repository<CourierReview>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) { }

    async create(userId: string, data: { orderId: string; rating: number; comment?: string }): Promise<Review> {
        const order = await this.orderRepository.findOne({
            where: { id: data.orderId, userId }
        });

        if (!order) throw new NotFoundException('Order not found or not yours');
        if (order.status !== OrderStatus.DELIVERED) {
            throw new BadRequestException('You can only review delivered orders');
        }

        const existing = await this.reviewRepository.findOne({
            where: { orderId: data.orderId }
        });

        if (existing) throw new BadRequestException('This order has already been reviewed');

        const review = this.reviewRepository.create({
            userId,
            orderId: data.orderId,
            merchantId: order.merchantId,
            rating: data.rating,
            comment: data.comment,
        });

        return await this.reviewRepository.save(review);
    }

    async findByMerchant(merchantId: string): Promise<Review[]> {
        return await this.reviewRepository.find({
            where: { merchantId },
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async getMerchantStats(merchantId: string) {
        const reviews = await this.reviewRepository.find({ where: { merchantId } });
        if (reviews.length === 0) return { average: 0, count: 0 };

        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return {
            average: parseFloat((sum / reviews.length).toFixed(1)),
            count: reviews.length
        };
    }

    async createCourierReview(userId: string, data: { orderId: string; rating: number; comment?: string }): Promise<CourierReview> {
        const order = await this.orderRepository.findOne({
            where: { id: data.orderId, userId },
            relations: ['deliveryPerson']
        });

        if (!order) throw new NotFoundException('Order not found or not yours');
        if (order.status !== OrderStatus.DELIVERED) {
            throw new BadRequestException('You can only review couriers after delivery');
        }
        if (!order.deliveryId) {
            throw new BadRequestException('This order was not handled by a courier');
        }

        const existing = await this.courierReviewRepository.findOne({
            where: { orderId: data.orderId }
        });

        if (existing) throw new BadRequestException('Courier has already been reviewed for this order');

        const review = this.courierReviewRepository.create({
            clientId: userId,
            orderId: data.orderId,
            courierId: order.deliveryId,
            rating: data.rating,
            comment: data.comment,
        });

        return await this.courierReviewRepository.save(review);
    }

    async findByCourier(courierId: string): Promise<CourierReview[]> {
        return await this.courierReviewRepository.find({
            where: { courierId },
            relations: ['client'],
            order: { createdAt: 'DESC' }
        });
    }

    async getCourierStats(courierId: string) {
        const reviews = await this.courierReviewRepository.find({ where: { courierId } });
        if (reviews.length === 0) return { average: 0, count: 0 };

        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return {
            average: parseFloat((sum / reviews.length).toFixed(1)),
            count: reviews.length
        };
    }
}
