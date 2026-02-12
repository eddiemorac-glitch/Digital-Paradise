import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useLanguageStore } from '../../store/languageStore';

interface BalanceHoyProps {
    dailyEarnings: number;
    completedUnits: number;
    rating: number;
    weeklyHistory: any[];
    language: 'es' | 'en';
}

export const BalanceHoy = ({ dailyEarnings, completedUnits, rating, weeklyHistory, language }: BalanceHoyProps) => {
    const { t } = useLanguageStore();

    return (
        <div className="glass p-8 rounded-[2.5rem] border-primary/20 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="text-center md:text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{t('today')}</p>
                    <h2 className="text-5xl font-black italic tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(0,255,102,0.4)]">
                        {formatCurrency(dailyEarnings)}
                    </h2>
                    <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <TrendingUp size={14} className="text-primary" />
                            <span className="text-[10px] font-bold uppercase text-white/60">{completedUnits} {t('deliveries')}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <Award size={14} className="text-yellow-500" />
                            <span className="text-[10px] font-bold uppercase text-white/60">{rating.toFixed(1)} {t('my_profile')}</span>
                        </div>
                    </div>
                </div>

                {/* GRAPH VISUALIZATION */}
                <div className="w-full md:w-1/2 h-32 flex items-end justify-between gap-2 px-4 border-l border-white/5">
                    {weeklyHistory.length > 0 ? (
                        weeklyHistory.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 relative group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(day.amount / 50000) * 100}%` }}
                                    className="w-full bg-primary/20 rounded-t-lg relative group-hover:bg-primary/40 transition-all border-t border-x border-primary/30"
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black bg-black/80 px-2 py-1 rounded text-primary whitespace-nowrap z-20">
                                        {formatCurrency(day.amount)}
                                    </div>
                                </motion.div>
                                <span className="text-[8px] font-bold uppercase text-white/20">{day.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-2">
                            <Clock size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-center">{t('weekly_performance')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
