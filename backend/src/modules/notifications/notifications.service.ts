import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { User } from '../users/entities/user.entity';
import axios from 'axios';

import { EmailsService } from '../emails/emails.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        private readonly gateway: NotificationsGateway,
        private readonly emailsService: EmailsService,
    ) { }

    async findAllForUser(userId: string): Promise<Notification[]> {
        return await this.notificationRepository.find({
            where: [
                { userId: userId },
                { userId: null } // Broadcast notifications
            ],
            order: { createdAt: 'DESC' },
            take: 20
        });
    }

    async create(data: Partial<Notification> & { sendEmail?: boolean; sendPush?: boolean }): Promise<Notification> {
        const notification = this.notificationRepository.create(data);
        const saved = await this.notificationRepository.save(notification);

        // Emit real-time via socket
        if (saved.userId) {
            this.gateway.emitToUser(saved.userId, 'new_notification', saved);
        } else {
            this.gateway.emitToAll('new_notification', saved);
        }

        // PHASE 18: Optional Push Notification
        if (data.sendPush && saved.userId) {
            await this.sendPushNotification(saved.userId, saved.title, saved.message, {
                notificationId: saved.id,
                type: saved.type,
                actionLink: saved.actionLink
            });
        }

        // Optional Email delivery
        if (data.sendEmail && saved.userId) {
            const notificationWithUser = await this.notificationRepository.findOne({
                where: { id: saved.id },
                relations: ['user']
            });

            if (notificationWithUser?.user?.email) {
                await this.emailsService.sendEmail(
                    notificationWithUser.user.email,
                    saved.title,
                    `<div style="font-family: sans-serif;">
                        <h2>${saved.title}</h2>
                        <p>${saved.message}</p>
                        ${saved.actionLink ? `<p><a href="${saved.actionLink}">Ver detalles</a></p>` : ''}
                    </div>`
                );
            }
        }

        return saved;
    }

    /**
     * PHASE 18: Integrated Push Notification logic
     */
    async sendPushNotification(userId: string, title: string, message: string, data?: any): Promise<void> {
        try {
            const user = await this.notificationRepository.manager.getRepository(User).findOne({
                where: { id: userId }
            });

            if (!user?.fcmToken) {
                this.logger.debug(`No fcmToken found for user ${userId}, skipping push`);
                return;
            }

            // MOCK OneSignal/Firebase logic (using Axios)
            // In a real scenario, these would come from ConfigService
            const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'MOCK_ID';
            const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_API_KEY || 'MOCK_KEY';

            await axios.post('https://onesignal.com/api/v1/notifications', {
                app_id: ONE_SIGNAL_APP_ID,
                include_player_ids: [user.fcmToken],
                headings: { en: title, es: title },
                contents: { en: message, es: message },
                data: data
            }, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`
                }
            });

            this.logger.log(`Push notification sent to user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to send push notification: ${error.message}`);
        }
    }

    async emitSignal(type: 'COMMERCE' | 'SECURITY' | 'SOCIAL' | 'LOGISTICS', text: string): Promise<void> {
        this.gateway.emitToAll('signal_intercept', {
            id: `sig-${Date.now()}`,
            type,
            text,
            timestamp: Date.now()
        });
    }

    async broadcastToAll(data: { title: string; message: string; type: string }): Promise<Notification> {
        const notification = this.notificationRepository.create({
            title: data.title,
            message: data.message,
            type: data.type as NotificationType,
            isRead: false,
            userId: null,
            createdAt: new Date()
        });

        const saved = await this.notificationRepository.save(notification);
        this.gateway.emitToAll('new_notification', saved);
        return saved;
    }

    async markAsRead(id: string): Promise<void> {
        await this.notificationRepository.update(id, { isRead: true });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update({ userId }, { isRead: true });
    }
}
