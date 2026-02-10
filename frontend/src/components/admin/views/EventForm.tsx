import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Type, Image, Leaf, Save, Sparkles } from 'lucide-react';
import { MapLocationPicker } from './MapLocationPicker';
import { Event, EventType } from '../../../types/event';
import { CreateEventDTO } from '../../../api/events';

interface EventFormProps {
    event?: Event | null;
    onSubmit: (data: CreateEventDTO) => void;
    onClose: () => void;
    isLoading?: boolean;
}

const EVENT_TYPES: { value: EventType; label: string; color: string; icon: string }[] = [
    { value: 'fire', label: 'Fiesta', color: '#ff4400', icon: '🔥' },
    { value: 'reggae', label: 'Reggae', color: '#00ff66', icon: '🎵' },
    { value: 'surf', label: 'Surf', color: '#00ecff', icon: '🏄' },
    { value: 'art', label: 'Arte', color: '#ff00ee', icon: '🎨' },
    { value: 'eco', label: 'Eco', color: '#22c55e', icon: '🌿' },
    { value: 'gastronomy', label: 'Gastronomía', color: '#f59e0b', icon: '🍽️' },
    { value: 'concert', label: 'Concierto', color: '#a855f7', icon: '🎸' },
    { value: 'adventure', label: 'Aventura', color: '#ef4444', icon: '🏕️' },
    { value: 'social', label: 'Social', color: '#3b82f6', icon: '👥' },
];

export const EventForm: React.FC<EventFormProps> = ({
    event,
    onSubmit,
    onClose,
    isLoading = false
}) => {
    const [formData, setFormData] = useState<CreateEventDTO>({
        title: '',
        description: '',
        date: '',
        time: '',
        locationName: '',
        venue: '',
        latitude: 9.6560, // Default to Puerto Viejo
        longitude: -82.7534,
        category: 'other', // Default category
        type: 'social' as EventType,
        imageUrl: '',
        bannerUrl: '',
        isEcoFriendly: false
    });

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description,
                date: event.date,
                time: event.time || '',
                locationName: event.locationName || '',
                venue: event.venue || '',
                latitude: event.latitude || 9.6560,
                longitude: event.longitude || -82.7534,
                type: event.type || 'social',
                category: event.category,
                imageUrl: event.imageUrl || '',
                bannerUrl: event.bannerUrl || '',
                isEcoFriendly: event.isEcoFriendly
            });
        }
    }, [event]);

    const handleChange = (field: keyof CreateEventDTO, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePositionChange = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Fallback for date if empty
        const finalData = { ...formData };
        if (!finalData.date) {
            finalData.date = new Date().toLocaleDateString();
        }
        onSubmit(finalData);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a1015] border border-white/10 rounded-[2.5rem] p-8"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Sparkles className="text-primary" size={24} />
                            {event && event.id !== 'NEW_REQUEST' ? 'Editar Evento' : 'Nuevo Evento'}
                        </h2>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                            {event && event.id !== 'NEW_REQUEST' ? 'Modifica los detalles del evento' : 'Crea un nuevo evento para el mapa'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                            <Type size={12} /> Título del evento
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Sunset Beats @ Playa Negra"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none focus:border-primary/50 font-bold"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Describe el evento..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none focus:border-primary/50 resize-none"
                            required
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <Calendar size={12} /> Fecha o Descripción Temporal
                            </label>
                            <input
                                type="text"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                placeholder="Ej: Hoy, 5:00 PM o 2024-12-31"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <Clock size={12} /> Hora (Opcional)
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => handleChange('time', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {/* Event Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            Tipo de evento
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {EVENT_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleChange('type', type.value)}
                                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.type === type.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                    style={{
                                        borderColor: formData.type === type.value ? type.color : undefined
                                    }}
                                >
                                    <span className="text-lg">{type.icon}</span>
                                    <span className="ml-1">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location & Venue */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <MapPin size={12} /> Ubicación
                            </label>
                            <input
                                type="text"
                                value={formData.locationName}
                                onChange={(e) => handleChange('locationName', e.target.value)}
                                placeholder="Puerto Viejo"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary/50"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                Venue / Local
                            </label>
                            <input
                                type="text"
                                value={formData.venue}
                                onChange={(e) => handleChange('venue', e.target.value)}
                                placeholder="Beach Bar Sunset"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {/* Map Location Picker */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            Ubicación en el mapa
                        </label>
                        <MapLocationPicker
                            initialPosition={formData.latitude && formData.longitude
                                ? [formData.latitude, formData.longitude]
                                : undefined
                            }
                            onPositionChange={handlePositionChange}
                        />
                    </div>

                    {/* Images */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <Image size={12} /> URL de imagen
                            </label>
                            <input
                                type="url"
                                value={formData.imageUrl}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                Banner cinematográfico
                            </label>
                            <input
                                type="url"
                                value={formData.bannerUrl}
                                onChange={(e) => handleChange('bannerUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {/* Eco-Friendly Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Leaf className={formData.isEcoFriendly ? 'text-primary' : 'text-white/20'} size={20} />
                            <div>
                                <p className="text-sm font-bold">Evento Eco-Friendly</p>
                                <p className="text-[10px] text-white/40">Marcará el evento como sostenible</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleChange('isEcoFriendly', !formData.isEcoFriendly)}
                            className={`w-14 h-7 rounded-full relative transition-colors ${formData.isEcoFriendly ? 'bg-primary' : 'bg-white/10'
                                }`}
                        >
                            <motion.div
                                animate={{ x: formData.isEcoFriendly ? 28 : 4 }}
                                className="absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow-lg"
                            />
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl border border-white/10 text-white/60 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-4 rounded-2xl bg-primary text-background font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isLoading ? 'Guardando...' : (event && event.id !== 'NEW_REQUEST' ? 'Actualizar' : 'Crear Evento')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
