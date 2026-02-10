import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, TrendingUp, Store, Sparkles,
    Shield, Bell, Globe, Clock,
    ShoppingBag, X, Loader2, Download,
    AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../api/notifications';
import { analyticsApi, AdminSummary } from '../../../api/analytics';
import { eventsApi } from '../../../api/events';
import { toast } from 'sonner';
import { EventForm } from './EventForm';
import { EmergencyModal } from './EmergencyModal';
import { socketService } from '../../../api/socket';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OverviewProps {
    onNavigate?: (view: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
    const { data: analytics } = useQuery<AdminSummary>({
        queryKey: ['admin-analytics'],
        queryFn: () => analyticsApi.getAdminSummary()
    });
    const { data: heatmapData } = useQuery<any[]>({
        queryKey: ['admin-heatmap'],
        queryFn: () => analyticsApi.getHeatmap()
    });

    // --- Modals & State ---
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    const [broadcastMessage, setBroadcastMessage] = useState({ title: '', message: '', type: 'info' });
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstance = React.useRef<L.Map | null>(null);

    // React Query Client for invalidations
    const queryClient = useQueryClient();

    // Event Creation Mutation
    const createEventMutation = useMutation({
        mutationFn: eventsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            toast.success('Evento creado directamente desde Misión Control');
            setShowEventModal(false);
        },
        onError: () => toast.error('Error al crear evento')
    });

    React.useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Initialize map
        mapInstance.current = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([9.9333, -84.0833], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            opacity: 0.5
        }).addTo(mapInstance.current);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // --- WebSocket Integration ---
    React.useEffect(() => {
        socketService.connect();
        socketService.joinAdminRoom();

        socketService.onEmergencyAlert((data) => {
            toast(`🚨 EMERGENCIA: ${data.title}`, {
                description: data.message,
                duration: 10000,
                action: {
                    label: 'Ver Detalle',
                    onClick: () => setShowEmergencyModal(true)
                }
            });
        });

        // Auto-refresh analytics on key events
        socketService.onNewOrder(() => {
            queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
            toast.info('Nuevo pedido recibido - Actualizando métricas');
        });
    }, [queryClient]);

    // Update heatmap circles when data changes
    React.useEffect(() => {
        if (!mapInstance.current || !heatmapData) return;

        // Clear existing circles (simplified: just add new ones for now, or use a layerGroup)
        const circlesLayer = L.layerGroup().addTo(mapInstance.current);

        heatmapData.forEach(point => {
            const lat = Number(point.lat);
            const lng = Number(point.lng);

            if (!isNaN(lat) && !isNaN(lng)) {
                L.circle([lat, lng], {
                    radius: 500,
                    fillColor: '#00ecff',
                    color: '#00ecff',
                    fillOpacity: 0.4,
                    weight: 0
                }).addTo(circlesLayer);
            }
        });

        return () => {
            circlesLayer.remove();
        };
    }, [heatmapData]);

    const broadcastMutation = useMutation({
        mutationFn: (data: { title: string; message: string; type: string }) => notificationsApi.broadcast(data),
        onSuccess: () => {
            toast.success('Mensaje emitido a toda la red');
            setIsBroadcastOpen(false);
            setBroadcastMessage({ title: '', message: '', type: 'info' });
        },
        onError: () => toast.error('Error al emitir mensaje')
    });

    const handleBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        socketService.emitEmergencyBroadcast({
            title: broadcastMessage.title,
            message: broadcastMessage.message,
            type: broadcastMessage.type === 'warning' ? 'ALERT' : 'LOCKDOWN'
        });
        toast.success('Transmisión de emergencia emitida correctamente');
        setIsBroadcastOpen(false);
        setBroadcastMessage({ title: '', message: '', type: 'info' });
    };

    const handleExportCSV = () => {
        if (!analytics) return;

        const csvRows = [];
        // Header
        csvRows.push(['Fecha', 'Ingresos', 'Pedidos']);

        // Data
        analytics.dailyTrends.forEach(day => {
            csvRows.push([day.date, day.revenue, day.orders]);
        });

        // Add Merchant Summary
        csvRows.push(['']);
        csvRows.push(['Comercio', 'Ingresos Totales', 'Pedidos Totales']);
        analytics.topMerchants.forEach(m => {
            csvRows.push([m.name, m.revenue, m.orders]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_general_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Reporte CSV generado correctamente');
    };

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

    const COLORS = ['#00ecff', '#00ff66', '#ff4400', '#ff00ee', '#ffcc00'];

    return (
        <div className="space-y-8 relative">
            <AnimatePresence>
                {isBroadcastOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#0a0f18] border border-white/10 p-8 rounded-3xl w-full max-w-lg relative"
                        >
                            <button
                                onClick={() => setIsBroadcastOpen(false)}
                                className="absolute top-4 right-4 text-white/40 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                            <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
                                <Bell className="text-primary" /> Transmisión Global
                            </h3>
                            <form onSubmit={handleBroadcast} className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Título</label>
                                    <input
                                        value={broadcastMessage.title}
                                        onChange={e => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary"
                                        placeholder="Ej: Alerta Climática"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Mensaje</label>
                                    <textarea
                                        value={broadcastMessage.message}
                                        onChange={e => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary h-24"
                                        placeholder="Mensaje a todos los usuarios..."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['info', 'warning', 'success'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setBroadcastMessage({ ...broadcastMessage, type })}
                                            className={`p-2 rounded-lg text-xs font-bold uppercase ${broadcastMessage.type === type ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="submit"
                                    disabled={broadcastMutation.isPending}
                                    className="w-full bg-primary text-background font-black py-4 rounded-xl uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {broadcastMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Enviar Transmisión'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEventModal && (
                    <EventForm
                        onClose={() => setShowEventModal(false)}
                        onSubmit={(data) => createEventMutation.mutate(data)}
                        isLoading={createEventMutation.isPending}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEmergencyModal && (
                    <EmergencyModal onClose={() => setShowEmergencyModal(false)} />
                )}
            </AnimatePresence>

            {/* Control Center Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                        <Shield className="text-primary" size={28} />
                        Misión Control
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Sistema en línea | Tiempo Real
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                    <Clock size={16} className="text-white/40" />
                    <span className="text-sm font-mono font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* Tactical Stats Grid */}
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

            {/* Intelligence & Trends Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue & Volume Chart */}
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

                {/* Status & Distribution */}
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

                {/* Top Merchants Leaderboard */}
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

                {/* Geographic Density Heatmap */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-[3.5rem] border-white/5 col-span-1 lg:col-span-2 overflow-hidden h-[500px] relative"
                >
                    <div className="absolute top-8 left-8 z-[1000] pointer-events-none">
                        <h3 className="text-xl font-black uppercase tracking-tight italic drop-shadow-lg">Densidad Geográfica</h3>
                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest drop-shadow-lg">Distribución de demanda en tiempo real</p>
                    </div>

                    <div className="absolute inset-0 z-0">
                        <div ref={mapRef} style={{ height: '100%', width: '100%', filter: 'grayscale(1) invert(1) opacity(0.5)' }} />
                    </div>

                    {/* Gradient Overlay for Map Integration */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0f18] via-transparent to-transparent opacity-60" />
                </motion.div>
            </div>

            {/* Bóveda Caribe - Financial Integrity Monitor */}
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
                            {analytics?.recentOrders?.map((order, i) => (
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

            {/* Quick Actions Nexus */}
            <div className="glass p-8 rounded-[3.5rem] border-white/5">
                <div className="flex items-center gap-4 mb-6">
                    <Globe className="text-primary" size={24} />
                    <h3 className="text-xl font-black uppercase tracking-tight italic">Nexos Rápidos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <button
                        onClick={() => setIsBroadcastOpen(true)}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/5 transition-all group cursor-pointer"
                    >
                        <div className="text-white/40 group-hover:text-primary transition-colors">
                            <Bell />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Broadcast</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/5 transition-all group cursor-pointer"
                    >
                        <div className="text-white/40 group-hover:text-primary transition-colors">
                            <Download />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Exportar CSV</span>
                    </button>
                    {[
                        { label: 'Nuevo Evento', icon: <Sparkles />, action: () => setShowEventModal(true) },
                        { label: 'Verificar Merchant', icon: <Shield />, action: () => onNavigate && onNavigate('merchants') },
                        { label: 'Emergencia', icon: <AlertTriangle />, action: () => setShowEmergencyModal(true) },
                        { label: 'Soporte', icon: <Activity />, action: () => toast.info('Panel de soporte próximamente') },
                    ].map((action, i) => (
                        <button
                            key={i}
                            onClick={action.action}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-[2rem] border border-white/5 transition-all group"
                        >
                            <div className="text-white/40 group-hover:text-primary transition-colors">
                                {action.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
