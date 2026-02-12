import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, Coffee, Utensils, Zap, Fish, Mic, Leaf, Shield, Sparkles, Waves, Palmtree } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { merchantApi, Merchant } from '../api/merchants';
import { MerchantCard } from '../components/MerchantCard';
import { MerchantProducts } from '../components/MerchantProducts';
import { TouristHUD } from '../components/TouristHUD';
import { useLanguageStore } from '../store/languageStore';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { EventHub } from '../components/EventHub';
import { useUIStore } from '../store/uiStore';
import { playTacticalSound } from '../utils/tacticalSound';
import { Button } from '../components/ui/button';
import { FilterSheet } from '../components/FilterSheet';
import { SlidersHorizontal } from 'lucide-react';

export const HomePage = () => {
    const { t, language } = useLanguageStore();
    const navigate = useNavigate();
    const { addNotification } = useNotificationStore();

    // Local State
    const [isListening, setIsListening] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [sortBy, setSortBy] = useState<'name' | 'rating' | 'distance'>('name');
    const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const { isEventHubOpen, setIsEventHubOpen } = useUIStore();
    const [showAllMerchants, setShowAllMerchants] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { data: merchants, isLoading, isError } = useQuery({
        queryKey: ['merchants', selectedCategory, sortBy, userCoords],
        queryFn: () => merchantApi.getAll({
            category: selectedCategory,
            sortBy,
            lat: userCoords?.lat,
            lng: userCoords?.lng
        }),
    });

    const categories = [
        { label: t('all'), value: undefined, icon: <Zap size={16} /> },
        { label: t('restaurants'), value: 'restaurant', icon: <Utensils size={16} /> },
        { label: t('cafes'), value: 'cafe', icon: <Coffee size={16} /> },
        { label: t('seafood'), value: 'seafood', icon: <Fish size={16} /> },
        { label: t('essentials'), value: 'essential', icon: <Shield size={16} /> },
        { label: t('eco_friendly'), value: 'sustainable', icon: <Leaf size={16} /> },
    ];

    const sortOptions = [
        { label: t('sort_az'), value: 'name' as const },
        { label: t('sort_rating'), value: 'rating' as const },
        { label: t('sort_distance'), value: 'distance' as const },
    ];

    const filteredMerchants = (Array.isArray(merchants) ? merchants : []).filter((m: Merchant) => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory ||
            (selectedCategory === 'sustainable' ? m.isSustainable : m.category === selectedCategory);
        return matchesSearch && matchesCategory;
    }).sort((a: Merchant, b: Merchant) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
        if (sortBy === 'distance' && userCoords) {
            const distA = Math.sqrt(Math.pow(a.latitude - userCoords.lat, 2) + Math.pow(a.longitude - userCoords.lng, 2));
            const distB = Math.sqrt(Math.pow(b.latitude - userCoords.lat, 2) + Math.pow(b.longitude - userCoords.lng, 2));
            return distA - distB;
        }
        return 0;
    });

    const handleSortChange = (value: 'name' | 'rating' | 'distance') => {
        if (value === 'distance' && !userCoords) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setSortBy('distance');
                },
                () => addNotification({
                    title: 'Ubicación',
                    message: 'No pudimos acceder a tu ubicación.',
                    type: 'warning'
                })
            );
        } else {
            setSortBy(value);
        }
    };

    const handleVoiceSearch = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addNotification({ title: 'Búsqueda por voz', message: 'No soportado.', type: 'info' });
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = language === 'es' ? 'es-CR' : 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => setSearchQuery(event.results[0][0].transcript);
        recognition.start();
    };

    return (
        <AnimatePresence mode="wait">
            {!selectedMerchant ? (
                <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative min-h-screen"
                >
                    {/* NEW: Caribbean Beach Background */}
                    <div className="bg-caribe-beach" />
                    <div className="bg-orb bg-orb-1" />
                    <div className="bg-orb bg-orb-2" />
                    <div className="bg-orb bg-orb-3" />

                    <AnimatePresence>
                        {isEventHubOpen && (
                            <EventHub
                                onClose={() => setIsEventHubOpen(false)}
                                onSelectEvent={() => {
                                    setIsEventHubOpen(false);
                                    playTacticalSound('CLICK');
                                    navigate('/map');
                                }}
                            />
                        )}
                    </AnimatePresence>

                    <FilterSheet
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={(val) => {
                            setSelectedCategory(val);
                            playTacticalSound('CLICK');
                        }}
                        sortOptions={sortOptions}
                        sortBy={sortBy}
                        onSortChange={(val) => {
                            handleSortChange(val);
                            playTacticalSound('CLICK');
                        }}
                    />

                    <header className="relative pt-24 pb-20 flex flex-col items-center text-center px-4">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full glass border-primary/20"
                        >
                            <Palmtree size={14} className="text-primary" />
                            <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
                                Digital Paradise
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[var(--text-hero)] font-black tracking-tighter leading-[0.85] italic mb-8 z-10 drop-shadow-2xl"
                        >
                            {selectedCategory ? (
                                <span className="text-primary">{selectedCategory.toUpperCase()}</span>
                            ) : (
                                <>
                                    <span className="block text-white">PURE</span>
                                    <span className="text-gradient pr-4">VIBES</span>
                                </>
                            )}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-[var(--text-base)] font-medium text-white/60 max-w-md mx-auto mb-10 leading-relaxed px-4"
                        >
                            {language === 'es'
                                ? 'Explora lo mejor del Caribe Sur. Gastronomía, cultura y naturaleza en un solo lugar.'
                                : 'Explore the best of the South Caribbean. Gastronomy, culture, and nature in one place.'}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="w-full max-w-2xl z-10 safe-area-x"
                        >
                            <div className="relative group p-1.5 glass-morphism rounded-3xl sm:rounded-full border-white/10 hover:border-primary/30 transition-colors duration-300">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="pl-3 sm:pl-4 text-white/40 group-focus-within:text-primary transition-colors">
                                        <Search size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('search_placeholder')}
                                        className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/30 font-semibold py-2 sm:py-3 text-base sm:text-lg min-w-0"
                                    />
                                    <div className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2">
                                        <Button
                                            variant={isListening ? 'primary' : 'ghost'}
                                            size="icon"
                                            onClick={handleVoiceSearch}
                                            className={`rounded-xl sm:rounded-full w-10 h-10 ${isListening ? 'animate-pulse bg-primary/20 text-primary' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                        >
                                            <Mic size={18} className="sm:w-5 sm:h-5" />
                                        </Button>
                                        <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
                                        <Button
                                            variant="primary"
                                            size="icon"
                                            className="rounded-xl sm:rounded-full w-10 h-10 sm:w-12 sm:h-12 shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:scale-105 transition-transform"
                                            onClick={() => handleSortChange('distance')}
                                        >
                                            <MapPin size={20} className="text-black sm:w-[22px] sm:h-[22px]" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </header>

                    {/* Filter Section */}
                    <section className="mb-12 px-4">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3 safe-area-x">
                                <span className="w-1.5 h-6 sm:w-2 sm:h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(0,255,102,0.4)]" />
                                <div className="flex flex-col">
                                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase italic">
                                        {selectedCategory ? t(selectedCategory as any) : (language === 'es' ? 'Explorar' : 'Explore')}
                                    </h2>
                                    <p className="text-[10px] sm:text-xs font-medium text-primary/80">
                                        {filteredMerchants.length} {language === 'es' ? 'lugares cerca de ti' : 'places near you'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsFilterOpen(true);
                                    playTacticalSound('CLICK');
                                }}
                                className="glass px-5 py-2.5 rounded-2xl border-white/10 text-white font-semibold text-xs flex items-center gap-2 hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
                            >
                                <SlidersHorizontal size={16} />
                                {language === 'es' ? 'Filtros' : 'Filters'}
                            </button>
                        </div>
                    </section>

                    {/* Results Section */}
                    <section className="px-4 pb-20">
                        <div className="max-w-7xl mx-auto">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <Waves className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={32} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80 animate-pulse">{t('loading')}</p>
                                </div>
                            ) : isError ? (
                                <div className="glass-morphism py-20 text-center max-w-lg mx-auto border-red-500/20 bg-red-500/5">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <X className="text-red-500" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-white">{t('connection_error')}</h3>
                                    <p className="text-white/40 mb-6 text-sm">{t('connection_error_desc')}</p>
                                    <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => window.location.reload()}>
                                        {t('retry')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-row-dense">
                                        <AnimatePresence mode="popLayout">
                                            {(showAllMerchants ? filteredMerchants : filteredMerchants?.slice(0, 6))?.map((merchant: any, index: number) => {
                                                const isSpotlight = merchant.avgRating >= 4.8 && merchant.reviewCount > 5;
                                                return (
                                                    <motion.div
                                                        key={merchant.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        transition={{ duration: 0.4, delay: index * 0.05 }}
                                                        className={isSpotlight ? 'md:col-span-2' : 'col-span-1'}
                                                    >
                                                        <MerchantCard
                                                            merchant={merchant}
                                                            onClick={() => setSelectedMerchant(merchant)}
                                                            isSpotlight={isSpotlight}
                                                        />
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>

                                    {!showAllMerchants && filteredMerchants && filteredMerchants.length > 6 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            className="flex justify-center pt-8"
                                        >
                                            <button
                                                onClick={() => {
                                                    playTacticalSound('CLICK');
                                                    setShowAllMerchants(true);
                                                }}
                                                className="glass px-8 py-3 rounded-full border-primary/20 text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary/10 transition-all flex items-center gap-3 group hover:scale-105 active:scale-95"
                                            >
                                                <Sparkles size={16} className="group-hover:text-amber-400 transition-colors" />
                                                {language === 'es' ? 'Ver todos los lugares' : 'View all places'}
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {!isLoading && filteredMerchants?.length === 0 && (
                                <div className="glass-morphism py-32 text-center max-w-2xl mx-auto border-dashed border-white/10">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Search className="text-white/20" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-white/80">No se encontraron resultados</h3>
                                    <p className="text-white/40 mb-8">Intenta con otra categoría o término de búsqueda</p>
                                    <Button
                                        variant="glass"
                                        onClick={() => { setSearchQuery(''); setSelectedCategory(undefined); }}
                                    >
                                        Limpiar filtros
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Monitors Section */}
                    <section className="mt-8 px-4 border-t border-white/5 pt-16 pb-32 bg-gradient-to-b from-transparent to-black/40">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center justify-center gap-4 mb-12 opacity-60">
                                <div className="h-[1px] w-12 bg-white/20" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Guía Turística</h3>
                                <div className="h-[1px] w-12 bg-white/20" />
                            </div>
                            <TouristHUD
                                onOpenGuide={() => navigate('/guide')}
                            />
                        </div>
                    </section>
                </motion.div>
            ) : (
                <MerchantProducts
                    merchant={selectedMerchant!}
                    onBack={() => setSelectedMerchant(null)}
                />
            )}
        </AnimatePresence>
    );
};
