import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Waves, DollarSign, ThermometerSun, LifeBuoy, Bus } from 'lucide-react';
import { useLanguageStore } from '../store/languageStore';
import { useNotificationStore } from '../store/notificationStore';
import { BusScheduleModal } from './BusScheduleModal';

interface TouristHUDProps {
    onOpenGuide?: () => void;
}

export const TouristHUD = ({ }: TouristHUDProps) => {
    const { t, language } = useLanguageStore();
    const addNotification = useNotificationStore((state) => state.addNotification);
    const [isBusScheduleOpen, setIsBusScheduleOpen] = useState(false);
    const [temperature, setTemperature] = useState<number | null>(null);
    const [waveHeight, setWaveHeight] = useState<number | null>(null);
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);

    useEffect(() => {
        // Fetch weather (Temperature)
        fetch('https://api.open-meteo.com/v1/forecast?latitude=9.6536&longitude=-82.7523&current_weather=true')
            .then(res => res.json())
            .then(data => {
                if (data.current_weather) setTemperature(Math.round(data.current_weather.temperature));
            })
            .catch(err => console.error('Weather error:', err));

        // Fetch Marine Data (Wave Height)
        fetch('https://marine-api.open-meteo.com/v1/marine?latitude=9.6536&longitude=-82.7523&current=wave_height')
            .then(res => res.json())
            .then(data => {
                if (data.current && data.current.wave_height) setWaveHeight(data.current.wave_height);
            })
            .catch(err => console.error('Marine error:', err));

        // Fetch Exchange Rate (USD -> CRC)
        fetch('https://open.er-api.com/v6/latest/USD')
            .then(res => res.json())
            .then(data => {
                if (data.rates && data.rates.CRC) setExchangeRate(data.rates.CRC);
            })
            .catch(err => console.error('Forex error:', err));
    }, []);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-24"
            >
                {/* BUS PUBLICO / Transportation Card */}
                <button
                    onClick={() => setIsBusScheduleOpen(true)}
                    className="glass p-5 rounded-[2rem] border-amber-400/20 bg-amber-400/5 flex flex-col justify-between group overflow-hidden relative text-left hover:bg-amber-400/10 transition-all duration-300 hover:scale-[1.02] hover:border-amber-400/30"
                >
                    {/* Background Icon */}
                    <div className="absolute -right-2 -bottom-4 opacity-[0.15] group-hover:opacity-25 transition-all duration-500 group-hover:-translate-x-2">
                        <Bus size={90} className="text-amber-400" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">TRANSPORTE</span>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-amber-200/60 uppercase tracking-wider mb-0.5">
                            {language === 'es' ? 'Rutas & Horarios' : 'Routes & Schedules'}
                        </p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-white italic tracking-tighter">MEPE</span>
                            <span className="text-xs font-bold text-white/40">/ CARIBE SUR</span>
                        </div>
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
                        <p className="text-xl font-black text-white italic tracking-tighter">
                            {temperature !== null ? `${temperature}°C` : '--°C'}
                            <span className="text-white/20 ml-2">Puerto Viejo</span>
                        </p>
                    </div>
                </div>

                {/* Surf / Oleaje Card (Premium Animated - Ultra Smooth) */}
                <div className="glass p-0 rounded-[2rem] border-cyan-400/20 bg-gradient-to-b from-cyan-900/10 to-blue-900/20 flex flex-col justify-between group overflow-hidden relative min-h-[140px]">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Animated Waves Container */}
                    <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden rounded-b-[2rem] opacity-60">
                        {/* Back Wave Layer (Slower, Very Smooth) */}
                        <motion.div
                            className="absolute bottom-0 w-[200%] h-full flex"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                        >
                            <svg className="w-1/2 h-full text-cyan-500/20" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path fill="currentColor" d="M0,220 C 480,150 960,290 1440,220 V 320 H 0 Z"></path>
                            </svg>
                            <svg className="w-1/2 h-full text-cyan-500/20" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path fill="currentColor" d="M0,220 C 480,150 960,290 1440,220 V 320 H 0 Z"></path>
                            </svg>
                        </motion.div>

                        {/* Front Wave Layer (Faster, Rounder but Low) */}
                        <motion.div
                            className="absolute bottom-0 w-[200%] h-full flex"
                            animate={{ x: ["-50%", "0%"] }}
                            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        >
                            <svg className="w-1/2 h-full text-blue-500/30" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path fill="currentColor" d="M0,250 C 480,310 960,190 1440,250 V 320 H 0 Z"></path>
                            </svg>
                            <svg className="w-1/2 h-full text-blue-500/30" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path fill="currentColor" d="M0,250 C 480,310 960,190 1440,250 V 320 H 0 Z"></path>
                            </svg>
                        </motion.div>
                    </div>

                    <div className="p-5 relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 border border-cyan-400/10 backdrop-blur-sm shadow-lg shadow-cyan-900/20">
                                <Waves size={20} />
                            </div>
                            {waveHeight !== null && (
                                <span className={`text-[9px] font-black px-2 py-1 rounded-full border backdrop-blur-md uppercase tracking-wide ${waveHeight > 1.8 ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                                    waveHeight > 1.2 ? 'bg-amber-500/20 border-amber-500/30 text-amber-200' :
                                        'bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                                    }`}>
                                    {waveHeight > 1.8 ? (language === 'es' ? 'ALTO ⚠️' : 'HIGH ⚠️') :
                                        waveHeight > 1.2 ? (language === 'es' ? 'MODERADO' : 'MID') :
                                            (language === 'es' ? 'CALMO' : 'CALM')}
                                </span>
                            )}
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/60 mb-1 drop-shadow-sm">
                                {language === 'es' ? 'OLEAJE ACTUAL' : 'CURRENT SURF'}
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                                    {waveHeight !== null ? waveHeight.toFixed(1) : '--'}
                                </span>
                                <span className="text-sm font-bold text-cyan-200/60">m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Currency / Tipo de Cambio */}
                <button
                    onClick={() => {
                        if (!exchangeRate) return;
                        const amount = prompt(language === 'es' ? 'Monto en USD a convertir:' : 'USD Amount to convert:');
                        if (amount && !isNaN(Number(amount))) {
                            const result = (Number(amount) * exchangeRate).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' });
                            addNotification({
                                title: 'Cambio / Exchange',
                                message: `$${amount} USD = ${result}`,
                                type: 'info'
                            });
                        }
                    }}
                    className="glass p-5 rounded-[2rem] border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 transition-all duration-300 group text-left relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={60} className="text-emerald-400 -rotate-12" />
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 mb-6 relative z-10">
                        <DollarSign size={20} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">USD <span className="text-white/40">⇌</span> CRC</p>
                        <p className="text-xl font-black text-white italic tracking-tighter">
                            {exchangeRate ? `₡${Math.floor(exchangeRate)}` : '...'}
                        </p>
                    </div>
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

            <BusScheduleModal
                isOpen={isBusScheduleOpen}
                onClose={() => setIsBusScheduleOpen(false)}
            />
        </>
    );
};
