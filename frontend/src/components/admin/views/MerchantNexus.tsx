import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store, Search, ShieldCheck,
    Leaf, MapPin, Briefcase, RefreshCw,
    Loader2, Check, X, Eye, FileText, AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Merchant, merchantApi } from '../../../api/merchants';
import { toast } from 'sonner';

export const MerchantNexus: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'archived'>('all');
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

    const { data: merchants, isLoading } = useQuery<Merchant[]>({
        queryKey: ['admin-merchants', activeTab],
        queryFn: () => {
            if (activeTab === 'pending') return merchantApi.getPending();
            if (activeTab === 'archived') return merchantApi.getAdminAll({ isActive: false });
            return merchantApi.getAdminAll();
        }
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => merchantApi.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
            toast.success('Comercio aprobado correctamente');
            setSelectedMerchant(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Error al aprobar')
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) => merchantApi.reject(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
            toast.success('Comercio rechazado');
            setSelectedMerchant(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Error al rechazar')
    });

    const suspendMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) => merchantApi.suspend(id, reason),
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: ['admin-merchants'] });
            const previousMerchants = queryClient.getQueryData(['admin-merchants', activeTab]);
            queryClient.setQueryData(['admin-merchants', activeTab], (old: Merchant[] | undefined) =>
                old ? old.map(m => m.id === id ? { ...m, status: 'suspended' } : m) : []
            );
            return { previousMerchants };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
        },
        onSuccess: () => {
            toast.success('Comercio suspendido');
        },
        onError: (err: any, context: any) => {
            if (context?.previousMerchants) {
                queryClient.setQueryData(['admin-merchants', activeTab], context.previousMerchants);
            }
            toast.error(err.response?.data?.message || 'Error al suspender');
        }
    });

    const updateGeneralMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => merchantApi.update(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['admin-merchants'] });
            const previousMerchants = queryClient.getQueryData(['admin-merchants', activeTab]);
            queryClient.setQueryData(['admin-merchants', activeTab], (old: Merchant[] | undefined) =>
                old ? old.map(m => m.id === id ? { ...m, ...data } : m) : []
            );
            return { previousMerchants };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
        },
        onSuccess: () => {
            toast.success('Cambios guardados');
            setEditingMerchant(null);
        },
        onError: (err: any, context: any) => {
            if (context?.previousMerchants) {
                queryClient.setQueryData(['admin-merchants', activeTab], context.previousMerchants);
            }
            toast.error(err.response?.data?.message || 'Error al guardar cambios');
            queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
        }
    });

    const reactivateMutation = useMutation({
        mutationFn: (id: string) => merchantApi.reactivate(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['admin-merchants'] });
            const previousMerchants = queryClient.getQueryData(['admin-merchants', activeTab]);
            queryClient.setQueryData(['admin-merchants', activeTab], (old: Merchant[] | undefined) =>
                old ? old.map(m => m.id === id ? { ...m, status: 'active', isActive: true } : m) : []
            );
            setSelectedMerchant(null);
            return { previousMerchants };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });
            // No need to clear selectedMerchant here as it's done in onMutate
        },
        onSuccess: () => {
            toast.success('Comercio reactivado');
        },
        onError: (err: any, context: any) => {
            if (context?.previousMerchants) {
                queryClient.setQueryData(['admin-merchants', activeTab], context.previousMerchants);
            }
            toast.error(err.response?.data?.message || 'Error al reactivar')
        }
    });

    const [processingId, setProcessingId] = useState<string | null>(null);

    const filteredMerchants = merchants?.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await approveMutation.mutateAsync(id);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Razón del rechazo:');
        if (!reason) return;
        setProcessingId(id);
        try {
            await rejectMutation.mutateAsync({ id, reason });
        } finally {
            setProcessingId(null);
        }
    };

    const handleSuspend = async (id: string) => {
        const reason = window.prompt('Razón de la suspensión:');
        if (!reason) return;
        setProcessingId(id);
        try {
            await suspendMutation.mutateAsync({ id, reason });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReactivate = async (id: string) => {
        if (!window.confirm('¿Estás seguro de reactivar este comercio?')) return;
        setProcessingId(id);
        try {
            await reactivateMutation.mutateAsync(id);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <Store className="text-primary" size={24} />
                        Nexo de Comercios
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                        Verificación y ecosistema empresarial
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-merchants'] })}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => alert("Módulo de Onboarding en desarrollo")}
                        className="px-6 py-3 bg-primary text-background rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Briefcase size={16} /> Onboarding
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-primary text-background' : 'text-white/40 hover:text-white'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'pending' ? 'bg-primary text-background' : 'text-white/40 hover:text-white'}`}
                    >
                        Pendientes
                        {activeTab !== 'pending' && (merchants?.filter(m => m.status.toLowerCase() === 'pending_approval').length ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0f18]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'archived' ? 'bg-primary text-background' : 'text-white/40 hover:text-white'}`}
                    >
                        Archivados
                    </button>
                </div>

                <div className="relative flex-1 w-full text-white">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar comercio por nombre, ID o categoría..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-primary/50"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center text-white/20">
                        <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                        Escaneando ecosistema empresarial...
                    </div>
                ) : filteredMerchants?.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass rounded-[3rem] border-white/5">
                        <p className="text-white/20 font-black uppercase tracking-[0.2em]">No se encontraron comercios</p>
                    </div>
                ) : filteredMerchants?.map((merchant) => (
                    <motion.div
                        key={merchant.id}
                        layout
                        className="glass p-6 rounded-[2.5rem] border-white/5 space-y-4 hover:border-primary/20 transition-all group relative overflow-hidden"
                    >
                        {!merchant.isActive && (
                            <div className="absolute inset-0 bg-[#0a0f18]/60 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                                <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg">Comercio Desactivado</span>
                            </div>
                        )}
                        {merchant.status.toLowerCase() === 'suspended' && (
                            <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                                <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg border border-red-400">🚨 SUSPENDIDO</span>
                            </div>
                        )}

                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 relative">
                                    {merchant.logoUrl ? (
                                        <img src={merchant.logoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : <Store size={20} className="text-white/40" />}
                                    {merchant.status.toLowerCase() === 'active' && (
                                        <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0a0f18] text-white">
                                            <ShieldCheck size={10} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]">{merchant.name}</h4>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{merchant.category}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] text-white/60">
                                <MapPin size={12} className="text-white/30" />
                                <span className="truncate">{merchant.address || 'Ubicación no especificada'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                                    <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">Sostenible</span>
                                    <div className="flex items-center gap-2">
                                        <Leaf size={14} className={merchant.isSustainable ? 'text-green-500' : 'text-white/20'} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateGeneralMutation.mutate({ id: merchant.id, data: { isSustainable: !merchant.isSustainable } }) }}
                                            className={`w-8 h-4 rounded-full relative transition-colors ${merchant.isSustainable ? 'bg-green-500' : 'bg-white/10'}`}
                                        >
                                            <motion.div animate={{ x: merchant.isSustainable ? 18 : 2 }} className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-lg" />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1 z-20">
                                    <span className="text-[7px] text-white/20 font-black uppercase tracking-widest">Estado Local</span>
                                    <div className="flex items-center gap-2">
                                        <RefreshCw size={14} className={merchant.isActive ? 'text-primary' : 'text-white/20'} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateGeneralMutation.mutate({ id: merchant.id, data: { isActive: !merchant.isActive } }) }}
                                            className={`w-8 h-4 rounded-full relative transition-colors ${merchant.isActive ? 'bg-primary' : 'bg-white/10'}`}
                                        >
                                            <motion.div animate={{ x: merchant.isActive ? 18 : 2 }} className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex gap-2 relative z-20">
                            {merchant.status.toLowerCase() === 'pending_approval' ? (
                                <button
                                    onClick={() => setSelectedMerchant(merchant)}
                                    className="flex-1 py-3 bg-primary text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye size={12} /> Revisar
                                </button>
                            ) : (
                                <>
                                    {merchant.status.toLowerCase() === 'suspended' ? (
                                        <button
                                            onClick={() => handleReactivate(merchant.id)}
                                            disabled={processingId === merchant.id}
                                            className="flex-1 py-3 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 z-20 relative"
                                        >
                                            {processingId === merchant.id ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} /> Reactivar</>}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSuspend(merchant.id)}
                                            disabled={processingId === merchant.id}
                                            className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {processingId === merchant.id ? <Loader2 size={12} className="animate-spin" /> : <><AlertTriangle size={12} /> Suspender</>}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingMerchant(merchant)}
                                        className="flex-1 bg-white/5 text-white/40 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        Gestionar
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedMerchant && (
                    <VerificationModal
                        merchant={selectedMerchant}
                        onClose={() => setSelectedMerchant(null)}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        processingId={processingId}
                    />
                )}
                {editingMerchant && (
                    <MerchantEditModal
                        merchant={editingMerchant}
                        onClose={() => setEditingMerchant(null)}
                        onUpdate={(data) => updateGeneralMutation.mutate({ id: editingMerchant.id, data })}
                        isUpdating={updateGeneralMutation.isPending}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components for cleaner structure
const VerificationModal: React.FC<{ merchant: Merchant, onClose: () => void, onApprove: (id: string) => void, onReject: (id: string) => void, processingId: string | null }> = ({ merchant, onClose, onApprove, onReject, processingId }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0a0f18]/90 backdrop-blur-xl" />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass w-full max-w-2xl rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden">
            <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            {merchant.logoUrl ? <img src={merchant.logoUrl} className="w-full h-full object-cover rounded-2xl" /> : <Store className="text-primary" size={32} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">{merchant.name}</h3>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{merchant.category}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} className="text-white/20" /></button>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Datos Legales</h5>
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-[10px] text-white/20 uppercase font-black">Cédula Jurídica</span><span className="text-xs font-bold">{merchant.taxId || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-[10px] text-white/20 uppercase font-black">Actividad Económica</span><span className="text-xs font-bold">{merchant.economicActivityCode || '000000'}</span></div>
                            <div className="flex justify-between"><span className="text-[10px] text-white/20 uppercase font-black">Teléfono</span><span className="text-xs font-bold">{merchant.phone}</span></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Documentación</h5>
                        <div className="space-y-2">
                            {merchant.verificationDocuments?.length ? merchant.verificationDocuments.map((doc, idx) => (
                                <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <FileText size={16} className="text-blue-400" />
                                    <div className="flex flex-col"><span className="text-[10px] font-bold uppercase tracking-tight">{doc.type}</span><span className="text-[8px] text-white/20">{new Date(doc.uploadedAt).toLocaleDateString()}</span></div>
                                </a>
                            )) : <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-2xl opacity-20"><p className="text-[10px] font-bold">Sin documentos</p></div>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 pt-4">
                    <button onClick={() => onReject(merchant.id)} disabled={processingId === merchant.id} className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 font-bold"><X size={16} /> Rechazar</button>
                    <button onClick={() => onApprove(merchant.id)} disabled={processingId === merchant.id} className="flex-1 py-4 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 font-bold">{processingId === merchant.id ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Aprobar Comercio</>}</button>
                </div>
            </div>
        </motion.div>
    </div>
);

const MerchantEditModal: React.FC<{ merchant: Merchant, onClose: () => void, onUpdate: (data: any) => void, isUpdating: boolean }> = ({ merchant, onClose, onUpdate, isUpdating }) => {
    const [formData, setFormData] = useState({
        name: merchant.name,
        description: merchant.description,
        category: merchant.category,
        address: merchant.address,
        phone: merchant.phone,
        email: merchant.email || '',
        economicActivityCode: merchant.economicActivityCode || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0a0f18]/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass w-full max-w-xl rounded-[3rem] border-white/10 shadow-2xl relative overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic">Gestionar Comercio</h3>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20} className="text-white/20" /></button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Nombre Comercial</label>
                                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Categoría</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50 appearance-none">
                                    <option value="RESTAURANT">Restaurante</option>
                                    <option value="CAFE">Cafetería</option>
                                    <option value="GROCERY">Supermercado</option>
                                    <option value="PHARMACY">Farmacia</option>
                                    <option value="ELECTRONICS">Electrónica</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Descripción</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50 resize-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Teléfono</label>
                                <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Actividad Hacienda</label>
                                <input value={formData.economicActivityCode} onChange={e => setFormData({ ...formData, economicActivityCode: e.target.value })} placeholder="6 dígitos" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-2">Dirección Física</label>
                            <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-primary/50" />
                        </div>
                    </div>

                    <button disabled={isUpdating} type="submit" className="w-full py-4 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Cambios Tácticos'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
