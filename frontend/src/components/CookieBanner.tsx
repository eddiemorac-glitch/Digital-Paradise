import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-6 right-6 z-[100] max-w-lg mx-auto"
                >
                    <div className="glass p-6 rounded-[2rem] border-primary/20 flex items-center gap-6 shadow-2xl">
                        <div className="bg-primary/10 p-4 rounded-2xl">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Control de Cookies</h4>
                            <p className="text-xs text-white/60 leading-tight">
                                Usamos cookies para optimizar tu experiencia tropical. Al continuar, aceptas nuestra política de privacidad.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleAccept}
                                className="px-4 py-2 bg-primary text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
