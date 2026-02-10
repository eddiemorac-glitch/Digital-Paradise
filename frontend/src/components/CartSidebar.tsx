import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, CheckCircle2, MessageSquare, Heart, Clock, MapPin, Zap } from 'lucide-react';
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
import { CartItem } from './cart/CartItem';
import { EmptyCart } from './cart/EmptyCart';
import { OrderSummary, OrderBreakdown } from './cart/OrderSummary';



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
                            <EmptyCart />
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
                                            <CartItem
                                                key={item.id}
                                                item={item}
                                                index={idx}
                                                onRemove={removeItem}
                                                onIncrease={addItem}
                                                onDecrease={decreaseItem}
                                                isLocked={isLocked}
                                            />
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
                    <OrderSummary
                        breakdown={breakdown}
                        isCalculating={isCalculating}
                        displayTotal={displayTotal}
                        courierTip={courierTip}
                        isDigitalOnly={isDigitalOnly}
                        isOutOfRange={isOutOfRange}
                        latitude={latitude}
                        hasUnavailableItems={hasUnavailableItems}
                        isOrdering={isOrdering}
                        onClear={clearCart}
                        onCheckout={handleCheckoutClick}
                    />
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
