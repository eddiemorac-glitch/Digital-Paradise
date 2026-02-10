import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Zap, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Event } from '../types/event';
import { EVENT_TYPE_CONFIG, getEventTypeFromCategory } from '../types/event-type-config';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import { EventStore } from './events/EventStore';
import { useAddToCart } from '../hooks/useAddToCart';
import { MerchantConflictModal } from './cart/MerchantConflictModal';
import { devLog, devError } from '../utils/devLog';

interface EventHubProps {
    onClose: () => void;
    onSelectEvent?: (event: Event) => void;
}

export const EventHub: React.FC<EventHubProps> = ({ onClose }) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const {
        handleAddToCart: onAddToCart,
        showConflictModal,
        setShowConflictModal,
        confirmConflict,
        currentMerchantName,
        newMerchantName
    } = useAddToCart();
    const { data: events = [], isLoading, error } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            devLog('🔮 EventHub: Fetching events...');
            try {
                const data = await eventsApi.getAll();
                devLog('✅ EventHub: Fetched events:', data);
                return data;
            } catch (err) {
                devError('❌ EventHub: Fetch failed:', err);
                throw err;
            }
        },
        retry: 1
    });

    devLog('🎨 EventHub Render State:', { isLoading, error, eventsCount: events?.length });

    // Map backend events to UI structure if needed, or sort directly
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const tierWeight: Record<string, number> = { GOLD: 3, SILVER: 2, BRONZE: 1 };
            const weightDiff = (tierWeight[b.adTier || ''] || 0) - (tierWeight[a.adTier || ''] || 0);
            if (weightDiff !== 0) return weightDiff;
            return 0; // Secondary sort by date could be added here
        });
    }, [events]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-3xl overflow-hidden flex flex-col"
        >
            {/* Background cinematic gradient - Fixed */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-orange-500/10 pointer-events-none" />

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
                <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 min-h-full flex flex-col">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 w-fit"
                            >
                                <Calendar size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Agenda Semanal</span>
                            </motion.div>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none"
                            >
                                {view === 'create' ? (
                                    <span>Publicar <span className="text-primary italic">Entradas</span></span>
                                ) : (
                                    <span>Store de <span className="text-primary italic">Entradas</span></span>
                                )}
                            </motion.h2>
                        </div>

                        <div className="flex items-center gap-4">
                            {view === 'list' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setView('create')}
                                    className="px-6 py-4 glass rounded-[2rem] flex items-center gap-3 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                                >
                                    <Plus size={20} className="text-primary" />
                                    <span className="hidden md:inline">Publicar Evento</span>
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (view === 'create') setView('list');
                                    else onClose();
                                }}
                                className="w-16 h-16 glass rounded-[2rem] flex items-center justify-center text-white/40 hover:text-white transition-all shadow-xl"
                            >
                                {view === 'create' ? <ArrowLeft size={24} /> : <X size={24} />}
                            </motion.button>
                        </div>
                    </div>

                    {view === 'create' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1"
                        >
                            <EventStore />
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {/* Loading State */}
                            {isLoading && (
                                <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-primary font-black uppercase tracking-widest animate-pulse">Sintonizando Frecuencias...</p>
                                </div>
                            )}

                            {error && (
                                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                                    <p className="text-red-500 font-bold uppercase tracking-widest">Error de Sintonización</p>
                                    <p className="text-white/40 text-xs mt-2">{String(error)}</p>
                                </div>
                            )}

                            {!isLoading && !error && events.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                                    <p className="text-white/40 font-bold uppercase tracking-widest">No hay eventos programados para esta semana.</p>
                                </div>
                            )}

                            {/* Event Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {sortedEvents.map((event: Event, index: number) => {
                                    const category = event.category || 'other';
                                    const eventType = event.type || getEventTypeFromCategory(category);
                                    const config = EVENT_TYPE_CONFIG[eventType as keyof typeof EVENT_TYPE_CONFIG] || EVENT_TYPE_CONFIG.social;
                                    const isGold = event.adTier === 'GOLD';
                                    const soldTickets = event.soldTickets || 0;
                                    const maxCapacity = event.maxCapacity || 0;
                                    const isSoldOut = maxCapacity > 0 && soldTickets >= maxCapacity;

                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ y: 50, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 + (index * 0.1) }}
                                            whileHover={{ y: -5 }}
                                            className={`group relative h-[650px] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-2xl border transition-all ${isGold ? 'border-primary/50 bg-primary/5' : 'border-white/5 bg-white/2'}`}
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            {/* Ticket Perforation Aesthetic */}
                                            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full z-30 border-r border-white/5 shadow-inner" />
                                            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full z-30 border-l border-white/5 shadow-inner" />
                                            <div className="absolute top-1/2 left-4 right-4 h-[1px] border-t border-dashed border-white/10 z-30 opacity-50" />

                                            {/* Cinematic Overlay & Style */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                                            {/* Visual Background */}
                                            <div className="absolute inset-0 bg-slate-900 transition-transform duration-700 group-hover:scale-110">
                                                {(event.bannerUrl || event.imageUrl) && (
                                                    <img
                                                        src={event.bannerUrl || event.imageUrl}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                                                        alt=""
                                                    />
                                                )}
                                                <div className="absolute inset-0 opacity-40 mix-blend-overlay"
                                                    style={{ backgroundColor: config.color }}
                                                />
                                                {isSoldOut && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                                                        <div className="border-4 border-white px-6 py-2 -rotate-12 transform">
                                                            <span className="text-white font-black text-2xl tracking-[0.2em] uppercase">AGOTADO</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content - Top Part (Event Info) */}
                                            <div className="absolute top-0 left-0 right-0 p-8 z-20 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 backdrop-blur-md">
                                                        <Zap size={10} className="animate-pulse" />
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{eventType}</span>
                                                    </div>
                                                    {isGold && (
                                                        <div className="text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.2em]">
                                                            PREMIUM
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-4xl font-black uppercase tracking-tighter leading-none group-hover:text-primary transition-colors">
                                                    {event.title}
                                                </h3>
                                            </div>

                                            {/* Content - Bottom Part (Ticket Footer) */}
                                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 space-y-6">
                                                <div className="flex justify-between items-end border-b border-white/5 pb-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Ubicación</p>
                                                        <div className="flex items-center gap-2 text-white/80">
                                                            <MapPin size={12} className="text-primary" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{event.locationName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Fecha</p>
                                                        <p className="text-[10px] font-black italic">{event.date}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex -space-x-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                                                                {String.fromCharCode(64 + i)}
                                                            </div>
                                                        ))}
                                                        <div className="w-8 h-8 rounded-full border-2 border-background bg-primary text-background flex items-center justify-center text-[8px] font-black">
                                                            +{event.attendees}
                                                        </div>
                                                    </div>

                                                    {event.price && Number(event.price) > 0 ? (
                                                        <div className={`px-5 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all ${isSoldOut
                                                            ? 'bg-gray-500 text-white/50 grayscale'
                                                            : 'bg-primary text-background group-hover:scale-105 shadow-primary/20'
                                                            }`}>
                                                            {isSoldOut ? 'SOLD OUT' : `₡${Number(event.price).toLocaleString()}`}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest italic">Entrada Libre</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Perforation Masking */}
                                            <div className="absolute inset-0 pointer-events-none border-[12px] border-background opacity-20" />
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Footer Insight */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-24 mb-12 text-center"
                            >
                                <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]">
                                    Desliza para explorar la agenda • Puerto Viejo de Talamanca
                                </p>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Detail Modal - ABSOLUTE GLOBAL OVERLAY */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4 md:p-8">
                        {/* Overlay backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-3xl pointer-events-auto"
                            onClick={() => setSelectedEvent(null)}
                        />

                        {/* Cinematic background flare */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />

                        {/* Professional Ticket Modal Container */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 100, rotateY: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0, rotateY: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50, rotateY: -10 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-lg aspect-[5/8] glass rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] pointer-events-auto relative flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Physical Ticket Aesthetics - Perforations */}
                            <div className="absolute top-[250px] -left-6 w-12 h-12 bg-black rounded-full z-50 shadow-inner" />
                            <div className="absolute top-[250px] -right-6 w-12 h-12 bg-black rounded-full z-50 shadow-inner" />
                            <div className="absolute top-[274px] left-10 right-10 h-[1.5px] border-t-2 border-dashed border-white/5 z-40" />

                            {/* Header / Banner Part */}
                            <div className="h-[250px] relative shrink-0">
                                {(selectedEvent.bannerUrl || selectedEvent.imageUrl) ? (
                                    <img
                                        src={selectedEvent.bannerUrl || selectedEvent.imageUrl}
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-900" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-8 right-8 w-14 h-14 glass rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all z-[60] shadow-2xl"
                                >
                                    <X size={28} />
                                </button>

                                <div className="absolute bottom-8 left-10 right-10 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 backdrop-blur-md w-fit">
                                            <Zap size={10} className="animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Premium Entry</span>
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic">{selectedEvent.title}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Body Part (Scrollable if needed) */}
                            <div className="flex-1 p-10 pt-16 space-y-8 overflow-y-auto scrollbar-hide">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-white/60">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                                <Calendar size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">📅 Fecha y Hora</p>
                                                <p className="text-sm font-bold">{selectedEvent.date} • {selectedEvent.time || '20:00'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-white/60">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                                <MapPin size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">📍 Ubicación</p>
                                                <p className="text-sm font-bold uppercase tracking-tight">{selectedEvent.locationName}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right glass p-6 rounded-[2rem] border-primary/30 min-w-[120px]">
                                        <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest mb-1">Precio</p>
                                        <p className="text-3xl font-black text-primary italic leading-none">
                                            {selectedEvent.price && Number(selectedEvent.price) > 0 ? `₡${Number(selectedEvent.price).toLocaleString()}` : '0'}<span className="text-xs ml-0.5">CRC</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Detalles de la experiencia</p>
                                    <p className="text-white/60 leading-relaxed font-medium">
                                        {selectedEvent.description || "Prepárate para vivir una noche inolvidable en el corazón del Caribe. Música, vibra y la mejor comunidad te esperan en este evento único."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col justify-center">
                                        <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest mb-1">Capacidad</p>
                                        <span className="text-lg font-black">{selectedEvent.maxCapacity || 'Unlimited'} pax</span>
                                    </div>
                                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col justify-center">
                                        <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest mb-1">Trending</p>
                                        <span className="text-lg font-black">🔥 {selectedEvent.attendees || 42}+ van</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-10 pt-0 shrink-0">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setSelectedEvent(null);
                                            onClose();
                                            window.location.href = `/map?zoom=18&lat=${selectedEvent.latitude}&lng=${selectedEvent.longitude}`;
                                        }}
                                        className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10 shrink-0"
                                    >
                                        <MapPin size={24} />
                                    </button>
                                    <button
                                        disabled={Number(selectedEvent.maxCapacity) > 0 && Number(selectedEvent.soldTickets) >= Number(selectedEvent.maxCapacity)}
                                        onClick={() => {
                                            const success = onAddToCart(selectedEvent, 'event');
                                            if (success) {
                                                setSelectedEvent(null);
                                                window.dispatchEvent(new CustomEvent('open_cart_sidebar'));
                                            }
                                        }}
                                        className="flex-1 h-16 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30"
                                    >
                                        <ShoppingBag size={24} />
                                        {selectedEvent.price && Number(selectedEvent.price) > 0 ? 'Comprar Entrada' : 'Obtener Acceso Libre'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
