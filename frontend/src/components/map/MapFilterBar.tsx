import React from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../../constants/map-categories';
import { useLanguageStore } from '../../store/languageStore';

interface MapFilterBarProps {
    activeCategories: string[] | null;
    onToggleCategory: (category: string) => void;
}

export const MapFilterBar: React.FC<MapFilterBarProps> = ({
    activeCategories,
    onToggleCategory
}) => {
    const { t } = useLanguageStore();

    return (
        <div className="hidden md:flex absolute md:top-20 md:left-4 md:bottom-auto md:w-auto md:right-auto z-[1001] flex flex-row md:flex-col gap-2 bottom-0 left-0 right-0 p-4 overflow-x-auto touch-pan-x scrollbar-hide">
            {CATEGORIES.map((cat) => {
                const isActive = activeCategories?.includes(cat.id.toLowerCase());
                return (
                    <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onToggleCategory(cat.id)}
                        className={`
                            flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 shrink-0
                            ${isActive
                                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,236,255,0.3)]'
                                : 'bg-background/40 border-white/10 text-white/60 hover:border-white/20'
                            }
                        `}
                    >
                        <span className="text-base md:text-lg">{cat.icon}</span>
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap">{t(cat.id.toLowerCase()) || cat.label}</span>
                        {isActive && (
                            <motion.div
                                layoutId="active-dot"
                                className="w-1 h-1 rounded-full bg-primary"
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
};
