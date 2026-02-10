import { MapPin, Navigation, Bike } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { devLog } from '../utils/devLog';

interface MapCardProps {
    lat: number;
    lng: number;
    courierPos?: { lat: number, lng: number };
    address: string;
    zoom?: number;
}

export const MapCard: React.FC<MapCardProps> = ({ lat, lng, courierPos, address, zoom = 15 }) => {
    // Zoom can be used for future actual API calls
    devLog(`Centering map at ${lat}, ${lng} with zoom ${zoom}`);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[2rem] overflow-hidden border border-white/5 relative group h-full"
        >
            {/* Map Placeholder/Static Image */}
            <div className="h-full min-h-[150px] bg-[#1a1a1a] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* Merchant Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border border-primary/40">
                            <MapPin className="text-primary" size={16} />
                        </div>
                    </div>
                </div>

                {/* Courier Pin (Dynamic) */}
                <AnimatePresence>
                    {courierPos && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                // Simulate position on the relative grid for demo
                                x: (courierPos.lng - lng) * 2000,
                                y: (lat - courierPos.lat) * 2000
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                        >
                            <div className="w-10 h-10 bg-accent/30 rounded-full flex items-center justify-center border border-accent/50 shadow-[0_0_20px_rgba(255,50,102,0.4)]">
                                <Bike className="text-accent" size={18} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Overlay Details */}
                <div className="absolute bottom-3 left-3 right-3 glass p-3 rounded-2xl flex justify-between items-center border-white/10 backdrop-blur-xl">
                    <div className="overflow-hidden">
                        <p className="text-[7px] font-black uppercase text-primary tracking-widest leading-none mb-1">
                            {courierPos ? 'Repartidor en camino' : 'Ubicación local'}
                        </p>
                        <p className="text-[10px] font-bold text-white truncate max-w-[150px]">{address}</p>
                    </div>
                    <Navigation className="text-primary/40" size={12} />
                </div>
            </div>
        </motion.div>
    );
};
