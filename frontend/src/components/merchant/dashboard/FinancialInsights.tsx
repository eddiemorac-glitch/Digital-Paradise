import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Receipt, Star, Info, ChevronDown } from 'lucide-react';
import { SalesChart } from '../SalesChart';
import { useLanguageStore } from '../../../store/languageStore';

interface FinancialInsightsProps {
    stats: any;
    chartData: any[];
}

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ stats, chartData }) => {
    const [showBreakdown, setShowBreakdown] = React.useState(false);
    const { t } = useLanguageStore();

    return (
        <div className="space-y-8 safe-area-inset">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
                <StatCard
                    icon={<TrendingUp className="text-primary" size={24} />}
                    label={t('net_revenue')}
                    value={`₡${stats?.netRevenue?.toLocaleString() || '0'}`}
                    trend="+100%"
                    glow="shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                />
                <StatCard
                    icon={<Clock className="text-yellow-400" size={24} />}
                    label={t('order_queue')}
                    value={stats?.pendingOrders?.toString() || '0'}
                    color="text-yellow-400"
                    glow="shadow-[0_0_30px_rgba(250,204,21,0.15)]"
                />
                <StatCard
                    icon={<Receipt className="text-blue-400" size={24} />}
                    label={t('invoices_emitted')}
                    value={stats?.invoicesEmitted?.toString() || '0'}
                    color="text-blue-400"
                />
                <StatCard
                    icon={<Star className="fill-accent text-accent" size={24} />}
                    label={t('rating_caribe')}
                    value={`${stats?.avgRating || 0} (${stats?.reviewCount || 0})`}
                    color="text-accent"
                />
            </div>

            {/* Main Insights Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 glass p-6 md:p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-primary/10 transition-all duration-1000" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">
                                {t('tactical_performance')}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                {t('daily_revenue')}
                            </p>
                        </div>
                    </div>
                    <SalesChart data={chartData} />
                </div>

                {/* Earnings Breakdown */}
                <div className="glass p-6 md:p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] -mr-16 -mt-16" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black uppercase italic tracking-tighter">
                                {t('transparency')}
                            </h3>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                                <Info size={14} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                                    {t('gross_sales')}
                                </span>
                                <span className="text-lg font-black text-white font-mono">
                                    ₡{stats?.grossSubtotal?.toLocaleString() || '0'}
                                </span>
                            </div>

                            <div className="flex justify-between items-end p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <span className="text-[10px] font-black uppercase text-red-500/60 tracking-widest">
                                    {t('commission_fee')}
                                </span>
                                <span className="text-lg font-black text-red-500 font-mono">
                                    -₡{stats?.totalFees?.toLocaleString() || '0'}
                                </span>
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                                        {t('your_balance')}
                                    </span>
                                    <span className="text-2xl font-black text-primary font-mono drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                        ₡{stats?.netRevenue?.toLocaleString() || '0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        {t('view_payouts')}
                        <ChevronDown size={14} className={`transition-transform duration-300 ${showBreakdown ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    color?: string;
    trend?: string;
    glow?: string;
}

const StatCard = ({ icon, label, value, color = "text-white", trend, glow = "" }: StatCardProps) => (
    <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className={`glass p-6 md:p-8 rounded-[2.5rem] border-white/5 flex items-center gap-6 transition-all duration-500 relative overflow-hidden group ${glow}`}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10 shadow-inner shrink-0">
            {icon}
        </div>
        <div className="relative z-10 w-full overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2 truncate">{label}</p>
            <div className="flex items-baseline gap-3 flex-wrap">
                <p className={`text-[clamp(1.5rem,3vw,1.875rem)] font-black tracking-tighter ${color}`}>{value}</p>
                {trend && (
                    <span className="text-[9px] font-black text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
        </div>
    </motion.div>
);
