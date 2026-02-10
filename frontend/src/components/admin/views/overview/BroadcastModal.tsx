import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, X, Loader2 } from 'lucide-react';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBroadcast: (data: { title: string; message: string; type: string }) => void;
    isLoading: boolean;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
    isOpen,
    onClose,
    onBroadcast,
    isLoading
}) => {
    const [broadcastMessage, setBroadcastMessage] = useState({ title: '', message: '', type: 'info' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onBroadcast(broadcastMessage);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0a0f18] border border-white/10 p-8 rounded-3xl w-full max-w-lg relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white"
                >
                    <X size={24} />
                </button>
                <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
                    <Bell className="text-primary" /> Transmisión Global
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Título</label>
                        <input
                            value={broadcastMessage.title}
                            onChange={e => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary"
                            placeholder="Ej: Alerta Climática"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Mensaje</label>
                        <textarea
                            value={broadcastMessage.message}
                            onChange={e => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary h-24"
                            placeholder="Mensaje a todos los usuarios..."
                            required
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {['info', 'warning', 'success'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setBroadcastMessage({ ...broadcastMessage, type })}
                                className={`p-2 rounded-lg text-xs font-bold uppercase ${broadcastMessage.type === type ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-background font-black py-4 rounded-xl uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Enviar Transmisión'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
