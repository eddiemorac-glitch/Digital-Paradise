import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ClipboardList, Loader2 } from 'lucide-react';
import { OrderCard } from './OrderCard';

interface LiveOrdersProps {
    orders: any[];
    isLoading: boolean;
    language: string;
    onUpdateStatus: (id: string, status: string) => void;
    onViewReceipt: (order: any) => void;
}

export const LiveOrders: React.FC<LiveOrdersProps> = ({ orders, isLoading, language, onUpdateStatus, onViewReceipt }) => {
    const [filter, setFilter] = React.useState('ALL');

    const filteredOrders = orders?.filter(o => {
        if (filter === 'ALL') return o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
        return o.status === filter;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">
                            {language === 'es' ? 'Gestión de Pedidos' : 'Order Management'}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                            {filteredOrders.length} {language === 'es' ? 'pedidos activos' : 'active orders'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                    {['ALL', 'PENDING', 'PREPARING', 'READY'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-background' : 'text-white/40 hover:text-white'}`}
                        >
                            {f === 'ALL' ? (language === 'es' ? 'Todos' : 'All') : f}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="h-96 glass rounded-[3rem] border-white/5 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                        {language === 'es' ? 'Sincronizando con satélite...' : 'Syncing with satellite...'}
                    </p>
                </div>
            ) : filteredOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                language={language}
                                onUpdateStatus={onUpdateStatus}
                                onViewReceipt={onViewReceipt}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="h-96 glass rounded-[3rem] border-white/5 flex flex-col items-center justify-center gap-6 text-center px-10">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                        <ClipboardList size={40} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black uppercase italic tracking-tighter text-white/60 mb-2">
                            {language === 'es' ? 'Silencio Táctico' : 'Tactical Silence'}
                        </h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 max-w-xs mx-auto">
                            {language === 'es'
                                ? 'No hay pedidos activos en este momento. ¡Buen momento para revisar tu inventario!'
                                : 'No active orders at the moment. Good time to check your inventory!'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
