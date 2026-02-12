import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, X } from 'lucide-react';
import { Event as EventData } from '../../types/event';
import { useAddToCart } from '../../hooks/useAddToCart';
import { MerchantConflictModal } from '../cart/MerchantConflictModal';
import { useLanguageStore } from '../../store/languageStore';

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
    const { t } = useLanguageStore();
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
            className="fixed inset-0 z-[2005] pointer-events-none flex flex-col items-center justify-end p-0 md:p-12 overflow-hidden"
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

            <div className="bottom-sheet md:relative md:bottom-auto md:p-0 md:bg-transparent md:backdrop-blur-none md:border-none md:shadow-none pointer-events-auto h-[80vh] md:h-auto overflow-y-auto scrollbar-hide">
                <div className="bottom-sheet-handle md:hidden" />

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-6 md:space-y-4 pb-8"
                >
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-primary" />
                        <span className="text-primary font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-xs">{t('featured_event')}</span>
                        <div className="h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-primary" />
                    </div>

                    <h2 className="text-2xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] leading-none text-center">
                        {event.title}
                    </h2>

                    <div className="flex items-center justify-center gap-4 md:gap-6">
                        <div className="flex items-center gap-2 text-white/60">
                            <MapPin size={14} className="text-primary" />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{event.venue || 'Puerto Viejo'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                            <Zap size={14} className="text-orange-500" />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{event.time || '20:00'}</span>
                        </div>
                    </div>

                    <p className="max-w-2xl mx-auto text-sm md:text-xl text-white/80 leading-relaxed text-center">
                        {event.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-4">
                        {event.isEcoFriendly && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                {t('eco_friendly')}
                            </span>
                        )}
                        {event.attendees > 0 && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[9px] font-bold uppercase tracking-widest">
                                {event.attendees.toLocaleString()}{event.maxCapacity ? ` / ${event.maxCapacity.toLocaleString()}` : ''} {t('attendees')}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {event.tags?.map((tag: string) => (
                            <span
                                key={tag}
                                className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {event.price && event.price > 0 && (
                        <div className="pt-4 flex justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleBuyTicket(event)}
                                className={`w-full md:w-auto px-6 py-4 md:px-12 md:py-5 text-background rounded-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs shadow-[0_0_50px_rgba(0,255,102,0.3)] transition-all flex items-center justify-center gap-4 ${event.adTier === 'GOLD' ? 'bg-amber-500 shadow-amber-500/30' : 'bg-primary shadow-primary/30'}`}
                            >
                                <Zap size={16} fill="currentColor" />
                                {t('buy_ticket_btn')} — ₡{event.price.toLocaleString()}
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>

            <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 md:top-12 md:right-12 md:w-16 md:h-16 rounded-full glass border-primary/20 flex items-center justify-center text-primary pointer-events-auto hover:bg-primary/10 transition-all active:scale-90 z-[2010]"
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
