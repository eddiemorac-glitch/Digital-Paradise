import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/orders';
import { motion } from 'framer-motion';
import { FileText, Download, CheckCircle2, Search, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';

interface MyInvoicesProps {
    onBack: () => void;
}

export const MyInvoices = ({ onBack }: MyInvoicesProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: orders, isLoading } = useQuery({
        queryKey: ['my-invoices'],
        queryFn: orderApi.getMyOrders,
    });

    // Filter only those that are technically "invoices" (in our mock, all new orders)
    const invoices = orders?.filter(o => o.haciendaKey || o.isElectronicInvoice) || [];

    const filteredInvoices = invoices.filter(inv =>
        (inv.merchant?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        inv.haciendaKey?.includes(searchTerm)
    );

    const handleDownload = (type: 'pdf' | 'xml', id: string) => {
        useNotificationStore.getState().addNotification({
            title: 'Descarga Iniciada',
            message: `Preparando ${type.toUpperCase()} para factura ${id.substring(0, 8)}...`,
            type: 'info'
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0f18] text-white p-4 md:p-8 pt-32">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">Mis Facturas</h1>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Comprobantes Electrónicos (Hacienda 4.3)</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por comercio o clave numérica..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-20 text-white/20 animate-pulse">Cargando comprobantes...</div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="glass p-12 text-center rounded-[2rem] border-white/5">
                            <FileText size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Sin comprobantes</h3>
                            <p className="text-white/40">Tus facturas electrónicas aparecerán aquí.</p>
                        </div>
                    ) : (
                        filteredInvoices.map((bg, idx) => (
                            <motion.div
                                key={bg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass p-6 rounded-[2rem] border-white/5 hover:border-primary/20 transition-all group"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg">{bg.merchant?.name}</h3>
                                            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 my-1">
                                                <span>{new Date(bg.createdAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span className="text-primary">₡{Number(bg.total).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 p-2 bg-black/20 rounded-lg max-w-fit">
                                                <CheckCircle2 size={12} className="text-primary" />
                                                <code className="text-[10px] text-white/60 font-mono tracking-tight break-all">
                                                    {bg.haciendaKey || 'Generando clave...'}
                                                </code>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => handleDownload('pdf', bg.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                                        >
                                            <Download size={14} /> PDF
                                        </button>
                                        <button
                                            onClick={() => handleDownload('xml', bg.id)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all"
                                        >
                                            <Download size={14} /> XML
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
