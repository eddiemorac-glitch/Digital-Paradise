import { motion } from 'framer-motion';
import { Compass, ShieldAlert, Heart, Info, Waves, Sun, Camera, ArrowLeft, ExternalLink, Megaphone } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';

interface CaribbeanGuideProps {
    onBack: () => void;
}

export const CaribbeanGuide = ({ onBack }: CaribbeanGuideProps) => {
    const { language } = useLanguageStore();

    const sections = [
        {
            title: language === 'es' ? 'Seguridad y Salud' : 'Safety & Health',
            icon: <ShieldAlert className="text-red-400" />,
            tips: [
                { icon: <Waves size={16} />, text: language === 'es' ? 'Cuidado con las corrientes de resaca en Playa Cocles.' : 'Beware of rip currents at Cocles Beach.' },
                { icon: <Heart size={16} />, text: language === 'es' ? 'Usa repelente natural, especialmente al atardecer.' : 'Use natural repellent, especially at sunset.' },
                { icon: <Sun size={16} />, text: language === 'es' ? 'Hidrátate bien; el sol del Caribe es más fuerte de lo que parece.' : 'Hydrate well; the Caribbean sun is stronger than it looks.' },
            ]
        },
        {
            title: language === 'es' ? 'Cultura y Lenguaje' : 'Culture & Language',
            icon: <Megaphone className="text-primary" />,
            tips: [
                { icon: <Info size={16} />, text: language === 'es' ? '"Pura Vida" es más que un hola, es un estado mental.' : '"Pura Vida" is more than a hello, it\'s a state of mind.' },
                { icon: <Info size={16} />, text: language === 'es' ? 'Aprende: "What up" es el saludo local en Patois.' : 'Learn: "What up" is the local Patois greeting.' },
                { icon: <Heart size={16} />, text: language === 'es' ? 'Respeta la propiedad privada y la calma de los locales.' : 'Respect private property and the local peace.' },
            ]
        },
    ];

    const gems = [
        { name: 'Punta Uva', type: 'Beach', img: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=1000&auto=format&fit=crop', desc: 'Aguas cristalinas y selva que toca el mar.' },
        { name: 'Gandoca', type: 'Nature', img: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=1000&auto=format&fit=crop', desc: 'Avistamiento de tortugas y manglares vírgenes.' },
        { name: 'Manzanillo', type: 'Adventure', img: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=1000&auto=format&fit=crop', desc: 'El mirador más icónico del Caribe Sur.' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-16 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        <ArrowLeft size={14} /> {language === 'es' ? 'Volver' : 'Back'}
                    </button>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                        GUÍA DE <span className="text-primary">SUPERVIVENCIA</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
                        {language === 'es' ? 'Todo lo que necesitas saber antes de entrar a la jungla' : 'Everything you need to know before entering the jungle'}
                    </p>
                </div>
                <div className="glass p-6 rounded-[2.5rem] border-white/10 flex items-center gap-4 bg-white/5">
                    <Compass size={40} className="text-primary animate-spin-slow" />
                </div>
            </div>

            {/* Quick Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sections.map((section, i) => (
                    <div key={i} className="glass p-10 rounded-[3rem] border-white/5 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                {section.icon}
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">{section.title}</h2>
                        </div>
                        <div className="space-y-4">
                            {section.tips.map((tip, j) => (
                                <div key={j} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                                    <div className="mt-1 text-primary">{tip.icon}</div>
                                    <p className="text-sm font-medium text-white/60">{tip.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Hidden Gems Slider-style Grid */}
            <section className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Joyas Ocultas</h2>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">Lugares que solo los locales conocen</p>
                    </div>
                    <button className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:underline">
                        Ver Mapa Completo <ExternalLink size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {gems.map((gem, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -10 }}
                            className="group relative h-96 rounded-[2.5rem] overflow-hidden cursor-pointer"
                        >
                            <img src={gem.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={gem.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-0 p-8 space-y-2">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                                    {gem.type}
                                </span>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{gem.name}</h3>
                                <p className="text-white/60 text-xs font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {gem.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Emergency Info */}
            <div className="bg-red-500/5 rounded-[3rem] p-12 border border-red-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <Megaphone size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">Números de Emergencia</h2>
                        <p className="text-red-500/60 font-black uppercase tracking-widest text-[10px]">Asistencia inmediata 24/7</p>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <button className="glass px-6 py-4 rounded-2xl text-white font-black hover:bg-white/10 transition-all border-white/10">
                        911 <span className="text-white/20 ml-2 font-bold uppercase tracking-widest text-[8px]">Emergencias</span>
                    </button>
                    <button className="glass px-6 py-4 rounded-2xl text-white font-black hover:bg-white/10 transition-all border-white/10">
                        2750-0230 <span className="text-white/20 ml-2 font-bold uppercase tracking-widest text-[8px]">Policía PV</span>
                    </button>
                    <button className="glass px-6 py-4 rounded-2xl text-white font-black hover:bg-white/10 transition-all border-white/10">
                        2750-0626 <span className="text-white/20 ml-2 font-bold uppercase tracking-widest text-[8px]">Clínica</span>
                    </button>
                </div>
            </div>

            {/* Photo Opps */}
            <div className="relative rounded-[3rem] p-16 border border-white/10 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary">
                            <Camera size={24} />
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Comparte tu Aventura</h2>
                        <p className="text-white/40 text-lg font-medium">Usa el hashtag <span className="text-primary">#CaribeDigital</span> en tus historias de Instagram y podrías ganar cupones semanales para tus restaurantes favoritos.</p>
                    </div>
                    <div className="flex -space-x-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-40 h-56 rounded-3xl border-4 border-[#0a0f18] overflow-hidden shadow-2xl rotate-[5deg] group-hover:rotate-0 transition-transform first:rotate-[-5deg] last:translate-y-4">
                                <img src={`https://images.unsplash.com/photo-${i === 1 ? '1542137722061-efd1cbdf156c' : i === 2 ? '1590523277543-a94d2e4eb00b' : '1519066629447-267ffbb62d4b'}?q=80&w=400`} className="w-full h-full object-cover" alt="User Post" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
