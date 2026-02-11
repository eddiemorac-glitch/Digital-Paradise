import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

/**
 * Shows a toast when a new Service Worker version is detected.
 * Uses the `controllerchange` event from the SW lifecycle.
 */
export const SWUpdatePrompt = () => {
    const [showUpdate, setShowUpdate] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handleSWUpdate = async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) return;

            // If there's already a waiting worker
            if (registration.waiting) {
                setWaitingWorker(registration.waiting);
                setShowUpdate(true);
                return;
            }

            // Listen for new service worker installing
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        setWaitingWorker(newWorker);
                        setShowUpdate(true);
                    }
                });
            });
        };

        handleSWUpdate();

        let refreshing = false;
        const handleControllerChange = () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    const handleUpdate = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        setShowUpdate(false);
    };

    return (
        <AnimatePresence>
            {showUpdate && (
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="fixed bottom-[96px] left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[9500]"
                >
                    <div className="glass border border-primary/20 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-secondary to-primary" />

                        <button
                            onClick={() => setShowUpdate(false)}
                            className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-white">Nueva Versión Disponible</h4>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Actualización lista</p>
                            </div>
                        </div>

                        <button
                            onClick={handleUpdate}
                            className="w-full py-2.5 rounded-xl bg-primary text-background text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                        >
                            Actualizar Ahora
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
