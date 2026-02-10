import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, ArrowRight, ArrowLeft, Share2, Heart, MessageSquare, Clock, Filter, Leaf, Loader2 } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';
import { useQuery } from '@tanstack/react-query';
import { blogApi, BlogPost } from '../api/blog';
import { useNotificationStore } from '../store/notificationStore';

interface JungleBlogProps {
    onBack: () => void;
    onNavigate: (view: string, params?: any) => void;
}

const CATEGORIES = [
    { id: 'all', label: 'Todos', icon: '🌴' },
    { id: 'sustainable', label: 'Eco-Historial', icon: '🌿' },
    { id: 'Naturaleza', label: 'Naturaleza', icon: '🐢' },
    { id: 'Cultura', label: 'Cultura', icon: '🗿' },
    { id: 'Gastronomía', label: 'Gastronomía', icon: '🍍' },
    { id: 'Noticias', label: 'Noticias', icon: '🗞️' },
];

export const JungleBlog = ({ onBack, onNavigate }: JungleBlogProps) => {
    const { language } = useLanguageStore();
    const [activeCategory, setActiveCategory] = useState('all');

    const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
        queryKey: ['blog-posts'],
        queryFn: () => blogApi.getAll()
    });

    const filteredArticles = posts.filter(post => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'sustainable') return post.isSustainableHighlight;
        return post.tags?.includes(activeCategory);
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-48 space-y-6">
                <Loader2 className="animate-spin text-accent" size={64} />
                <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">
                    Sintonizando con la jungla...
                </p>
            </div>
        );
    }


    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        <ArrowLeft size={14} /> {language === 'es' ? 'Volver' : 'Back'}
                    </button>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none">
                        BLOG DE LA <br /><span className="text-accent italic">JUNGLA</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">
                        {language === 'es' ? 'Historias, Ritmos y Sabores de Limón' : 'Stories, Rhythms and Flavors of Limón'}
                    </p>
                </div>
                <div className="flex gap-4 mb-4">
                    <div className="glass p-4 rounded-3xl border-white/5 flex flex-col items-center">
                        <span className="text-2xl font-black text-white">45</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Artículos</span>
                    </div>
                    <div className="glass p-4 rounded-3xl border-white/5 flex flex-col items-center">
                        <span className="text-2xl font-black text-accent">1.2k</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Lectores</span>
                    </div>
                </div>
            </div>

            {/* Categories Navigation */}
            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <div className="glass p-2 rounded-2xl border-white/5 flex gap-2 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                        <Filter size={18} />
                    </div>
                </div>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shrink-0 border ${activeCategory === cat.id
                            ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                            : 'glass text-white/40 border-white/5 hover:border-white/20'
                            }`}
                    >
                        <span>{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Featured Hero Article */}
            <div
                onClick={() => onNavigate('sustainability')}
                className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-[3.5rem] overflow-hidden glass border border-white/10 group cursor-pointer hover:border-accent/30 transition-all"
            >
                <div className="lg:col-span-7 h-[400px] lg:h-[600px] overflow-hidden relative">
                    <img
                        src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2070&auto=format&fit=crop"
                        alt="Featured"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute top-8 left-8">
                        <span className="bg-accent text-white px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">
                            {language === 'es' ? 'Edición Especial' : 'Special Edition'}
                        </span>
                    </div>
                </div>
                <div className="lg:col-span-5 p-12 lg:p-16 flex flex-col justify-between bg-white/[0.02]">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-accent text-[10px] font-black uppercase tracking-widest">
                            <BookOpen size={16} /> Crónicas del Caribe
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight">
                            {language === 'es' ? 'Puerto Viejo: El Corazón del Reggae-Roots' : 'Puerto Viejo: The Heart of Reggae-Roots'}
                        </h2>
                        <p className="text-white/60 text-lg leading-relaxed font-medium italic">
                            {language === 'es'
                                ? 'Exploramos cómo la música moldeó la identidad de un pueblo que vive al ritmo del mar y la selva.'
                                : 'We explore how music shaped the identity of a town that lives to the rhythm of the sea and the jungle.'}
                        </p>
                    </div>
                    <div className="pt-10 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black">CD</div>
                            <div>
                                <p className="text-xs font-black text-white uppercase italic">Editor Jefe</p>
                                <p className="text-[10px] text-white/40 font-bold">26 Mayo, 2026</p>
                            </div>
                        </div>
                        <button className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-accent text-white flex items-center justify-center transition-all">
                            <ArrowRight size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Article Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {filteredArticles.map((art) => (
                        <motion.div
                            key={art.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -10 }}
                            onClick={() => onNavigate('assistant', { articleId: art.id })}
                            className="glass rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col group cursor-pointer"
                        >
                            <div className="h-64 relative overflow-hidden">
                                <img
                                    src={art.coverImage || 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800'}
                                    alt={art.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    {art.isSustainableHighlight && (
                                        <span className="bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary/30 text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                            <Leaf size={10} /> Eco-Impact
                                        </span>
                                    )}
                                    <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black uppercase tracking-widest text-white">
                                        {art.tags?.[0] || 'Caribe'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 text-white/30 text-[8px] font-black uppercase tracking-widest mb-4">
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(art.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><Clock size={10} /> 5 min</span>
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter group-hover:text-accent transition-colors">
                                    {art.title}
                                </h3>
                                <p className="text-white/40 text-sm font-medium mb-8 flex-1 line-clamp-3">
                                    {art.excerpt}
                                </p>
                                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                    <div className="flex gap-4">
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-white/40 group-hover:text-white transition-colors">
                                            <Heart size={14} className="group-hover:text-red-500 transition-colors" /> {art.likes}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-white/40 group-hover:text-white transition-colors">
                                            <MessageSquare size={14} /> {art.views}
                                        </span>
                                    </div>
                                    <Share2 size={16} className="text-white/20 hover:text-white transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Newsletter */}
            <div className="relative rounded-[3rem] p-16 border border-white/10 overflow-hidden isolate">
                <div className="absolute inset-0 bg-accent/5 -z-10" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 rounded-full blur-[80px]" />
                <div className="flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                    <div className="flex-1 space-y-4">
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic">Suscríbete a la Jungla</h2>
                        <p className="text-white/40 text-lg font-medium">Recibe las mejores historias, eventos secretos y descuentos VIP cada semana.</p>
                    </div>
                    <div className="w-full max-w-md flex items-center glass rounded-3xl p-2 border border-white/10">
                        <input
                            type="email"
                            placeholder="tu@email.com"
                            className="bg-transparent border-none outline-none flex-1 text-white px-6 py-4 font-bold"
                        />
                        <button
                            onClick={() => useNotificationStore.getState().addNotification({
                                title: language === 'es' ? '¡Bienvenido a la Jungla!' : 'Welcome to the Jungle!',
                                message: language === 'es' ? 'Revisa tu correo para confirmar tu suscripción.' : 'Check your email to confirm your subscription.',
                                type: 'success'
                            })}
                            className="bg-accent text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-[0_0_20px_rgba(255,50,100,0.4)] transition-all"
                        >
                            Unirme
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
