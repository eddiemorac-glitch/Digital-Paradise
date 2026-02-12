import React from 'react';
import { motion } from 'framer-motion';
import { Power, Zap, Loader2, Settings } from 'lucide-react';
import { Merchant } from '../../../api/merchants';
import { useLanguageStore } from '../../../store/languageStore';

interface OperationsBarProps {
    merchant: Merchant | undefined;
    isSocketConnected: boolean;
    onToggleStatus: (isActive: boolean) => void;
    onToggleBusy: (isBusy: boolean) => void;
    onViewProfile: () => void;
    isStatusPending: boolean;
    isBusyPending: boolean;
}

export const OperationsBar: React.FC<OperationsBarProps> = ({
    merchant,
    isSocketConnected,
    onToggleStatus,
    onToggleBusy,
    onViewProfile,
    isStatusPending,
    isBusyPending,
}) => {
    const { t } = useLanguageStore();

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl relative group shrink-0">
                    {merchant?.logoUrl ? (
                        <img src={merchant.logoUrl} alt={merchant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-2xl uppercase">
                            {merchant?.name?.[0] || 'M'}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Settings size={16} className="text-white animate-spin-slow" />
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3 flex-wrap">
                        {merchant?.name || t('my_business')}
                        <div className="flex items-center gap-3 sm:flex">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                                <div className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-primary shadow-[0_0_8px_rgba(0,255,102,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
                                    {isSocketConnected ? t('status_synced') : t('status_offline')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                                <div className={`w-1.5 h-1.5 rounded-full ${merchant?.haciendaStatus === 'ACTIVE' ? 'bg-primary shadow-[0_0_8px_rgba(0,255,102,0.8)]' : merchant?.haciendaStatus === 'INVALID' ? 'bg-red-500' : 'bg-white/20'}`} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
                                    Hacienda {merchant?.haciendaStatus === 'ACTIVE' ? 'OK' : 'Error'}
                                </span>
                            </div>
                        </div>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">{merchant?.category || 'Marketplace'}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl">
                {/* BUSY MODE TOGGLE */}
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex flex-col items-end">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5 whitespace-nowrap">
                            {t('busy_mode')}
                        </p>
                        <p className={`text-[10px] font-black uppercase ${merchant?.operationalSettings?.isBusy ? 'text-amber-500' : 'text-white/20'}`}>
                            {merchant?.operationalSettings?.isBusy ? t('status_active') : t('status_normal')}
                        </p>
                    </div>
                    <button
                        onClick={() => onToggleBusy(!merchant?.operationalSettings?.isBusy)}
                        disabled={isBusyPending}
                        className={`w-10 h-6 rounded-full transition-colors relative ${merchant?.operationalSettings?.isBusy ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-white/10'}`}
                    >
                        <motion.div
                            animate={{ x: merchant?.operationalSettings?.isBusy ? 16 : 0 }}
                            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center"
                        >
                            {isBusyPending ? <Loader2 size={8} className="animate-spin text-amber-500" /> : <Zap size={8} className={merchant?.operationalSettings?.isBusy ? 'text-amber-500 fill-amber-500' : 'text-white/20'} />}
                        </motion.div>
                    </button>
                </div>

                <div className="h-8 w-px bg-white/10 hidden sm:block" />

                {/* ONLINE STATUS TOGGLE */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5 whitespace-nowrap">
                            {t('store_status_label')}
                        </p>
                        <p className={`text-[10px] font-black uppercase ${merchant?.isActive ? 'text-primary' : 'text-red-500'}`}>
                            {merchant?.isActive ? t('status_online') : t('status_offline')}
                        </p>
                    </div>
                    <button
                        onClick={() => onToggleStatus(!merchant?.isActive)}
                        disabled={isStatusPending}
                        className={`w-20 h-10 rounded-full p-1 transition-all duration-500 relative flex items-center ${merchant?.isActive ? 'bg-primary/20' : 'bg-red-500/20'}`}
                    >
                        <motion.div
                            animate={{ x: merchant?.isActive ? 40 : 0 }}
                            className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center ${merchant?.isActive ? 'bg-primary' : 'bg-red-500'}`}
                        >
                            {isStatusPending ? (
                                <Loader2 size={14} className="animate-spin text-background" />
                            ) : (
                                <Power size={14} className="text-background" />
                            )}
                        </motion.div>
                    </button>
                </div>

                <div className="h-8 w-px bg-white/10 hidden sm:block" />

                <button
                    onClick={onViewProfile}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10 hover:scale-105"
                    title={t('settings')}
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
};
