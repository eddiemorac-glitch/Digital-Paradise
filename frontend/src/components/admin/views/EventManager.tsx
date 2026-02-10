import React, { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Plus, Search, Filter, Edit2, Trash2,
    MapPin, Clock, Leaf, Users, AlertTriangle, RefreshCw,
    Eye
} from 'lucide-react';
import { eventsApi, CreateEventDTO } from '../../../api/events';
import { Event as AppEvent, EventRequest as AppEventRequest } from '../../../types/event';
import { EVENT_TYPE_CONFIG, getEventTypeFromCategory, EventType } from '../../../types/event-type-config';
import { EventForm } from './EventForm';

interface EventManagerProps {
    onViewOnMap?: (event: AppEvent) => void;
}


export const EventManager: React.FC<EventManagerProps> = ({ onViewOnMap }) => {
    // ... (rest of component)
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<EventType | 'all'>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'active' | 'requests'>('active');
    const [selectedRequest, setSelectedRequest] = useState<AppEventRequest | null>(null);

    // Queries
    const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
        queryKey: ['admin-events'],
        queryFn: eventsApi.getAll
    });

    const { data: requests } = useQuery({
        queryKey: ['admin-event-requests'],
        queryFn: () => eventsApi.getAllRequests('PENDING'),
        refetchInterval: 30000
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: eventsApi.create,
        onSuccess: async () => {
            if (selectedRequest) {
                // Determine implicit status based on category/tier or just mark APPROVED
                await eventsApi.updateRequestStatus(selectedRequest.id, 'APPROVED');
            }
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            queryClient.invalidateQueries({ queryKey: ['admin-event-requests'] });
            setShowForm(false);
            setSelectedRequest(null);
            toast.success('Evento publicado y solicitud aprobada');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventDTO> }) =>
            eventsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            setEditingEvent(null);
            setShowForm(false);
            toast.success('Evento actualizado');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: eventsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            setDeleteConfirm(null);
            toast.success('Evento eliminado');
        }
    });

    const rejectRequestMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            eventsApi.updateRequestStatus(id, 'REJECTED', reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-event-requests'] });
            toast.info('Solicitud rechazada');
        }
    });


    // Filters
    const filteredEvents = events?.filter((event: AppEvent) => {
        const titleMatch = (event.title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const locationMatch = (event.locationName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = titleMatch || locationMatch;
        const matchesType = filterType === 'all' || event.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleSubmit = (data: CreateEventDTO) => {
        if (editingEvent && editingEvent.id !== 'NEW_REQUEST') {
            updateMutation.mutate({ id: editingEvent.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (event: AppEvent) => {
        setEditingEvent(event);
        setShowForm(true);
    };

    const handlePromote = (request: any) => {
        setSelectedRequest(request);
        // Map request to event structure
        const prefilledEvent: any = {
            title: request.title,
            description: request.description,
            date: request.date,
            time: request.time,
            locationName: request.locationName || request.venue,
            venue: request.venue,
            category: request.category,
            adTier: request.adTier,
            adSize: request.adSize,
            isEcoFriendly: request.isEcoFriendly
        };

        // Pass a phantom ID to signal promotion in handleSubmit
        setEditingEvent({ ...prefilledEvent, id: 'NEW_REQUEST' } as AppEvent);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingEvent(null);
        setSelectedRequest(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <Calendar className="text-accent" size={24} />
                        Gestión de Eventos
                    </h2>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                        {events?.length || 0} eventos activos • {requests?.length || 0} solicitudes
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        Activos
                    </button>
                    <button
                        onClick={() => setViewMode('requests')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all relative ${viewMode === 'requests' ? 'bg-primary/20 text-primary' : 'text-white/40 hover:text-white'}`}
                    >
                        Solicitudes
                        {requests && requests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>

                    <div className="w-[1px] h-8 bg-white/10 mx-2" />

                    <button
                        onClick={() => refetchEvents()}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <RefreshCw size={16} className={eventsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-3 bg-primary text-background rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                    >
                        <Plus size={16} />
                        Nuevo
                    </button>
                </div>
            </div>

            {viewMode === 'active' ? (
                <>
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar eventos..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shrink-0 transition-all ${filterType === 'all'
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <Filter size={12} className="inline mr-1" />
                                Todos
                            </button>
                            {Object.entries(EVENT_TYPE_CONFIG).slice(0, 5).map(([key, config]: [any, any]) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterType(key as EventType)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${filterType === key
                                        ? 'border'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                    style={{
                                        borderColor: filterType === key ? config.color : undefined,
                                        backgroundColor: filterType === key ? `${config.color}20` : undefined,
                                        color: filterType === key ? config.color : undefined
                                    }}
                                >
                                    {config.icon} {config.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Events Grid */}
                    {eventsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw size={32} className="animate-spin text-primary" />
                        </div>
                    ) : filteredEvents?.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <Calendar size={48} className="mx-auto text-white/10" />
                            <p className="text-white/40 font-bold">No hay eventos</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="text-primary text-sm font-bold underline"
                            >
                                Crear el primero
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredEvents?.map((event: AppEvent) => {
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
                                                    onClick={() => handleEdit(event)}
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
                                                                onClick={() => handleDelete(event.id)}
                                                                disabled={deleteMutation.isPending}
                                                                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                                                            >
                                                                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
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
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {requests?.length === 0 ? (
                            <div className="col-span-2 text-center py-20 opacity-40">
                                <Leaf className="mx-auto mb-4" size={48} />
                                <p>No hay solicitudes pendientes</p>
                            </div>
                        ) : (
                            requests?.map((req: any) => (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass p-6 rounded-[2rem] border-white/5 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <h1 className="text-4xl font-black">{req.adTier}</h1>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${req.adTier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        req.adTier === 'SILVER' ? 'bg-slate-400/20 text-slate-400' :
                                                            'bg-orange-500/20 text-orange-500'
                                                        }`}>
                                                        {req.adTier}
                                                    </span>
                                                    <span className="text-[10px] text-white/40 font-bold uppercase">{req.category}</span>
                                                </div>
                                                <h3 className="text-xl font-black">{req.title}</h3>
                                                <p className="text-xs text-white/60 mt-1 line-clamp-2">{req.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs text-white/50 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} /> {req.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={12} /> {req.user?.fullName || 'Usuario'}
                                            </div>
                                            <div className="flex items-center gap-2 col-span-2">
                                                <MapPin size={12} /> {req.locationName}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => rejectRequestMutation.mutate({ id: req.id, reason: 'Reject via Admin' })}
                                                className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Rechazar
                                            </button>
                                            <button
                                                onClick={() => handlePromote(req)}
                                                className="flex-[2] py-3 bg-primary text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={12} />
                                                Aprobar y Editar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Event Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <EventForm
                        event={editingEvent}
                        onSubmit={handleSubmit}
                        onClose={handleCloseForm}
                        isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
