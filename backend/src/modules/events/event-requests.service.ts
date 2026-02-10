import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPaidEvent } from '../orders/events/order-paid.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRequest, EventRequestStatus } from './entities/event-request.entity';
import { CreateEventRequestDto } from './dto/create-event-request.dto';
import { User } from '../users/entities/user.entity';
import { Event as EventEntity } from './entities/event.entity';

@Injectable()
export class EventRequestsService {
    constructor(
        @InjectRepository(EventRequest)
        private eventRequestRepository: Repository<EventRequest>,
        @InjectRepository(EventEntity)
        private eventRepository: Repository<EventEntity>
    ) { }

    async create(createEventRequestDto: CreateEventRequestDto, user: User): Promise<EventRequest> {
        const request = this.eventRequestRepository.create({
            ...createEventRequestDto,
            userId: user.id
        });
        return this.eventRequestRepository.save(request);
    }

    async findAll(status?: EventRequestStatus): Promise<EventRequest[]> {
        const where = status ? { status } : {};
        return this.eventRequestRepository.find({
            where,
            relations: ['user'],
            order: { createdAt: 'DESC' }
        });
    }

    async findMyRequests(userId: string): Promise<EventRequest[]> {
        return this.eventRequestRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<EventRequest> {
        const request = await this.eventRequestRepository.findOne({
            where: { id },
            relations: ['user']
        });
        if (!request) {
            throw new NotFoundException(`Event request with ID ${id} not found`);
        }
        return request;
    }

    async updateStatus(id: string, status: EventRequestStatus, rejectionReason?: string): Promise<EventRequest> {
        const request = await this.findOne(id);
        request.status = status;

        if (status === 'APPROVED') {
            await this.approve(id);
        }

        if (rejectionReason) {
            request.rejectionReason = rejectionReason;
        }
        return this.eventRequestRepository.save(request);
    }

    async approve(id: string): Promise<void> {
        const request = await this.findOne(id);

        // Auto-create event
        const event = this.eventRepository.create({
            title: request.title,
            description: request.description,
            date: request.date,
            time: request.time,
            startDate: request.startDate,
            latitude: request.latitude || 9.6500, // Default to PV if missing
            longitude: request.longitude || -82.7500,
            locationName: request.locationName,
            venue: request.venue,
            category: request.category,
            adTier: request.adTier,
            adSize: request.adSize,
            merchantId: request.userId, // Associate with the requester
            isActive: true
        });

        // Generate geometry
        if (event.latitude && event.longitude) {
            event.location = `POINT(${event.longitude} ${event.latitude})`;
        }

        await this.eventRepository.save(event);
    }

    @OnEvent('order.paid')
    async handleOrderPaid(event: OrderPaidEvent) {
        const order = event.order;
        if (order.metadata?.type === 'EVENT_PROMOTION' && order.metadata?.eventRequestId) {
            await this.approve(order.metadata.eventRequestId);

            // Update request status to reflect confirmation
            const request = await this.findOne(order.metadata.eventRequestId);
            request.status = EventRequestStatus.APPROVED;
            request.paymentMetadata = {
                transactionId: order.transactionId,
                paidAt: new Date()
            };
            await this.eventRequestRepository.save(request);
        }
    }
}
