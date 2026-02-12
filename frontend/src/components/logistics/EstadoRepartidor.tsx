import { motion } from 'framer-motion';
import {
    Wifi, WifiOff, MapPin, MapPinOff, Power, Utensils, Package, Car
} from 'lucide-react';
import { playTacticalSound } from '../../utils/tacticalSound';
import { useLanguageStore } from '../../store/languageStore';

interface EstadoRepartidorProps {
    isOnline: boolean;
    onToggleOnline: (status: boolean) => void;
    activeWorkType: 'FOOD' | 'PARCEL' | 'RIDE';
    onWorkTypeChange: (type: 'FOOD' | 'PARCEL' | 'RIDE') => void;
    isSocketConnected: boolean;
    isGpsActive: boolean;
}

export const EstadoRepartidor = ({
    isOnline,
    onToggleOnline,
    activeWorkType,
    onWorkTypeChange,
    isSocketConnected,
    isGpsActive
}: EstadoRepartidorProps) => {
    const { t } = useLanguageStore();

    return (
        <div className="glass p-8 rounded-[2.5rem] border-primary/20 space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isOnline ? 'text-primary' : 'text-white/40'}`}>
                        {isOnline ? t('status_online_title') : t('status_offline_title')}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {isOnline ? t('online_desc') : t('offline_desc')}
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        onToggleOnline(!isOnline);
                        playTacticalSound(isOnline ? 'OFFLINE' : 'ONLINE');
                    }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isOnline ? 'bg-primary text-background shadow-[0_0_40px_rgba(0,255,102,0.4)]' : 'bg-white/5 text-white/20 border border-white/10'}`}
                >
                    <Power size={32} />
                </motion.button>
            </div>

            {/* STATUS INDICATORS */}
            <div className="flex gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isSocketConnected ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {isSocketConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">{isSocketConnected ? t('network_ok') : t('no_network')}</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isGpsActive ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {isGpsActive ? <MapPin size={14} /> : <MapPinOff size={14} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">{isGpsActive ? t('gps_ok') : t('no_gps')}</span>
                </div>
            </div>

            {/* WORK TYPE SELECTOR */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { id: 'FOOD', icon: Utensils, label: t('work_type_food') },
                    { id: 'PARCEL', icon: Package, label: t('work_type_parcel') },
                    { id: 'RIDE', icon: Car, label: t('work_type_ride') },
                ].map((type) => (
                    <motion.button
                        key={type.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (activeWorkType !== type.id) {
                                onWorkTypeChange(type.id as any);
                                playTacticalSound('CLICK');
                            }
                        }}
                        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border transition-all ${activeWorkType === type.id
                            ? 'bg-primary text-background border-primary shadow-[0_10px_30px_rgba(0,255,102,0.3)]'
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                    >
                        <type.icon size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
