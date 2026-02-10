import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../../api/products';
import { Package, Power, Search, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickStockToggleProps {
    merchantId: string;
    language: string;
}

export const QuickStockToggle: React.FC<QuickStockToggleProps> = ({ merchantId, language }) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');

    const { data: products, isLoading } = useQuery({
        queryKey: ['merchant-products-all', merchantId],
        queryFn: () => productApi.getByMerchant(merchantId, true),
        enabled: !!merchantId,
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isAvailable }: { id: string, isAvailable: boolean }) =>
            productApi.update(id, { isAvailable }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-products-all', merchantId] });
        }
    });

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="glass h-full rounded-[2.5rem] border-white/5 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Package size={16} />
                    </div>
                    <h3 className="text-sm font-black uppercase italic tracking-widest text-white">
                        {language === 'es' ? 'Stock Rápido' : 'Quick Stock'}
                    </h3>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                    <input
                        type="text"
                        placeholder={language === 'es' ? 'Buscar producto...' : 'Search product...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/30 transition-all font-black uppercase tracking-widest"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-20">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Sincronizando...</span>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product) => (
                            <motion.div
                                layout
                                key={product.id}
                                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${product.isAvailable ? 'bg-white/5 border-white/5' : 'bg-red-500/5 border-red-500/10 opacity-60'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black text-xs">
                                                {product.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-black uppercase text-white truncate">{product.name}</p>
                                        <p className="text-[8px] font-black uppercase text-white/20 font-mono">₡{product.price.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleMutation.mutate({ id: product.id, isAvailable: !product.isAvailable })}
                                    disabled={toggleMutation.isPending}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${product.isAvailable ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}
                                >
                                    {toggleMutation.isPending ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Power size={12} />
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-10">
                        <AlertCircle size={20} className="mx-auto text-white/10 mb-2" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                            {language === 'es' ? 'Sin resultados' : 'No results'}
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-primary/5 border-t border-white/5">
                <p className="text-[8px] font-black uppercase tracking-widest text-primary/60 text-center leading-relaxed">
                    {language === 'es'
                        ? 'Los cambios se reflejan al instante en la app del cliente'
                        : 'Changes reflect instantly in the customer app'}
                </p>
            </div>
        </div>
    );
};
