import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { socketService } from '../api/socket';
import { pushNotificationService } from '../services/pushNotificationService';
import { useLanguageStore } from '../store/languageStore';

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
    const { t } = useLanguageStore();

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
        } else if (blocked && show) {
            // CRITICAL FIX: Hide if subsequently blocked by higher priority prompt
            setShow(false);
            // We don't call onClose here to avoid loop, just hide UI
        }
    }, [isReady, blocked, show, dismissed, onOpen]);

    const handleEnable = async () => {
        const granted = await socketService.enablePushNotifications();
        if (granted) {
            setShow(false);
            onClose?.();
            // Show a test notification
            pushNotificationService.show({
                title: t('push_success_title'),
                body: t('push_success_desc'),
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
                className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[10002] safe-area-bottom"
            >
                <div className="glass border border-white/10 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl bg-[#0B1015]/80">
                    <div className="flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/20 shadow-[0_0_20px_rgba(0,255,102,0.15)]">
                            <Bell size={28} className="fill-primary/20" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="font-black text-white text-base uppercase tracking-tight">
                                {t('push_title')}
                            </h3>
                            <p className="text-xs text-white/60 leading-relaxed font-medium">
                                {t('push_desc')}
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-white/30 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95"
                        >
                            {t('push_later')}
                        </button>
                        <button
                            onClick={handleEnable}
                            className="flex-1 py-3.5 px-4 rounded-xl bg-primary text-background text-[10px] font-black uppercase tracking-wider hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,102,0.3)] active:scale-95"
                        >
                            <Check size={14} strokeWidth={4} />
                            {t('push_enable')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
