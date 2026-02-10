import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Eye, Edit2, Trash2, Leaf, AlertTriangle, RefreshCw } from 'lucide-react';
import { Event as AppEvent } from '../../../../types/event';
import { EVENT_TYPE_CONFIG, getEventTypeFromCategory } from '../../../../types/event-type-config';

interface EventListProps {
    events: AppEvent[];
    loading: boolean;
    onViewOnMap?: (event: AppEvent) => void;
    onEdit: (event: AppEvent) => void;
    deleteConfirm: string | null;
    setDeleteConfirm: (id: string | null) => void;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
    onOpenForm: () => void;
}

export const EventList: React.FC<EventListProps> = ({
    events,
    loading,
    onViewOnMap,
    onEdit,
    deleteConfirm,
    setDeleteConfirm,
    onDelete,
    isDeleting,
    onOpenForm
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-12 space-y-4">
                <Calendar size={48} className="mx-auto text-white/10" />
                <p className="text-white/40 font-bold">No hay eventos</p>
                <button
                    onClick={onOpenForm}
                    className="text-primary text-sm font-bold underline"
                >
                    Crear el primero
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
                {events.map((event: AppEvent) => {
                    const eventType = event.type || getEventTypeFromCategory(event.category);
                    const typeConfig = EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.social;

                    return (
                        <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass p-5 rounded-[2rem] border-white/5 space-y-4 group"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                        style={{ backgroundColor: `${typeConfig.color}20` }}
                                    >
                                        {typeConfig.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-sm truncate">{event.title}</h3>
                                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                            {typeConfig.label}
                                        </p>
                                    </div>
                                </div>
                                {event.isEcoFriendly && (
                                    <Leaf size={16} className="text-primary shrink-0" />
                                )}
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-xs text-white/60">
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-white/30" />
                                    <span>{event.date}</span>
                                    {event.time && (
                                        <>
                                            <Clock size={12} className="text-white/30 ml-2" />
                                            <span>{event.time}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={12} className="text-white/30" />
                                    <span className="truncate">{event.venue || event.locationName || 'Ubicación desconocida'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={12} className="text-white/30" />
                                    <span>{event.attendees} asistentes</span>
                                </div>
                            </div>

                            {/* Coordinates indicator */}
                            {event.latitude !== undefined && event.latitude !== null && event.longitude !== undefined && event.longitude !== null && (
                                <div className="flex items-center gap-2 text-[10px] text-primary/60 font-mono">
                                    <MapPin size={10} />
                                    En el mapa
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-3 border-t border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onViewOnMap && event.latitude !== undefined && event.latitude !== null && (
                                    <button
                                        onClick={() => onViewOnMap(event)}
                                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                                    >
                                        <Eye size={12} /> Ver
                                    </button>
                                )}
                                <button
                                    onClick={() => onEdit(event)}
                                    className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                                >
                                    <Edit2 size={12} /> Editar
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(event.id)}
                                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            {/* Delete Confirmation */}
                            <AnimatePresence>
                                {deleteConfirm === event.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pt-3 border-t border-red-500/20 space-y-3"
                                    >
                                        <div className="flex items-center gap-2 text-red-400 text-xs">
                                            <AlertTriangle size={14} />
                                            ¿Eliminar este evento?
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="flex-1 py-2 bg-white/5 rounded-xl text-xs font-bold"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => onDelete(event.id)}
                                                disabled={isDeleting}
                                                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                                            >
                                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
