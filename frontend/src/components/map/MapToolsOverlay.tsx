import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Navigation2,
    CloudRain,
    MapPin,
    Zap,
    Filter,
    X
} from 'lucide-react';
import { MapLayers, SceneticEffect } from '../../types/map';

import { playTacticalSound } from '../../utils/tacticalSound';

import { CATEGORIES } from '../../constants/map-categories';

interface MapToolsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    // Layer Controls
    layers: MapLayers;
    setLayers: React.Dispatch<React.SetStateAction<MapLayers>>;
    // Patrol / Actions
    isPatrolling: boolean;
    setIsPatrolling: () => void;
    onLocateMe: () => void;
    isLocating: boolean;
    // Categories
    activeCategories: string[] | null;
    onToggleCategory: (category: string) => void;
    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    // Scenetic
    setSceneticEffect: (effect: SceneticEffect | ((prev: SceneticEffect) => SceneticEffect)) => void;
}


export const MapToolsOverlay: React.FC<MapToolsOverlayProps> = ({
    isOpen,
    onClose,
    layers,
    setLayers,
    isPatrolling,
    setIsPatrolling,
    onLocateMe,
    isLocating,
    activeCategories,
    onToggleCategory,
    searchQuery,
    setSearchQuery,
    setSceneticEffect
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[1003]"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[1004] glass rounded-t-[2.5rem] border-t border-primary/20 p-6 pb-[calc(1.5rem+var(--sab))] sm:pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] safe-area-inset"
                    >
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

                        <div className="flex flex-col gap-8">
                            {/* Search */}
                            <div className="relative">
                                <div className="glass h-14 w-full rounded-2xl border-white/5 flex items-center px-4 gap-3 bg-white/5">
                                    <Search size={20} className="text-primary/60" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar eventos o locales..."
                                        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/20"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="text-white/40">
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Section: Categories */}
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-1">Categorías</h3>
                                <div className="grid grid-cols-4 gap-3">
                                    {CATEGORIES.map((cat) => {
                                        const isActive = activeCategories?.includes(cat.id.toLowerCase());
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => onToggleCategory(cat.id)}
                                                className={`
                                                    flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all
                                                    ${isActive
                                                        ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                                                        : 'bg-white/5 border-white/5 text-white/40'
                                                    }
                                                `}
                                            >
                                                <span className="text-xl">{cat.icon}</span>
                                                <span className="text-[9px] font-black uppercase tracking-wider">{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section: Layer Settings */}
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-1">Visualización</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setLayers(l => ({ ...l, weather: !l.weather }))}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border ${layers.weather ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-white/40'}`}
                                    >
                                        <CloudRain size={20} />
                                        <span className="text-xs font-bold">Clima Dinámico</span>
                                    </button>
                                    <button
                                        onClick={() => setLayers(l => ({ ...l, scanlines: !l.scanlines }))}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border ${layers.scanlines ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-white/40'}`}
                                    >
                                        <Zap size={20} />
                                        <span className="text-xs font-bold">Líneas Scan</span>
                                    </button>
                                    <button
                                        onClick={() => setLayers(l => ({ ...l, merchants: !l.merchants }))}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border ${layers.merchants ? 'bg-accent/20 border-accent text-accent' : 'bg-white/5 border-white/5 text-white/40'}`}
                                    >
                                        <MapPin size={20} />
                                        <span className="text-xs font-bold">Locales</span>
                                    </button>
                                    <button
                                        onClick={() => setLayers(l => ({ ...l, events: !l.events }))}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border ${layers.events ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-white/40'}`}
                                    >
                                        <Zap size={20} />
                                        <span className="text-xs font-bold">Eventos</span>
                                    </button>
                                </div>
                            </div>

                            {/* Section: Advanced Tools */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={onLocateMe}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${isLocating ? 'bg-primary/20 border-primary text-primary animate-pulse' : 'bg-white/5 border-white/5 text-white/40'}`}
                                >
                                    <Navigation2 size={24} className={isLocating ? 'fill-primary' : ''} />
                                    <span className="text-[9px] font-black uppercase">GPS</span>
                                </button>
                                <button
                                    onClick={setIsPatrolling}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${isPatrolling ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/5 text-white/40'}`}
                                >
                                    <motion.div animate={isPatrolling ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}>
                                        <Zap size={24} />
                                    </motion.div>
                                    <span className="text-[9px] font-black uppercase">Patrulla</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setSceneticEffect(prev => prev === 'RAIN' ? 'SUN' : 'RAIN');
                                        playTacticalSound('CLICK');
                                    }}
                                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-white/5 border-white/5 text-primary"
                                >
                                    <Filter size={24} />
                                    <span className="text-[9px] font-black uppercase">Ambiente</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
