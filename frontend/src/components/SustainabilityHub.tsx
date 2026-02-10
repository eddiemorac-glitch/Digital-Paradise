import { useQuery } from '@tanstack/react-query';
import { merchantApi } from '../api/merchants';
import { motion } from 'framer-motion';
import { Leaf, Globe, Recycle, Wind, Droplets, ArrowLeft, ExternalLink, Sparkles, Star } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';

interface SustainabilityHubProps {
    onBack: () => void;
    onNavigate: (view: string, params?: any) => void;
}

export const SustainabilityHub = ({ onBack, onNavigate }: SustainabilityHubProps) => {
    const { language } = useLanguageStore();

    const { data: merchants } = useQuery({
        queryKey: ['merchants-sustainable'],
        queryFn: () => merchantApi.getAll({ isSustainable: true })
    });

    const sustainableMerchants = merchants || [];

    const stats = [
        { label: language === 'es' ? 'Plástico Evitado' : 'Plastic Avoided', value: '1.2k kg', icon: <Recycle size={20} />, color: 'text-green-400' },
        { label: language === 'es' ? 'Huella Carbono' : 'Carbon Footprint', value: '-12%', icon: <Wind size={20} />, color: 'text-blue-400' },
        { label: language === 'es' ? 'Agua Ahorrada' : 'Water Saved', value: '45k L', icon: <Droplets size={20} />, color: 'text-cyan-400' },
    ];

    const initiatives = [
        {
            title: language === 'es' ? 'Empaques Biodegradables' : 'Biodegradable Packaging',
            desc: language === 'es' ? 'Impulsamos que todos nuestros comercios utilicen empaques compostables hechos de fibra de coco y yuca.' : 'We encourage all our shops to use compostable packaging made from coconut and cassava fiber.',
            icon: <Leaf className="text-primary" size={24} />
        },
        {
            title: language === 'es' ? 'Misiones Carbono Cero' : 'Zero Carbon Missions',
            desc: language === 'es' ? 'El 80% de nuestras entregas en Puerto Viejo se realizan en bicicleta o vehículos eléctricos.' : '80% of our deliveries in Puerto Viejo are made by bicycle or electric vehicles.',
            icon: <Wind className="text-blue-400" size={24} />
        },
        {
            title: language === 'es' ? 'Comercio Local' : 'Local Commerce',
            desc: language === 'es' ? 'Priorizamos productos de fincas locales para reducir el transporte y apoyar la economía de Limón.' : 'We prioritize products from local farms to reduce transport and support Limón\'s economy.',
            icon: <Globe className="text-orange-400" size={24} />
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-16 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        <ArrowLeft size={14} /> {language === 'es' ? 'Volver' : 'Back'}
                    </button>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                        Huella <span className="text-primary">Verde</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs mt-2">
                        {language === 'es' ? 'Compromiso Caribe Digital 2026' : 'Caribe Digital 2026 Commitment'}
                    </p>
                </div>
                <div className="glass p-6 rounded-[2.5rem] border-primary/20 bg-primary/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                        <Leaf size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">Impacto Positivo</p>
                        <p className="text-lg font-black text-white">Nivel Esmeralda</p>
                    </div>
                </div>
            </div>

            {/* Impact Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center text-center gap-4"
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Featured Initiative */}
            <div className="relative rounded-[3rem] overflow-hidden group min-h-[400px] flex items-end shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2026&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="relative p-12 space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-background text-[10px] font-black uppercase tracking-widest mb-2">
                        <Sparkles size={12} /> PROYECTO DESTACADO
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                        {language === 'es' ? 'Rescate de Corales Gandoca' : 'Gandoca Coral Rescue'}
                    </h2>
                    <p className="text-white/60 font-medium leading-relaxed">
                        {language === 'es'
                            ? 'Por cada pedido realizado a través de un comercio certificado "Sostenible", donamos un porcentaje a la reforestación de arrecifes en Gandoca-Manzanillo.'
                            : 'For every order placed through a "Sustainable" certified merchant, we donate a percentage to the reforestation of reefs in Gandoca-Manzanillo.'}
                    </p>
                    <button
                        onClick={() => onNavigate('assistant', { topic: 'gandoca_corals' })}
                        className="flex items-center gap-2 bg-white text-background px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
                    >
                        {language === 'es' ? 'Saber más' : 'Learn more'} <ExternalLink size={14} />
                    </button>
                </div>
            </div>

            {/* Sustainable Merchants List */}
            <section className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">{language === 'es' ? 'Red de Alianza Verde' : 'Green Alliance Network'}</h2>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">{language === 'es' ? 'Comercios certificados con impacto positivo' : 'Certified merchants with positive impact'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sustainableMerchants.length > 0 ? sustainableMerchants.map((merchant, i) => (
                        <motion.div
                            key={merchant.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-6 rounded-[2.5rem] border-white/5 hover:border-primary/20 transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Leaf className="text-primary" size={60} />
                            </div>
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-primary font-black text-2xl relative z-10">
                                {merchant.logoUrl ? <img src={merchant.logoUrl} className="w-full h-full object-cover rounded-[1.5rem]" alt={merchant.name} /> : merchant.name[0]}
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-black text-white uppercase tracking-tight">{merchant.name}</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{merchant.category}</p>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400 text-xs font-black relative z-10">
                                <Star size={12} fill="currentColor" /> {merchant.avgRating || '4.8'}
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-white/10 space-y-4">
                            <Leaf size={40} className="mx-auto text-white/10" />
                            <p className="text-white/20 font-bold uppercase tracking-[0.2em] text-xs">Aún no hay comercios certificados en esta categoría</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Pillars Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {initiatives.map((item, i) => (
                    <div key={i} className="glass p-10 rounded-[2.5rem] border-white/5 space-y-4 hover:border-primary/20 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{item.title}</h3>
                        <p className="text-white/40 text-sm font-medium leading-relaxed">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* CTAs */}
            <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">¿Eres un comercio eco-responsable?</h2>
                    <p className="text-white/40 font-medium">Únete a nuestra red de sostenibilidad y obtén el sello oficial.</p>
                </div>
                <button
                    onClick={() => onNavigate('assistant')}
                    className="bg-primary hover:bg-primary-dark text-background font-black px-12 py-5 rounded-[2rem] transition-all hover:shadow-[0_0_30px_rgba(0,255,102,0.4)] text-xs uppercase tracking-[0.2em]"
                >
                    Solicitar Certificación
                </button>
            </div>
        </motion.div>
    );
};
