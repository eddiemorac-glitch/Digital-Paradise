import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Coffee, ArrowLeft, Zap, Info, MapPin, Compass } from 'lucide-react';
import { CocoIcon } from './CocoIcon';
import { useLanguageStore } from '../store/languageStore';
import { useAuthStore } from '../store/authStore';
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
    const token = useAuthStore(state => state.token);
    const { data: profile } = useQuery({
        queryKey: ['user-profile'],
        queryFn: userApi.getProfile,
        enabled: !!token,
    });

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: language === 'es'
                ? `¡Hola${profile ? ' ' + profile.fullName.split(' ')[0] : ''}! Soy COCO Caribeño, tu guía en DIGITAL PARADISE. 🌴 ¿Qué aventura buscamos hoy?`
                : `Hi${profile ? ' ' + profile.fullName.split(' ')[0] : ''}! I am COCO Caribeño, your DIGITAL PARADISE guide. 🌴 What adventure are we looking for today?`,
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
                        const nextText = targetText.slice(0, currentLen + 3); // Slightly faster typing
                        return { ...m, text: nextText };
                    }
                    return m;
                });
            });
        }, 20);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
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

            const aiMsgId = Date.now() + 1;
            const aiMsg: Message = {
                id: aiMsgId,
                text: '',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);

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
                            streamBufferRef.current += data.text;
                        }
                    } catch (e) { }
                }
            }
        } catch (err) {
            console.error('COCO Stream Error:', err);
            const errorMsg: Message = {
                id: Date.now() + 2,
                text: language === 'es'
                    ? 'Ups, perdí la conexión con el paraíso. ¿Intentamos de nuevo?'
                    : 'Oops, lost connection with paradise. Try again?',
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex flex-col h-[100dvh]"
        >
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00BFA5]/20 blur-[100px] rounded-full animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <div className="flex-none p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="rounded-full w-10 h-10 hover:bg-white/10 text-white/80"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                                <CocoIcon size={24} className="animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-black animate-bounce" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-white leading-none mb-1">
                                Coco <span className="text-primary">Caribeño</span>
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Online AI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 scrollbar-hide relative z-10 w-full max-w-3xl mx-auto"
            >
                <div className="h-4" /> {/* Spacer */}
                <AnimatePresence mode='popLayout'>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            layout
                            className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'} group`}
                        >
                            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
                                <div className={`px-5 py-4 rounded-[1.5rem] shadow-sm relative ${msg.sender === 'ai'
                                    ? 'bg-white/10 backdrop-blur-md rounded-tl-none border border-white/5 text-white/90'
                                    : 'bg-gradient-to-br from-primary to-emerald-600 text-black font-bold rounded-tr-none shadow-[0_4px_15px_rgba(0,255,102,0.2)]'
                                    }`}>
                                    <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                                    {/* Link Preview / Action */}
                                    {msg.suggestedAction && onNavigate && (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onNavigate(msg.suggestedAction!.view)}
                                            className="mt-3 w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-3 flex items-center gap-3 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                <Compass size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black uppercase text-primary tracking-wider">{t('explore')}</p>
                                                <p className="text-xs text-white/80">{msg.suggestedAction.label}</p>
                                            </div>
                                            <ArrowLeft size={14} className="rotate-180 text-white/40" />
                                        </motion.button>
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-white/20 mt-1 px-2">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white/5 rounded-[1.5rem] rounded-tl-none px-4 py-3 flex gap-1.5 items-center ml-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="h-4" /> {/* Spacer */}
            </div>

            {/* Suggestions & Input */}
            <div className="flex-none p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20 w-full max-w-3xl mx-auto">
                {/* Quick Chips */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mask-fade-right">
                    {[
                        { icon: MapPin, label: t('quick_points'), color: "text-blue-400" },
                        { icon: Coffee, label: t('quick_eat'), color: "text-orange-400" },
                        { icon: Sparkles, label: t('quick_eco'), color: "text-emerald-400" }
                    ].map((chip, idx) => (
                        <motion.button
                            key={idx}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setInput(chip.label)}
                            className="flex-shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-3 pr-4 py-2 flex items-center gap-2 transition-colors"
                        >
                            <chip.icon size={14} className={chip.color} />
                            <span className="text-xs font-bold text-white/80 whitespace-nowrap">{chip.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Input Bar */}
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative flex items-center gap-2"
                >
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isTyping ? "..." : t('ai_placeholder')}
                            disabled={isTyping}
                            className="w-full bg-white/10 border border-white/10 rounded-[2rem] px-6 py-4 text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/15 transition-all text-base md:text-lg relative z-10"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${input.trim()
                            ? 'bg-primary text-black hover:scale-105 shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                            : 'bg-white/5 text-white/20'
                            }`}
                    >
                        <Send size={20} className={input.trim() ? 'ml-1' : ''} />
                    </Button>
                </form>
            </div>
        </motion.div>
    );
};
