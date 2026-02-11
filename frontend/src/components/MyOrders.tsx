import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Calendar, Clock, Package, RefreshCw, ArrowLeft, MessageSquare, Star, MapPinned, Navigation, FileText, Ticket } from 'lucide-react';
import { orderApi } from '../api/orders';
import { API_BASE_URL } from '../api/api';
import { socketService } from '../api/socket';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderChat } from './OrderChat';
import { RatingModal } from './RatingModal';
import { LiveMap } from './LiveMap';
import { useCartStore } from '../store/cartStore';
import { useTrackingStore } from '../store/trackingStore';
import { useNotificationStore } from '../store/notificationStore';
import { useLanguageStore } from '../store/languageStore';
import { getStatusConfig } from '../utils/statusMapping';

interface MyOrdersProps {
    onBack: () => void;
    onSelectOrder?: (order: any) => void;
}

export const MyOrders = ({ onBack, onSelectOrder }: MyOrdersProps) => {
    const navigate = useNavigate();
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [ratingOrder, setRatingOrder] = useState<any | null>(null);
    const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
    const couriers = useTrackingStore((state) => state.couriers);

    const { data: orders, isLoading } = useQuery({
        queryKey: ['my-orders'],
        queryFn: orderApi.getMyOrders,
        refetchInterval: 300000,
    });

    const addItem = useCartStore(state => state.addItem);

    const handleDownload = async (url: string, filename: string) => {
        try {
            const token = localStorage.getItem('token'); // Fixed key to match authStore
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download error:', error);
            useNotificationStore.getState().addNotification({
                title: 'Error de descarga',
                message: 'No se pudo generar el documento PDF.',
                type: 'error'
            });
        }
    };

    const handleBuyAgain = (order: any) => {
        const { language } = useLanguageStore.getState();

        order.items.forEach((item: any) => {
            if (item.product) {
                addItem({
                    ...item.product,
                    quantity: item.quantity,
                    merchantId: order.merchantId
                });
            }
        });

        // Signal RootLayout to open the cart (Phase 35)
        window.dispatchEvent(new CustomEvent('open_cart_sidebar'));

        useNotificationStore.getState().addNotification({
            title: language === 'es' ? 'Carrito Actualizado' : 'Cart Updated',
            message: language === 'es' ? '¡Carrito actualizado con los productos de este pedido!' : 'Cart updated with products from this order!',
            type: 'success'
        });
    };

    useEffect(() => {
        // Redundant connection removed. RootLayout handles global socket state.
        if (orders) {
            orders.forEach((o: any) => {
                if (['ON_WAY', 'READY', 'PREPARING'].includes(o.status)) {
                    socketService.joinOrderTracking(o.id);
                }
            });
        }
    }, [orders]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl mx-auto pb-20"
        >
            <AnimatePresence>
                {activeChat && (
                    <OrderChat
                        orderId={activeChat.id}
                        partnerName={activeChat.merchant.name}
                        partnerRole="merchant"
                        onClose={() => setActiveChat(null)}
                    />
                )}
                {ratingOrder && (
                    <RatingModal
                        orderId={ratingOrder.id}
                        merchantName={ratingOrder.merchant.name}
                        onClose={() => setRatingOrder(null)}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors touch-target"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
                        Mis <span className="text-primary">Pedidos</span>
                    </h1>
                    <p className="text-white/40 text-sm">Historial de tus sabores caribeños</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/40 gap-4">
                    <RefreshCw className="animate-spin" size={32} />
                    <p className="text-xs uppercase tracking-widest font-bold">Cargando historial...</p>
                </div>
            ) : orders && orders.length > 0 ? (
                <div className="space-y-6">
                    {orders.map((order: any) => {
                        const isTracking = trackingOrderId === order.id;
                        const trackingData = couriers[order.id];

                        return (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`glass p-6 rounded-[2.5rem] border transition-all ${isTracking ? 'border-primary/40 ring-1 ring-primary/20' : 'border-white/5 hover:border-primary/20'}`}
                            >
                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary/40">
                                            <Package size={32} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-lg text-white">{order.merchant.name}</h3>
                                                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusConfig(order.status).color} ${getStatusConfig(order.status).bg} ${getStatusConfig(order.status).border}`}>
                                                    {getStatusConfig(order.status).label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-white/40 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                        {['ON_WAY', 'READY', 'PREPARING'].includes(order.status) && (
                                            <>
                                                {/* Internal Accordion (Old) */}
                                                <button
                                                    onClick={() => setTrackingOrderId(isTracking ? null : order.id)}
                                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border touch-target ${isTracking ? 'bg-primary text-background border-primary' : 'bg-white/5 text-white/60 border-white/10 hover:border-primary/40'}`}
                                                >
                                                    <MapPinned size={14} />
                                                    {isTracking ? 'Cerrar' : 'Expandir'}
                                                </button>

                                                {/* Full-screen Tracking Page */}
                                                <button
                                                    onClick={() => navigate(`/orders/track/${order.id}`)}
                                                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-background border border-primary hover:brightness-110 shadow-[0_0_15px_rgba(0,255,102,0.3)] touch-target"
                                                >
                                                    <Navigation size={14} />
                                                    Rastrear
                                                </button>

                                                {/* Full Mission Tracker (Phase 3) */}
                                                {onSelectOrder && (
                                                    <button
                                                        onClick={() => {
                                                            // Map order to MissionData format to prevent crashes
                                                            const missionData = {
                                                                id: order.id,
                                                                status: order.status,
                                                                merchant: order.merchant,
                                                                originLat: Number(order.merchant?.latitude || 0),
                                                                originLng: Number(order.merchant?.longitude || 0),
                                                                destinationAddress: order.deliveryAddress,
                                                                destinationLat: Number(order.deliveryLat || 0),
                                                                destinationLng: Number(order.deliveryLng || 0),
                                                                courierId: order.courierId,
                                                                orderId: order.id
                                                            };
                                                            onSelectOrder(missionData);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-accent text-white border border-accent hover:brightness-110 shadow-[0_0_15px_rgba(0,255,102,0.3)] touch-target"
                                                    >
                                                        <MapPinned size={14} />
                                                        En Vivo
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {order.status === 'DELIVERED' && (
                                            <button
                                                onClick={() => handleBuyAgain(order)}
                                                className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-primary/30 group touch-target"
                                            >
                                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                                Re-pedir
                                            </button>
                                        )}
                                        {order.status === 'DELIVERED' && !order.review && (
                                            <button
                                                onClick={() => setRatingOrder(order)}
                                                className="flex items-center gap-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-yellow-400/20 touch-target"
                                            >
                                                <Star size={14} className="fill-yellow-400" />
                                                Valorar
                                            </button>
                                        )}
                                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                            <button
                                                onClick={() => setActiveChat(order)}
                                                className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all touch-target"
                                            >
                                                <MessageSquare size={14} />
                                                Chat
                                            </button>
                                        )}
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-white/40 text-[8px] uppercase tracking-widest font-black">Total</span>
                                            <span className="text-xl font-black text-primary italic">₡{Number(order.total).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Actions Toolbar */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleDownload(`${API_BASE_URL}/orders/${order.id}/invoice`, `factura-${order.id.slice(0, 8)}.pdf`)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all touch-target"
                                    >
                                        <FileText size={12} />
                                        Factura PDF
                                    </button>

                                    {order.items?.some((i: any) => i.eventId) && order.items.filter((i: any) => i.eventId).map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleDownload(`${API_BASE_URL}/orders/${order.id}/ticket/${item.eventId}`, `ticket-${item.eventId.slice(0, 8)}.pdf`)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all touch-target"
                                        >
                                            <Ticket size={12} />
                                            Ticket: {item.event?.title || 'Evento'}
                                        </button>
                                    ))}
                                </div>

                                <AnimatePresence>
                                    {isTracking && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-6 mt-6 border-t border-white/5">
                                                <div className="h-[300px] mb-4">
                                                    <LiveMap
                                                        merchants={[order.merchant]}
                                                        driverPos={trackingData ? [trackingData.lat, trackingData.lng] : null}
                                                    />
                                                </div>
                                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                        <Clock size={20} className="animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                            {trackingData?.tripState === 'NEAR_DESTINATION' ? '🚀 ¡PREPÁRATE!' : 'Estado del envío'}
                                                        </p>
                                                        <p className="text-xs font-bold text-white/80">
                                                            {order.status === 'ON_WAY'
                                                                ? (trackingData?.metersRemaining
                                                                    ? `El repartidor está a ${Math.round(trackingData.metersRemaining)}m de tu ubicación.`
                                                                    : '¡Tu repartidor está en movimiento! Ya casi llega a tu ubicación.')
                                                                : 'Estamos terminando de preparar tu pedido en el local.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Items Preview */}
                                <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {order.items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center text-xs text-white/40 group-hover:text-white/60 transition-colors">
                                            <span className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/80 border border-white/5">{item.quantity}x</span>
                                                {item.product.name}
                                            </span>
                                            <span className="font-bold">₡{Number(item.subtotal).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/20">
                        <Archive size={40} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">Sin pedidos aún</h3>
                    <p className="text-white/40 max-w-md mx-auto">Cuando realices tu primera orden, aparecerá aquí para que puedas rastrearla.</p>
                </div>
            )}
        </motion.div>
    );
};
