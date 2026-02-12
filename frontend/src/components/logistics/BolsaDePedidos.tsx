import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Clock, Package, Utensils, Navigation
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { playTacticalSound } from '../../utils/tacticalSound';
import { useLanguageStore } from '../../store/languageStore';

interface BolsaDePedidosProps {
    availableOrders: any[];
    onClaimMission: (id: string) => void;
    isClaiming: boolean;
    language: 'es' | 'en';
}

export const BolsaDePedidos = ({ availableOrders, onClaimMission, isClaiming, language }: BolsaDePedidosProps) => {
    const { t } = useLanguageStore();

    if (!availableOrders || availableOrders.length === 0) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Package size={20} className="text-orange-500" />
                {t('order_pool')} <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] animate-pulse">{t('live_tag')}</span>
            </h2>

            <div className="grid gap-4">
                <AnimatePresence>
                    {availableOrders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white/[0.03] backdrop-blur-md p-6 rounded-[2rem] border border-white/5 relative overflow-hidden hover:bg-white/[0.05] transition-colors group"
                        >
                            {/* TACTICAL CORNERS */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/20 rounded-tr-2xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/20 rounded-bl-2xl" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        {order.type === 'FOOD' ? <Utensils size={20} /> : <Package size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase bg-white/10 px-2 py-0.5 rounded text-white/60">
                                                {order.type === 'FOOD' ? t('type_food') : t('type_parcel')}
                                            </span>
                                            <span className="text-[9px] font-black uppercase bg-primary/10 px-2 py-0.5 rounded text-primary">
                                                +{formatCurrency(order.deliveryFee)} {t('earnings_label')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black uppercase mt-1 leading-none">
                                            {order.merchant?.name || t('private_order')}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-white/40 mb-6 font-mono text-xs">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    ~25 {t('minutes_label')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Navigation size={12} />
                                    2.4 {t('km_label')}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        playTacticalSound('CLAIM');
                                        onClaimMission(order.id);
                                    }}
                                    disabled={isClaiming}
                                    className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isClaiming ? '...' : t('earnings_label')}
                                </button>
                                <button className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                                    <MapPin size={20} className="text-white/60" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
