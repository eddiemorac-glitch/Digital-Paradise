import React from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Package, XCircle, ChevronRight } from 'lucide-react';
import { getStatusConfig } from '../../../utils/statusMapping';
import { useLanguageStore } from '../../../store/languageStore';

interface OrderCardProps {
    order: any;
    onUpdateStatus: (id: string, status: string) => void;
    onViewReceipt: (order: any) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onUpdateStatus, onViewReceipt }) => {
    const { language, t } = useLanguageStore();
    const statusConfig = getStatusConfig(order.status, language);
    const StatusIcon = statusConfig.icon;

    const getNextStatus = (current: string) => {
        const flow: Record<string, string> = {
            'PENDING': 'CONFIRMED',
            'CONFIRMED': 'PREPARING',
            'PREPARING': 'READY',
            'READY': 'ON_WAY',
            'ON_WAY': 'DELIVERED'
        };
        return flow[current];
    };

    const nextStatus = getNextStatus(order.status);
    const nextStatusConfig = nextStatus ? getStatusConfig(nextStatus, language) : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2rem] border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-500 touch-pan-y"
        >
            <div className={`p-6 border-b border-white/5 bg-gradient-to-r ${statusConfig.bg} to-transparent`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${statusConfig.bg} ${statusConfig.color} flex items-center justify-center border ${statusConfig.border} shrink-0`}>
                            <StatusIcon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                #{order.id.slice(-6).toUpperCase()}
                            </p>
                            <h4 className={`text-sm font-black uppercase italic ${statusConfig.color}`}>
                                {statusConfig.currentLabel}
                            </h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-white font-mono">₡{order.total.toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {/* Items Preview */}
                <div className="space-y-2 py-3">
                    {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide">
                            <span className="text-white/60">
                                <span className="text-primary mr-2 font-black">{item.quantity}x</span>
                                {item.product?.name || item.event?.title || t('product_default')}
                            </span>
                            <span className="text-white/20 font-mono">₡{item.price.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 overflow-hidden">
                        <User size={12} className="text-primary shrink-0" />
                        <span className="truncate">{order.user?.firstName || t('guest')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 overflow-hidden">
                        <MapPin size={12} className="text-primary shrink-0" />
                        <span className="truncate">{order.deliveryAddress || t('pickup')}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    {nextStatus && (
                        <button
                            onClick={() => onUpdateStatus(order.id, nextStatus)}
                            className={`flex-1 py-3 ${nextStatusConfig?.bg} ${nextStatusConfig?.color} hover:brightness-110 rounded-xl text-[10px] font-black uppercase tracking-widest border ${nextStatusConfig?.border} transition-all flex items-center justify-center gap-2 active:scale-95`}
                        >
                            {t('move_to')}
                            {nextStatusConfig?.currentLabel}
                            <ChevronRight size={14} />
                        </button>
                    )}

                    <button
                        onClick={() => onViewReceipt(order)}
                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95 shrink-0"
                    >
                        <Package size={18} />
                    </button>

                    {order.status === 'PENDING' && (
                        <button
                            onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                            className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500/60 hover:text-red-500 hover:bg-red-500/20 transition-all active:scale-95 shrink-0"
                        >
                            <XCircle size={18} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
