/**
 * Push Notification Service
 * Handles browser push notification permissions and display
 * Works with existing WebSocket notifications for real-time updates
 */

type NotificationPermission = 'default' | 'granted' | 'denied';

interface PushNotificationOptions {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string; icon?: string }>;
    data?: any;
}

class PushNotificationService {
    private permission: NotificationPermission = 'default';
    private audioContext: AudioContext | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support push notifications');
            return false;
        }

        if (this.permission === 'granted') return true;
        if (this.permission === 'denied') return false;

        const result = await Notification.requestPermission();
        this.permission = result;
        return result === 'granted';
    }

    isSupported(): boolean {
        return 'Notification' in window;
    }

    isGranted(): boolean {
        return this.permission === 'granted';
    }

    async show(options: PushNotificationOptions): Promise<Notification | null> {
        if (!this.isGranted()) {
            const granted = await this.requestPermission();
            if (!granted) return null;
        }

        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/icons/notification-icon.png',
            badge: options.badge || '/icons/badge-icon.png',
            tag: options.tag,
            requireInteraction: options.requireInteraction ?? false,
            data: options.data,
        });

        // Play notification sound
        this.playSound();

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
            setTimeout(() => notification.close(), 5000);
        }

        return notification;
    }

    private playSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (e) {
            // Silent fail if audio not available
        }
    }

    // Helper methods for common notification types
    showOrderUpdate(orderId: string, status: string) {
        const statusMessages: Record<string, string> = {
            'CONFIRMED': '¡Tu pedido ha sido confirmado!',
            'PREPARING': '🍳 Tu pedido está siendo preparado',
            'READY': '✅ Tu pedido está listo para recoger',
            'IN_TRANSIT': '🚴 Tu pedido está en camino',
            'DELIVERED': '🎉 ¡Tu pedido ha sido entregado!'
        };

        this.show({
            title: 'Actualización de Pedido',
            body: statusMessages[status] || `Estado: ${status}`,
            tag: `order-${orderId}`,
            data: { type: 'order', orderId }
        });
    }

    showNewAssignment(missionId: string, merchantName: string) {
        this.show({
            title: '🚀 Nueva Misión Asignada',
            body: `Tienes un nuevo pedido de ${merchantName}`,
            tag: `mission-${missionId}`,
            requireInteraction: true,
            data: { type: 'mission', missionId }
        });
    }

    showEcoReward(points: number) {
        this.show({
            title: '🌿 ¡Puntos ECO Ganados!',
            body: `Has ganado ${points} puntos por tu compra sustentable`,
            tag: 'eco-reward',
            data: { type: 'eco' }
        });
    }
}

export const pushNotificationService = new PushNotificationService();
