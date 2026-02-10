import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CreditCard, Loader2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../api/api';
import { devLog, devError } from '../utils/devLog';

interface PaymentModalProps {
    orderId: string;
    amount: number; // in cents
    onClose: () => void;
    onSuccess: (transactionId: string) => void;
    onError?: (error: string) => void;
}

type PaymentState = 'idle' | 'loading' | 'error';

export const PaymentModal = ({ orderId, amount, onClose, onError }: PaymentModalProps) => {
    const [state, setState] = useState<PaymentState>('idle');
    const [error, setError] = useState<string | null>(null);

    const formatAmount = (cents: number) => {
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0
        }).format(cents / 100);
    };

    const handlePayment = useCallback(async () => {
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
        setState('loading');
        setError(null);

        try {
            devLog('[PAYMENT] Requesting payment session for order:', orderId, 'amount:', amount);

            const { data } = await api.post('/payments/tilopay-token', {
                orderId,
                amount,
                currency: 'CRC'
            });

            devLog('[PAYMENT] Backend response:', data);

            if (!data.success || !data.redirectUrl) {
                throw new Error(data.error || 'No se pudo crear la sesión de pago.');
            }

            devLog('[PAYMENT] Redirecting to Tilopay:', data.redirectUrl);

            // Store orderId before redirect so callback page can recover it
            sessionStorage.setItem('tilopay_pending_orderId', orderId);

            // Redirect to Tilopay's hosted payment page
            window.location.href = data.redirectUrl;

        } catch (err: any) {
            devError('[PAYMENT] Error:', err);
            if (navigator.vibrate) navigator.vibrate([200]);

            let errorMessage = 'Error al crear la sesión de pago.';
            if (err.response?.status === 500) {
                errorMessage = 'Error del servidor. Intenta de nuevo en unos segundos.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setState('error');
            onError?.(errorMessage);
        }
    }, [orderId, amount, onError]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-md bg-[#0a0f18] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg">Checkout Seguro</h3>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Powered by TILOPAY</p>
                        </div>
                    </div>
                    {state !== 'loading' && (
                        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors touch-target">
                            <X size={24} />
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    {/* Amount */}
                    <div className="text-center py-6 bg-white/5 rounded-2xl">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total a pagar</p>
                        <p className="text-4xl font-black text-white">{formatAmount(amount)}</p>
                        <p className="text-white/30 text-xs mt-2">Pedido #{orderId.substring(0, 8)}</p>
                    </div>

                    {/* Security Info */}
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                        <ShieldCheck size={20} className="text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-white/50 space-y-1">
                            <p className="text-white/70 font-medium">Pago seguro con Tilopay</p>
                            <p>Serás redirigido a la plataforma segura de Tilopay para completar tu pago con tarjeta de crédito o débito.</p>
                        </div>
                    </div>

                    {/* Payment Methods Info */}
                    <div className="flex items-center justify-center gap-4 py-2">
                        <div className="flex items-center gap-1.5 text-white/30 text-xs">
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold uppercase">VISA</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/30 text-xs">
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold uppercase">MC</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/30 text-xs">
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold uppercase">AMEX</div>
                        </div>
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3"
                            >
                                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                <div className="text-xs">{error}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pay Button */}
                    <button
                        onClick={handlePayment}
                        disabled={state === 'loading'}
                        className="w-full bg-primary hover:bg-primary-dark text-background font-black py-5 rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest touch-target"
                    >
                        {state === 'loading' ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                <span>Conectando con Tilopay...</span>
                            </>
                        ) : (
                            <>
                                <Lock size={16} />
                                <span>Pagar {formatAmount(amount)}</span>
                                <ExternalLink size={14} className="opacity-50" />
                            </>
                        )}
                    </button>

                    {state === 'error' && (
                        <button
                            onClick={() => { setState('idle'); setError(null); }}
                            className="w-full text-white/40 hover:text-white/60 text-xs py-2 transition-colors"
                        >
                            Intentar de nuevo
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
