import React from 'react';
import { DollarSign, PackageCheck, Star, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface BalanceHoyProps {
    dailyEarnings: number;
    completedUnits: number;
    rating: number;
    weeklyHistory: { date: string, earnings: number, deliveries: number }[];
    language?: string;
}

export const BalanceHoy: React.FC<BalanceHoyProps> = ({
    dailyEarnings,
    completedUnits,
    rating,
    weeklyHistory,
    language = 'es'
}) => {
    // Format day labels for simple users (just the day name)
    const chartData = weeklyHistory.map(item => {
        const d = new Date(item.date);
        const dayName = d.toLocaleDateString(language === 'es' ? 'es-CR' : 'en-US', { weekday: 'short' });
        return {
            ...item,
            displayDate: dayName.toUpperCase()
        };
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* KPI GRID */}
            <div className="grid grid-cols-2 gap-3">
                <div className="glass p-5 rounded-[2rem] border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2 text-primary opacity-60">
                        <DollarSign size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'es' ? 'Hoy' : 'Today'}</span>
                    </div>
                    <p className="text-3xl font-black italic tracking-tighter">₡{dailyEarnings.toLocaleString()}</p>
                </div>

                <div className="glass p-5 rounded-[2rem] border-white/10 bg-white/5">
                    <div className="flex items-center gap-2 mb-2 text-white opacity-40">
                        <PackageCheck size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'es' ? 'Entregas' : 'Deliveries'}</span>
                    </div>
                    <p className="text-3xl font-black italic tracking-tighter">{completedUnits}</p>
                </div>

                <div className="col-span-2 glass p-5 rounded-[2.5rem] border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-orange-400 opacity-60">
                            <Star size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{language === 'es' ? 'Mi Perfil' : 'Profile'}</span>
                        </div>
                        <p className="text-3xl font-black italic tracking-tighter">{rating.toFixed(1)} <span className="text-xs opacity-40 font-bold uppercase italic">puntos</span></p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                        <TrendingUp size={28} />
                    </div>
                </div>
            </div>

            {/* WEEKLY CHART */}
            <div className="glass p-6 rounded-[2.5rem] border-white/5 bg-white/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-6 px-2">
                    {language === 'es' ? 'Rendimiento Semanal' : 'Weekly Effort'}
                </p>

                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="glass p-3 border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                <p className="text-white mb-1">{payload[0].payload.displayDate}</p>
                                                <p className="text-primary">₡{payload[0].value?.toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                                {chartData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === chartData.length - 1 ? '#00FF66' : 'rgba(255,255,255,0.1)'}
                                    />
                                ))}
                            </Bar>
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 8, fontWeight: 900, opacity: 0.3, fill: '#fff' }}
                                interval={0}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
