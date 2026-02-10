import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, Product } from '../api/products';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    Package,
    X,
    Leaf,
    Loader2,
    Save,
    Power,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { useState } from 'react';
import { CabysSelector } from './CabysSelector';
import { ImageUploader } from './ImageUploader';
import { ProductVariationPro } from './merchant/ProductVariationPro';

interface ProductManagementProps {
    merchantId: string;
}

export const ProductManagement = ({ merchantId }: ProductManagementProps) => {
    const queryClient = useQueryClient();
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const { data: products, isLoading } = useQuery({
        queryKey: ['merchant-products-all', merchantId],
        queryFn: () => productApi.getByMerchant(merchantId, true),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
            productApi.update(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['merchant-products-all', merchantId] });
            const previousProducts = queryClient.getQueryData<Product[]>(['merchant-products-all', merchantId]);
            queryClient.setQueryData(['merchant-products-all', merchantId], (old: Product[] | undefined) =>
                old ? old.map(p => p.id === id ? { ...p, ...data } : p) : []
            );
            return { previousProducts };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(['merchant-products-all', merchantId], context.previousProducts);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-products-all'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setEditingProduct(null);
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Product>) => productApi.create({ ...data, merchantId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-products-all'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsAdding(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-products-all'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const handleToggleAvailable = (product: Product) => {
        updateMutation.mutate({ id: product.id, data: { isAvailable: !product.isAvailable } });
    };

    const handleTogglePopular = (product: Product) => {
        updateMutation.mutate({ id: product.id, data: { isPopular: !product.isPopular } });
    };

    const handleToggleEco = (product: Product) => {
        updateMutation.mutate({ id: product.id, data: { isEco: !product.isEco } });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Cargando Menú...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
                    <Package className="text-primary" size={24} />
                    Gestión de Menú
                </h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-primary text-background px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={16} />
                    Agregar Producto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products?.map((product) => (
                    <motion.div
                        key={product.id}
                        layout
                        className="glass p-6 rounded-[2rem] border-white/5 flex gap-4 group hover:border-white/10 transition-all"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden flex-shrink-0 relative">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black text-xs">
                                    No Pic
                                </div>
                            )}
                            {!product.isAvailable && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/60">No Disp.</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 text-white">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-black text-white truncate">{product.name}</h3>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleTogglePopular(product)}
                                        className={`p-1.5 rounded-lg transition-all ${product.isPopular ? 'text-accent bg-accent/10' : 'text-white/20 hover:text-white/40'}`}
                                    >
                                        <Sparkles size={14} className={product.isPopular ? 'fill-accent' : ''} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleEco(product)}
                                        className={`p-1.5 rounded-lg transition-all ${product.isEco ? 'text-primary bg-primary/10' : 'text-white/20 hover:text-white/40'}`}
                                    >
                                        <Leaf size={14} className={product.isEco ? 'fill-primary' : ''} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleAvailable(product)}
                                        className={`p-1.5 rounded-lg transition-all ${product.isAvailable ? 'text-primary bg-primary/10' : 'text-red-500 bg-red-500/10'}`}
                                    >
                                        <Power size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{product.category}</p>
                                {!product.cabysCode && (
                                    <div className="flex items-center gap-1 bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                                        <AlertCircle size={8} />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Falta CABYS</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-lg font-black text-primary italic font-mono">₡{Number(product.price).toLocaleString()}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingProduct(product)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => { if (confirm('¿Borrar?')) deleteMutation.mutate(product.id) }}
                                        className="p-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all text-red-500/40 hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {(isAdding || editingProduct) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass w-full max-w-lg p-10 rounded-[3rem] border-white/10 max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                                    {isAdding ? 'Nuevo Producto' : 'Editar Producto'}
                                </h3>
                                <button
                                    onClick={() => { setIsAdding(false); setEditingProduct(null); }}
                                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const optionsInput = document.getElementById('optionsMetadataFinal') as HTMLInputElement;
                                    const data = {
                                        name: formData.get('name') as string,
                                        price: Number(formData.get('price')),
                                        description: formData.get('description') as string,
                                        category: formData.get('category') as string,
                                        imageUrl: formData.get('imageUrl') as string,
                                        cabysCode: (formData.get('cabysCode') as string) || undefined,
                                        isPopular: formData.get('isPopular') === 'on',
                                        isEco: formData.get('isEco') === 'on',
                                        optionsMetadata: JSON.parse(optionsInput?.value || '[]'),
                                    };

                                    if (isAdding) createMutation.mutate(data);
                                    else updateMutation.mutate({ id: editingProduct!.id, data });
                                }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest pl-2">Nombre</label>
                                        <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/20 tracking-widest pl-2">Precio (₡)</label>
                                        <input name="price" type="number" defaultValue={editingProduct?.price} required className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest pl-2">Categoría</label>
                                    <input name="category" defaultValue={editingProduct?.category} required placeholder="Postres, Entradas..." className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest pl-2">Descripción</label>
                                    <textarea name="description" defaultValue={editingProduct?.description} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white min-h-[80px] outline-none focus:border-primary/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest pl-2">Imagen del Producto</label>
                                    <ImageUploader
                                        currentImageUrl={editingProduct?.imageUrl}
                                        onImageChange={(url) => {
                                            const hiddenInput = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
                                            if (hiddenInput) hiddenInput.value = url || '';
                                        }}
                                    />
                                    <input type="hidden" name="imageUrl" defaultValue={editingProduct?.imageUrl} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/20 tracking-widest pl-2">Código CABYS (Facturación)</label>
                                    <CabysSelector
                                        value={editingProduct?.cabysCode}
                                        onChange={(codigo) => {
                                            const hiddenInput = document.querySelector('input[name="cabysCode"]') as HTMLInputElement;
                                            if (hiddenInput) hiddenInput.value = codigo || '';
                                        }}
                                    />
                                    <input type="hidden" name="cabysCode" defaultValue={editingProduct?.cabysCode} />
                                </div>

                                <div className="flex gap-4">
                                    <label className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 flex-1 cursor-pointer">
                                        <input type="checkbox" name="isPopular" defaultChecked={editingProduct?.isPopular} className="w-4 h-4 accent-accent" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Destacado</span>
                                    </label>
                                    <label className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 flex-1 cursor-pointer">
                                        <input type="checkbox" name="isEco" defaultChecked={editingProduct?.isEco} className="w-4 h-4 accent-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Eco-Friendly</span>
                                    </label>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <ProductVariationPro
                                        value={editingProduct?.optionsMetadata || []}
                                        onChange={(newOptions) => {
                                            const input = document.getElementById('optionsMetadataFinal') as HTMLInputElement;
                                            if (input) input.value = JSON.stringify(newOptions);
                                        }}
                                    />
                                    <input type="hidden" id="optionsMetadataFinal" name="optionsMetadata" defaultValue={JSON.stringify(editingProduct?.optionsMetadata || [])} />
                                </div>

                                <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/50 backdrop-blur-xl py-4 -mx-10 px-10 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => { setIsAdding(false); setEditingProduct(null); }}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary text-background font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : (
                                            <>
                                                <Save size={16} />
                                                <span>Guardar Producto</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
