import React from 'react';
import { motion } from 'framer-motion';
import { Bell, X, Package, ChevronRight, Zap } from 'lucide-react';
import { Order } from '../../../api/orders';

interface NewOrderOverlayProps {
    order: Order;
    onClose: () => void;
    language: string;
}

export const NewOrderOverlay: React.FC<NewOrderOverlayProps> = ({ order, onClose, language }) => {
    // Sound effect could be added here
    React.useEffect(() => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => { }); // Ignore if browser blocks auto-play
    }, []);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/40 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="relative w-full max-w-lg glass rounded-[3.5rem] border-primary/30 shadow-[0_0_100px_rgba(0,255,102,0.15)] overflow-hidden"
            >
                {/* Animated Background Pulse */}
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />

                <div className="relative p-10 flex flex-col items-center text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>

                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-24 h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center text-primary mb-8 border border-primary/30 shadow-[0_0_40px_rgba(0,255,102,0.3)]"
                    >
                        <Bell size={40} className="fill-primary" />
                    </motion.div>

                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2">
                        {language === 'es' ? '¡NUEVA ORDEN!' : 'NEW ORDER!'}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8">
                        #{order.id.slice(-8).toUpperCase()}
                    </p>

                    <div className="w-full bg-white/5 rounded-3xl p-6 border border-white/5 mb-8 text-left">
                        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{language === 'es' ? 'Cliente' : 'Customer'}</p>
                                <p className="text-lg font-black text-white">{order.user?.fullName || 'Cliente Caribe'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                    <span className="text-white/60">
                                        <span className="text-primary mr-2">{item.quantity}x</span>
                                        {item.product?.name || item.event?.title || 'Item'}
                                    </span>
                                    <span className="text-white/20">₡{Number(item.price).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{language === 'es' ? 'Total Pedido' : 'Order Total'}</span>
                            <span className="text-2xl font-black text-primary font-mono">₡{Number(order.total).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 w-full">
                        <button
                            onClick={onClose}
                            className="bg-primary text-background font-black uppercase tracking-[0.2em] py-5 rounded-[2rem] text-xs shadow-[0_10px_30px_rgba(0,255,102,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                            <Zap size={18} className="fill-background" />
                            {language === 'es' ? 'ENTRAR AL COMANDO' : 'ENTER COMMAND'}
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
