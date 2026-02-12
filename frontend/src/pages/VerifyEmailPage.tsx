import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../api/api';
import { useAuthStore } from '../store/authStore';

export const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando tu correo electrónico...');
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de verificación no encontrado.');
            return;
        }

        const verify = async () => {
            try {
                const { data } = await api.post('/auth/verify-email', { token });
                setStatus('success');
                setMessage(data.message || 'Correo verificado exitosamente exceptuando si eres un repartidor.');

                // If the backend returns a token/user, log them in automatically
                if (data.access_token && data.user) {
                    setAuth(data.user, data.access_token, data.refresh_token);
                }

                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'El token es inválido o ha expirado.');
            }
        };

        verify();
    }, [token, navigate, setAuth]);

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-10 rounded-[2rem] max-w-md w-full text-center border border-white/10 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                <div className="mb-6 flex justify-center">
                    {status === 'loading' && (
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                            <Loader2 size={40} className="text-primary animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500 shadow-[0_0_30px_rgba(0,255,100,0.3)]"
                        >
                            <CheckCircle size={40} className="text-green-400" />
                        </motion.div>
                    )}
                    {status === 'error' && (
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.3)]"
                        >
                            <XCircle size={40} className="text-red-400" />
                        </motion.div>
                    )}
                </div>

                <h1 className="text-2xl font-black mb-4 text-white">
                    {status === 'loading' && 'Verificando...'}
                    {status === 'success' && '¡Verificación Exitosa!'}
                    {status === 'error' && 'Error de Verificación'}
                </h1>

                <p className="text-white/60 font-medium leading-relaxed">
                    {message}
                </p>

                {status === 'success' && (
                    <p className="mt-6 text-xs font-bold uppercase tracking-widest text-primary animate-pulse">
                        Redirigiendo al inicio...
                    </p>
                )}

                {status === 'error' && (
                    <button
                        onClick={() => navigate('/')}
                        className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-all w-full"
                    >
                        Volver al Inicio
                    </button>
                )}
            </motion.div>
        </div>
    );
};
