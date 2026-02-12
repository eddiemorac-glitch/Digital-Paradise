import { motion, AnimatePresence } from 'framer-motion';
import { X, Bus, Clock, AlertCircle, Phone } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';

interface BusScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BusScheduleModal = ({ isOpen, onClose }: BusScheduleModalProps) => {
    const { t } = useLanguageStore();

    if (!isOpen) return null;

    const schedules = {
        sjo_pv: [
            { time: '06:00 AM', notes: t('bus_direct') },
            { time: '08:00 AM', notes: t('bus_direct') },
            { time: '10:00 AM', notes: t('bus_direct') },
            { time: '02:00 PM', notes: t('bus_direct') },
            { time: '04:00 PM', notes: t('bus_direct') },
        ],
        pv_sjo: [
            { time: '04:50 AM', notes: t('bus_direct') },
            { time: '07:30 AM', notes: t('bus_direct') },
            { time: '09:00 AM', notes: t('bus_direct') },
            { time: '11:00 AM', notes: t('bus_direct') },
            { time: '04:00 PM', notes: t('bus_direct') },
        ],
        limon_pv: [
            { time: '05:30 AM - 07:30 PM', notes: t('freq_hourly') },
        ]
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 touch-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0B1015] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10 active:scale-90"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                                    <Bus size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">
                                        {t('bus_schedules')}
                                    </h2>
                                    <p className="text-primary font-black text-xs uppercase tracking-[0.2em]">{t('bus_company')}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* San José to Puerto Viejo */}
                                <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-primary font-black text-sm">{t('city_sjo')}</span>
                                            <span className="text-white/20">→</span>
                                            <span className="text-white font-black text-sm">{t('city_pv')}</span>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">{t('bus_duration')}</span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {schedules.sjo_pv.map((s, i) => (
                                            <div key={i} className="bg-white/5 rounded-xl p-3 text-center border border-white/5 hover:border-primary/30 transition-colors">
                                                <span className="block text-sm font-black text-white">{s.time.split(' ')[0]}</span>
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">{s.time.split(' ')[1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Puerto Viejo to San José */}
                                <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-amber-400 font-black text-sm">{t('city_pv')}</span>
                                            <span className="text-white/20">→</span>
                                            <span className="text-white font-black text-sm">{t('city_sjo')}</span>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">{t('bus_duration')}</span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {schedules.pv_sjo.map((s, i) => (
                                            <div key={i} className="bg-white/5 rounded-xl p-3 text-center border border-white/5 hover:border-amber-400/30 transition-colors">
                                                <span className="block text-sm font-black text-white">{s.time.split(' ')[0]}</span>
                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">{s.time.split(' ')[1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Limón Connection */}
                                <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-blue-400 font-black text-sm">{t('city_limon')}</span>
                                        <span className="text-white/20">↔</span>
                                        <span className="text-white font-black text-sm">{t('city_pv')}</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="w-10 h-10 rounded-xl bg-blue-400/20 flex items-center justify-center shrink-0">
                                            <Clock size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-base">05:30 AM - 07:30 PM</p>
                                            <p className="text-[10px] text-white/50 uppercase tracking-[0.1em] font-bold">{t('freq_hourly')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-5 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                                        <AlertCircle className="text-yellow-500" size={18} />
                                    </div>
                                    <p className="text-[10px] font-bold text-yellow-200/60 leading-relaxed uppercase tracking-wide pt-1">
                                        {t('bus_warning')}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <a href="tel:+50627500023" className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 rounded-xl text-yellow-500 text-[10px] font-black uppercase tracking-wider hover:bg-yellow-500/20 transition-colors border border-yellow-500/10 active:scale-95">
                                        <Phone size={12} /> {t('city_pv')}: 2750-0023
                                    </a>
                                    <a href="tel:+50622578129" className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 rounded-xl text-yellow-500 text-[10px] font-black uppercase tracking-wider hover:bg-yellow-500/20 transition-colors border border-yellow-500/10 active:scale-95">
                                        <Phone size={12} /> {t('city_sjo')}: 2257-8129
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
