import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from './ui/button';

interface FilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    categories: { label: string; value: string | undefined; icon: React.ReactNode }[];
    selectedCategory: string | undefined;
    onSelectCategory: (value: string | undefined) => void;
    sortOptions: { label: string; value: 'name' | 'rating' | 'distance' }[];
    sortBy: 'name' | 'rating' | 'distance';
    onSortChange: (value: 'name' | 'rating' | 'distance') => void;
}

export const FilterSheet = ({
    isOpen,
    onClose,
    categories,
    selectedCategory,
    onSelectCategory,
    sortOptions,
    sortBy,
    onSortChange
}: FilterSheetProps) => {
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
                        className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card/50 backdrop-blur-2xl border-l border-white/10 z-[101] p-8 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <SlidersHorizontal size={20} />
                                </div>
                                <h2 className="text-2xl font-black italic tracking-tighter italic uppercase">Panel de Filtros</h2>
                            </div>
                            <Button variant="glass" size="icon" onClick={onClose} className="rounded-2xl">
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Categories */}
                        <div className="space-y-6 mb-12">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Categorías</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.label}
                                        onClick={() => onSelectCategory(cat.value)}
                                        className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${selectedCategory === cat.value
                                            ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_20px_rgba(0,255,102,0.1)]'
                                            : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className={selectedCategory === cat.value ? 'text-primary' : 'text-white/20'}>
                                                {cat.icon}
                                            </span>
                                            <span className="font-bold text-sm tracking-widest uppercase">{cat.label}</span>
                                        </div>
                                        {selectedCategory === cat.value && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sorting */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Ordenar Por</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {sortOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => onSortChange(opt.value)}
                                        className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${sortBy === opt.value
                                            ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_20px_rgba(0,255,102,0.1)]'
                                            : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                                            }`}
                                    >
                                        <span className="font-bold text-sm tracking-widest uppercase">{opt.label}</span>
                                        {sortBy === opt.value && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-16">
                            <Button variant="primary" className="w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs" onClick={onClose}>
                                Aplicar Sensores
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
