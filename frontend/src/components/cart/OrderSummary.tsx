import { Loader2, ArrowRight } from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

export interface OrderBreakdown {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    courierTip: number;
    platformFee: number;
    transactionFee: number;
    total: number;
}

interface OrderSummaryProps {
    breakdown: OrderBreakdown | null;
    isCalculating: boolean;
    displayTotal: number;
    courierTip: number;
    isDigitalOnly: boolean;
    isOutOfRange: boolean;
    latitude: number | null;
    hasUnavailableItems: boolean;
    isOrdering: boolean;
    onClear: () => void;
    onCheckout: () => void;
}

export const OrderSummary = ({
    breakdown,
    isCalculating,
    displayTotal,
    courierTip,
    isDigitalOnly,
    isOutOfRange,
    latitude,
    hasUnavailableItems,
    isOrdering,
    onClear,
    onCheckout
}: OrderSummaryProps) => {
    const { t, language } = useLanguageStore();

    return (
        <div className="border-t border-white/5 bg-background/90 backdrop-blur-xl shrink-0">
            {/* Dotted perforation */}
            <div className="w-full border-t border-dashed border-white/10" />

            <div className="px-5 pt-4 pb-5 sm:pb-5 pb-[calc(1.25rem+var(--sab))] space-y-4">
                {/* Price breakdown */}
                <div className="space-y-2">
                    {/* Subtotal */}
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <span>{t('subtotal')}</span>
                        <span className="text-white/50">
                            {breakdown ? `₡${breakdown.subtotal.toLocaleString()}` : '...'}
                        </span>
                    </div>

                    {/* Delivery */}
                    {!isDigitalOnly && (
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                            <span>{t('delivery_fee')}</span>
                            <span className={isOutOfRange ? 'text-red-500' : 'text-white/50'}>
                                {isCalculating ? '...' : (breakdown ? `₡${breakdown.deliveryFee.toLocaleString()}` : '-')}
                            </span>
                        </div>
                    )}

                    {/* Tip */}
                    {!isDigitalOnly && courierTip > 0 && (
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary/60">
                            <span>TIP ♥</span>
                            <span>₡{courierTip.toLocaleString()}</span>
                        </div>
                    )}

                    {/* Taxes & Fees (New) */}
                    {breakdown && (
                        <>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                <span>IVA (13%)</span>
                                <span className="text-white/50">₡{breakdown.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                                <span>Tasa Servicio</span>
                                <span className="text-white/50">₡{breakdown.transactionFee.toLocaleString()}</span>
                            </div>
                        </>
                    )}

                    <div className="flex justify-between items-baseline pt-3 border-t border-white/5">
                        <span className="text-xs font-black uppercase tracking-tight text-white/60">{t('total')}</span>
                        <span className="text-primary text-2xl font-black tracking-tighter italic">
                            {isCalculating ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                `₡${displayTotal.toLocaleString()}`
                            )}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-[1fr_2fr] gap-3">
                    <button
                        onClick={onClear}
                        disabled={isOrdering}
                        className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                    >
                        {language === 'es' ? 'VACIAR' : 'CLEAR'}
                    </button>
                    <button
                        onClick={onCheckout}
                        disabled={isOrdering || (!isDigitalOnly && (isOutOfRange || !latitude)) || hasUnavailableItems}
                        className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-background font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isOrdering ? (
                            <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{t('place_order')}</span>
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
