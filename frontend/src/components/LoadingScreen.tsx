import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import logo from '../assets/logo.png';

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex flex-col items-center"
            >
                {/* Logo & Spinner Container */}
                <div className="relative mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 rounded-full border-t-2 border-primary border-r-2 border-r-transparent border-b-2 border-b-primary/20 border-l-2 border-l-transparent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img src={logo} alt="Logo" className="w-12 h-12 object-contain opacity-80" />
                    </div>
                </div>

                {/* Text Branding */}
                <div className="text-center">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2 justify-center">
                        DIGITAL <span className="text-primary italic">PARADISE</span>
                    </h2>
                    <div className="mt-2 flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 text-primary animate-spin" />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">Cargando Experiencia</span>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Tagline */}
            <div className="absolute bottom-12 left-0 right-0 text-center">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Limón • Costa Rica</p>
            </div>
        </div>
    );
};
