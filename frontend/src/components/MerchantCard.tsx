import { MapPin, Phone, Star, Leaf, ArrowRight } from 'lucide-react';
import { Merchant } from '../api/merchants';
import { useLanguageStore } from '../store/languageStore';
import { Card, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getMerchantAvailability } from '../utils/merchant';

interface MerchantCardProps {
    merchant: Merchant;
    onClick?: () => void;
    isSpotlight?: boolean;
}

export const MerchantCard = ({ merchant, onClick, isSpotlight }: MerchantCardProps) => {
    const { language, t } = useLanguageStore();
    const availability = getMerchantAvailability(merchant);

    return (
        <Card
            whileHover={availability.available ? { y: -12, scale: 1.02 } : {}}
            whileTap={availability.available ? { scale: 0.98 } : {}}
            className={`group h-full flex flex-col border-white/5 hover:border-primary/20 transition-all duration-500 active:opacity-90 ${!availability.available ? 'opacity-70' : ''
                } ${isSpotlight ? 'bg-primary/5 shadow-[0_0_40px_rgba(0,255,102,0.1)] border-primary/20' : ''}`}
            noPadding
            onClick={onClick}
        >
            <div className={`${isSpotlight ? 'h-72 sm:h-80' : 'h-48 xs:h-40 sm:h-52'} bg-card relative overflow-hidden ${!availability.available ? 'grayscale-[0.8]' : ''}`}>
                {merchant.bannerUrl ? (
                    <img
                        src={merchant.bannerUrl}
                        alt={merchant.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                        <div className="w-32 h-32 bg-primary/20 rounded-full blur-[80px] animate-pulse-slow" />
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {isSpotlight && (
                        <Badge variant="primary" className="bg-accent text-background border-none shadow-[0_0_20px_rgba(255,214,0,0.5)] animate-bounce-slow">
                            <Star size={10} className="mr-1.5 fill-current" />
                            {language === 'es' ? 'DESTACADO' : 'FEATURED'}
                        </Badge>
                    )}
                    <Badge variant="glass" className="bg-background/40">
                        {merchant.category}
                    </Badge>
                    {merchant.isSustainable && (
                        <Badge variant="primary" className="animate-pulse shadow-[0_0_15px_rgba(0,255,102,0.3)]">
                            <Leaf size={10} className="mr-1.5 fill-current" />
                            {t('eco_friendly')}
                        </Badge>
                    )}
                    {!availability.available && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 uppercase tracking-widest text-[8px] font-black">
                            {availability.reason === 'OFFLINE' ? (language === 'es' ? 'Fuera de Línea' : 'Offline') :
                                availability.reason === 'CLOSED' ? (language === 'es' ? 'Cerrado' : 'Closed') :
                                    (language === 'es' ? 'Ocupado' : 'Busy')}
                        </Badge>
                    )}
                </div>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <CardTitle className={`group-hover:text-primary transition-colors duration-300 ${isSpotlight ? 'text-2xl sm:text-3xl font-black' : ''}`}>
                        {merchant.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-accent bg-accent/10 px-2 py-1 rounded-lg border border-accent/10">
                        <Star size={14} className={(merchant.avgRating ?? 0) > 0 ? 'fill-accent' : ''} />
                        <span className="text-[10px] font-black">
                            {(merchant.avgRating ?? 0) > 0
                                ? `${merchant.avgRating} (${merchant.reviewCount})`
                                : t('new')}
                        </span>
                    </div>
                </div>

                <CardDescription className="line-clamp-2 mb-6 min-h-[40px]">
                    {merchant.description}
                </CardDescription>

                <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                            <MapPin size={14} className="text-primary" />
                        </div>
                        <span className="line-clamp-1">{merchant.address}</span>
                    </div>
                    {merchant.phone && (
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                <Phone size={14} className="text-primary" />
                            </div>
                            <span>{merchant.phone}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 mt-0">
                <Button
                    variant={availability.available ? 'glass' : 'ghost'}
                    className="w-full group/btn"
                    disabled={!availability.available}
                >
                    <span className="flex items-center gap-2">
                        {language === 'es' ? 'Ver Menú' : 'View Menu'}
                        {availability.available && <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                    </span>
                </Button>
            </CardFooter>
        </Card>
    );
};
