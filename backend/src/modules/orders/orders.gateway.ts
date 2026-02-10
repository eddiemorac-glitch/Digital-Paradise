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
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(OrdersGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_merchant_room')
    handleJoinRoom(client: Socket, merchantId: string) {
        client.join(`merchant_${merchantId}`);
        this.logger.log(`Client ${client.id} joined room for merchant: ${merchantId}`);
        return { event: 'joined', data: merchantId };
    }

    @SubscribeMessage('join_delivery_pool')
    handleJoinDeliveryPool(client: Socket) {
        client.join('delivery_pool');
        this.logger.log(`Courier ${client.id} joined the delivery pool`);
        return { event: 'joined_pool' };
    }

    emitNewOrder(merchantId: string, order: any) {
        if (!this.server) return;
        this.server.to(`merchant_${merchantId}`).emit('new_order', order);
        this.logger.log(`New order event emitted for merchant: ${merchantId}`);
    }

    emitOrderStatusUpdate(merchantId: string, order: any) {
        if (!this.server) return;
        this.server.to(`merchant_${merchantId}`).emit('order_status_updated', order);

        // Notify buyer on tracking page
        if (order.id) {
            this.server.to(`order_tracking_${order.id}`).emit('order_status_updated', order);
        }

        // Notify delivery pool earlier (at PREPARING) to minimize idle time
        if (order.status === 'PREPARING' || order.status === 'READY') {
            this.server.to('delivery_pool').emit('order_available_nearby', order);
        }

        // Notify specific courier if assigned
        if (order.deliveryId) {
            this.server.to(`delivery_${order.deliveryId}`).emit('your_delivery_updated', order);
        }

        this.logger.log(`Order status update event emitted for order: ${order.id}`);
    }

    @SubscribeMessage('join_delivery_private_room')
    handleJoinPrivateDelivery(client: Socket, deliveryId: string) {
        client.join(`delivery_${deliveryId}`);
        this.logger.log(`Courier ${client.id} joined personal room: ${deliveryId}`);
    }

    @SubscribeMessage('join_order_tracking')
    handleJoinOrderTracking(client: Socket, orderId: string) {
        client.join(`order_tracking_${orderId}`);
        this.logger.log(`Client ${client.id} tracking order: ${orderId}`);
        return { event: 'tracking_joined', data: orderId };
    }

    @SubscribeMessage('update_courier_location')
    handleUpdateLocation(client: Socket, data: { orderId: string, lat: number, lng: number }) {
        // Broadcast to anyone tracking this order (usually the client)
        this.server.to(`order_tracking_${data.orderId}`).emit('courier_location_updated', {
            orderId: data.orderId,
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date().toISOString()
        });

        this.logger.log(`Location update for order ${data.orderId}: ${data.lat}, ${data.lng}`);
    }
}
