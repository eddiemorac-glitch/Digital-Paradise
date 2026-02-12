import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Shows a toast when a new Service Worker version is detected.
 * Uses the `useRegisterSW` hook from vite-plugin-pwa.
 */
export const SWUpdatePrompt = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW Registration Error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
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
                            onClick={close}
                            className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-white">
                                    {offlineReady ? 'Contenido Disponible Offline' : 'Nueva Versión Disponible'}
                                </h4>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    {offlineReady ? 'App lista para usar sin conexión' : 'Actualización lista para instalar'}
                                </p>
                            </div>
                        </div>

                        {needRefresh && (
                            <button
                                onClick={() => updateServiceWorker(true)}
                                className="w-full py-2.5 rounded-xl bg-primary text-background text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                            >
                                Actualizar Ahora
                            </button>
                        )}

                        {offlineReady && !needRefresh && (
                            <button
                                onClick={close}
                                className="w-full py-2.5 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                            >
                                Entendido
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
