import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, X } from 'lucide-react';
import { Event as EventData } from '../../types/event';
import { useAddToCart } from '../../hooks/useAddToCart';
import { MerchantConflictModal } from '../cart/MerchantConflictModal';

interface EventOverlayProps {
    event: EventData;
    center: [number, number];
    onClose: () => void;
}

export const EventOverlay: React.FC<EventOverlayProps> = ({
    event,
    center,
    onClose
}) => {
    const {
        handleAddToCart: onAddToCart,
        showConflictModal,
        setShowConflictModal,
        confirmConflict,
        currentMerchantName,
        newMerchantName
    } = useAddToCart();
    const handleBuyTicket = (event: EventData) => {
        const success = onAddToCart(event, 'event');
        if (success) {
            // Optional: visual feedback specific to overlay if needed
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] pointer-events-none flex flex-col items-center justify-end p-4 md:p-12 overflow-hidden"
        >
            <div className="absolute inset-0 z-0">
                {(event.banner || event.bannerUrl) && (
                    <motion.img
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.4 }}
                        src={event.banner || event.bannerUrl}
                        className="w-full h-full object-cover mix-blend-screen"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
            </div>

            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 15 }}
                className="relative z-10 text-center space-y-4"
            >
                <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary" />
                    <span className="text-primary font-black uppercase tracking-[0.5em] text-xs">Evento Destacado</span>
                    <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary" />
                </div>

                <h2 className="text-3xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                    {event.title}
                </h2>

                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 text-white/60">
                        <MapPin size={16} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">{event.venue || 'Puerto Viejo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                        <Zap size={16} className="text-orange-500" />
                        <span className="text-xs font-black uppercase tracking-widest">{event.time || '20:00'}</span>
                    </div>
                </div>

                {/* SIGNAL INTERCEPT HUD - Stabilized values */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -right-64 top-1/2 -translate-y-1/2 w-48 text-left border-l border-primary/30 pl-4 py-2 space-y-2 hidden lg:block bg-black/40 backdrop-blur-sm rounded-r-xl"
                >
                    <div className="text-[8px] font-black text-primary animate-pulse">INTERCEPTING SIGNAL...</div>
                    <div className="space-y-1 font-mono text-[9px] text-white/40 uppercase">
                        <p className="flex justify-between"><span>Rel SNR</span> <span className="text-primary">94.2dB</span></p>
                        <p className="flex justify-between"><span>Humidity</span> <span>88%</span></p>
                        <p className="flex justify-between"><span>Sector</span> <span>TZ-0{(center[0] * 10).toFixed(0)}</span></p>
                        <div className="w-full h-px bg-white/10 my-2" />
                        <p className="animate-pulse">Data Link: ESTABLISHED</p>
                        <div className="h-12 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10" />
                            <div className="animate-marquee-vertical py-2">
                                {["Ping Response OK", "Encrypted Hash Valid", "Telemetry Syncing...", "Node Validated"].map(t => (
                                    <p key={t} className="text-[7px] mb-1">{t}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <p className="max-w-2xl mx-auto text-xl text-white/80 leading-relaxed drop-shadow-lg line-clamp-3">
                    {event.description}
                </p>

                <div className="flex items-center justify-center gap-4 mt-4">
                    {event.isEcoFriendly && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Eco Friendly
                        </span>
                    )}
                    {event.attendees > 0 && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {event.attendees.toLocaleString()}{event.maxCapacity ? ` / ${event.maxCapacity.toLocaleString()}` : ''} Asistentes
                        </span>
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex flex-col items-center gap-6 pointer-events-auto"
            >
                <div className="flex gap-3">
                    {event.tags?.map((tag: string) => (
                        <span
                            key={tag}
                            className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:border-primary/40 hover:text-primary transition-all cursor-crosshair"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>

                {event.price && event.price > 0 && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBuyTicket(event)}
                        className={`px-6 py-3 md:px-12 md:py-5 text-background rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] md:text-xs shadow-[0_0_50px_rgba(0,255,102,0.3)] hover:shadow-[0_0_70px_rgba(0,255,102,0.5)] transition-all flex items-center gap-4 ${event.adTier === 'GOLD' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-primary shadow-primary/30'}`}
                    >
                        <Zap size={18} fill="currentColor" />
                        COMPRAR ENTRADA — ₡{event.price.toLocaleString()}
                    </motion.button>
                )}
            </motion.div>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 md:top-12 md:right-12 md:w-16 md:h-16 rounded-full glass border-primary/20 flex items-center justify-center text-primary pointer-events-auto hover:bg-primary/10 transition-all active:scale-90"
            >
                <X size={24} className="md:w-[32px] md:h-[32px]" />
            </button>

            <MerchantConflictModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                onConfirm={confirmConflict}
                currentMerchantName={currentMerchantName}
                newMerchantName={newMerchantName}
            />
        </motion.div>
    );
};
