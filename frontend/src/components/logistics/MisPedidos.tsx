import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Bike, Package, MessageSquare, MapPin, Navigation, ChevronRight, CheckCircle2, ThermometerSun, AlertTriangle, DollarSign, Route } from 'lucide-react';
import { Mission } from '../../types/logistics';
import { getStatusConfig } from '../../utils/statusMapping';

interface MisPedidosProps {
    activeMissions: Mission[];
    onOpenChat: (mission: Mission) => void;
    onLaunchMaps: (lat: number, lng: number) => void;
    onUpdateStatus: (id: string, status: string, isFood: boolean) => void;
    onConfirmDelivery: (mission: Mission) => void;
    language?: string;
}

export const MisPedidos: React.FC<MisPedidosProps> = ({
    activeMissions,
    onOpenChat,
    onLaunchMaps,
    onUpdateStatus,
    onConfirmDelivery,
    language = 'es'
}) => {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <Zap size={18} className="text-primary fill-primary" />
                    {language === 'es' ? 'Pedidos en curso' : 'Active Routes'}
                </h2>
                <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-black text-primary">
                    {activeMissions.length}
                </div>
            </div>

            <AnimatePresence mode="popLayout">
                {activeMissions.map((mission: Mission) => (
                    <motion.div
                        key={mission.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass overflow-hidden rounded-[2.5rem] border-primary/20 bg-primary/[0.02] relative group shadow-[0_0_50px_rgba(0,0,0,0.3)]"
                    >
                        <div className="p-6 space-y-6 relative z-20">
                            {/* Header: Status & Info */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/10">
                                        {mission.type === 'FOOD' || mission.merchantId ? <Bike size={28} /> : <Package size={28} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-tighter italic">
                                                {mission.status === 'READY' ? (language === 'es' ? 'LISTO PARA RECOGER' : 'READY TO PICKUP') : (language === 'es' ? 'EN CAMINO AL CLIENTE' : 'EN ROUTE')}
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getStatusConfig(mission.status).color} ${getStatusConfig(mission.status).bg} ${getStatusConfig(mission.status).border}`}>
                                                {getStatusConfig(mission.status, language).currentLabel}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black leading-none uppercase truncate max-w-[150px]">
                                            {mission.merchant?.name || (language === 'es' ? 'Pedido Privado' : 'Private Parcel')}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onOpenChat(mission)}
                                    className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/40 transition-all relative group"
                                >
                                    <MessageSquare size={28} />
                                    <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-4 border-[#0F1115] group-hover:animate-bounce" />
                                </button>
                            </div>

                            {/* Tactical HUD: Earnings + Distance + Handling */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 flex flex-col items-center justify-center gap-1">
                                    <DollarSign size={14} className="text-primary" />
                                    <span className="text-[9px] font-black text-primary">₡{(Number(mission.estimatedPrice) || Number(mission.courierEarnings) || 1500).toLocaleString()}</span>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <Route size={14} className="text-blue-400" />
                                    <span className="text-[8px] font-black uppercase opacity-40">{(Number(mission.estimatedDistanceKm) || 3.2).toFixed(1)} KM</span>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <ThermometerSun size={14} className="text-orange-400" />
                                    <span className="text-[8px] font-black uppercase opacity-40">CALIENTE</span>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                                    <AlertTriangle size={14} className="text-yellow-400" />
                                    <span className="text-[8px] font-black uppercase opacity-40">FRÁGIL</span>
                                </div>
                            </div>

                            {/* Destination Detail */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 relative group overflow-hidden">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <MapPin size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-black text-white/20 uppercase mb-1 tracking-widest">{language === 'es' ? 'Punto de Entrega' : 'Delivery Point'}</p>
                                        <p className="text-xs font-bold leading-tight line-clamp-2">
                                            {mission.destinationAddress || mission.merchant?.address}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onLaunchMaps(
                                            Number(mission.destinationLat || mission.merchant?.latitude),
                                            Number(mission.destinationLng || mission.merchant?.longitude)
                                        )}
                                        className="bg-primary text-background p-4 rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-xl shadow-primary/20"
                                    >
                                        <Navigation size={24} fill="currentColor" />
                                    </button>
                                </div>
                            </div>

                            {/* Main Action Bar */}
                            <div className="grid grid-cols-1 gap-3">
                                {mission.status === 'READY' && (
                                    <button
                                        onClick={() => onUpdateStatus(mission.id, 'ON_WAY', true)}
                                        className="w-full bg-white text-background h-20 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl"
                                    >
                                        {language === 'es' ? 'RECOGER PEDIDO' : 'PICKUP ORDER'}
                                        <ChevronRight size={28} />
                                    </button>
                                )}
                                {mission.status === 'ON_WAY' && (
                                    <button
                                        onClick={() => onConfirmDelivery(mission)}
                                        className="w-full bg-primary text-background h-20 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl shadow-primary/30"
                                    >
                                        {language === 'es' ? 'COMPLETAR ENTREGA' : 'FINISH TRICK'}
                                        <CheckCircle2 size={28} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {activeMissions.length === 0 && (
                <div className="glass p-16 rounded-[3rem] border-white/5 bg-white/[0.01] text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-10">
                        <Navigation size={40} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20 italic">
                        {language === 'es' ? 'Buscando misiones cerca...' : 'Scanning for orders...'}
                    </p>
                </div>
            )}
        </section>
    );
};
