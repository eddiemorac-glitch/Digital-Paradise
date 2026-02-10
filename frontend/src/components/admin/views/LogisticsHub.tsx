import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck, ShoppingBag, Search, Filter,
    MoreHorizontal, CheckCircle, Clock,
    MapPin, RefreshCw, Activity, AlertTriangle, Save,
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, orderApi } from '../../../api/orders';
import { Mission, logisticsApi } from '../../../api/logistics';
import { toast } from 'sonner';



import { MissionAssignModal } from './MissionAssignModal';
import { LiveTrackingMap } from './LiveTrackingMap';

export const LogisticsHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'orders' | 'missions'>('orders');
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: orders, isLoading: loadingOrders } = useQuery<Order[]>({ queryKey: ['admin-orders'], queryFn: () => orderApi.getAll() });
    const { data: missions, isLoading: loadingMissions } = useQuery<Mission[]>({ queryKey: ['admin-missions'], queryFn: () => logisticsApi.getAvailable() });

    const updateOrderStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.adminUpdateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Estado del pedido actualizado (Override)');
            setEditingOrderId(null);
        },
        onError: () => toast.error('Error al actualizar estado')
    });

    const assignMissionMutation = useMutation({
        mutationFn: ({ missionId, courierId }: { missionId: string; courierId: string }) => logisticsApi.assignMission(missionId, courierId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-missions'] });
            toast.success('Misión asignada correctamente');
            setSelectedMissionId(null);
        },
        onError: () => toast.error('Error al asignar misión')
    });

    const handleUpdateStatus = (id: string) => {
        if (!selectedStatus) return;
        updateOrderStatusMutation.mutate({ id, status: selectedStatus });
    };

    const handleAssignMission = (courierId: string) => {
        if (selectedMissionId) {
            assignMissionMutation.mutate({ missionId: selectedMissionId, courierId });
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [showFilters, setShowFilters] = useState(false);

    const filteredOrders = orders?.filter(order => {
        const matchesSearch =
            (order.id?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (order.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || '');

        const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <Truck className="text-primary" size={24} />
                        Centro Logístico
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                        Gestión de flujo y misiones
                    </p>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-primary text-background' : 'text-white/40'}`}
                    >
                        Pedidos
                    </button>
                    <button
                        onClick={() => setActiveTab('missions')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'missions' ? 'bg-primary text-background' : 'text-white/40'}`}
                    >
                        Misiones
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-[2rem] border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">En preparación</p>
                    <p className="text-2xl font-black mt-1">{orders?.filter(o => o.status === 'PREPARING').length || 0}</p>
                </div>
                <div className="glass p-6 rounded-[2rem] border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">En ruta</p>
                    <p className="text-2xl font-black mt-1">{orders?.filter(o => o.status === 'DELIVERING').length || 0}</p>
                </div>
                <div className="glass p-6 rounded-[2rem] border-white/5 text-primary">
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Entregados hoy</p>
                    <p className="text-2xl font-black mt-1">{orders?.filter(o => o.status === 'COMPLETED').length || 0}</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'orders' ? (
                    <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass rounded-[2.5rem] border-white/5 overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar pedido o Cliente..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="flex gap-2 relative">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-4 py-2.5 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/60'}`}
                                >
                                    <Filter size={14} /> {filterStatus === 'ALL' ? 'Todos' : filterStatus}
                                </button>

                                {showFilters && (
                                    <div className="absolute top-full right-0 mt-2 w-40 bg-[#0a1015] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                                        {['ALL', 'PENDING', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => { setFilterStatus(status); setShowFilters(false); }}
                                                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-orders'] })}
                                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">ID Pedido</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Cliente</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Estado</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Total</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loadingOrders ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-white/20">Cargando flujos tácticos...</td></tr>
                                    ) : filteredOrders?.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-white/20">No se encontraron pedidos.</td></tr>
                                    ) : filteredOrders?.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                        <ShoppingBag size={14} />
                                                    </div>
                                                    <span className="text-xs font-mono font-bold">#{order.id.slice(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-white/60">{order.user?.fullName || 'Cliente Anónimo'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingOrderId === order.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            className="bg-black/50 border border-white/20 text-xs rounded px-2 py-1 outline-none focus:border-primary"
                                                            value={selectedStatus}
                                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                                        >
                                                            <option value="PENDING">PENDING</option>
                                                            <option value="PREPARING">PREPARING</option>
                                                            <option value="READY">READY</option>
                                                            <option value="DELIVERING">DELIVERING</option>
                                                            <option value="COMPLETED">COMPLETED</option>
                                                            <option value="CANCELLED">CANCELLED</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleUpdateStatus(order.id)}
                                                            disabled={updateOrderStatusMutation.isPending}
                                                            className="p-1 bg-primary/20 text-primary rounded hover:bg-primary/40 disabled:opacity-50"
                                                        >
                                                            {updateOrderStatusMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingOrderId(null)}
                                                            className="p-1 bg-white/10 text-white/40 rounded hover:bg-white/20"
                                                        >
                                                            <AlertTriangle size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => { setEditingOrderId(order.id); setSelectedStatus(order.status); }}
                                                        className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                                                            }`}
                                                    >
                                                        {order.status === 'COMPLETED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                                        {order.status}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black">₡{order.total?.toLocaleString() || '0'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                                    <MoreHorizontal size={16} className="text-white/40" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="missions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <LiveTrackingMap />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loadingMissions ? (
                                <div className="col-span-full py-20 text-center text-white/20 italic">Escaneando misiones activas...</div>
                            ) : missions?.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-white/20 italic">No hay misiones activas en este momento.</div>
                            ) : missions?.map((mission) => (
                                <div key={mission.id} className="glass p-6 rounded-[2.5rem] border-white/5 space-y-4 hover:border-primary/20 transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase truncate max-w-[150px]">{mission.restaurantName || 'Desconocido'}</h4>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Misión #{mission.id.slice(0, 6)}</p>
                                            </div>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/5 text-white/40">
                                            <Activity size={14} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-white/60">
                                            <MapPin size={12} className="text-primary" />
                                            <span className="truncate">{mission.dropoffAddress || 'Sin dirección'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-white/60">
                                            <Clock size={12} className="text-white/40" />
                                            <span>Prioridad: {mission.isExpress ? 'CRÍTICA' : 'NORMAL'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-white/60">
                                            <AlertTriangle size={12} className={mission.status === 'PENDING' ? 'text-orange-500' : 'text-green-500'} />
                                            <span>Estado: {mission.status}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex gap-2">
                                        <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Ruta</button>
                                        <button
                                            onClick={() => setSelectedMissionId(mission.id)}
                                            className="flex-1 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Asignar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedMissionId && (
                    <MissionAssignModal
                        missionId={selectedMissionId}
                        onClose={() => setSelectedMissionId(null)}
                        onAssign={handleAssignMission}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
