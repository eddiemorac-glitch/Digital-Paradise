import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
    data: any[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
    // Process data to group by date if needed
    // For now assume data is already formatted: { date: '2026-02-01', total: 50000 }

    return (
        <div className="w-full h-[300px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900' }}
                        tickFormatter={(value) => `₡${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem',
                            backdropFilter: 'blur(10px)',
                            color: '#fff',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#10b981', fontWeight: '900' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
