import { motion } from 'framer-motion';
import { ShieldCheck, Heart, Zap, Waves, ArrowLeft, Star, Users } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';

interface AboutUsProps {
    onBack: () => void;
}

export const AboutUs = ({ onBack }: AboutUsProps) => {
    const { language } = useLanguageStore();

    const values = [
        { title: language === 'es' ? 'ADN Caribeño' : 'Caribbean DNA', desc: language === 'es' ? 'Nacimos en Puerto Viejo, respiramos el mar y entendemos el ritmo de la selva.' : 'We were born in Puerto Viejo, we breathe the sea and understand the rhythm of the jungle.', icon: <Waves className="text-blue-400" /> },
        { title: language === 'es' ? 'Tecnología Humana' : 'Human Technology', desc: language === 'es' ? 'Creamos herramientas digitales que fortalecen los lazos de la comunidad real.' : 'We create digital tools that strengthen the bonds of the real community.', icon: <Zap className="text-primary" /> },
        { title: language === 'es' ? 'Protección Local' : 'Local Protection', desc: language === 'es' ? 'Priorizamos la seguridad de tus datos y la integridad de nuestro entorno natural.' : 'We prioritize the security of your data and the integrity of our natural environment.', icon: <ShieldCheck className="text-accent" /> },
    ];

    const milestones = [
        { year: '2023', title: 'La Idea', desc: 'Una servilleta en un café de Cocles bastó para soñar con un Puerto Viejo conectado.' },
        { year: '2024', title: 'Lanzamiento Beta', desc: 'Primeros 10 comercios confían en la Tortuga Digital.' },
        { year: '2025', title: 'Crecimiento', desc: 'Expandimos a Cahuita y Manzanillo con logística propia.' },
        { year: '2026', title: 'Pura Vida Edition', desc: 'Reinventamos la plataforma con IA y enfoque 100% Sostenible.' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-20 pb-20"
        >
            {/* Hero Section */}
            <div className="relative h-[600px] rounded-[3.5rem] overflow-hidden flex items-center justify-center text-center px-6">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
                </div>
                <div className="relative z-10 max-w-4xl space-y-8">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-primary hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4 bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
                    >
                        <ArrowLeft size={14} /> {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
                    </button>
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none italic">
                        Misión <br /><span className="text-primary underline decoration-white/20">Tortuga</span>
                    </h1>
                    <p className="text-white/80 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto italic">
                        {language === 'es'
                            ? 'Digitalizando el paraíso para que tú solo te preocupes de disfrutar la vida.'
                            : 'Digitalizing paradise so you only have to worry about enjoying life.'}
                    </p>
                </div>
            </div>

            {/* Our Values */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {values.map((v, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="glass p-12 rounded-[3rem] border-white/5 space-y-6 relative overflow-hidden group"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">
                            {v.icon}
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">{v.title}</h3>
                        <p className="text-white/40 leading-relaxed font-medium">
                            {v.desc}
                        </p>
                    </motion.div>
                ))}
            </section>

            {/* Storytelling Content */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                        ¿Por qué <br /><span className="text-accent">DIGITAL PARADISE?</span>
                    </h2>
                    <div className="space-y-6 text-white/60 text-lg leading-relaxed font-medium">
                        <p>
                            En el Caribe Sur, el tiempo fluye diferente. Pero los negocios y la logística local necesitaban un aliado que entendiera esa fluidez y la tradujera en eficiencia.
                        </p>
                        <p>
                            Creamos esta plataforma para empoderar al chef de la sodita local, al artesano de Puerto Viejo y al repartidor que conoce cada atajo entre la jungla y la playa.
                        </p>
                        <div className="pt-8 grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-4xl font-black text-white">50+</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Comercios Afiliados</p>
                            </div>
                            <div>
                                <p className="text-4xl font-black text-white">100%</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Orgullo Caribeño</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <img src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=1000&auto=format&fit=crop" className="rounded-[2.5rem] w-full h-80 object-cover mt-12" alt="Landscape" />
                    <img src="https://images.unsplash.com/photo-1519066629447-267ffbb62d4b?q=80&w=1000&auto=format&fit=crop" className="rounded-[2.5rem] w-full h-80 object-cover" alt="Sloth" />
                </div>
            </section>

            {/* Timeline */}
            <section className="space-y-12">
                <div className="text-center">
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic">Nuestra Evolución</h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">La historia de un sueño digital</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {milestones.map((m, i) => (
                        <div key={i} className="glass p-8 rounded-[2rem] border-white/5 relative">
                            <span className="text-primary font-black text-xl mb-4 block">0{i + 1}</span>
                            <p className="text-2xl font-black text-white mb-2">{m.year}</p>
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-3">{m.title}</h4>
                            <p className="text-[10px] text-white/40 leading-relaxed font-bold">{m.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Team/Community */}
            <div className="bg-white/5 rounded-[3.5rem] p-16 border border-white/10 text-center space-y-12 overflow-hidden relative">
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
                <h2 className="text-4xl font-black uppercase tracking-tighter italic relative z-10">Impulsado por la Gente</h2>
                <div className="flex justify-center gap-12 relative z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                            <Users size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Comunidad Activa</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent/20">
                            <Heart size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Amor por Limón</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-400 border border-blue-400/20">
                            <Star size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Excelencia Local</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
