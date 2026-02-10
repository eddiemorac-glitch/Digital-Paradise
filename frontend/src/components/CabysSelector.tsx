import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X } from 'lucide-react';

interface CabysItem {
    codigo: string;
    descripcion: string;
    impuesto: number;
}

interface CabysSelectorProps {
    value?: string;
    onChange: (codigo: string | null, item?: CabysItem) => void;
    placeholder?: string;
}

export const CabysSelector = ({ value, onChange, placeholder = 'Buscar código CABYS...' }: CabysSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedTerm, setDebouncedTerm] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: results, isLoading } = useQuery({
        queryKey: ['cabys-search', debouncedTerm],
        queryFn: async () => {
            if (debouncedTerm.length < 2) return [];
            const response = await api.get<CabysItem[]>('/products/cabys/search', { params: { q: debouncedTerm } });
            return response.data;
        },
        enabled: debouncedTerm.length >= 2,
    });

    const handleSelect = useCallback((item: CabysItem) => {
        onChange(item.codigo, item);
        setSearchTerm('');
        setIsOpen(false);
    }, [onChange]);

    const handleClear = useCallback(() => {
        onChange(null);
        setSearchTerm('');
    }, [onChange]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                {value ? (
                    <div className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 pl-10 text-xs text-primary flex items-center justify-between">
                        <span className="font-mono">{value}</span>
                        <button type="button" onClick={handleClear} className="p-1 hover:bg-white/10 rounded-lg">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                        onFocus={() => setIsOpen(true)}
                        placeholder={placeholder}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 pl-10 text-xs text-white outline-none focus:border-primary/50"
                    />
                )}
                {isLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={14} />
                )}
            </div>

            <AnimatePresence>
                {isOpen && results && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 glass rounded-2xl border border-white/10 max-h-60 overflow-y-auto shadow-xl"
                    >
                        {results.map((item) => (
                            <button
                                key={item.codigo}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className="w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-mono text-primary mb-1">{item.codigo}</p>
                                        <p className="text-xs text-white/80 line-clamp-2">{item.descripcion}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-white/40 shrink-0">{item.impuesto}% IVA</span>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {isOpen && searchTerm.length >= 2 && results?.length === 0 && !isLoading && (
                <div className="absolute z-50 w-full mt-2 glass rounded-2xl border border-white/10 p-6 text-center">
                    <p className="text-xs text-white/40">No se encontraron resultados</p>
                </div>
            )}
        </div>
    );
};
