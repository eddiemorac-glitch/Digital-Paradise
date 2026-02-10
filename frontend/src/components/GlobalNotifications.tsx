import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Leaf, Package, Bell, CheckCircle, AlertTriangle, AlertOctagon, X, Star } from 'lucide-react';
import { socketService } from '../api/socket';
import { useNotificationStore } from '../store/notificationStore';

export const GlobalNotifications = () => {
    const { notifications, addNotification, removeNotification } = useNotificationStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket) return;

        socket.on('new_notification', (data) => {
            addNotification({
                title: data.title,
                message: data.message,
                type: data.type || 'info'
            });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        socketService.onOrderStatusUpdate((order) => {
            addNotification({
                title: 'Actualización de Pedido',
                message: `El pedido #${order.id.slice(0, 4)} ahora está ${order.status}`,
                type: 'order'
            });
        });

        return () => {
            socket.off('new_notification');
        };
    }, [queryClient, addNotification]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'promo': return <Star size={20} className="text-[#ffaa00] animate-pulse" />;
            case 'eco': return <Leaf size={20} className="text-primary animate-pulse" />;
            case 'order': return <Package size={20} className="text-primary animate-bounce" />;
            case 'success': return <CheckCircle size={20} className="text-green-400" />;
            case 'error': return <AlertOctagon size={20} className="text-red-400 animate-shake" />;
            case 'warning': return <AlertTriangle size={20} className="text-yellow-400" />;
            default: return <Bell size={20} className="text-primary" />;
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className="w-80 pointer-events-auto"
                    >
                        <div className={`backdrop-blur-2xl border p-4 rounded-2xl shadow-2xl flex items-start gap-4 relative overflow-hidden ${notif.type === 'error'
                            ? 'bg-red-500/10 border-red-500/20'
                            : notif.type === 'promo'
                                ? 'bg-[#ffaa00]/10 border-[#ffaa00]/30'
                                : 'bg-[#0a0f18]/80 border-primary/20'
                            }`}>
                            {/* Accent Glow */}
                            <div className={`absolute -inset-1 opacity-10 blur-xl ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'promo' ? 'bg-[#ffaa00]' : 'bg-primary'
                                }`} />

                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative ${notif.type === 'error' ? 'bg-red-500/20' : notif.type === 'promo' ? 'bg-[#ffaa00]/20' : 'bg-primary/10'
                                }`}>
                                {getIcon(notif.type)}
                            </div>

                            <div className="space-y-0.5 relative">
                                <h4 className="font-black text-white text-[10px] uppercase tracking-widest">{notif.title}</h4>
                                <p className="text-xs text-white/70 leading-relaxed font-bold">{notif.message}</p>
                            </div>

                            <button
                                onClick={() => removeNotification(notif.id)}
                                className="text-white/20 hover:text-white transition-colors absolute top-3 right-3"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
