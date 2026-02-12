import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { Bot } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';

export const CocoWelcomeBubble = ({ onOpenChat }: { onOpenChat: () => void }) => {
    const { language } = useLanguageStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if shown in this session
        const hasBeenShown = sessionStorage.getItem('coco_welcome_shown');

        if (!hasBeenShown) {
            const timer = setTimeout(() => {
                setIsVisible(true);
                sessionStorage.setItem('coco_welcome_shown', 'true');
            }, 3000); // Show after 3 seconds

            return () => clearTimeout(timer);
        }
    }, []);

    const messages = {
        es: [
            "¡Pura Vida! Soy Coco Caribeño. 🥥",
            "¿Buscas un lugar rico para comer?",
            "¡Te ayudo a explorar el paraíso!",
        ],
        en: [
            "Pura Vida! I'm Coco Caribeño. 🥥",
            "Looking for a great place to eat?",
            "I'll help you explore paradise!",
        ]
    };

    const currentMessages = language === 'es' ? messages.es : messages.en;

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
                className="fixed bottom-[160px] left-4 z-[9005] max-w-[280px]"
            >
                <div className="glass p-6 rounded-[2rem] border-primary/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                                <Bot size={20} className="animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">COCO Caribeño</span>
                        </div>

                        <div className="space-y-1">
                            {currentMessages.map((msg, i) => (
                                <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.2) }}
                                    className={`text-base font-bold italic ${i === 0 ? 'text-white text-lg' : 'text-white/60'}`}
                                >
                                    {msg}
                                </motion.p>
                            ))}
                        </div>

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5 }}
                            onClick={() => {
                                setIsVisible(false);
                                onOpenChat();
                            }}
                            className="mt-2 bg-primary text-background font-black uppercase tracking-tighter text-xs py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {language === 'es' ? 'HABLAR CON COCO' : 'TALK TO COCO'}
                            <MessageCircle size={14} />
                        </motion.button>
                    </div>
                </div>

                {/* Visual Connector to the Bot Icon below */}
                <div className="w-4 h-4 glass border-r border-b border-primary/20 rotate-45 absolute -bottom-2 left-8 -z-10" />
            </motion.div>
        </AnimatePresence>
    );
};
