
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bus, Clock, AlertCircle, Phone } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';

interface BusScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BusScheduleModal = ({ isOpen, onClose }: BusScheduleModalProps) => {
    const { language } = useLanguageStore();

    if (!isOpen) return null;

    const schedules = {
        sjo_pv: [
            { time: '06:00 AM', notes: 'Directo' },
            { time: '08:00 AM', notes: 'Directo' },
            { time: '10:00 AM', notes: 'Directo' },
            { time: '02:00 PM', notes: 'Directo' },
            { time: '04:00 PM', notes: 'Directo' },
        ],
        pv_sjo: [
            { time: '04:50 AM', notes: 'Directo' },
            { time: '07:30 AM', notes: 'Directo' },
            { time: '09:00 AM', notes: 'Directo' },
            { time: '11:00 AM', notes: 'Directo' },
            { time: '04:00 PM', notes: 'Directo' },
        ],
        limon_pv: [
            { time: '05:30 AM - 07:30 PM', notes: language === 'es' ? 'Cada hora' : 'Hourly' },
        ]
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                        className="relative w-full max-w-2xl bg-[#0B1015] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                    <Bus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none mb-1">
                                        {language === 'es' ? 'Horarios' : 'Schedules'}
                                    </h2>
                                    <p className="text-primary font-medium text-xs uppercase tracking-wider">MEPE & Caribe Sur</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* San José to Puerto Viejo */}
                                <div className="glass p-5 rounded-2xl border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary font-black text-sm">SJO</span>
                                            <span className="text-white/20">→</span>
                                            <span className="text-white font-black text-sm">PV</span>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">~4.5h</span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {schedules.sjo_pv.map((s, i) => (
                                            <div key={i} className="bg-white/5 rounded-lg p-2 text-center border border-white/5 hover:border-primary/30 transition-colors">
                                                <span className="block text-sm font-bold text-white">{s.time.split(' ')[0]}</span>
                                                <span className="text-[10px] text-white/40">{s.time.split(' ')[1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Puerto Viejo to San José */}
                                <div className="glass p-5 rounded-2xl border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-400 font-black text-sm">PV</span>
                                            <span className="text-white/20">→</span>
                                            <span className="text-white font-black text-sm">SJO</span>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">~4.5h</span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {schedules.pv_sjo.map((s, i) => (
                                            <div key={i} className="bg-white/5 rounded-lg p-2 text-center border border-white/5 hover:border-amber-400/30 transition-colors">
                                                <span className="block text-sm font-bold text-white">{s.time.split(' ')[0]}</span>
                                                <span className="text-[10px] text-white/40">{s.time.split(' ')[1]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Limón Connection */}
                                <div className="glass p-5 rounded-2xl border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-blue-400 font-black text-sm">Limón</span>
                                        <span className="text-white/20">↔</span>
                                        <span className="text-white font-black text-sm">Puerto Viejo</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <Clock size={18} className="text-blue-400" />
                                        <div>
                                            <p className="font-bold text-white text-sm">05:30 AM - 07:30 PM</p>
                                            <p className="text-[10px] text-white/50 uppercase tracking-wide">{language === 'es' ? 'Cada hora' : 'Every hour'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                <div className="flex gap-3 mb-3">
                                    <AlertCircle className="text-yellow-500 shrink-0" size={16} />
                                    <p className="text-[10px] text-yellow-200/60 leading-relaxed">
                                        {language === 'es'
                                            ? 'Llega 30 min antes. Compra boletos en ventanilla.'
                                            : 'Arrive 30 mins early. Buy tickets at counter.'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <a href="tel:+50627500023" className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-lg text-yellow-500 text-[10px] font-bold hover:bg-yellow-500/20 transition-colors border border-yellow-500/10">
                                        <Phone size={10} /> PV: 2750-0023
                                    </a>
                                    <a href="tel:+50622578129" className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-lg text-yellow-500 text-[10px] font-bold hover:bg-yellow-500/20 transition-colors border border-yellow-500/10">
                                        <Phone size={10} /> SJO: 2257-8129
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
