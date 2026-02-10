import { motion } from 'framer-motion';
import { Waves, DollarSign, ThermometerSun, LifeBuoy, Activity } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';
import { useNotificationStore } from '../store/notificationStore';

interface TouristHUDProps {
    onOpenGuide?: () => void;
}

export const TouristHUD = ({ }: TouristHUDProps) => {
    const { t, language } = useLanguageStore();
    const addNotification = useNotificationStore((state) => state.addNotification);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-24"
        >
            {/* BUS PUBLICO / Traffic Generation */}
            <button
                onClick={() => addNotification({
                    title: 'Buses Puerto Viejo',
                    message: 'Limón -> PV: 6:00, 8:00, 10:00... | San José (MEPE): 6:00 AM, 12:00 PM',
                    type: 'info'
                })}
                className="glass p-5 rounded-[2rem] border-primary/20 bg-primary/5 flex flex-col justify-between group overflow-hidden relative text-left"
            >
                <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Activity size={40} className="text-primary animate-pulse" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">BUS PUBLICO</span>
                </div>
                <div>
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">
                        {language === 'es' ? 'HORARIOS' : 'TRANSIT'}
                    </p>
                    <p className="text-xl font-black text-white italic tracking-tighter uppercase">MEPE / Limón</p>
                </div>
            </button>


            {/* Weather */}
            <div className="glass p-5 rounded-[2rem] border-white/5 bg-white/5 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                        <ThermometerSun size={20} />
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">{t('weather_today')}</p>
                    <p className="text-xl font-black text-white italic tracking-tighter">28°C <span className="text-white/20">Puerto Viejo</span></p>
                </div>
            </div>

            {/* Tides */}
            <div className="glass p-5 rounded-[2rem] border-white/5 bg-white/5 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-400 group-hover:-translate-y-1 transition-transform">
                        <Waves size={20} />
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{t('high_tide')}</p>
                    <p className="text-xl font-black text-white italic tracking-tighter">4:15 PM</p>
                </div>
            </div>

            {/* Currency */}
            <button
                onClick={() => {
                    const amount = prompt(language === 'es' ? 'Monto en USD:' : 'USD Amount:');
                    if (amount) {
                        addNotification({
                            title: 'Conversión Caribbean',
                            message: `$${amount} USD ≈ ₡${(Number(amount) * 512.4).toLocaleString()} CRC`,
                            type: 'info'
                        });
                    }
                }}
                className="glass p-5 rounded-[2rem] border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-500 group text-left"
            >
                <div className="w-10 h-10 rounded-2xl bg-green-400/10 flex items-center justify-center text-green-400 mb-6">
                    <DollarSign size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">{t('exchange_rate')}</p>
                <p className="text-xl font-black text-white italic tracking-tighter text-gradient">₡512.4</p>
            </button>

            {/* SOS / Assistance */}
            <button
                onClick={() => addNotification({
                    title: 'Caribbean Support',
                    message: 'Emergencias 911 | PV Security 2750-0230',
                    type: 'warning'
                })}
                className="glass p-5 rounded-[2rem] border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all duration-500 group text-left"
            >
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 mb-6 group-hover:animate-pulse">
                    <LifeBuoy size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">PROTOCOLO</p>
                <p className="text-xl font-black text-white italic tracking-tighter">SOS</p>
            </button>
        </motion.div>
    );
};
