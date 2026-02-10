import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp } from 'lucide-react';
import { AdminSummary } from '../../../../api/analytics';

interface RecentOrdersTableProps {
    analytics?: AdminSummary;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ analytics }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-[3.5rem] border-white/5"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <Shield className="text-[#ffcc00]" /> Bóveda Caribe
                    </h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Auditoría forense de transacciones en tiempo real</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                        Margen: ₡{(analytics?.summary?.platformProfit || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                            <th className="px-6 py-2">Comercio</th>
                            <th className="px-6 py-2 text-right">Subtotal</th>
                            <th className="px-6 py-2 text-right text-[#ffcc00]">IVA (13%)</th>
                            <th className="px-6 py-2 text-right text-primary">Fee (Plataforma)</th>
                            <th className="px-6 py-2 text-right">Total Final</th>
                            <th className="px-6 py-2 text-right opacity-0 md:opacity-100">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics?.recentOrders?.map((order: any, i: number) => (
                            <motion.tr
                                key={order.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group"
                            >
                                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/[0.05] rounded-l-[1.5rem] border-y border-l border-white/5 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-wider">{order.merchantName}</span>
                                        <span className="text-[8px] font-mono text-white/20 uppercase truncate w-24">{order.id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/[0.05] border-y border-white/5 text-right font-mono text-xs">
                                    ₡{order.subtotal?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/[0.05] border-y border-white/5 text-right font-mono text-xs text-[#ffcc00] font-bold">
                                    ₡{order.tax?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/[0.05] border-y border-white/5 text-right font-mono text-xs text-primary font-bold">
                                    ₡{(order.platformFee + order.transactionFee)?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/[0.05] border-y border-white/5 text-right font-black text-sm">
                                    ₡{order.total?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/[0.05] border-y border-r border-white/5 rounded-r-[1.5rem] text-right text-[10px] text-white/20 transition-all">
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};
