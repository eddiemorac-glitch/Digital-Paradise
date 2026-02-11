import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star, Sparkles, Leaf, Zap } from 'lucide-react';
import { Product } from '../api/products';
import { useLanguageStore } from '../store/languageStore';
import { useAddToCart } from '../hooks/useAddToCart';
import { MerchantConflictModal } from './cart/MerchantConflictModal';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ProductCardProps {
    product: Product;
    isMerchantUnavailable?: boolean;
}

export const ProductCard = ({ product, isMerchantUnavailable }: ProductCardProps) => {
    const {
        handleAddToCart: onAddToCart,
        showConflictModal,
        setShowConflictModal,
        confirmConflict,
        currentMerchantName,
        newMerchantName
    } = useAddToCart();
    const { language } = useLanguageStore();
    const [isAdded, setIsAdded] = useState(false);

    const isDisabled = isMerchantUnavailable || !product.isAvailable;

    const handleAddToCartClick = () => {
        if (isDisabled) return;
        const success = onAddToCart(product);
        if (success) {
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        }
    };

    return (
        <Card variant="default" noPadding className={`group hover:border-primary/30 transition-all duration-500 overflow-hidden ${isDisabled ? 'grayscale-[0.5]' : ''}`}>
            {/* Badges Container */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {product.isPopular && (
                    <Badge variant="accent" className="flex items-center gap-1.5 shadow-lg shadow-accent/20 animate-float">
                        <Sparkles size={10} className="fill-white" />
                        Popular
                    </Badge>
                )}
                {product.isEco && (
                    <Badge variant="primary" className="flex items-center gap-1.5 shadow-lg shadow-primary/20">
                        <Leaf size={10} className="fill-background" />
                        Eco
                    </Badge>
                )}
                {isDisabled && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-md uppercase text-[9px]">
                        {isMerchantUnavailable ? (language === 'es' ? 'Local Cerrado' : 'Merchant Closed') : (language === 'es' ? 'Agotado' : 'Sold Out')}
                    </Badge>
                )}
            </div>

            {/* Product Image Section */}
            <div className="relative h-48 sm:h-56 bg-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 opacity-60" />

                {product.imageUrl ? (
                    <motion.img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 uppercase font-black text-6xl tracking-tighter select-none">
                        {product.name[0]}
                    </div>
                )}

                <div className="absolute bottom-4 right-4 z-20">
                    <div className="glass px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-xl backdrop-blur-xl">
                        <Star size={12} className="text-accent fill-accent" />
                        <span className="text-xs font-black">4.9</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                        {product.category}
                    </span>
                    <div className="text-primary font-black text-lg tracking-tighter">
                        <span className="text-[10px] mr-0.5">₡</span>
                        {product.price.toLocaleString()}
                    </div>
                </div>

                <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors h-14 line-clamp-2 uppercase italic tracking-tighter leading-none">
                    {product.name}
                </h3>

                <p className="text-white/40 text-xs line-clamp-2 mb-6 font-medium leading-relaxed">
                    {product.description}
                </p>

                <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                        onClick={handleAddToCartClick}
                        variant={isDisabled ? 'glass' : (isAdded ? 'primary' : 'glass')}
                        className={`w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAdded ? 'bg-primary text-background' : ''}`}
                        disabled={isDisabled}
                    >
                        {isAdded ? (
                            <span className="flex items-center gap-2">
                                {language === 'es' ? 'AGREGADO' : 'ADDED'}
                                <Zap size={14} className="fill-current" />
                            </span>
                        ) : isDisabled ? (
                            isMerchantUnavailable ? (language === 'es' ? 'LOCAL CERRADO' : 'CLOSED') : (language === 'es' ? 'AGOTADO' : 'SOLD OUT')
                        ) : (
                            language === 'es' ? 'ORDENAR AHORA' : 'ORDER NOW'
                        )}
                    </Button>
                </motion.div>
            </CardContent >

            <MerchantConflictModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                onConfirm={confirmConflict}
                currentMerchantName={currentMerchantName}
                newMerchantName={newMerchantName}
            />
        </Card >
    );
};
