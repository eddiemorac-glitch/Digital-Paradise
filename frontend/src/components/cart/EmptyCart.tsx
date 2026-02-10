import { ShoppingBag } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

export const EmptyCart = () => {
    const { t } = useLanguageStore();

    return (
        <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 opacity-20">
                <ShoppingBag size={32} />
            </div>
            <p className="text-base font-black text-white/30 uppercase tracking-tighter mb-1">{t('empty_cart')}</p>
            <p className="text-[10px] text-white/15 uppercase tracking-widest">{t('empty_cart_desc')}</p>
        </div>
    );
};
