import React from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Shield, Globe, ShoppingBag } from 'lucide-react';
import { AdminSummary } from '../../../../api/analytics';

interface OverviewStatsProps {
    analytics?: AdminSummary;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({ analytics }) => {
    const stats = [
        {
            label: 'Volumen Bruto',
            value: '₡' + (analytics?.summary?.totalRevenue?.toLocaleString() || '0'),
            icon: <Globe size={20} />,
            color: '#00ecff',
            trend: 'Bruto General',
            description: 'Total procesado por la red'
        },
        {
            label: 'IVA Recaudado',
            value: '₡' + (analytics?.summary?.totalTax?.toLocaleString() || '0'),
            icon: <Shield size={20} />,
            color: '#ffcc00',
            trend: '13% Hacienda',
            description: 'Impuestos locales retenidos'
        },
        {
            label: 'Ganancia Neta',
            value: '₡' + (analytics?.summary?.platformProfit?.toLocaleString() || '0'),
            icon: <TrendingUp size={20} />,
            color: '#00ff66',
            trend: 'Profit Real',
            description: 'Comisiones + Tarifas fijos'
        },
        {
            label: 'Ticket Promedio',
            value: '₡' + (analytics?.summary?.averageOrderValue?.toLocaleString() || '0'),
            icon: <Activity size={20} />,
            color: '#ff00ee',
            trend: 'Intelligence',
            description: 'Valor medio por pedido'
        },
        {
            label: 'Pedidos',
            value: analytics?.summary?.totalOrders || '0',
            icon: <ShoppingBag size={20} />,
            color: '#ff4400',
            trend: 'Escalando',
            description: 'Transacciones exitosas'
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                    className="glass p-6 rounded-[2.5rem] border-white/5 relative overflow-hidden group hover:border-primary/20 transition-all cursor-default"
                >
                    {/* Birthday Flare Aura */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-30" style={{ backgroundColor: stat.color }} />

                    <div className="flex justify-between items-start mb-4">
                        <motion.div
                            initial={{ rotate: -15 }}
                            animate={{ rotate: 0 }}
                            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"
                            style={{ color: stat.color }}
                        >
                            {stat.icon}
                        </motion.div>
                        <span className="text-[9px] font-black px-2 py-1 rounded-full bg-white/5 text-white/60 uppercase tracking-tighter border border-white/5">
                            {stat.trend}
                        </span>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-black tracking-tighter"
                        >
                            {stat.value}
                        </motion.p>
                        <p className="text-[8px] text-white/20 font-medium uppercase mt-2 group-hover:text-white/40 transition-colors uppercase tracking-widest">{stat.description}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
