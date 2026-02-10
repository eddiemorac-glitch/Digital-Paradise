import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShoppingBag, Store } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { AdminSummary } from '../../../../api/analytics';

interface ChartsProps {
    analytics?: AdminSummary;
    onNavigate?: (view: any) => void;
}

const COLORS = ['#00ecff', '#00ff66', '#ff4400', '#ff00ee', '#ffcc00'];

export const RevenueChart: React.FC<ChartsProps> = ({ analytics }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass p-8 rounded-[3.5rem] border-white/5 min-h-[400px]"
    >
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight italic">Tendencias de Ingresos</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Últimos 7 días de operación</p>
            </div>
            <Activity className="text-primary" />
        </div>

        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.dailyTrends}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ecff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00ecff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₡${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0a0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                        itemStyle={{ color: '#00ecff', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#00ecff"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </motion.div>
);

export const StatusDistributionChart: React.FC<ChartsProps> = ({ analytics, onNavigate }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass p-8 rounded-[3.5rem] border-white/5 flex flex-col"
    >
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight italic">Distribución de Pedidos</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Estado actual de la red</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => onNavigate && onNavigate('logistics')} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">Ver Todos</button>
                <ShoppingBag className="text-primary" />
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={analytics?.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="status"
                            stroke="none"
                        >
                            {analytics?.statusDistribution?.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0a0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={({ payload }) => (
                                <div className="flex justify-center gap-4 mt-4">
                                    {payload?.map((entry: any, index: number) => (
                                        <div key={`legend-item-${index}`} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    </motion.div>
);

export const TopMerchantsChart: React.FC<ChartsProps> = ({ analytics, onNavigate }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[3.5rem] border-white/5 col-span-1 lg:col-span-2"
    >
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight italic">Comercios Líderes</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Top 5 por ingresos totales</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => onNavigate && onNavigate('merchants')} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">Ver Todos</button>
                <Store className="text-primary" />
            </div>
        </div>

        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.topMerchants}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₡${value / 1000}k`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0a0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                        itemStyle={{ color: '#00ecff', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="revenue" fill="#00ecff" radius={[10, 10, 0, 0]} barSize={40}>
                        {analytics?.topMerchants?.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </motion.div>
);
