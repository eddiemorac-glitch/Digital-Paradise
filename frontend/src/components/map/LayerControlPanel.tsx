import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, MapPin, Zap, Search, Navigation2, Filter, X } from 'lucide-react';
import { MapLayers, SceneticEffect } from '../../types/map';
import { playTacticalSound } from '../../utils/tacticalSound';

interface LayerControlPanelProps {
    layers: MapLayers;
    setLayers: React.Dispatch<React.SetStateAction<MapLayers>>;
    isPatrolling: boolean;
    setIsPatrolling: React.Dispatch<React.SetStateAction<boolean>>;
    setSceneticEffect: React.Dispatch<React.SetStateAction<SceneticEffect>>;
    onLocateMe: () => void;
    isLocating: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
    layers,
    setLayers,
    isPatrolling,
    setIsPatrolling,
    setSceneticEffect,
    onLocateMe,
    isLocating,
    searchQuery,
    setSearchQuery
}) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <div className="hidden md:flex absolute left-4 md:left-6 bottom-24 md:bottom-12 z-[1001] flex flex-col gap-3">
            {/* Search & Filter Bar */}
            <div className="flex gap-2 items-center">
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 240, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="glass h-12 w-full rounded-2xl border-primary/20 flex items-center px-4 gap-2">
                                <Search size={16} className="text-primary/60 shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar eventos o locales..."
                                    className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-white/20"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => {
                        setIsSearchOpen(!isSearchOpen);
                        playTacticalSound('CLICK');
                    }}
                    className={`w-12 h-12 glass rounded-2xl flex items-center justify-center transition-all ${isSearchOpen ? 'text-primary border-primary/40' : 'text-white/40 border-white/5 hover:text-white'}`}
                >
                    <Search size={20} />
                </button>
            </div>

            {/* Layer Stack */}
            <div className="flex flex-col gap-2 p-2 glass rounded-3xl border-primary/20">
                {/* Locate Me Button */}
                <button
                    onClick={() => {
                        onLocateMe();
                        playTacticalSound('CLICK');
                    }}
                    disabled={isLocating}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isLocating ? 'text-primary animate-pulse bg-primary/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    title="Mi Ubicación"
                >
                    <Navigation2 size={18} className={isLocating ? 'fill-primary' : ''} />
                </button>

                <div className="w-8 h-px bg-white/5 mx-auto my-1" />

                <button
                    onClick={() => setLayers(l => ({ ...l, weather: !l.weather }))}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${layers.weather ? 'text-primary bg-primary/10' : 'text-white/20'}`}
                    title="Clima Dinámico"
                >
                    <CloudRain size={18} />
                </button>
                <button
                    onClick={() => setLayers(l => ({ ...l, scanlines: !l.scanlines }))}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${layers.scanlines ? 'text-primary bg-primary/10' : 'text-white/20'}`}
                    title="Scanlines Tácticas"
                >
                    <div className="w-4 h-3 border border-current rounded-sm flex flex-col justify-around px-0.5">
                        <div className="w-full h-px bg-current opacity-50" />
                        <div className="w-full h-px bg-current opacity-50" />
                    </div>
                </button>
                <div className="w-8 h-px bg-white/5 mx-auto" />
                <button
                    onClick={() => setLayers(l => ({ ...l, merchants: !l.merchants }))}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${layers.merchants ? 'text-primary bg-primary/10' : 'text-white/20'}`}
                    title="Mostrar Locales"
                >
                    <MapPin size={18} />
                </button>
                <button
                    onClick={() => setLayers(l => ({ ...l, events: !l.events }))}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${layers.events ? 'text-primary bg-primary/10' : 'text-white/20'}`}
                    title="Mostrar Eventos"
                >
                    <Zap size={18} />
                </button>
                <div className="w-8 h-px bg-white/5 mx-auto" />
                <button
                    onClick={() => {
                        setIsPatrolling(!isPatrolling);
                        playTacticalSound('CLICK');
                    }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isPatrolling ? 'text-orange-500 bg-orange-500/10' : 'text-white/20 hover:text-white'}`}
                    title="Modo Patrulla Estratégico"
                >
                    <motion.div animate={isPatrolling ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}>
                        <Zap size={18} />
                    </motion.div>
                </button>
            </div>

            {/* Weather Cycle Toggle */}
            <button
                onClick={() => {
                    setSceneticEffect(prev => prev === 'RAIN' ? 'SUN' : 'RAIN');
                    playTacticalSound('CLICK');
                }}
                className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-primary shadow-xl border-primary/20 hover:scale-110 active:scale-95 transition-all mt-2"
                title="Ciclo de Ambiente"
            >
                <Filter size={22} />
            </button>
        </div>
    );
};
