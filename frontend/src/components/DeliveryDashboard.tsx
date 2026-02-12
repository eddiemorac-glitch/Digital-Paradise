import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '../api/delivery';
import { logisticsApi } from '../api/logistics';
import { socketService } from '../api/socket';
import { courierApi } from '../api/courier';
import { eventsApi } from '../api/events';
import { merchantApi } from '../api/merchants';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, LayoutDashboard, Zap, CheckCircle2
} from 'lucide-react';
import { OrderChat } from './OrderChat';
import { LiveMap } from './LiveMap';
import { EventHub } from './EventHub';
import { DashboardSkeleton } from './DashboardSkeleton';
import { playTacticalSound } from '../utils/tacticalSound';
import { toast } from 'sonner';
import { useLanguageStore } from '../store/languageStore';

// Modular components
import { EstadoRepartidor } from './logistics/EstadoRepartidor';
import { BalanceHoy } from './logistics/BalanceHoy';
import { MisPedidos } from './logistics/MisPedidos';
import { BolsaDePedidos } from './logistics/BolsaDePedidos';

type LogisticsVertical = 'FOOD' | 'PARCEL' | 'RIDE';

export const DeliveryDashboard = () => {
    const { t, language } = useLanguageStore();
    const queryClient = useQueryClient();
    const [selectedVertical, setSelectedVertical] = useState<LogisticsVertical>('FOOD');
    const [isOnline, setIsOnline] = useState(false);
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [podModalMission, setPodModalMission] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'HUD' | 'MAP' | 'EVENT_HUB'>('HUD');
    const [focusedEvent, setFocusedEvent] = useState<any | null>(null);
    const [deliveryOtp, setDeliveryOtp] = useState('');

    // 1. Available missions/orders
    const { data: availableOrders } = useQuery({
        queryKey: ['available-deliveries', selectedVertical],
        queryFn: () => selectedVertical === 'FOOD'
            ? deliveryApi.getAvailable()
            : logisticsApi.getAvailable(selectedVertical === 'PARCEL' ? 'PRIVATE_PARCEL' : 'RIDE_HAILING'),
        enabled: isOnline,
        refetchInterval: 10000 // Tactical refresh every 10s
    });

    // 2. Active missions
    const { data: myDeliveries } = useQuery({
        queryKey: ['my-deliveries'],
        queryFn: async () => {
            const food = await deliveryApi.getMyDeliveries();
            const logistics = await logisticsApi.getMyMissions();
            return [...food, ...logistics];
        },
    });

    // 3. Stats
    const { data: stats } = useQuery({
        queryKey: ['courier-stats'],
        queryFn: courierApi.getStats,
        refetchInterval: 30000
    });

    // 4. Events (Special Game Events)
    const { data: events } = useQuery({
        queryKey: ['live-events'],
        queryFn: eventsApi.getAll,
        refetchInterval: 60000 // Refresh every minute
    });

    // 5. Merchants (Locales)
    const { data: merchants } = useQuery({
        queryKey: ['all-merchants'],
        queryFn: () => merchantApi.getAll(),
        refetchInterval: 120000 // Refresh every 2 mins
    });

    const activeMissions = useMemo(() =>
        myDeliveries?.filter((o: any) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'ON_WAY'].includes(o.status)) || [],
        [myDeliveries]);

    const dailyEarnings = stats?.today?.earnings || 0;
    const completedCount = stats?.today?.delivered || 0;
    const weeklyHistory = stats?.weekly || [];

    const isLoading = false; // We use conditional rendering for parts that need data

    useEffect(() => {
        if (!isOnline) return;
        socketService.joinLogisticsPool();

        const handleNewMission = () => {
            queryClient.invalidateQueries({ queryKey: ['available-deliveries'] });
            playTacticalSound('ALERT');
            toast.info(t('new_mission'));
        };

        const handleMissionUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['available-deliveries'] });
        };

        socketService.onMissionAvailable(handleNewMission);
        socketService.onMissionUpdated(handleMissionUpdate);

        // Phase 38: Real Geolocation Tracking
        let watchId: number;
        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    // Find if there's an active mission to update
                    const activeMission = myDeliveries?.find((m: any) => m.status === 'ON_WAY');
                    if (activeMission) {
                        socketService.updateDriverLocation(activeMission.id, latitude, longitude);
                    }
                },
                (err) => console.error('📍 Geolocation tracking failed:', err),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }

        return () => {
            const socket = socketService.getSocket();
            if (socket) {
                socket.off('mission_available', handleNewMission);
                socket.off('mission_updated', handleMissionUpdate);
            }
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isOnline, myDeliveries]);

    // Haptic effect on new orders
    useEffect(() => {
        if (isOnline && availableOrders?.length > 0) {
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    }, [availableOrders?.length, isOnline]);

    const claimMutation = useMutation({
        mutationFn: (id: string) => selectedVertical === 'FOOD' ? deliveryApi.claimOrder(id) : logisticsApi.claimMission(id),
        onSuccess: () => {
            playTacticalSound('CLAIM');
            if ('vibrate' in navigator) navigator.vibrate(200);
            queryClient.invalidateQueries({ queryKey: ['available-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, isFood, metadata }: { id: string, status: string, isFood: boolean, metadata?: any }) =>
            isFood ? deliveryApi.updateStatus(id, status, metadata) : logisticsApi.updateStatus(id, status, metadata),
        onSuccess: () => {
            playTacticalSound('STATUS');
            queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
        },
    });

    const verifyDeliveryMutation = useMutation({
        mutationFn: ({ id, otp, metadata }: { id: string, otp: string, metadata?: any }) => logisticsApi.verifyDelivery(id, otp, metadata),
        onSuccess: () => {
            playTacticalSound('CLAIM');
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 500]);
            queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['courier-stats'] });
            setPodModalMission(null);
            setDeliveryOtp('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Código OTP inválido');
        }
    });

    const handleLaunchMaps = (lat: number, lng: number) => {
        const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        window.open(url, '_blank');
    };

    const handleConfirmDelivery = (mission: any) => {
        setPodModalMission(mission);
    };

    const finalizeDelivery = () => {
        if (!podModalMission) return;

        const metadata = {
            deliveredAt: new Date().toISOString(),
            location: 'Geolocalización verificada via Hyper-Tracking'
        };

        // If it's a mission that requires OTP (most logistics missions)
        if (podModalMission.metadata?.deliveryOtp) {
            if (!deliveryOtp || deliveryOtp.length < 4) {
                toast.error('El código de entrega es requerido');
                return;
            }
            verifyDeliveryMutation.mutate({ id: podModalMission.id, otp: deliveryOtp, metadata });
            return;
        }

        updateStatusMutation.mutate({
            id: podModalMission.id,
            status: 'DELIVERED',
            isFood: !!podModalMission.merchantId,
            metadata
        });
        setPodModalMission(null);
    };

    if (isLoading) return <DashboardSkeleton />;

    const mergedEvents = useMemo(() => [
        ...(events || [])
    ], [events]);

    return (
        <div className="min-h-screen bg-background text-white p-4 md:p-8 space-y-8 relative overflow-x-hidden">
            {/* Background Premium Glow */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
            </div>

            {/* EVENT DISCOVERY HUB OVERLAY */}
            <AnimatePresence>
                {viewMode === 'EVENT_HUB' && (
                    <EventHub
                        onClose={() => setViewMode('HUD')}
                        onSelectEvent={(event) => {
                            setFocusedEvent(event);
                            setViewMode('MAP');
                            playTacticalSound('CLICK');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* FLOATING TOGGLE: HUD vs MAP */}
            <div className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-[110] flex flex-col items-end gap-3 safe-area-bottom">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        setViewMode('EVENT_HUB');
                        playTacticalSound('CLICK');
                    }}
                    className="bg-orange-600 text-white p-6 rounded-full shadow-[0_15px_40px_rgba(255,100,0,0.4)] transition-all flex items-center gap-3 font-black uppercase tracking-tighter touch-target border border-white/20"
                >
                    <Zap size={24} />
                    <span className="hidden xs:inline">{t('weekly_events')}</span>
                    <span className="xs:hidden">{t('events')}</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.9, rotate: -5 }}
                    onClick={() => {
                        setViewMode(viewMode === 'HUD' ? 'MAP' : 'HUD');
                        playTacticalSound('CLICK');
                    }}
                    className="bg-primary text-background p-6 rounded-full shadow-[0_15px_40px_rgba(0,255,102,0.4)] transition-all flex items-center gap-3 font-black uppercase tracking-tighter touch-target border border-white/20"
                >
                    {viewMode === 'HUD' ? <Globe size={24} /> : <LayoutDashboard size={24} />}
                    <span className="hidden xs:inline">{viewMode === 'HUD' ? t('tactical_map') : t('hud_panel')}</span>
                    <span className="xs:hidden">{viewMode === 'HUD' ? t('map') : 'HUD'}</span>
                </motion.button>
            </div>

            {viewMode === 'MAP' ? (
                <div className="fixed inset-0 z-[100] bg-background">
                    <LiveMap
                        missions={activeMissions}
                        events={mergedEvents}
                        merchants={merchants}
                        focusedEvent={focusedEvent}
                        onUpdateStatus={(id, status, isFood) => updateStatusMutation.mutate({ id, status, isFood })}
                        onConfirmDelivery={handleConfirmDelivery}
                        onChatOpen={setActiveChat}
                    />
                    <div className="absolute top-8 left-8 z-[1001] glass p-4 rounded-2xl border-primary/20">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">{t('tactical_mode')}</p>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">{activeMissions.length} {t('active_missions')}</h2>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-10 pb-24">
                    {/* 1. ESTADO DEL REPARTIDOR */}
                    <EstadoRepartidor
                        isOnline={isOnline}
                        onToggleOnline={setIsOnline}
                        activeWorkType={selectedVertical}
                        onWorkTypeChange={setSelectedVertical}
                        isSocketConnected={socketService.isConnected}
                        isGpsActive={'geolocation' in navigator}
                    />

                    {/* 2. MI BALANCE */}
                    <BalanceHoy
                        dailyEarnings={dailyEarnings}
                        completedUnits={completedCount}
                        rating={stats?.profile?.rating || 5.0}
                        weeklyHistory={weeklyHistory}
                        language={language}
                    />

                    {/* 3. MIS PEDIDOS */}
                    <MisPedidos
                        activeMissions={activeMissions}
                        onOpenChat={setActiveChat}
                        onLaunchMaps={handleLaunchMaps}
                        onUpdateStatus={(id, status, isFood) => updateStatusMutation.mutate({ id, status, isFood })}
                        onConfirmDelivery={handleConfirmDelivery}
                        language={language}
                    />

                    {/* 4. BOLSA DE PEDIDOS */}
                    {isOnline && (
                        <BolsaDePedidos
                            availableOrders={availableOrders || []}
                            onClaimMission={(id) => claimMutation.mutate(id)}
                            isClaiming={claimMutation.isPending}
                            language={language}
                        />
                    )}
                </div>
            )}

            {/* MODALS & OVERLAYS */}
            <AnimatePresence>
                {podModalMission && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="relative z-10 w-full max-w-sm glass p-8 rounded-[3rem] border-primary/20 space-y-8"
                        >
                            <div className="text-center">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} className="text-primary" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">{t('verify_delivery')}</h3>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-4">{t('otp_instruction')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-2 text-primary/60">
                                    <Zap size={24} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('secure_delivery_active')}</span>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center">{t('otp_label')}</p>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        value={deliveryOtp}
                                        onChange={(e) => setDeliveryOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="0000"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-16 text-center text-3xl font-black tracking-[0.5em] text-primary focus:border-primary/50 focus:bg-primary/5 outline-none transition-all placeholder:text-white/5"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setPodModalMission(null)} className="flex-1 py-4 text-white/40 font-black uppercase text-[10px]">{t('cancel')}</button>
                                <button onClick={finalizeDelivery} className="flex-1 bg-primary text-background py-4 rounded-[1.5rem] font-black uppercase text-[10px] shadow-lg shadow-primary/20">{t('finalize_mission')}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeChat && (
                    <div className="fixed inset-0 z-[160] flex flex-col md:items-center md:justify-center">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setActiveChat(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm hidden md:block"
                        />
                        <div className="relative z-10 w-full max-w-2xl h-full md:h-[80vh] bg-background md:rounded-[3rem] md:border md:border-white/10 overflow-hidden flex flex-col shadow-2xl">
                            <OrderChat
                                orderId={activeChat.id}
                                partnerName={activeChat.user?.fullName || t('client')}
                                partnerRole="client"
                                onClose={() => setActiveChat(null)}
                            />
                            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
                                {[t('chat_arrived'), t('chat_on_way'), t('chat_traffic'), t('chat_where')].map(txt => (
                                    <button
                                        key={txt}
                                        className="px-4 py-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border border-white/5 transition-all text-white/40 hover:border-primary/20 active:scale-90"
                                    >
                                        {txt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
