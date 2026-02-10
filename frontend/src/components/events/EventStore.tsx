import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShoppingBag, Zap, Star, Crown } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventsApi } from '../../api/events';
import { EventCategory, AdTier, AdSize } from '../../types/event-monetization';

// --- Types ---
interface EventRequestForm {
    title: string;
    description: string;
    date: string;
    time: string;
    locationName: string;
    venue: string;
    category: EventCategory;
    adTier: AdTier;
    adSize: AdSize;
    contactPhone: string;
    contactEmail: string;
    isEcoFriendly: boolean;
}

const TIER_FEATURES = {
    [AdTier.BRONZE]: {
        label: 'Bronce',
        price: 'Gratis',
        features: ['Listado en la agenda', 'Búsqueda básica', 'Visibilidad estándar'],
        color: 'from-orange-400 to-amber-600',
        recommendation: 'Ideal para eventos comunitarios',
        icon: Zap
    },
    [AdTier.SILVER]: {
        label: 'Plata',
        price: '₡5,000 / día',
        features: ['Listado superior', 'Icono destacado en mapa', 'Búsqueda prioritaria', 'Fotos en galería'],
        color: 'from-slate-300 to-slate-500',
        recommendation: 'Perfecto para negocios locales',
        icon: Star
    },
    [AdTier.GOLD]: {
        label: 'Oro',
        price: '₡15,000 / día',
        features: ['Banner en Home', 'Push Notification (Radio)', 'Máxima prioridad en mapa', 'Estética Cinematic'],
        color: 'from-yellow-300 to-yellow-600',
        recommendation: 'Para festivales y grandes eventos',
        icon: Crown
    }
};

export const EventStore = () => {
    const [selectedTier, setSelectedTier] = useState<AdTier>(AdTier.BRONZE);
    const [step, setStep] = useState<'selection' | 'details' | 'success'>('selection');
    const queryClient = useQueryClient();
    const { addItem, setLocked } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit } = useForm<EventRequestForm>({
        defaultValues: {
            adTier: AdTier.BRONZE,
            adSize: AdSize.SMALL,
            category: EventCategory.OTHER,
            isEcoFriendly: false
        }
    });

    const createRequestMutation = useMutation({
        mutationFn: eventsApi.createRequest,
        onSuccess: (data) => {
            if (data.adTier === AdTier.BRONZE) {
                setStep('success');
                queryClient.invalidateQueries({ queryKey: ['my-event-requests'] });
                toast.success('Solicitud enviada con éxito');
            } else {
                const price = data.price || (data.adTier === AdTier.SILVER ? 5000 : 15000);
                const cartItem = {
                    ...data,
                    id: data.id,
                    price: price,
                    name: `Publicación: ${data.title} (${data.adTier})`,
                    description: `Publicación de entrada en categoría ${data.category}. Tier: ${data.adTier}`,
                    imageUrl: data.imageUrl || '',
                    merchantId: 'system',
                    itemType: 'event-request',
                    isAvailable: true
                };

                addItem(cartItem as any, 'event-request');
                setLocked(false);
                toast.success('Solicitud creada. Ve al carrito para finalizar el pago.');
                window.dispatchEvent(new CustomEvent('open_cart_sidebar'));
                setStep('success');
            }
            setIsSubmitting(false);
        },
        onError: (error) => {
            setIsSubmitting(false);
            toast.error('Error al enviar solicitud: ' + (error as any).message);
        }
    });

    const onSubmit = (data: EventRequestForm) => {
        setIsSubmitting(true);
        data.adTier = selectedTier;
        createRequestMutation.mutate(data);
    };

    if (step === 'success') {
        const isPaid = selectedTier !== AdTier.BRONZE;

        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className={`w-24 h-24 ${isPaid ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'} rounded-full flex items-center justify-center mb-4 animate-bounce`}>
                    {isPaid ? <ShoppingBag size={48} /> : <Check size={48} />}
                </div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {isPaid ? '¡CASI LISTO!' : '¡SOLICITUD RECIBIDA!'}
                </h2>
                <p className="text-white/60 max-w-md">
                    {isPaid
                        ? 'Tu solicitud ha sido creada. Para activarla, por favor finaliza el pago en tu carrito de compras.'
                        : 'Tu solicitud de entradas ha sido enviada a nuestro equipo de curaduría. Te notificaremos cuando sea aprobado.'}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => setStep('selection')}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                    >
                        Volver a la Tienda
                    </button>
                    {isPaid && (
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open_cart_sidebar'))}
                            className="px-8 py-3 bg-primary text-background hover:bg-primary/80 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <ShoppingBag size={18} />
                            Ir a Pagar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">
                    <span className="text-primary mr-2">♦</span>
                    Vende tus <span className="text-primary">Entradas</span>
                </h1>
                <p className="text-white/40 font-medium">Impulsa tu evento en el ecosistema digital más potente del Caribe.</p>
            </header>

            {step === 'selection' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(Object.keys(TIER_FEATURES) as AdTier[]).map((tier) => {
                        const Icon = TIER_FEATURES[tier].icon;
                        return (
                            <motion.div
                                key={tier}
                                whileHover={{ y: -5 }}
                                onClick={() => setSelectedTier(tier)}
                                className={`relative group cursor-pointer rounded-3xl p-1 transition-all duration-300 ${selectedTier === tier
                                    ? 'bg-gradient-to-br ' + TIER_FEATURES[tier].color
                                    : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="bg-[#0f141e] h-full rounded-[1.3rem] p-6 flex flex-col relative overflow-hidden">
                                    <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon size={24} className={`text-transparent bg-gradient-to-r ${TIER_FEATURES[tier].color} bg-clip-text font-black`} />
                                    </div>

                                    <div className="mb-4">
                                        <h3 className={`text-xl font-black uppercase tracking-tight bg-gradient-to-r ${TIER_FEATURES[tier].color} bg-clip-text text-transparent`}>
                                            Tier {TIER_FEATURES[tier].label}
                                        </h3>
                                        <p className="text-2xl font-bold text-white mt-1">{TIER_FEATURES[tier].price}</p>
                                    </div>

                                    <ul className="space-y-3 mb-8 flex-1">
                                        {TIER_FEATURES[tier].features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                                                <Check size={16} className={`mt-0.5 opacity-40`} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTier(tier);
                                            setStep('details');
                                        }}
                                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${selectedTier === tier
                                            ? `bg-gradient-to-r ${TIER_FEATURES[tier].color} text-black shadow-lg shadow-white/10`
                                            : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'
                                            }`}
                                    >
                                        Configurar Entradas
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-3xl mx-auto"
                >
                    <button
                        onClick={() => setStep('selection')}
                        className="mb-6 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-2"
                    >
                        <ArrowRight className="rotate-180" size={14} />
                        Volver a Paquetes
                    </button>

                    <div className="glass p-8 rounded-3xl border-white/5">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Nombre de la Entrada / Evento</label>
                                    <input
                                        {...register('title', { required: true })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                        placeholder="Ej: Acceso General - Concierto"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Categoría</label>
                                    <select
                                        {...register('category')}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                    >
                                        {Object.values(EventCategory).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Descripción de la Entrada</label>
                                <textarea
                                    {...register('description', { required: true })}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                    placeholder="Describe qué incluye la entrada y detalles clave del evento..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Fecha del Evento</label>
                                    <input
                                        type="date"
                                        {...register('date', { required: true })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Hora de Apertura</label>
                                    <input
                                        type="time"
                                        {...register('time')}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Lugar (Nombre)</label>
                                    <input
                                        {...register('locationName', { required: true })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                        placeholder="Ej: Playa Cocles"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Venue / Local (Opcional)</label>
                                    <input
                                        {...register('venue')}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                                        placeholder="Ej: Restaurante El Sol"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={createRequestMutation.isPending}
                                    className="px-8 py-3 bg-primary hover:bg-primary/80 text-background rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                                >
                                    {createRequestMutation.isPending || isSubmitting ? 'Procesando...' : 'Publicar Entradas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
