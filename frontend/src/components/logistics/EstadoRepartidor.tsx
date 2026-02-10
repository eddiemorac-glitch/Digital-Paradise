import React from 'react';
import { Power, Bike, Package, Users, Globe, Signal } from 'lucide-react';

interface EstadoRepartidorProps {
    isOnline: boolean;
    onToggleOnline: (online: boolean) => void;
    activeWorkType: 'FOOD' | 'PARCEL' | 'RIDE';
    onWorkTypeChange: (type: 'FOOD' | 'PARCEL' | 'RIDE') => void;
    isSocketConnected: boolean;
    isGpsActive: boolean;
}

export const EstadoRepartidor: React.FC<EstadoRepartidorProps> = ({
    isOnline,
    onToggleOnline,
    activeWorkType,
    onWorkTypeChange,
    isSocketConnected,
    isGpsActive
}) => {
    return (
        <div className="space-y-4">
            {/* Main Toggle */}
            <button
                onClick={() => onToggleOnline(!isOnline)}
                className={`w-full group relative overflow-hidden glass p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${isOnline
                    ? 'border-primary bg-primary/10 shadow-[0_0_40px_rgba(0,255,102,0.15)]'
                    : 'border-white/5 bg-white/5'
                    }`}
            >
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOnline ? 'bg-primary text-background' : 'bg-white/5 text-white/20'
                            }`}>
                            <Power size={32} strokeWidth={3} className={isOnline ? 'animate-pulse' : ''} />
                        </div>
                        <div className="text-left">
                            <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${isOnline ? 'text-primary' : 'text-white/40'}`}>
                                {isOnline ? 'ESTÁS CONECTADO' : 'ESTÁS DESCONECTADO'}
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
                                {isOnline ? 'Recibiendo pedidos en tiempo real' : 'Conéctate para empezar a ganar'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Pills */}
                {isOnline && (
                    <div className="absolute top-4 right-8 flex gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isSocketConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                            <Signal size={10} strokeWidth={3} />
                            {isSocketConnected ? 'RED OK' : 'SIN RED'}
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isGpsActive ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            <Globe size={10} strokeWidth={3} />
                            {isGpsActive ? 'GPS OK' : 'SIN GPS'}
                        </div>
                    </div>
                )}
            </button>

            {/* Work Type Selection */}
            <div className="flex gap-2 bg-white/5 p-2 rounded-[2rem] border border-white/10">
                {[
                    { id: 'FOOD', icon: Bike, label: 'Comida' },
                    { id: 'PARCEL', icon: Package, label: 'Paquetes' },
                    { id: 'RIDE', icon: Users, label: 'Viajes' }
                ].map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onWorkTypeChange(type.id as any)}
                        className={`flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl transition-all ${activeWorkType === type.id
                            ? 'bg-white/10 text-primary shadow-inner border border-white/5'
                            : 'text-white/20 hover:text-white/40'
                            }`}
                    >
                        <type.icon size={24} strokeWidth={activeWorkType === type.id ? 2.5 : 2} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{type.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
