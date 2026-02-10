import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Clock, AlertTriangle } from 'lucide-react';
import { MerchantData } from '../../types/map';
import { getMerchantAvailability } from '../../utils/merchant';
import { useLanguageStore } from '../../store/languageStore';

interface MerchantCardProps {
    merchant: MerchantData;
    onClose: () => void;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
    merchant,
    onClose
}) => {
    const { t } = useLanguageStore();
    const availability = getMerchantAvailability(merchant);

    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute top-24 left-8 z-[1001] w-72 pointer-events-auto"
        >
            <div className="glass p-6 rounded-[2rem] border-primary/20 bg-background/60 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <MapPin size={20} />
                    </div>
                    <button onClick={onClose} className="text-white/20 hover:text-white transition-all">
                        <X size={16} />
                    </button>
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">
                    {t('local_establishment')}
                </p>
                <h4 className="text-sm font-black uppercase tracking-tighter truncate mt-1">
                    {merchant.name}
                </h4>

                <div className="mt-3">
                    {!availability.available ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">
                            {availability.reason === 'OFFLINE' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {availability.reason === 'OFFLINE' ? t('inactive') :
                                    availability.reason === 'CLOSED' ? t('closed') : t('busy')}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t('operational')}</span>
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-white/60 font-medium leading-relaxed mt-3">
                    {merchant.address}
                </p>
            </div>
        </motion.div>
    );
};
