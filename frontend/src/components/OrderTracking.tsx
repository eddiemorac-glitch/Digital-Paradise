import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Clock, ChefHat, Package, Truck, CheckCircle2,
    MessageSquare, MapPin, Navigation, ShieldCheck, Bike
} from 'lucide-react';
import { orderApi } from '../api/orders';
import { socketService } from '../api/socket';
import { useTrackingStore } from '../store/trackingStore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './OrderTracking.css';

// ─── Status Pipeline ─────────────────────────────────────────────
const STATUSES = [
    { key: 'PENDING', label: 'Pedido Recibido', icon: <Clock size={20} />, emoji: '🕐' },
    { key: 'CONFIRMED', label: 'Confirmado', icon: <CheckCircle2 size={20} />, emoji: '✅' },
    { key: 'PREPARING', label: 'Preparando', icon: <ChefHat size={20} />, emoji: '👨‍🍳' },
    { key: 'READY', label: 'Listo', icon: <Package size={20} />, emoji: '📦' },
    { key: 'ON_WAY', label: 'En Camino', icon: <Truck size={20} />, emoji: '🛵' },
    { key: 'DELIVERED', label: 'Entregado', icon: <CheckCircle2 size={20} />, emoji: '🎉' },
];

const STATUS_DESCRIPTIONS: Record<string, string> = {
    PENDING: 'Tu pedido está siendo procesado por el comercio.',
    CONFIRMED: 'El comercio ha aceptado tu pedido.',
    PREPARING: 'Tu comida se está preparando en la cocina.',
    READY: 'Tu pedido está listo y esperando al repartidor.',
    ON_WAY: 'Tu repartidor va en camino con tu pedido.',
    DELIVERED: '¡Tu pedido ha sido entregado! Buen provecho 🌴',
};

// ─── Courier Marker Icon ─────────────────────────────────────────
const courierIcon = L.divIcon({
    html: `<div style="width:36px;height:36px;background:var(--primary,#00ff66);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(0,255,102,0.5);border:3px solid white;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 16l-4-4 4-4"/><path d="M4 12h16"/><path d="M16 8l4 4-4 4"/></svg>
    </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

const destinationIcon = L.divIcon({
    html: `<div style="width:32px;height:32px;background:#FF6B6B;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(255,107,107,0.4);border:3px solid white;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#FF6B6B"/></svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

// ─── Component ───────────────────────────────────────────────────
interface OrderTrackingProps {
    orderId: string;
}

export const OrderTracking = ({ orderId }: OrderTrackingProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showChat, setShowChat] = useState(false);
    const courierTracking = useTrackingStore((s) => s.couriers);

    // 1. Order data
    const { data: order, isLoading } = useQuery({
        queryKey: ['order-tracking', orderId],
        queryFn: () => orderApi.getMyOrders().then(orders => orders.find(o => o.id === orderId) || null),
        refetchInterval: 15000,
    });

    // 2. OTP data (separate call, owner-only)
    const { data: otpData } = useQuery({
        queryKey: ['delivery-otp', orderId],
        queryFn: () => orderApi.getDeliveryOtp(orderId),
        enabled: !!order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED',
        refetchInterval: 30000,
    });

    // 3. WebSocket: Join tracking room
    useEffect(() => {
        socketService.connect();
        socketService.joinOrderTracking(orderId);

        // Listen for status updates
        const handleStatusUpdate = (updatedOrder: any) => {
            if (updatedOrder.id === orderId) {
                queryClient.invalidateQueries({ queryKey: ['order-tracking', orderId] });
                queryClient.invalidateQueries({ queryKey: ['delivery-otp', orderId] });
            }
        };

        socketService.onOrderStatusUpdate(handleStatusUpdate);

        return () => {
            socketService.getSocket()?.off('order_status_updated', handleStatusUpdate);
        };
    }, [orderId, queryClient]);

    // Derived
    const currentStatus = order?.status || 'PENDING';
    const currentIdx = STATUSES.findIndex(s => s.key === currentStatus);
    const isDelivered = currentStatus === 'DELIVERED';
    const isCancelled = currentStatus === 'CANCELLED';

    // Find courier location from tracking store (by missionId if available)
    const missionId = order?.logisticsMission?.id;
    const courierLoc = missionId ? courierTracking[missionId] : null;

    // Estimate ETA from meters remaining
    const etaMinutes = useMemo(() => {
        const meters = courierLoc?.metersRemaining || order?.logisticsMission?.metadata?.metersToDestination;
        if (!meters) return null;
        // Rough estimate: average 25 km/h on motorbike in urban area
        const minutes = Math.ceil(meters / (25000 / 60));
        return Math.max(1, minutes);
    }, [courierLoc?.metersRemaining, order?.logisticsMission?.metadata?.metersToDestination]);

    if (isLoading) {
        return (
            <div className="order-tracking">
                <div className="order-tracking__bg" />
                <div className="tracking-content" style={{ paddingTop: '4rem' }}>
                    <div className="tracking-status-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ width: 48, height: 48, margin: '0 auto 1rem', borderRadius: '1rem', background: 'rgba(0,255,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Navigation size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
                            Sincronizando pedido...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-tracking">
                <div className="order-tracking__bg" />
                <div className="tracking-header">
                    <button className="tracking-header__back" onClick={() => navigate('/orders')}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="tracking-header__info">
                        <span className="tracking-header__label">Error</span>
                        <h1 className="tracking-header__title">Pedido no encontrado</h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="order-tracking">
            <div className="order-tracking__bg" />

            {/* Header */}
            <div className="tracking-header">
                <button className="tracking-header__back" onClick={() => navigate('/orders')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="tracking-header__info">
                    <span className="tracking-header__label">Tu Pedido</span>
                    <h1 className="tracking-header__title">
                        {order.merchant?.name || 'Comercio'}
                    </h1>
                </div>
            </div>

            <div className="tracking-content">
                {/* ═══ Delivered Celebration ═══ */}
                <AnimatePresence>
                    {isDelivered && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="tracking-delivered"
                        >
                            <div className="tracking-delivered__icon">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="tracking-delivered__title">¡Entregado!</h2>
                            <p className="tracking-delivered__sub">Tu pedido ha sido entregado con éxito. Buen provecho 🌴</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ Cancelled ═══ */}
                {isCancelled && (
                    <div className="tracking-status-card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                        <div className="tracking-status-card__current">
                            <div className="tracking-status-card__icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                                ❌
                            </div>
                            <div className="tracking-status-card__text">
                                <h3>Pedido Cancelado</h3>
                                <p>Este pedido fue cancelado.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Active Status Card + Timeline ═══ */}
                {!isDelivered && !isCancelled && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="tracking-status-card"
                    >
                        {/* Current Status */}
                        <div className="tracking-status-card__current">
                            <div className={`tracking-status-card__icon tracking-status-card__icon--${currentStatus.toLowerCase()}`}>
                                {STATUSES[currentIdx]?.emoji || '📦'}
                            </div>
                            <div className="tracking-status-card__text">
                                <h3>{STATUSES[currentIdx]?.label || currentStatus}</h3>
                                <p>{STATUS_DESCRIPTIONS[currentStatus]}</p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="tracking-timeline">
                            {STATUSES.map((step, i) => {
                                const isDone = i < currentIdx;
                                const isCurrent = i === currentIdx;
                                return (
                                    <div key={step.key} className="tracking-timeline__step">
                                        <div className="tracking-timeline__dot-col">
                                            <motion.div
                                                className={`tracking-timeline__dot ${isDone ? 'tracking-timeline__dot--done' : ''} ${isCurrent ? 'tracking-timeline__dot--current' : ''}`}
                                                animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                            />
                                            {i < STATUSES.length - 1 && (
                                                <div className={`tracking-timeline__line ${isDone ? 'tracking-timeline__line--done' : ''}`} />
                                            )}
                                        </div>
                                        <span className={`tracking-timeline__label ${isDone || isCurrent ? 'tracking-timeline__label--active' : ''} ${isCurrent ? 'tracking-timeline__label--current' : ''}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ═══ ETA ═══ */}
                {currentStatus === 'ON_WAY' && etaMinutes && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="tracking-eta"
                    >
                        <span className="tracking-eta__label">Tiempo Estimado</span>
                        <span className="tracking-eta__value">~{etaMinutes} min</span>
                    </motion.div>
                )}

                {/* ═══ Mini Map ═══ */}
                {(currentStatus === 'ON_WAY' || currentStatus === 'READY') && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="tracking-minimap"
                    >
                        {courierLoc ? (
                            <MapContainer
                                center={[courierLoc.lat, courierLoc.lng]}
                                zoom={15}
                                scrollWheelZoom={false}
                                zoomControl={false}
                                attributionControl={false}
                                dragging={false}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                <Marker position={[courierLoc.lat, courierLoc.lng]} icon={courierIcon}>
                                    <Popup>🛵 Tu Repartidor</Popup>
                                </Marker>
                                {order.deliveryLat && order.deliveryLng && (
                                    <Marker position={[order.deliveryLat, order.deliveryLng]} icon={destinationIcon}>
                                        <Popup>📍 Tu ubicación</Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        ) : (
                            <div className="tracking-minimap__placeholder">
                                <MapPin size={32} />
                                <span>Esperando ubicación del repartidor...</span>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ═══ Courier Info ═══ */}
                {otpData?.courierName && !isDelivered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="tracking-courier"
                    >
                        <div className="tracking-courier__avatar">
                            <Bike size={24} />
                        </div>
                        <div className="tracking-courier__info">
                            <p className="tracking-courier__name">{otpData.courierName}</p>
                            <p className="tracking-courier__role">Tu Repartidor</p>
                        </div>
                        <div className="tracking-courier__actions">
                            <button className="tracking-courier__btn" onClick={() => setShowChat(!showChat)}>
                                <MessageSquare size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ═══ OTP Code ═══ */}
                {!isDelivered && !isCancelled && otpData?.otp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="tracking-otp"
                    >
                        <div className="tracking-otp__label">
                            <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                            Código de Entrega Segura
                        </div>
                        <div className="tracking-otp__code">{otpData.otp}</div>
                        <p className="tracking-otp__hint">
                            Muestra este código al repartidor para confirmar tu entrega
                        </p>
                    </motion.div>
                )}

                {/* ═══ Order Summary ═══ */}
                {order.items && order.items.length > 0 && (
                    <div className="tracking-status-card" style={{ padding: '1.5rem' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                            Resumen del Pedido
                        </p>
                        {order.items.map((item: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < order.items!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                    {item.quantity}x {item.product?.name || item.event?.name || 'Artículo'}
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                                    ₡{Number(item.subtotal || 0).toLocaleString()}
                                </span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Total</span>
                            <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>
                                ₡{Number(order.total || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Back to orders */}
                <button
                    onClick={() => navigate('/orders')}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '1.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                        fontWeight: 800,
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    ← Volver a Mis Pedidos
                </button>
            </div>

            {/* ═══ Chat Overlay ═══ */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        className="fixed inset-0 z-[200] bg-background"
                    >
                        <div className="p-4 flex items-center gap-4 border-b border-white/5">
                            <button onClick={() => setShowChat(false)} className="tracking-header__back">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <p style={{ fontWeight: 800 }}>{otpData?.courierName || 'Repartidor'}</p>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Chat en Vivo</p>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8" style={{ height: 'calc(100vh - 80px)' }}>
                            <MessageSquare size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                                Chat integrado próximamente
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
