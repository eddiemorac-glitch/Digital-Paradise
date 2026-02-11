import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, MapPin } from 'lucide-react';
import { Mission } from '../../types/logistics';

interface BolsaDePedidosProps {
    availableOrders: Mission[];
    onClaimMission: (id: string) => void;
    isClaiming: boolean;
    language?: string;
}

export const BolsaDePedidos: React.FC<BolsaDePedidosProps> = ({
    availableOrders,
    onClaimMission,
    isClaiming,
    language = 'es'
}) => {
    if (!availableOrders || availableOrders.length === 0) return null;

    return (
        <section className="space-y-6 pt-10 border-t border-white/5">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <Zap size={18} className="text-primary fill-primary animate-pulse" />
                    {language === 'es' ? 'Bolsa de Pedidos' : 'Order Pool'}
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    {language === 'es' ? 'EN VIVO' : 'LIVE'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {availableOrders.map((mission: Mission) => (
                        <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass p-6 rounded-[2.5rem] border-white/10 hover:border-primary/40 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none" />

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-[8px] font-black uppercase tracking-widest border border-white/5">
                                            {mission.type === 'FOOD_DELIVERY' ? (language === 'es' ? 'Comida' : 'Food') : (language === 'es' ? 'Paquete' : 'Parcel')}
                                        </div>
                                        <div className="text-primary text-[10px] font-black uppercase tracking-tighter italic">
                                            ₡{(mission.estimatedPrice || 1500).toLocaleString()} {language === 'es' ? 'Ganancia' : 'Take'}
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-black uppercase truncate text-white mb-1">
                                        {mission.merchant?.name || mission.restaurantName || (language === 'es' ? 'Pedido Privado' : 'Private Order')}
                                    </h4>

                                    <div className="flex items-start gap-1.5 opacity-40">
                                        <MapPin size={10} className="mt-0.5" />
                                        <p className="text-[10px] font-bold uppercase truncate max-w-[200px]">
                                            {mission.merchant?.address || mission.originAddress}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    disabled={isClaiming}
                                    onClick={() => onClaimMission(mission.id)}
                                    className="bg-primary hover:scale-110 active:scale-95 text-background p-6 rounded-3xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center disabled:opacity-50 disabled:scale-100"
                                >
                                    <Plus size={32} strokeWidth={3} />
                                </button>
                            </div>

                            {/* Flashy detail: Distance or Time if available */}
                            <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                                <div className="text-[8px] font-black uppercase tracking-widest text-white/20">
                                    <span className="text-white">~{mission.estimatedMinutes || 30}</span> {language === 'es' ? 'MINUTOS' : 'MINS'}
                                </div>
                                <div className="text-[8px] font-black uppercase tracking-widest text-white/20">
                                    <span className="text-white">~{(mission.estimatedDistanceKm || 3.2).toFixed(1)}</span> {language === 'es' ? 'KM' : 'KM'}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};
