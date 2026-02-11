import { io, Socket } from 'socket.io-client';
import { pushNotificationService } from '../services/pushNotificationService';
import { useTrackingStore } from '../store/trackingStore';
import { devLog, devWarn, devError } from '../utils/devLog';

const SOCKET_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '') || window.location.origin;

class SocketService {
    private socket: Socket | null = null;
    private pushEnabled: boolean = false;
    private activeRooms: Set<string> = new Set();
    private activeLogistics: boolean = false;
    private activeAdmin: boolean = false;

    connect() {
        if (!this.socket) {
            const token = localStorage.getItem('token');

            this.socket = io(SOCKET_URL, {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            devLog('🔗 WebSocket Connecting to:', SOCKET_URL);

            this.setupLifecyleListeners();
            this.setupPushNotificationListeners();
        }
        return this.socket;
    }

    private setupLifecyleListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            devLog('✅ WebSocket Connected (ID:', this.socket?.id, ')');

            // Auto-restore rooms on reconnection
            this.restoreRooms();
        });

        this.socket.on('connect_error', (err) => {
            devError('❌ WebSocket Connection Error:', err.message);
            if (err.message.includes('Unauthorized') || err.message.includes('unauthorized')) {
                devWarn('⚠️ Authentication failure in Socket. Force cleaning...');
                this.disconnect();
                // Emit custom event for UI to handle logout if needed
                window.dispatchEvent(new CustomEvent('socket_auth_error'));
            }
        });

        this.socket.on('disconnect', (reason) => {
            devLog('🔌 WebSocket Disconnected:', reason);
        });
    }

    private restoreRooms() {
        if (!this.socket) return;

        // Restore Merchant Rooms
        this.activeRooms.forEach(merchantId => {
            this.socket?.emit('join_merchant_room', merchantId);
            devLog(`  ↪ Restored Merchant Room: ${merchantId}`);
        });

        // Restore Logistics
        if (this.activeLogistics) {
            this.socket.emit('join_logistics_pool');
            devLog('  ↪ Restored Logistics Pool');
        }

        // Restore Admin
        if (this.activeAdmin) {
            this.socket.emit('join_admin_room');
            devLog('  ↪ Restored Admin Room');
        }
    }

    async enablePushNotifications(): Promise<boolean> {
        this.pushEnabled = await pushNotificationService.requestPermission();
        return this.pushEnabled;
    }

    private setupPushNotificationListeners() {
        this.socket?.on('order_status_updated', (order: any) => {
            if (this.pushEnabled && document.hidden) {
                pushNotificationService.showOrderUpdate(order.id, order.status);
            }
        });

        this.socket?.on('mission_available', (mission: any) => {
            if (this.pushEnabled) {
                pushNotificationService.showNewAssignment(
                    mission.id,
                    mission.merchantName || 'Comercio'
                );
            }
        });

        this.socket?.on('emergency_alert', (data: any) => {
            if (this.pushEnabled) {
                pushNotificationService.show({
                    title: `🚨 ${data.title}`,
                    body: data.message,
                    requireInteraction: true,
                    tag: 'emergency'
                });
            }
        });

        // Sync with high-frequency tracking store
        this.socket?.on('driver_location_updated', (data: any) => {
            useTrackingStore.getState().setCourierLocation({
                missionId: data.missionId,
                lat: data.lat,
                lng: data.lng,
                metersRemaining: data.metersToDestination || data.metersRemaining,
                tripState: data.tripState,
                timestamp: data.timestamp
            });
        });

        // Phase 23: Signal Intercepts
        // We don't push notify for basic signals, but we need to listen? 
        // SignalIntercept.tsx listens directly. We might expose a public method just in case.
    }

    onSignalIntercept(callback: (signal: any) => void) {
        this.socket?.on('signal_intercept', callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.activeRooms.clear();
            this.activeLogistics = false;
            this.activeAdmin = false;
        }
    }

    getSocket() {
        return this.socket;
    }

    get isConnected(): boolean {
        return this.socket?.connected || false;
    }

    joinMerchantRoom(merchantId: string) {
        this.activeRooms.add(merchantId);
        if (this.socket) {
            this.socket.emit('join_merchant_room', merchantId);
        }
    }

    onNewOrder(callback: (order: any) => void) {
        this.socket?.on('new_order', callback);
    }

    onOrderStatusUpdate(callback: (order: any) => void) {
        this.socket?.on('order_status_updated', callback);
    }

    joinOrderChat(orderId: string) {
        this.socket?.emit('join_order_chat', orderId);
    }

    sendChatMessage(orderId: string, content: string, senderId: string) {
        this.socket?.emit('send_message', { orderId, content, senderId });
    }

    onNewMessage(callback: (message: any) => void) {
        this.socket?.on('new_message', callback);
    }

    joinOrderTracking(orderId: string) {
        this.socket?.emit('join_order_tracking', orderId);
    }

    updateCourierLocation(orderId: string, lat: number, lng: number) {
        this.socket?.emit('update_courier_location', { orderId, lat, lng });
    }

    onCourierLocationUpdate(callback: (data: any) => void) {
        this.socket?.on('courier_location_updated', callback);
    }

    joinLogisticsPool() {
        this.activeLogistics = true;
        if (this.socket) {
            this.socket.emit('join_logistics_pool');
            devLog('🚚 Joined Logistics Pool');
        }
    }

    onMissionAvailable(callback: (mission: any) => void) {
        this.socket?.on('mission_available', callback);
    }

    joinMissionTracking(missionId: string) {
        this.socket?.emit('join_mission_tracking', missionId);
    }

    onMissionUpdated(callback: (mission: any) => void) {
        this.socket?.on('mission_updated', callback);
    }

    onProductUpdate(callback: (data: any) => void) {
        this.socket?.on('product_updated', callback);
    }

    updateDriverLocation(missionId: string, lat: number, lng: number) {
        this.socket?.emit('update_driver_location', { missionId, lat, lng });
    }

    onDriverLocationUpdated(callback: (data: any) => void) {
        this.socket?.on('driver_location_updated', callback);
    }

    onDriverArriving(callback: (data: any) => void) {
        this.socket?.on('driver_arriving', callback);
    }

    joinAdminRoom() {
        this.activeAdmin = true;
        if (this.socket) {
            this.socket.emit('join_admin_room');
            devLog('🛡️ Joined Admin Control Room');
        }
    }

    emitEmergencyBroadcast(data: { title: string, message: string, type: 'ALERT' | 'LOCKDOWN' }) {
        if (this.socket) {
            this.socket.emit('send_emergency_broadcast', data);
        }
    }

    onEmergencyAlert(callback: (data: any) => void) {
        this.socket?.on('emergency_alert', callback);
    }
}

export const socketService = new SocketService();
