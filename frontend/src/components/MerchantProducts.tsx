import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Phone, Star, Sparkles, Utensils, Zap } from 'lucide-react';
import { productApi } from '../api/products';
import { ProductCard } from './ProductCard';
import { MapCard } from './MapCard';
import { useLanguageStore } from '../store/languageStore';
import { getMerchantAvailability } from '../utils/merchant';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MerchantProductsProps {
    merchant: any;
    onBack: () => void;
}

export const MerchantProducts = ({ merchant, onBack }: MerchantProductsProps) => {
    const { language } = useLanguageStore();
    const { data: products, isLoading } = useQuery({
        queryKey: ['products', merchant.id],
        queryFn: () => productApi.getByMerchant(merchant.id),
    });

    const popularProducts = products?.filter(p => p.isPopular);
    const otherProducts = products?.filter(p => !p.isPopular);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full relative min-h-screen"
        >
            {/* Background Effects */}
            <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none -z-10" />
            <div className="fixed -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 transform-gpu" />
            <div className="fixed bottom-0 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-[140px] pointer-events-none -z-10 transform-gpu" />

            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 px-4 py-4 sm:py-6 flex items-center justify-between pointer-events-none mb-4 sm:mb-8 safe-area-top">
                <Button
                    variant="glass"
                    size="sm"
                    onClick={onBack}
                    className="pointer-events-auto rounded-2xl group border-white/10 backdrop-blur-md"
                >
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    {language === 'es' ? 'ATRÁS' : 'BACK'}
                </Button>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <header className="mb-12 sm:mb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                        {/* Merchant Details */}
                        <div className="lg:col-span-7 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Badge variant="primary" className="mb-6 uppercase tracking-widest px-4 py-1.5 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                                    {merchant.category}
                                </Badge>
                                <div className="flex flex-wrap items-center gap-4 mb-6">
                                    <h1 className="text-[var(--text-4xl)] sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-gradient filter drop-shadow-[0_0_30px_rgba(0,255,102,0.1)]">
                                        {merchant.name}
                                    </h1>
                                    {getMerchantAvailability(merchant).available === false && (
                                        <Badge variant="outline" className="animate-pulse bg-red-500/10 text-red-500 border-red-500/20 shadow-lg shadow-red-500/20 px-4 py-2 text-sm uppercase">
                                            {getMerchantAvailability(merchant).reason === 'OFFLINE' ?
                                                (language === 'es' ? 'FUERA DE LÍNEA' : 'OFFLINE') :
                                                getMerchantAvailability(merchant).reason === 'CLOSED' ?
                                                    (language === 'es' ? 'CERRADO' : 'CLOSED') :
                                                    (language === 'es' ? 'OCUPADO' : 'BUSY')}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-white/60 max-w-2xl text-lg font-medium leading-relaxed mb-10">
                                    {merchant.description}
                                </p>

                                <div className="flex flex-wrap gap-6 text-xs font-black uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
                                        <MapPin size={16} className="text-primary" />
                                        <span className="text-white/80">{merchant.address}</span>
                                    </div>
                                    {merchant.phone && (
                                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5">
                                            <Phone size={16} className="text-secondary" />
                                            <span className="text-white/80">{merchant.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Visual Card / Map */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-5 w-full"
                        >
                            <div className="glass-morphism overflow-hidden p-3 border-white/10 shadow-2xl relative">
                                <MapCard
                                    lat={Number(merchant.latitude)}
                                    lng={Number(merchant.longitude)}
                                    address={merchant.address}
                                />
                                <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                                    <div className="glass px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                                        <Star size={14} className="text-accent fill-accent" />
                                        <span className="text-sm font-black">{merchant.avgRating || 0}</span>
                                    </div>
                                    <div className="glass px-4 py-2 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                            {merchant.reviewCount || 0} REVIEWS
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={24} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 animate-glow">
                            {language === 'es' ? 'Sincronizando menú...' : 'Syncing menu...'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-16 sm:space-y-32 mb-20 sm:mb-40">
                        {/* Popular Items Section */}
                        {popularProducts && popularProducts.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(255,136,0,0.1)]">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                            {language === 'es' ? 'LOS MÁS' : 'MOST'} <span className="text-accent">POPULARES</span>
                                        </h2>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">RECOMENDADOS POR LA COMUNIDAD</p>
                                    </div>
                                    <div className="flex-1 h-[1px] bg-white/5 ml-8" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {popularProducts.map((product, index) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <ProductCard
                                                product={product}
                                                isMerchantUnavailable={!getMerchantAvailability(merchant).available}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* All/Other Items Section */}
                        <section>
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(0,255,102,0.1)]">
                                    <Utensils size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                        {language === 'es' ? 'NUESTRO' : 'OUR'} <span className="text-primary">CATÁLOGO</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">ESTO ES LO QUE TENEMOS PARA TI</p>
                                </div>
                                <div className="flex-1 h-[1px] bg-white/5 ml-8" />
                            </div>

                            {otherProducts && otherProducts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {otherProducts.map((product, index) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <ProductCard
                                                product={product}
                                                isMerchantUnavailable={!getMerchantAvailability(merchant).available}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                !popularProducts?.length && (
                                    <div className="text-center py-40 glass-morphism border-dashed border-white/5">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                                            <Zap className="text-white/10" size={32} />
                                        </div>
                                        <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">Sinuosidad Zero</h3>
                                        <p className="text-white/20 font-medium uppercase text-[10px] tracking-widest">
                                            {language === 'es'
                                                ? 'Este comercio aún no ha cargado sus delicias al radar.'
                                                : 'This merchant has not loaded its delights to the radar yet.'}
                                        </p>
                                    </div>
                                )
                            )}
                        </section>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
