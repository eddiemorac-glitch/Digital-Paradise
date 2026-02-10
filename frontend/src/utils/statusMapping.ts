import {
    Clock,
    CheckCircle2,
    Package,
    Truck,
    XCircle,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'ON_WAY' | 'DELIVERED' | 'CANCELLED';

export interface StatusConfig {
    label: string;
    labelEn: string;
    description: string;
    descriptionEn: string;
    color: string;
    bg: string;
    border: string;
    icon: LucideIcon;
}

export const STATUS_MAPPING: Record<OrderStatus, StatusConfig> = {
    PENDING: {
        label: 'Pendiente',
        labelEn: 'Pending',
        description: 'Esperando confirmación del comercio',
        descriptionEn: 'Waiting for merchant confirmation',
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20',
        icon: Clock
    },
    CONFIRMED: {
        label: 'Confirmado',
        labelEn: 'Confirmed',
        description: 'El comercio ha aceptado tu pedido',
        descriptionEn: 'Merchant has accepted your order',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20',
        icon: CheckCircle
    },
    PREPARING: {
        label: 'En Cocina',
        labelEn: 'Preparing',
        description: 'Tu pedido se está preparando con amor',
        descriptionEn: 'Your order is being prepared with love',
        color: 'text-orange-400',
        bg: 'bg-orange-400/10',
        border: 'border-orange-400/20',
        icon: Package
    },
    READY: {
        label: 'Listo',
        labelEn: 'Ready',
        description: 'Preparación completada, esperando repartidor',
        descriptionEn: 'Preparation complete, waiting for courier',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-400/20',
        icon: Package
    },
    ON_WAY: {
        label: 'En Camino',
        labelEn: 'On the Way',
        description: '¡Tu repartidor va volando hacia ti!',
        descriptionEn: 'Your courier is flying to you!',
        color: 'text-accent',
        bg: 'bg-accent/10',
        border: 'border-accent/20',
        icon: Truck
    },
    DELIVERED: {
        label: 'Entregado',
        labelEn: 'Delivered',
        description: '¡Buen provecho! Pedido finalizado',
        descriptionEn: 'Enjoy! Order completed',
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        icon: CheckCircle2
    },
    CANCELLED: {
        label: 'Cancelado',
        labelEn: 'Cancelled',
        description: 'El pedido ha sido cancelado',
        descriptionEn: 'The order has been cancelled',
        color: 'text-red-400',
        bg: 'bg-red-400/10',
        border: 'border-red-400/20',
        icon: XCircle
    }
};

export const getStatusConfig = (status: string, language: string = 'es'): StatusConfig & { currentLabel: string, currentDescription: string } => {
    const config = STATUS_MAPPING[status as OrderStatus] || {
        label: status,
        labelEn: status,
        description: 'Estado desconocido',
        descriptionEn: 'Unknown status',
        color: 'text-white/40',
        bg: 'bg-white/5',
        border: 'border-white/10',
        icon: AlertTriangle
    };

    return {
        ...config,
        currentLabel: language === 'es' ? config.label : config.labelEn,
        currentDescription: language === 'es' ? config.description : config.descriptionEn
    };
};
