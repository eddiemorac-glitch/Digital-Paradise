import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X, User, Store, Bike, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../api/socket';
import { messageApi, Message } from '../api/messages';
import { useQuery } from '@tanstack/react-query';

interface OrderChatProps {
    orderId: string;
    onClose: () => void;
    partnerName?: string;
    partnerRole?: 'merchant' | 'delivery' | 'client';
}

export const OrderChat: React.FC<OrderChatProps> = ({ orderId, onClose, partnerName, partnerRole }) => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: history, isLoading } = useQuery({
        queryKey: ['chat-history', orderId],
        queryFn: () => messageApi.getChat(orderId),
    });

    useEffect(() => {
        if (history) {
            setMessages(history);
        }
    }, [history]);

    useEffect(() => {
        socketService.connect();
        socketService.joinOrderChat(orderId);

        socketService.onNewMessage((msg: Message) => {
            if (msg.orderId === orderId) {
                setMessages(prev => [...prev, msg]);
            }
        });

        return () => {
            // Socket listeners cleanup would happen globally or we can add off() methods
        };
    }, [orderId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        socketService.sendChatMessage(orderId, newMessage, user.id);
        setNewMessage('');
    };

    const getPartnerIcon = () => {
        switch (partnerRole) {
            case 'merchant': return <Store size={14} />;
            case 'delivery': return <Bike size={14} />;
            default: return <User size={14} />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 w-full max-w-[350px] z-50 h-[500px] flex flex-col"
        >
            <div className="glass flex-1 rounded-[2.5rem] border-white/10 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="bg-primary/10 border-b border-white/5 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                            {getPartnerIcon()}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">Chat de Orden</p>
                            <h4 className="text-sm font-black text-white">{partnerName || 'Soporte / Aliado'}</h4>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Body */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-primary" />
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-4 rounded-3xl text-xs font-medium ${msg.senderId === user?.id
                                    ? 'bg-primary text-background rounded-tr-none'
                                    : 'glass border-white/5 text-white rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                    <p className={`text-[8px] mt-1 opacity-40 ${msg.senderId === user?.id ? 'text-black' : 'text-white'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Smart Shorthands for Couriers */}
                {user?.role === 'delivery' && (
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide bg-black/20">
                        {['Ya llegué', 'En camino', 'Mucha presa', '¿Dónde estás?'].map(txt => (
                            <button
                                key={txt}
                                onClick={() => {
                                    socketService.sendChatMessage(orderId, txt, user.id);
                                }}
                                className="px-3 py-1.5 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border border-white/5 transition-all text-white/40"
                            >
                                {txt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-4 bg-white/5 border-t border-white/5 flex gap-2"
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex-1 text-xs text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                        type="submit"
                        className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-background hover:scale-105 active:scale-95 transition-transform"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </motion.div>
    );
};
