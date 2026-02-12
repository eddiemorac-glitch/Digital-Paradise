import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { devLog } from '../utils/devLog';

export const PWAInstallPrompt = ({ onOpen, onClose, blocked = false }: { onOpen?: () => void; onClose?: () => void, blocked?: boolean }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67+ from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Auto-show for merchants and delivery partners, or if not dismissed
            const hasDismissed = localStorage.getItem('pwa_install_dismissed');
            if (!hasDismissed) {
                // Delay slightly for better UX
                setTimeout(() => {
                    setShowPrompt(true);
                }, 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Effect to handle onOpen callback only when not blocked
    useEffect(() => {
        if (showPrompt && !blocked) {
            onOpen?.();
        }
    }, [showPrompt, blocked, onOpen]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            devLog('User accepted the install prompt');
        } else {
            devLog('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
        onClose?.();
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_install_dismissed', 'true');
        onClose?.();
    };

    // If already installed (standalone mode), don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return null;

    if (!showPrompt) return null;

    const isMerchantOrCourier = user?.role === 'merchant' || user?.role === 'delivery';

    return (
        <AnimatePresence>
            {!blocked && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 100 }}
                    className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-[10002]"
                >
                    <div className="glass border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex gap-5 items-center mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <Smartphone size={28} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-black text-white text-lg uppercase tracking-tight italic">
                                    {isMerchantOrCourier ? 'App Profesional' : 'Instalar App'}
                                </h3>
                                <p className="text-xs text-white/50 font-medium">
                                    {isMerchantOrCourier
                                        ? 'Maximiza tu eficiencia controlando pedidos sin abrir el navegador.'
                                        : 'La mejor experiencia de Caribe Digital en tu pantalla de inicio.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Ahora No
                            </button>
                            <button
                                onClick={handleInstall}
                                className="flex-[2] py-3 px-4 rounded-xl bg-primary text-background text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                            >
                                <Download size={16} />
                                Instalar
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
