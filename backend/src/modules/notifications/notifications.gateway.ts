import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' },

})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private userSockets = new Map<string, string>(); // userId -> socketId

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.userSockets.set(userId, client.id);
            this.logger.log(`Notification Socket Connected: User ${userId}`);
        }
    }

    handleDisconnect(client: Socket) {
        for (const [userId, socketId] of this.userSockets.entries()) {
            if (socketId === client.id) {
                this.userSockets.delete(userId);
                break;
            }
        }
    }

    // --- Admin & Emergency (Phase 15.5) ---

    @SubscribeMessage('join_admin_room')
    handleJoinAdminRoom(client: Socket) {
        client.join('admin_room');
        this.logger.log(`Admin ${client.id} joined admin control room`);
        return { event: 'joined_admin_room' };
    }

    @SubscribeMessage('send_emergency_broadcast')
    handleEmergencyBroadcast(client: Socket, data: { title: string, message: string, type: string }) {
        // Security: Only clients in admin_room can broadcast emergencies
        const rooms = client.rooms;
        if (!rooms.has('admin_room')) {
            this.logger.warn(`🚫 Unauthorized emergency broadcast attempt from ${client.id}`);
            return { status: 'error', message: 'Unauthorized: must be in admin_room' };
        }

        // Broadcast to EVERYONE (emergency alert)
        this.server.emit('emergency_alert', {
            ...data,
            timestamp: new Date().toISOString(),
            senderId: client.id
        });

        this.logger.warn(`🚨 EMERGENCY BROADCAST: ${data.title} (by ${client.id})`);
        return { status: 'success', sentAt: new Date().toISOString() };
    }

    emitToUser(userId: string, event: string, data: any) {
        if (!this.server) return;
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit(event, data);
        }
    }

    emitToAll(event: string, data: any) {
        if (!this.server) return;
        this.server.emit(event, data);
    }
}
