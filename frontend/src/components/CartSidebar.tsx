import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight, CheckCircle2, MessageSquare, Heart, Clock, Calendar, MapPin, Ticket, Zap, Loader2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { orderApi } from '../api/orders';
import { merchantApi } from '../api/merchants';
import { useState, useEffect } from 'react';
import { PaymentModal } from './PaymentModal';
import { useNotificationStore } from '../store/notificationStore';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCartSync } from '../hooks/useCartSync';
import { useLocation } from '../hooks/useLocation';

interface OrderBreakdown {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    courierTip: number;
    platformFee: number;
    transactionFee: number;
    total: number;
}

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onAuth: (mode: 'login' | 'register') => void;
}

export const CartSidebar = ({ isOpen, onClose, onAuth }: CartSidebarProps) => {
    const {
        items, addItem, decreaseItem, removeItem, totalPrice, clearCart,
        customerNotes, courierTip, setNotes, setTip, setLocked, isLocked, unlock
    } = useCartStore();
    const { user } = useAuthStore();
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<any>(null);
    const { t, language } = useLanguageStore();
    const { addNotification } = useNotificationStore();
    const { syncCart } = useCartSync();
    const { latitude, longitude, address, detectLocation, isDetecting, setAddress } = useLocation();

    // Monetary Flow: Backend-driven calculation
    const [breakdown, setBreakdown] = useState<OrderBreakdown | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            syncCart();
        }
    }, [isOpen, syncCart]);

    useEffect(() => {
        const handleMismatch = () => {
            toast.error(language === 'es' ? 'Comercio Diferente' : 'Different Merchant', {
                description: language === 'es'
                    ? 'Tu carrito ya tiene productos de otro comercio. Vacíalo para agregar estos.'
                    : 'Your cart already has products from another merchant. Clear it to add these.'
            });
            onClose();
        };

        window.addEventListener('cart_merchant_mismatch', handleMismatch);
        return () => window.removeEventListener('cart_merchant_mismatch', handleMismatch);
    }, [language, onClose]);

    const merchantId = items.length > 0 ? items[0].merchantId : null;
    const { data: merchant } = useQuery({
        queryKey: ['merchant-status', merchantId],
        queryFn: () => merchantApi.getOne(merchantId!),
        enabled: !!merchantId,
        refetchInterval: 30000,
    });

    // --- Delivery & Pricing Logic ---
    const isDigitalOnly = items.length > 0 && items.every(item =>
        item.itemType === 'event' || item.itemType === 'event-request'
    );
    const isMerchantActive = isDigitalOnly || merchant?.status === 'active' || !merchantId;

    const { data: deliveryData } = useQuery({
        queryKey: ['delivery-fee', merchantId, latitude, longitude],
        queryFn: () => merchantApi.calculateDelivery(merchantId!, latitude!, longitude!),
        enabled: !!merchantId && !!latitude && !!longitude && !isDigitalOnly,
        staleTime: 60000,
    });

    const isOutOfRange = !isDigitalOnly && deliveryData ? !deliveryData.inRange : false;
    const estimatedTime = !isDigitalOnly && deliveryData?.estimatedTime || null;

    // Trigger price calculation when cart changes
    useEffect(() => {
        let mounted = true;
        const calculateTotal = async () => {
            if (items.length === 0) {
                setBreakdown(null);
                return;
            }

            // Debounce or wait for stable state
            if (!merchantId) return;
            if (!isDigitalOnly && !latitude) return; // Wait for address

            setIsCalculating(true);
            try {
                const dto = {
                    merchantId: merchantId,
                    items: items.map(item => ({
                        productId: item.itemType === 'product' ? item.id : undefined,
                        eventId: item.itemType === 'event' ? item.id : undefined,
                        eventRequestId: item.itemType === 'event-request' ? item.id : undefined,
                        quantity: item.quantity,
                        selectedOptions: (item as any).selectedOptions
                    })),
                    courierTip: isDigitalOnly ? 0 : courierTip,
                    deliveryLat: isDigitalOnly ? 0 : (latitude || undefined),
                    deliveryLng: isDigitalOnly ? 0 : (longitude || undefined)
                };

                const result = await orderApi.preview(dto);
                if (mounted) setBreakdown(result);
            } catch (err) {
                console.error('Price preview failed', err);
            } finally {
                if (mounted) setIsCalculating(false);
            }
        };

        const timer = setTimeout(calculateTotal, 500); // 500ms debounce
        return () => { mounted = false; clearTimeout(timer); };
    }, [items, courierTip, latitude, longitude, merchantId, isDigitalOnly]);

    const hasUnavailableItems = items.some(item => item.isAvailable === false);

    const handleCheckoutClick = async () => {
        if (navigator.vibrate) navigator.vibrate([10]);
        if (!user) {
            onAuth('register');
            return;
        }
        if (items.length === 0) return;

        if (!isMerchantActive) {
            toast.error(language === 'es' ? 'Comercio Cerrado' : 'Merchant Closed', {
                description: language === 'es'
                    ? 'Este comercio no está aceptando pedidos en este momento.'
                    : 'This merchant is not accepting orders at the moment.'
            });
            return;
        }

        if (hasUnavailableItems) {
            toast.error(language === 'es' ? 'Productos Agotados' : 'Items Sold Out', {
                description: language === 'es'
                    ? 'Algunos productos en tu carrito ya no están disponibles. Por favor elimínalos para continuar.'
                    : 'Some items in your cart are no longer available. Please remove them to continue.'
            });
            return;
        }

        setIsOrdering(true);
        setLocked(true);
        try {
            const createOrderDto = {
                merchantId: merchantId as string,
                items: items.map(item => ({
                    productId: item.itemType === 'product' ? item.id : undefined,
                    eventId: item.itemType === 'event' ? item.id : undefined,
                    eventRequestId: item.itemType === 'event-request' ? item.id : undefined,
                    quantity: item.quantity
                })),
                customerNotes,
                courierTip: isDigitalOnly ? 0 : courierTip,
                deliveryAddress: isDigitalOnly ? 'Digital Delivery (Email/App)' : address,
                deliveryLat: isDigitalOnly ? 0 : (latitude || undefined),
                deliveryLng: isDigitalOnly ? 0 : (longitude || undefined)
            };

            const order = await orderApi.create(createOrderDto);
            setCurrentOrder(order);
            setShowPayment(true);
        } catch (error: any) {
            console.error('Failed to initiate order', error);
            setLocked(false);

            const errorMessage = error.response?.data?.message || '';
            const isClosed = errorMessage.toLowerCase().includes('cerrado') || errorMessage.toLowerCase().includes('horario');
            const isBusy = errorMessage.toLowerCase().includes('ocupado') || errorMessage.toLowerCase().includes('saturado');

            addNotification({
                title: isClosed ? 'Comercio Cerrado' : (isBusy ? 'Comercio Ocupado' : 'Error de pedido'),
                message: errorMessage || 'No pudimos procesar tu solicitud. Intenta de nuevo.',
                type: 'error'
            });
        } finally {
            setIsOrdering(false);
        }
    };

    const handlePaymentSuccess = async (_transactionId: string) => {
        setShowPayment(false);
        setOrderSuccess(true);
        setTimeout(() => {
            unlock();
            setOrderSuccess(false);
            onClose();
        }, 2000);
    };

    const handlePaymentClose = () => {
        setShowPayment(false);
        unlock();
    };

    // Use backend total if available, else fallback to safe estimates for display (though preview should exist)
    const displayTotal = breakdown ? breakdown.total : (totalPrice() + (isDigitalOnly ? 0 : courierTip));

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10002]"
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: isOpen ? 0 : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[420px] bg-background/95 backdrop-blur-xl z-[10003] shadow-2xl border-l border-white/5 flex flex-col overscroll-contain"
            >
                {/* ────── Header ────── */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ShoppingBag size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white italic leading-none">
                                {t('your_order')}
                            </h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/50 mt-0.5">
                                {items.length > 0 ? `${items.reduce((s, i) => s + i.quantity, 0)} items` : 'EMPTY'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ────── Content ────── */}
                <div className="flex-1 overflow-y-auto relative">
                    {orderSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-8 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.1 }}
                                className="w-20 h-20 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary mb-6 shadow-[0_0_40px_rgba(0,255,102,0.2)]"
                            >
                                <CheckCircle2 size={40} />
                            </motion.div>
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic">¡CONFIRMADO!</h2>
                            <p className="text-white/40 text-xs font-medium">Tu orden está siendo procesada.</p>
                        </motion.div>
                    ) : (
                        items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-8">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 opacity-20">
                                    <ShoppingBag size={32} />
                                </div>
                                <p className="text-base font-black text-white/30 uppercase tracking-tighter mb-1">{t('empty_cart')}</p>
                                <p className="text-[10px] text-white/15 uppercase tracking-widest">{t('empty_cart_desc')}</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {/* ── Merchant Status Alert ── */}
                                <AnimatePresence mode="wait">
                                    {!isMerchantActive && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3"
                                        >
                                            <Clock size={16} className="text-red-500 animate-pulse shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Comercio Cerrado</p>
                                                <p className="text-[9px] font-bold text-white/60">No acepta pedidos ahora.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ── Digital Delivery Badge ── */}
                                {isDigitalOnly ? (
                                    <div className="bg-primary/5 border border-primary/15 p-3 rounded-xl flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                                            <Zap size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-primary">Entrega Digital</p>
                                            <p className="text-[9px] font-bold text-white/50">Entradas enviadas a tu correo y cuenta.</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── Physical Delivery Address ── */
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                                            <MapPin size={10} className="text-primary" />
                                            Dirección de Entrega
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Ingresa tu dirección exacta..."
                                                className={`w-full bg-white/5 border ${isOutOfRange ? 'border-red-500/50' : 'border-white/5'} rounded-xl p-3 pr-10 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-primary/30 transition-all min-h-[52px] resize-none`}
                                            />
                                            <button
                                                disabled={isDetecting}
                                                onClick={detectLocation}
                                                className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-primary transition-all"
                                            >
                                                <MapPin size={14} className={isDetecting ? 'animate-pulse' : ''} />
                                            </button>
                                        </div>
                                        {isOutOfRange && (
                                            <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-1">
                                                Fuera del radio ({deliveryData?.distance}km)
                                            </p>
                                        )}
                                        {!latitude && (
                                            <p className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest px-1">
                                                Detecta ubicación para calcular envío
                                            </p>
                                        )}
                                        {estimatedTime && (
                                            <div className="flex items-center gap-1.5 px-1">
                                                <Clock size={10} className="text-primary" />
                                                <span className="text-[9px] font-bold text-white/50">~{estimatedTime} min</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Cart Items ── */}
                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {items.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20, height: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className={`group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all duration-300 ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}
                                            >
                                                {/* Sold out overlay */}
                                                {!item.isAvailable && (
                                                    <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                                                        <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                                                            Agotado
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-3">
                                                    {/* Thumbnail */}
                                                    <div className="w-14 h-14 rounded-lg bg-white/5 overflow-hidden flex-shrink-0 border border-white/5">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/10">
                                                                {(item.itemType === 'event' || item.itemType === 'event-request')
                                                                    ? <Ticket size={20} />
                                                                    : <span className="text-lg font-black uppercase">{item.name[0]}</span>
                                                                }
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="min-w-0">
                                                                <h3 className="font-black text-white text-xs uppercase italic tracking-tight truncate">{item.name}</h3>
                                                                {(item.itemType === 'event' || item.itemType === 'event-request') ? (
                                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                        {item.date && (
                                                                            <span className="text-[9px] text-white/40 flex items-center gap-0.5">
                                                                                <Calendar size={8} /> {item.date}
                                                                            </span>
                                                                        )}
                                                                        {item.locationName && (
                                                                            <span className="text-[9px] text-white/40 flex items-center gap-0.5 truncate max-w-[120px]">
                                                                                <MapPin size={8} /> {item.locationName}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[9px] text-primary/40 font-bold uppercase tracking-widest mt-0.5">{item.category}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                disabled={isLocked}
                                                                className={`text-white/10 hover:text-red-400 transition-colors shrink-0 ${isLocked ? 'cursor-not-allowed opacity-20' : ''}`}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>

                                                        {/* Price + Quantity */}
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-primary font-black text-sm tracking-tighter">
                                                                ₡{(item.price * item.quantity).toLocaleString()}
                                                            </span>

                                                            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/5">
                                                                <button
                                                                    onClick={() => decreaseItem(item.id)}
                                                                    disabled={isLocked}
                                                                    className={`w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:bg-white/10 transition-all ${isLocked ? 'opacity-20' : ''}`}
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="text-[10px] font-black w-5 text-center text-white">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => addItem(item)}
                                                                    disabled={!item.isAvailable || isLocked}
                                                                    className={`w-7 h-7 rounded-md flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-all ${(!item.isAvailable || isLocked) ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* ── Notes ── */}
                                <div className="space-y-1.5 pt-2">
                                    <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                                        <MessageSquare size={10} className="text-primary" />
                                        {t('add_notes')}
                                    </label>
                                    <textarea
                                        value={customerNotes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={t('notes_placeholder')}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-primary/30 transition-all min-h-[56px] resize-none"
                                    />
                                </div>

                                {/* ── Courier Tip (physical only) ── */}
                                {!isDigitalOnly && (
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                                            <Heart size={10} className="text-accent" />
                                            {t('courier_tip')}
                                        </label>
                                        <div className="flex gap-2">
                                            {[500, 1000, 2000, 5000].map((amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setTip(courierTip === amount ? 0 : amount)}
                                                    className={`flex-1 h-9 rounded-lg text-[10px] font-black transition-all border ${courierTip === amount
                                                        ? 'bg-primary/20 border-primary/30 text-primary'
                                                        : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                                                        }`}
                                                >
                                                    ₡{amount.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* ────── Receipt Footer ────── */}
                {!orderSuccess && items.length > 0 && (
                    <div className="border-t border-white/5 bg-background/90 backdrop-blur-xl shrink-0">
                        {/* Dotted perforation */}
                        <div className="w-full border-t border-dashed border-white/10" />

                        <div className="px-5 pt-4 pb-5 space-y-4">
                            {/* Price breakdown */}
                            <div className="space-y-2">
                                {/* Subtotal */}
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                    <span>{t('subtotal')}</span>
                                    <span className="text-white/50">
                                        {breakdown ? `₡${breakdown.subtotal.toLocaleString()}` : '...'}
                                    </span>
                                </div>

                                {/* Delivery */}
                                {!isDigitalOnly && (
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                        <span>{t('delivery_fee')}</span>
                                        <span className={isOutOfRange ? 'text-red-500' : 'text-white/50'}>
                                            {isCalculating ? '...' : (breakdown ? `₡${breakdown.deliveryFee.toLocaleString()}` : '-')}
                                        </span>
                                    </div>
                                )}

                                {/* Tip */}
                                {!isDigitalOnly && courierTip > 0 && (
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                        <span>TIP ♥</span>
                                        <span>₡{courierTip.toLocaleString()}</span>
                                    </div>
                                )}

                                {/* Taxes & Fees (New) */}
                                {breakdown && (
                                    <>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                            <span>IVA (13%)</span>
                                            <span className="text-white/50">₡{breakdown.tax.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                            <span>Tasa Servicio</span>
                                            <span className="text-white/50">₡{breakdown.transactionFee.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between items-baseline pt-3 border-t border-white/5">
                                    <span className="text-xs font-black uppercase tracking-tight text-white/60">{t('total')}</span>
                                    <span className="text-primary text-2xl font-black tracking-tighter italic">
                                        {isCalculating ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            `₡${displayTotal.toLocaleString()}`
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-[1fr_2fr] gap-3">
                                <button
                                    onClick={clearCart}
                                    disabled={isOrdering}
                                    className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                                >
                                    {language === 'es' ? 'VACIAR' : 'CLEAR'}
                                </button>
                                <button
                                    onClick={handleCheckoutClick}
                                    disabled={isOrdering || (!isDigitalOnly && (isOutOfRange || !latitude)) || hasUnavailableItems}
                                    className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-background font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isOrdering ? (
                                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>{t('place_order')}</span>
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {showPayment && currentOrder && (
                    <PaymentModal
                        orderId={currentOrder.id}
                        amount={displayTotal * 100} // Backend gives Colones, PaymentModal expects Cents
                        onClose={handlePaymentClose}
                        onSuccess={handlePaymentSuccess}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
