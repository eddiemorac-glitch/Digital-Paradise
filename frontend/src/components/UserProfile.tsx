import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Shield, Clock, Settings, LogOut, Ticket, ArrowLeft, Loader2, Map as MapIcon, MessageSquare, Edit2, Store, Bike, Hash, CheckCircle2, Award } from 'lucide-react';
import { UserVitals } from './UserVitals';
import { AvatarSelector } from './AvatarSelector';
import { ProfileEditModal } from './ProfileEditModal';
import { getAvatarById, AVATARS } from './AvatarIcons';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { userApi } from '../api/users';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
    onBack: () => void;
    onViewOrders: () => void;
    onViewRewards: () => void;
    onViewInvoices: () => void;
}

export const UserProfile = ({ onBack, onViewOrders, onViewRewards, onViewInvoices }: UserProfileProps) => {
    const { logout, updateUser, user } = useAuthStore();
    const { language } = useLanguageStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: profile, isLoading, isError } = useQuery({
        queryKey: ['user-profile'],
        queryFn: userApi.getProfile,
    });

    // Avatar State
    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Use React Query Mutation for updates
    const { mutate: updateProfile } = useMutation({
        mutationFn: userApi.updateProfile,
        onSuccess: (data) => {
            // Update local cache or refetch
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            // Update global auth store for immediate cross-component sync
            updateUser(data as any);
        }
    });

    // Derive avatar from profile data (backend source of truth) or fallback to store
    const currentAvatarId = profile?.avatarId || user?.avatarId || 'jaguar';

    const handleAvatarSelect = (id: string) => {

        // Persist to backend
        updateProfile({ avatarId: id });

        // Update global auth store immediately
        updateUser({ avatarId: id });

        setIsAvatarSelectorOpen(false);
    };

    const CurrentAvatar = getAvatarById(currentAvatarId)?.component || AVATARS[0].component;


    if (isLoading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    if (isError || !profile) return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
            <Shield className="text-red-500 mb-2" size={48} />
            <h2 className="text-2xl font-black uppercase text-white">Error de Enlace</h2>
            <p className="text-white/40 max-w-md">No se pudo establecer conexión con el perfil de usuario. Verifique su sesión.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
            >
                Reintentar Conexión
            </button>
        </div>
    );

    const points = profile.points || 0;
    const nextTierPoints = points < 1000 ? 1000 : points < 5000 ? 5000 : 10000;
    const progress = (points / nextTierPoints) * 100;
    const remaining = nextTierPoints - points;



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto space-y-6 pb-24 px-4"
        >
            <AvatarSelector
                isOpen={isAvatarSelectorOpen}
                onClose={() => setIsAvatarSelectorOpen(false)}
                currentAvatarId={currentAvatarId}
                onSelect={handleAvatarSelect}
            />

            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentName={profile.fullName}
                currentPhone={profile.phoneNumber}
                currentVehicleType={profile.vehicleType}
                currentVehiclePlate={profile.vehiclePlate}
                isCourier={profile.role?.toLowerCase() === 'delivery'}
            />

            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    <ArrowLeft size={14} /> {language === 'es' ? 'ABORTAR' : 'ABORT'}
                </button>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <Settings size={14} /> {language === 'es' ? 'EDITAR' : 'EDIT'}
                    </button>
                </div>
            </div>

            {/* Tactical Vitals HUD */}
            <UserVitals
                points={points}
                sustainabilityScore={85}
                language={language}
                role={profile.role}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Profile Hero - Main Uplink */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass p-8 md:p-12 rounded-[3rem] border-white/10 relative overflow-hidden group">
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />

                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="relative group/avatar cursor-pointer" onClick={() => setIsAvatarSelectorOpen(true)}>
                                <div className="w-32 h-32 rounded-[2.5rem] bg-black/40 border-2 border-primary/40 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,255,102,0.2)] transition-all group-hover/avatar:border-primary group-hover/avatar:scale-105">
                                    <CurrentAvatar className="w-20 h-20" />
                                </div>

                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center group-hover/avatar:border-primary transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-black/60 rounded-[2.5rem]">
                                    <Edit2 size={24} className="text-white" />
                                </div>
                            </div>

                            <div className="space-y-4 flex-1 text-center md:text-left">
                                <div className="space-y-1">

                                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase whitespace-nowrap">
                                        {profile.fullName.split(' ')[0]} <span className="text-white/20">{profile.fullName.split(' ')[1]}</span>
                                    </h1>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5"><Mail size={12} /> {profile.email}</span>
                                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/10"><Shield size={12} className="text-primary" /> {profile.role}</span>
                                    </div>
                                </div>

                                {profile.role?.toLowerCase() === 'delivery' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="glass p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden group">
                                            <div className="flex items-center gap-6 mb-6">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                    <Bike size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight">Vehículo</h3>
                                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Configuración de Enjambre</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tipo</span>
                                                    <span className="text-sm font-bold text-primary italic uppercase tracking-tighter">{profile.vehicleType || 'No Definido'}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Placa</span>
                                                    <span className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                                        <Hash size={12} className="text-primary" /> {profile.vehiclePlate || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass p-8 rounded-[2.5rem] border-white/10 relative overflow-hidden group">
                                            <div className="flex items-center gap-6 mb-6">
                                                <div className={`w-14 h-14 rounded-2xl ${profile.courierStatus === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'} flex items-center justify-center border border-white/5`}>
                                                    <Shield size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight">Estatus</h3>
                                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Clearance de Operación</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Verificación</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${profile.courierStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                        {profile.courierStatus || 'PENDING'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Seguridad</span>
                                                    <span className="text-sm font-bold text-white flex items-center gap-2">
                                                        <CheckCircle2 size={12} className="text-primary" /> Lvl 1 Access
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mission Control / Progress */}
                    <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{language === 'es' ? 'PRÓXIMO OBJETIVO' : 'NEXT OBJECTIVE'}</h3>
                                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{language === 'es' ? 'Recompensa en camino' : 'Reward Incoming'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-primary">{remaining.toLocaleString()}</p>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{language === 'es' ? 'PUNTOS RESTANTES' : 'POINTS LEFT'}</p>
                            </div>
                        </div>

                        <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-8 border border-white/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-primary/50 to-primary relative"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-shimmer" />
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={onViewRewards}
                                className="bg-primary hover:bg-primary/90 text-background font-black py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                <Award size={16} /> {language === 'es' ? 'CENTRO DE CANJES' : 'REWARDS HUB'}
                            </button>
                            <button
                                onClick={() => navigate('/map')}
                                className="bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10 text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                            >
                                <MapIcon size={16} /> {language === 'es' ? 'SOLICITAR REFUERZOS' : 'REQ REINFORCEMENTS'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Tactical Intelligence */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Quick Uplinks */}
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={onViewOrders}
                            className="glass p-6 rounded-[2rem] border-white/5 hover:border-primary/30 transition-all group flex items-center gap-6"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Clock size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-black uppercase tracking-tight">{language === 'es' ? 'HISTORIAL' : 'HISTORY'}</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{language === 'es' ? 'REGISTRO DE OPERACIONES' : 'OPS LOG'}</p>
                            </div>
                        </button>

                        <button
                            onClick={onViewInvoices}
                            className="glass p-6 rounded-[2rem] border-white/5 hover:border-accent/30 transition-all group flex items-center gap-6"
                        >
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                <Ticket size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-black uppercase tracking-tight">{language === 'es' ? 'FACTURACIÓN' : 'BILLING'}</h3>
                                <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest">{language === 'es' ? 'FACTURACIÓN ELECTRÓNICA' : 'E-INVOICING'}</p>
                            </div>
                        </button>

                        {profile?.role?.toLowerCase() === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="glass p-6 rounded-[2rem] border-primary/20 hover:border-primary/50 bg-primary/5 transition-all group flex items-center gap-6"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                                    <Shield size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-primary">Control Center</h3>
                                    <p className="text-[8px] text-primary/40 font-bold uppercase tracking-widest">Panel de Administración</p>
                                </div>
                            </button>
                        )}

                        {profile?.role?.toLowerCase() === 'merchant' && (
                            <button
                                onClick={() => navigate('/merchant-dashboard')}
                                className="glass p-6 rounded-[2rem] border-primary/20 hover:border-primary/50 bg-primary/5 transition-all group flex items-center gap-6"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                                    <Store size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-primary">{language === 'es' ? 'Mi Negocio' : 'My Business'}</h3>
                                    <p className="text-[8px] text-primary/40 font-bold uppercase tracking-widest">Panel de Operaciones</p>
                                </div>
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/assistant')}
                            className="glass p-6 rounded-[2rem] border-white/5 hover:border-blue-400/30 transition-all group flex items-center gap-6"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                <MessageSquare size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-black uppercase tracking-tight">{language === 'es' ? 'ASISTENTE' : 'ASSISTANT'}</h3>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{language === 'es' ? 'UPLINK DIRECTO CON COCO' : 'DIRECT COCO UPLINK'}</p>
                            </div>
                        </button>
                    </div>

                    {/* Logout Signal */}
                    <div className="p-8 glass rounded-[2.5rem] border-red-500/10 flex flex-col items-center gap-4">
                        <div className="w-16 h-1 bg-red-500/20 rounded-full" />
                        <button
                            onClick={() => { logout(); onBack(); }}
                            className="w-full flex items-center justify-center gap-3 text-red-500/60 hover:text-red-500 transition-colors font-black uppercase tracking-[0.3em] text-[10px] py-4 rounded-2xl hover:bg-red-500/5 border border-transparent hover:border-red-500/20"
                        >
                            <LogOut size={16} /> {language === 'es' ? 'DESCONECTAR' : 'TERMINATE LINK'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
