import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { socketService } from '../api/socket';
import { pushNotificationService } from '../services/pushNotificationService';

interface PushNotificationPromptProps {
    delay?: number; // ms to wait before showing prompt
    blocked?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
}

export const PushNotificationPrompt = ({
    delay = 10000,
    blocked = false,
    onOpen,
    onClose
}: PushNotificationPromptProps) => {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Check if already granted or denied
        if (!pushNotificationService.isSupported()) return;
        if (pushNotificationService.isGranted()) return;

        // Check if user has dismissed before
        const hasDismissed = localStorage.getItem('push_notification_dismissed');
        if (hasDismissed) return;

        // Show prompt after delay
        const timer = setTimeout(() => setIsReady(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    // Effect to handle showing when ready and not blocked
    useEffect(() => {
        if (isReady && !blocked && !show && !dismissed) {
            setShow(true);
            onOpen?.();
        }
    }, [isReady, blocked, show, dismissed, onOpen]);

    const handleEnable = async () => {
        const granted = await socketService.enablePushNotifications();
        if (granted) {
            setShow(false);
            onClose?.();
            // Show a test notification
            pushNotificationService.show({
                title: '🎉 Notificaciones Activadas',
                body: 'Recibirás alertas de tus pedidos y ofertas especiales',
                tag: 'welcome'
            });
        }
    };

    const handleDismiss = () => {
        setShow(false);
        setDismissed(true);
        localStorage.setItem('push_notification_dismissed', 'true');
        onClose?.();
    };

    if (dismissed || !show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="fixed bottom-[96px] left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[9500]"
            >
                <div className="glass border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                    <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                            <Bell size={24} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <h3 className="font-black text-white text-sm uppercase tracking-tight">
                                ¿Activar Notificaciones?
                            </h3>
                            <p className="text-xs text-white/50 leading-relaxed">
                                Recibe alertas instantáneas sobre el estado de tus pedidos y ofertas exclusivas.
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-white/30 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
                        >
                            Ahora No
                        </button>
                        <button
                            onClick={handleEnable}
                            className="flex-1 py-3 px-4 rounded-xl bg-primary text-background text-xs font-black uppercase tracking-wider hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Check size={16} />
                            Activar
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
