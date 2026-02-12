import React from 'react';
import { motion } from 'framer-motion';
import { Bike, Package, MessageSquare, ChevronRight, CheckCircle2, MapPin, X, Navigation, Target } from 'lucide-react';
import { MissionData } from '../../types/map';
import { useLanguageStore } from '../../store/languageStore';

interface MissionHUDProps {
    mission: MissionData;
    onClose: () => void;
    onUpdateStatus?: (id: string, status: string, isFood: boolean) => void;
    onConfirmDelivery?: (mission: MissionData) => void;
    onChatOpen?: (mission: MissionData) => void;
    isFixed?: boolean;
    onToggleFixed?: () => void;
}

export const MissionHUD: React.FC<MissionHUDProps> = ({
    mission,
    onClose,
    onUpdateStatus,
    onConfirmDelivery,
    onChatOpen,
    isFixed,
    onToggleFixed
}) => {
    const { t } = useLanguageStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-[104px] left-6 right-6 z-[1001] md:absolute md:bottom-12 md:left-auto md:w-[400px] md:right-12"
        >
            <div className="glass p-6 rounded-[2.5rem] border-primary/30 bg-background/80 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                {/* Visual indicator for fixed mode */}
                {isFixed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-0 left-0 right-0 h-1 bg-primary/40 shadow-[0_0_10px_var(--primary)]"
                    />
                )}

                <div className="flex gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        {mission.merchantId ? <Bike size={32} /> : <Package size={32} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-primary uppercase italic mb-1 tracking-tighter">
                            {t('active_mission')}: {t(`status_${mission.status.toLowerCase()}`) || mission.status}
                        </p>
                        <h3 className="text-xl font-black uppercase tracking-tighter truncate leading-none">
                            {mission.merchant?.name || t('private_mission')}
                        </h3>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFixed?.();
                            }}
                            className={`p-2 rounded-xl transition-all border ${isFixed ? 'bg-primary text-black border-primary shadow-[0_0_10px_var(--primary)]' : 'bg-white/5 text-white/20 border-white/5 hover:text-white hover:bg-white/10'}`}
                            title={isFixed ? t('release_camera') : t('fix_camera')}
                        >
                            <Target size={20} className={isFixed ? "animate-pulse" : ""} />
                        </button>
                        <button onClick={onClose} className="text-white/20 hover:text-white transition-all p-2">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <MapPin size={18} className="text-primary" />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[8px] font-black text-white/20 uppercase">{t('destination')}</p>
                            <p className="text-xs font-bold truncate">{mission.destinationAddress}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onChatOpen?.(mission)}
                                className="p-3 glass rounded-xl text-primary"
                                title={t('open_chat')}
                            >
                                <MessageSquare size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    const url = `https://waze.com/ul?ll=${mission.destinationLat},${mission.destinationLng}&navigate=yes`;
                                    window.open(url, '_blank');
                                }}
                                className="p-3 bg-[#33ccff]/20 text-[#33ccff] rounded-xl border border-[#33ccff]/30 shadow-[0_0_15px_rgba(51,204,255,0.2)] active:scale-95 transition-all"
                                title={t('waze_nav')}
                            >
                                <Navigation size={18} />
                            </button>
                        </div>
                    </div>
                    {mission.status === 'READY' && (
                        <button
                            onClick={() => onUpdateStatus?.(mission.id, 'ON_WAY', !!mission.merchantId)}
                            className="w-full bg-white text-background h-16 rounded-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            {t('pickup_order')} <ChevronRight size={20} />
                        </button>
                    )}
                    {mission.status === 'ON_WAY' && (
                        <button
                            onClick={() => onConfirmDelivery?.(mission)}
                            className="w-full bg-primary text-background h-16 rounded-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            {t('complete_delivery')} <CheckCircle2 size={20} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
