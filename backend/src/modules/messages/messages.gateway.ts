import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    },
})
export class MessagesGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MessagesGateway.name);

    constructor(private readonly messagesService: MessagesService) { }

    @SubscribeMessage('join_order_chat')
    handleJoinOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() orderId: string,
    ) {
        client.join(`order_chat_${orderId}`);
        return { event: 'joined_chat', data: orderId };
    }

    @SubscribeMessage('send_message')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { orderId: string, content: string, senderId: string },
    ) {
        // Security: Extract senderId from socket auth if available, fallback to payload
        // This prevents impersonation when auth is configured on the socket
        const authenticatedUserId = (client.handshake.auth as any)?.userId
            || client.handshake.query.userId as string;
        const senderId = authenticatedUserId || data.senderId;

        if (authenticatedUserId && data.senderId && authenticatedUserId !== data.senderId) {
            this.logger.warn(`⚠️ SenderId mismatch: auth=${authenticatedUserId}, payload=${data.senderId}. Using authenticated ID.`);
        }

        const message = await this.messagesService.create(senderId, data.orderId, data.content);

        // Broadcast to all in the order room
        this.server.to(`order_chat_${data.orderId}`).emit('new_message', message);

        return message;
    }
}
