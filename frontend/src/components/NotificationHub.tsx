import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Leaf, Package, CheckCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';

const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (minutes > 0) return `hace ${minutes}m`;
    return 'ahora';
};

interface NotificationHubProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string, params?: any) => void;
}

export const NotificationHub = ({ isOpen, onClose, onNavigate }: NotificationHubProps) => {
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationsApi.getMine,
        enabled: isOpen,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationsApi.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationsApi.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'eco': return <Leaf className="text-primary" size={18} />;
            case 'order': return <Package className="text-secondary" size={18} />;
            case 'success': return <CheckCircle className="text-green-400" size={18} />;
            default: return <Bell className="text-primary" size={18} />;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className="fixed top-24 right-4 md:right-8 w-[350px] md:w-[400px] glass border-white/10 rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Bell size={20} className="text-primary" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    )}
                                </div>
                                <h3 className="font-black uppercase tracking-tighter text-lg">Alertas</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                                    title="Marcar todo como leído"
                                >
                                    <CheckCircle size={18} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[500px] overflow-y-auto scrollbar-hide py-4 px-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                                        <Bell size={32} />
                                    </div>
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No hay notificaciones nuevas</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-5 rounded-3xl border transition-all cursor-pointer group relative ${n.isRead
                                            ? 'bg-white/[0.02] border-white/5 opacity-60'
                                            : 'bg-white/5 border-primary/20 shadow-lg shadow-primary/5'
                                            }`}
                                        onClick={() => {
                                            if (!n.isRead) markAsReadMutation.mutate(n.id);
                                            if (n.actionLink) {
                                                const parts = n.actionLink.split('/').filter(Boolean);
                                                const path = parts[0];
                                                const id = parts[1];
                                                if (path === 'blog') onNavigate('blog', { id });
                                                if (path === 'orders' || path === 'order') onNavigate('orders', { id });
                                                onClose();
                                            }
                                        }}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'eco' ? 'bg-primary/10' : 'bg-white/5'
                                                }`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="space-y-1 pr-6">
                                                <h4 className={`text-sm font-black uppercase tracking-tighter ${n.isRead ? 'text-white/60' : 'text-white'}`}>
                                                    {n.title}
                                                </h4>
                                                <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                                                    {n.message}
                                                </p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 pt-1">
                                                    {getRelativeTime(new Date(n.createdAt))}
                                                </p>
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="absolute top-5 right-5 w-2 h-2 bg-primary rounded-full" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                                Caribe Digital Premium System
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
