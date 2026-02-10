import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCartStore } from '../store/cartStore';
import api from '../api/api';
import { devLog, devError } from '../utils/devLog';

export const PaymentCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando pago...');
    const { unlock, clearCart } = useCartStore();

    useEffect(() => {
        // Log ALL params for debugging
        const allParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            allParams[key] = value;
        });
        devLog('[PAYMENT CALLBACK] All URL params:', JSON.stringify(allParams));
        devLog('[PAYMENT CALLBACK] Full URL:', window.location.href);

        // Try all possible parameter name variations from Tilopay
        const orderId = searchParams.get('orderNumber')
            || searchParams.get('order_number')
            || searchParams.get('OrderNumber')
            || searchParams.get('ordernumber')
            || searchParams.get('order')
            || sessionStorage.getItem('tilopay_pending_orderId');

        const responseCode = searchParams.get('responseCode')
            || searchParams.get('response_code')
            || searchParams.get('ResponseCode')
            || searchParams.get('status');

        const code = searchParams.get('code');

        devLog('[PAYMENT CALLBACK] Parsed: orderId=', orderId, 'responseCode=', responseCode, 'code=', code);

        const verifyPayment = async () => {
            if (!orderId) {
                devError('[PAYMENT CALLBACK] No orderId found. Available params:', allParams);
                setStatus('error');
                setMessage('No se encontró información del pedido.');
                return;
            }

            try {
                // Call our backend to verify and update the payment
                devLog('[PAYMENT CALLBACK] Calling verify-payment endpoint...');
                const { data } = await api.post('/payments/verify-payment', {
                    orderId,
                    responseCode: responseCode || undefined,
                    code: code || undefined,
                });

                devLog('[PAYMENT CALLBACK] Verify response:', data);

                // Clean up sessionStorage
                sessionStorage.removeItem('tilopay_pending_orderId');

                if (data.success) {
                    // Clear cart — must unlock first (clearCart guards against locked state)
                    unlock();
                    clearCart();
                    setStatus('success');
                    setMessage(data.message || '¡Tu pago ha sido procesado con éxito!');

                    // Auto-navigate to tracking after short delay
                    setTimeout(() => {
                        navigate(`/orders/track/${orderId}`);
                    }, 2000);
                } else if (data.status === 'DECLINED') {
                    setStatus('error');
                    setMessage(data.message || 'El pago fue rechazado. Intenta con otra tarjeta.');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'El pago no pudo ser verificado.');
                }
            } catch (err: any) {
                devError('[PAYMENT CALLBACK] Error:', err);

                // Always unlock the cart so user can re-order if needed
                unlock();

                // SECURITY: Do NOT trust URL responseCode. The webhook is the source of truth.
                // Show pending status and ask user to check their orders.
                setStatus('error');
                setMessage('No pudimos verificar tu pago en este momento. Revisa el estado en "Mis Pedidos".');
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-[80dvh] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md glass border-white/5 p-10 rounded-[3rem] text-center space-y-8 relative overflow-hidden"
            >
                {/* Background Decoration */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    {status === 'loading' && (
                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-primary">
                            <Loader2 size={48} className="animate-spin" />
                        </div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12 }}
                            className="w-24 h-24 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary shadow-[0_0_40px_rgba(0,255,102,0.2)]"
                        >
                            <CheckCircle2 size={48} />
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-24 h-24 bg-red-500/20 rounded-[2rem] flex items-center justify-center text-red-500"
                        >
                            <XCircle size={48} />
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                            {status === 'loading' ? 'Sincronizando' : status === 'success' ? '¡Éxito!' : 'Aviso'}
                        </h1>
                        <p className="text-white/40 text-sm font-medium px-4">
                            {message}
                        </p>
                    </div>

                    {status !== 'loading' && (
                        <Button
                            variant={status === 'success' ? 'primary' : 'glass'}
                            onClick={() => navigate(status === 'success' ? '/orders' : '/')}
                            className="w-full h-16 rounded-2xl gap-3"
                        >
                            {status === 'success' ? 'Ver mis pedidos' : 'Volver al inicio'}
                            <ArrowRight size={18} />
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
