import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Coffee, ArrowLeft, Zap, Info } from 'lucide-react';
import { CocoIcon } from './CocoIcon';
import { useLanguageStore } from '../store/languageStore';
import { useAuthStore } from '../store/authStore'; // Import auth store for token
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/users';
import { cocoAiApi } from '../api/coco-ai';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface Message {
    id: number;
    text: string;
    sender: 'ai' | 'user';
    timestamp: Date;
    suggestedAction?: {
        label: string;
        view: string;
    };
}

interface CaribeAssistantProps {
    onBack: () => void;
    onNavigate?: (view: string, params?: any) => void;
}

export const CaribeAssistant = ({ onBack, onNavigate }: CaribeAssistantProps) => {
    const { language, t } = useLanguageStore();
    const token = useAuthStore(state => state.token); // Get token
    const { data: profile } = useQuery({
        queryKey: ['user-profile'],
        queryFn: userApi.getProfile,
        enabled: !!token,
    });

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: language === 'es'
                ? `¡Hola${profile ? ' ' + profile.fullName.split(' ')[0] : ''}! Soy COCO Caribeño, tu guía en DIGITAL PARADISE. ¿En qué puedo ayudarte? Puedo buscar comercios, recomendarte playas o hablarte sobre la cultura local. ¡Pura Vida!`
                : `Hi${profile ? ' ' + profile.fullName.split(' ')[0] : ''}! I am COCO Caribeño, your DIGITAL PARADISE guide. How can I help you? I can search for merchants, recommend beaches, or tell you about local culture. Pura Vida!`,
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Typewriter refs
    const streamBufferRef = useRef('');
    const aiMsgIdRef = useRef<number | null>(null);

    // Smooth typing effect loop
    useEffect(() => {
        const interval = setInterval(() => {
            if (!aiMsgIdRef.current) return;

            setMessages(prev => {
                return prev.map(m => {
                    if (m.id !== aiMsgIdRef.current) return m;

                    const targetText = streamBufferRef.current;
                    const currentLen = m.text.length;

                    if (currentLen < targetText.length) {
                        // Add 2 characters every 25ms (~80 chars/sec) - smooth reading speed
                        // Adjust slice length to speed up/slow down
                        const nextText = targetText.slice(0, currentLen + 2);
                        return { ...m, text: nextText };
                    }
                    return m;
                });
            });
        }, 25);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        // Flush previous typing if interrupted
        if (aiMsgIdRef.current && streamBufferRef.current) {
            setMessages(prev => prev.map(m =>
                m.id === aiMsgIdRef.current ? { ...m, text: streamBufferRef.current } : m
            ));
        }

        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const reader = await cocoAiApi.chatStream(userMsg.text, token || '');
            if (!reader) throw new Error('No stream reader available');

            // Create initial empty AI message
            const aiMsgId = Date.now() + 1;
            const aiMsg: Message = {
                id: aiMsgId,
                text: '',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);

            // Initialize buffer for this message
            aiMsgIdRef.current = aiMsgId;
            streamBufferRef.current = '';

            const decoder = new TextDecoder();
            let partialLine = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = (partialLine + chunk).split('\n');
                partialLine = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                    try {
                        const data = JSON.parse(trimmedLine.slice(6));
                        if (data.text) {
                            // PUSH TO BUFFER, NOT STATE
                            streamBufferRef.current += data.text;
                        }
                    } catch (e) {
                        // Silent catch for JSON parse errors
                    }
                }
            }
        } catch (err) {
            console.error('COCO Stream Error:', err);
            const errorMsg: Message = {
                id: Date.now() + 2,
                text: language === 'es'
                    ? 'Lo siento, tuve un pequeño problema tropical. ¿Podrías intentar de nuevo?'
                    : 'Sorry, I had a little tropical glitch. Could you try again?',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto glass rounded-[3rem] border-white/10 overflow-hidden shadow-2xl relative"
        >
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-background/40 backdrop-blur-md flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="rounded-2xl hover:bg-white/5"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(0,255,102,0.1)]">
                            <Bot size={28} className="animate-pulse" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-4 border-background animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2 italic">
                            COCO <span className="text-primary italic">Caribeño</span>
                        </h2>
                        <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.3em]">{t('ai_title')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="glass" size="icon" className="rounded-2xl w-12 h-12">
                        <Info size={18} />
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[85%] flex gap-4 ${msg.sender === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                                <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-lg ${msg.sender === 'ai' ? 'bg-primary text-background' : 'bg-white/10 text-white'}`}>
                                    {msg.sender === 'ai' ? <Bot size={20} /> : <User size={20} />}
                                </div>
                                <div className={`p-6 rounded-[2.5rem] shadow-xl ${msg.sender === 'ai'
                                    ? 'bg-white/5 rounded-tl-none border border-white/10 text-white/90 font-medium leading-relaxed'
                                    : 'bg-primary text-background rounded-tr-none font-black italic shadow-primary/20'
                                    }`}>
                                    <p className="text-sm md:text-base">{msg.text}</p>
                                    {msg.suggestedAction && onNavigate && (
                                        <Button
                                            onClick={() => onNavigate(msg.suggestedAction!.view)}
                                            variant="glass"
                                            className="mt-6 w-full border-primary/20 text-primary hover:bg-primary/10 rounded-2xl h-12"
                                        >
                                            <span className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                                                {msg.suggestedAction.label}
                                                <Sparkles size={14} className="animate-pulse" />
                                            </span>
                                        </Button>
                                    )}
                                    <div className="flex items-center justify-between mt-4">
                                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-40`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {msg.sender === 'ai' && <Zap size={10} className="text-primary/40" />}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start pl-14">
                            <Card variant="glass" className="p-4 rounded-3xl flex gap-2">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(0,255,102,0.5)]" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary/60 rounded-full" />
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary/40 rounded-full" />
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Actions */}
            <div className="px-8 pb-6 flex gap-4 overflow-x-auto scrollbar-hide relative z-10">
                <Button
                    variant="glass"
                    onClick={() => setInput(t('quick_points'))}
                    className="flex-shrink-0 rounded-2xl h-11 border-white/5 hover:border-primary/30"
                >
                    <span className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-white/60">
                        <CocoIcon size={14} /> {t('quick_points')}
                    </span>
                </Button>
                <Button
                    variant="glass"
                    onClick={() => setInput(t('quick_eat'))}
                    className="flex-shrink-0 rounded-2xl h-11 border-white/5 hover:border-primary/30"
                >
                    <span className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-white/60">
                        <Coffee size={14} className="text-primary" /> {t('quick_eat')}
                    </span>
                </Button>
                <Button
                    variant="glass"
                    onClick={() => setInput(t('quick_eco'))}
                    className="flex-shrink-0 rounded-2xl h-11 border-white/5 hover:border-emerald-400/30"
                >
                    <span className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-white/60">
                        <Sparkles size={14} className="text-emerald-400" /> {t('quick_eco')}
                    </span>
                </Button>
            </div>

            {/* Input Area */}
            <div className="p-8 pt-6 border-t border-white/5 bg-background/80 backdrop-blur-2xl relative z-20">
                <div className="bg-white/5 rounded-[2.5rem] p-3 border border-white/10 flex items-center gap-4 focus-within:border-primary/30 transition-all shadow-inner">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isTyping ? "COCO Caribeño está escribiendo..." : t('ai_placeholder')}
                        disabled={isTyping}
                        className="bg-transparent border-none outline-none flex-1 text-white px-6 py-3 font-medium placeholder:text-white/10 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Button
                        variant="primary"
                        size="icon"
                        onClick={handleSend}
                        disabled={isTyping || !input.trim()}
                        className="w-14 h-14 rounded-2xl shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_40px_rgba(0,255,102,0.5)] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        <Send size={24} />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};
