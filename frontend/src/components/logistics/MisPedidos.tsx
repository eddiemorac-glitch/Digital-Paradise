import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Navigation, MessageCircle, CheckCircle2, Package, Clock, Flame, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { playTacticalSound } from '../../utils/tacticalSound';
import { useLanguageStore } from '../../store/languageStore';

interface MisPedidosProps {
    activeMissions: any[];
    onOpenChat: (mission: any) => void;
    onLaunchMaps: (lat: number, lng: number) => void;
    onUpdateStatus: (id: string, status: string, isFood: boolean) => void;
    onConfirmDelivery: (mission: any) => void;
    language: 'es' | 'en';
}

export const MisPedidos = ({
    activeMissions,
    onOpenChat,
    onLaunchMaps,
    onUpdateStatus,
    onConfirmDelivery,
    language
}: MisPedidosProps) => {
    const { t } = useLanguageStore();

    if (activeMissions.length === 0) return (
        <div className="flex flex-col items-center justify-center p-12 text-white/20 gap-4 border border-white/5 rounded-[2.5rem] bg-white/[0.02]">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Navigation size={48} className="relative z-10 animate-spin-slow" />
            </div>
            <p className="font-bold uppercase tracking-widest text-[10px] animate-pulse">{t('scanning_missions')}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <Navigation size={20} className="text-primary animate-pulse" />
                {t('active_routes')} ({activeMissions.length})
            </h2>

            <div className="grid gap-4">
                <AnimatePresence>
                    {activeMissions.map((mission) => (
                        <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass p-6 rounded-[2rem] border-primary/20 relative overflow-hidden group"
                        >
                            {/* LIVE STATUS BAR */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${mission.status === 'READY' ? 'bg-green-500 animate-pulse' : 'bg-primary animate-pulse'}`} />

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 ${mission.status === 'READY' ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mission.status === 'READY' ? 'bg-green-500' : 'bg-primary'} animate-pulse`} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {mission.status === 'READY'
                                                ? t('ready_pickup')
                                                : t('en_route')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black uppercase leading-none mb-1">
                                        {mission.merchant?.name || t('private_parcel')}
                                    </h3>
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                                        <Clock size={10} />
                                        {mission.estimatedTime || '15-20'} {t('minutes_label')} • {formatCurrency(mission.deliveryFee)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {mission.isHot && (
                                        <div className="bg-orange-500/20 p-2 rounded-full text-orange-500" title={t('tag_hot')}>
                                            <Flame size={16} />
                                        </div>
                                    )}
                                    {mission.isFragile && (
                                        <div className="bg-purple-500/20 p-2 rounded-full text-purple-500" title={t('tag_fragile')}>
                                            <AlertTriangle size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ACTIONS GRID */}
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => onLaunchMaps(mission.targetLat || 9.65, mission.targetLng || -82.75)}
                                    className="col-span-1 bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group/btn"
                                >
                                    <Navigation size={20} className="group-hover/btn:scale-110 transition-transform text-primary" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Waze</span>
                                </button>

                                <button
                                    onClick={() => onOpenChat(mission)}
                                    className="col-span-1 bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all relative"
                                >
                                    {mission.unreadCount > 0 && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-bounce" />
                                    )}
                                    <MessageCircle size={20} className="text-blue-400" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Chat</span>
                                </button>

                                {mission.status === 'ON_WAY' ? (
                                    <button
                                        onClick={() => {
                                            playTacticalSound('SUCCESS');
                                            onConfirmDelivery(mission);
                                        }}
                                        className="col-span-2 bg-primary text-background hover:bg-primary/90 p-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-tighter shadow-[0_0_20px_rgba(0,255,102,0.3)] animate-shimmer bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.4),transparent)] bg-[length:200%_100%]"
                                    >
                                        <CheckCircle2 size={20} />
                                        <span>{t('verify_delivery')}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onUpdateStatus(mission.id, 'ON_WAY', !!mission.merchantId)}
                                        className="col-span-2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-tighter border border-white/5"
                                    >
                                        <Package size={20} />
                                        <span>{t('en_route')}</span>
                                    </button>
                                )}
                            </div>

                            {/* ADDRESS PREVIEW */}
                            <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-3 opacity-60">
                                <MapPin size={14} className="mt-0.5 text-primary" />
                                <p className="text-[10px] font-mono leading-relaxed">
                                    <span className="text-primary font-bold">{t('delivery_point')}:</span> {mission.address || 'Puerto Viejo Centro, Limón'}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
