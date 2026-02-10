import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Shield, Radio, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { socketService } from '../../../api/socket';

interface EmergencyModalProps {
    onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ onClose }) => {
    const handleAction = (action: string, type: 'ALERT' | 'LOCKDOWN') => {
        socketService.emitEmergencyBroadcast({
            title: action,
            message: `Acción de emergencia activada: ${action}`,
            type: type
        });
        toast.error(`${action} ACTIVADO EN TODA LA RED`, {
            description: 'Protocolo de seguridad en curso.',
            duration: 5000
        });
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 border-t-4 border-red-500"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-[#1a0505] border border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl shadow-red-900/50"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-red-500">
                            <AlertTriangle size={24} />
                            Protocolo de Emergencia
                        </h2>
                        <p className="text-xs text-red-200/40 font-bold uppercase tracking-widest mt-1">
                            Solo para uso autorizado
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleAction('Lockdown Global', 'LOCKDOWN')}
                        className="w-full p-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-3xl group transition-all text-left flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase text-white mb-1">Lockdown Global</h3>
                            <p className="text-xs text-red-200/60 font-bold">Pausar todos los pedidos instantáneamente</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleAction('Alerta Masiva', 'ALERT')}
                        className="w-full p-6 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/50 rounded-3xl group transition-all text-left flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                            <Radio size={20} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase text-white mb-1">Alerta Masiva</h3>
                            <p className="text-xs text-orange-200/60 font-bold">Notificar evacuación/alerta a todos los usuarios</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleAction('Modo Seguro', 'LOCKDOWN')}
                        className="w-full p-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 rounded-3xl group transition-all text-left flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase text-white mb-1">Modo Seguro</h3>
                            <p className="text-xs text-blue-200/60 font-bold">Activar protocolos de seguridad de datos</p>
                        </div>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-white/20 uppercase font-mono">Este panel registra todas las acciones.</p>
                </div>
            </motion.div>
        </motion.div>
    );
};
