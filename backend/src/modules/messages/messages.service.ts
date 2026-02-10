import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
    ) { }

    async create(senderId: string, orderId: string, content: string): Promise<Message> {
        const message = this.messageRepository.create({
            senderId,
            orderId,
            content,
        });
        return await this.messageRepository.save(message);
    }

    async findByOrder(orderId: string): Promise<Message[]> {
        return await this.messageRepository.find({
            where: { orderId },
            relations: ['sender'],
            order: { createdAt: 'ASC' },
        });
    }
}
