import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',

    },
})
@Injectable()
export class LogisticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(LogisticsGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Logistics Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Logistics Client disconnected: ${client.id}`);
    }

    // --- Rooms ---

    @SubscribeMessage('join_logistics_pool')
    handleJoinLogisticsPool(client: Socket) {
        client.join('logistics_pool');
        this.logger.log(`Courier ${client.id} joined logistics pool`);
        return { event: 'joined_logistics_pool' };
    }

    @SubscribeMessage('join_mission_tracking')
    handleJoinMissionTracking(client: Socket, missionId: string) {
        client.join(`mission_${missionId}`);
        this.logger.log(`Client ${client.id} tracking mission: ${missionId}`);
        return { event: 'joined_mission_tracking', data: missionId };
    }

    // --- Emits (Server -> Client) ---

    // Called by LogisticsService
    emitNewMission(mission: any) {
        this.server.to('logistics_pool').emit('mission_available', mission);
        this.logger.log(`New mission broadcasted: ${mission.id}`);
    }

    // Called by LogisticsService
    emitMissionUpdate(mission: any) {
        this.server.to(`mission_${mission.id}`).emit('mission_updated', mission);
        // Also notify pool if it becomes available again?
        this.logger.log(`Mission updated: ${mission.id} -> ${mission.status}`);
    }

    emitDriverLocation(missionId: string, lat: number, lng: number, status?: string, metersToDestination?: number, tripState?: string, orderId?: string) {
        const payload = {
            missionId: missionId,
            lat,
            lng,
            status,
            metersToDestination,
            tripState,
            timestamp: new Date().toISOString()
        };

        // Broadcast to mission room (Client)
        this.server.to(`mission_${missionId}`).emit('driver_location_updated', payload);

        // Also broadcast to buyer tracking room
        if (orderId) {
            this.server.to(`order_tracking_${orderId}`).emit('driver_location_updated', payload);
        }

        // Also broadcast to Admin/Logistics for global map visibility
        this.server.to('admin_room').to('logistics_pool').emit('driver_location_updated', payload);
    }

    // --- Client -> Server (Live Tracking) ---

    @SubscribeMessage('update_driver_location')
    handleDriverLocation(client: Socket, data: any | any[]) {
        const updates = Array.isArray(data) ? data : [data];
        const processed = [];

        for (const update of updates) {
            if (!update.missionId || !update.lat || !update.lng) {
                continue;
            }

            const payload = {
                missionId: update.missionId,
                lat: update.lat,
                lng: update.lng,
                timestamp: update.timestamp || new Date().toISOString() // Use client TS if available
            };

            // Broadcast to mission room (Client)
            this.server.to(`mission_${update.missionId}`).emit('driver_location_updated', payload);

            // Broadcast to buyer tracking room
            if (update.orderId) {
                this.server.to(`order_tracking_${update.orderId}`).emit('driver_location_updated', payload);
            }

            // Also broadcast to Admin/Logistics for global map visibility
            this.server.to('admin_room').to('logistics_pool').emit('driver_location_updated', payload);

            processed.push(update.timestamp);
        }

        // ACKNOWLEDGEMENT
        return {
            status: 'ok',
            received: processed.length,
            timestamps: processed
        };
    }
}
