import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../api/socket';
import { LiveMap } from './LiveMap';
import { X, Phone, MessageSquare, Star, Clock, Navigation } from 'lucide-react';
import { OrderTimeline } from './OrderTimeline';
import { OrderChat } from './OrderChat';
import { toast } from 'sonner';
import { devLog } from '../utils/devLog';

interface MissionProp {
    mission: any; // Using any for now, matches api/logistics contract
    onClose: () => void;
}

export const MissionTracker = ({ mission: initialMission, onClose }: MissionProp) => {
    // Safety guard
    if (!initialMission) return null;

    const [mission, setMission] = useState(initialMission);
    const [, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [eta, setEta] = useState<number | null>(null);
    const [isArriving, setIsArriving] = useState(false);

    useEffect(() => {
        // Connect to tracking room
        socketService.joinMissionTracking(initialMission.id);

        // Listen for mission status updates (e.g. PICKED_UP, DELIVERED)
        socketService.onMissionUpdated((updatedMission) => {
            setMission(updatedMission);
        });

        // Listen for arrival
        // Listen for arrival
        devLog('👀 MissionTracker: Setting up listeners for', initialMission.id);

        socketService.onDriverArriving(() => {
            devLog('🛵 Driver Arriving Event Received!');
            setIsArriving(true);
            toast("¡Tu repartidor está llegando!", {
                icon: "🛵",
                style: { background: "#10B981", color: "#fff" }
            });
        });

        // Listen for driver location updates
        socketService.onDriverLocationUpdated((data) => {
            if (data.missionId === initialMission.id) {
                setDriverLocation({ lat: data.lat, lng: data.lng });

                // Simple ETA calc (1 min per 500m approx)
                const originLat = Number(mission.originLat || mission.merchant?.latitude || 0);
                const originLng = Number(mission.originLng || mission.merchant?.longitude || 0);

                if (originLat && originLng) {
                    const dist = Math.sqrt(Math.pow(data.lat - originLat, 2) + Math.pow(data.lng - originLng, 2));
                    setEta(Math.max(2, Math.round(dist * 1000))); // Rough estimate
                }
            }
        });

        return () => {
            // Cleanup listeners if needed, though socketService is global
        };
    }, [initialMission.id]);

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '150%' }}
            className="fixed bottom-0 left-0 right-0 z-[9995] p-0 md:p-6 pointer-events-none flex justify-center h-[90vh] md:h-auto"
        >
            <div className="w-full max-w-5xl bg-[#0a0f18] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto flex flex-col relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Map Section */}
                    <div className="w-full md:w-[50%] h-[40%] md:h-auto relative min-h-[300px]">
                        <LiveMap
                            missions={[mission]}
                        />
                        {/* ETA Overlay on Map */}
                        {eta && (
                            <div className="absolute bottom-6 left-6 z-[1000] bg-white text-black px-4 py-2 rounded-xl font-black text-sm shadow-xl flex items-center gap-2">
                                <Clock size={16} />
                                <span>{eta} min</span>
                                {/* Debug: {driverLocation?.lat} */}
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 p-6 md:p-10 flex flex-col bg-[#0a0f18] relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex-1 relative z-10 overflow-y-auto">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_var(--primary)] ${mission.status === 'DELIVERED' ? 'bg-primary' : 'bg-primary animate-pulse'}`}></div>
                                <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                                    {mission?.status?.replace('_', ' ') || 'UNKNOWN'}
                                </span>
                            </div>

                            <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter leading-none">
                                {mission.status === 'DELIVERED' ? '¡Disfruta tu pedido!' :
                                    isArriving ? '¡El repartidor está aquí!' : 'Tu pedido está en camino'}
                            </h3>
                            <p className="text-white/40 text-sm font-medium mb-8">
                                {mission.status === 'PREPARING' && 'El restaurante está preparando tus alimentos.'}
                                {mission.status === 'READY' && 'Tu pedido está listo y esperando repartidor.'}
                                {mission.status === 'ON_WAY' && (isArriving ? 'Prepara tu identificación para recibir.' : 'El repartidor se dirige a tu ubicación.')}
                                {mission.status === 'DELIVERED' && 'Gracias por usar Caribe Digital.'}
                            </p>

                            {/* Timeline Integration */}
                            <OrderTimeline status={mission.status} />

                            <div className="mt-8 space-y-4">
                                {/* Driver / Chat Card */}
                                {mission.courierId ? (
                                    <div className="bg-white/5 rounded-[2rem] p-1 border border-white/5">
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl relative">
                                                🛵
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-4 border-[#0a0f18] flex items-center justify-center">
                                                    <Navigation size={10} className="text-black" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-bold text-base">Enjambre Driver</p>
                                                <div className="flex items-center gap-1 text-accent text-xs mt-0.5 font-black uppercase">
                                                    <Star size={10} fill="currentColor" /> 5.0 • Honda Navi
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${isChatOpen ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white/60 border-white/5 hover:text-white'}`}
                                                >
                                                    <MessageSquare size={20} />
                                                </button>
                                                <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 hover:text-green-400 hover:bg-green-400/10 transition-all border border-white/5">
                                                    <Phone size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Embedded Chat */}
                                        <AnimatePresence>
                                            {isChatOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: '300px', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t border-white/5"
                                                >
                                                    <OrderChat
                                                        orderId={mission.orderId || mission.id}
                                                        partnerName="Repartidor"
                                                        partnerRole="delivery"
                                                        onClose={() => setIsChatOpen(false)}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 rounded-[2rem] p-6 flex items-center justify-center gap-4 border border-dashed border-white/10">
                                        <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
                                        <span className="text-white/40 text-xs font-black uppercase tracking-widest">Asignando repartidor cercano...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
