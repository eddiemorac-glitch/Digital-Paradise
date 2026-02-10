import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

export const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            addNotification({
                title: 'Conexión Restablecida',
                message: 'Vuelves a estar en línea. Tus acciones se sincronizarán.',
                type: 'success'
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            addNotification({
                title: 'Sin Conexión',
                message: 'Parece que estás fuera de línea. Algunas funciones podrían no estar disponibles.',
                type: 'warning'
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [addNotification]);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-red-500/90 backdrop-blur-md rounded-full border border-white/20 shadow-2xl flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                        <WifiOff size={16} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Modo Offline Activo</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
