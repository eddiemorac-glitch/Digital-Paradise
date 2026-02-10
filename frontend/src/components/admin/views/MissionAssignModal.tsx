import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Truck, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { userApi, UserProfile } from '../../../api/users';

interface MissionAssignModalProps {
    missionId: string;
    onClose: () => void;
    onAssign: (courierId: string) => void;
}

export const MissionAssignModal: React.FC<MissionAssignModalProps> = ({ missionId, onClose, onAssign }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);

    const { data: users, isLoading } = useQuery<UserProfile[]>({
        queryKey: ['admin-users'],
        queryFn: () => userApi.getAll()
    });

    // Filter for couriers (assuming role 'COURIER' or similar, strict for now but flexible in search)
    // For now, let's just show all users that match search and maybe highlight roles
    const couriers = users?.filter(u =>
        (u.role === 'COURIER' || u.role === 'DRIVER' || u.role === 'DELIVERY' || true) && // Show all for now to be safe, filter by search
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssign = () => {
        if (selectedCourierId) {
            onAssign(selectedCourierId);
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh]"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Truck className="text-primary" size={20} />
                            Asignar Misión
                        </h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                            ID: {missionId.slice(0, 8)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-white/5 bg-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar repartidor..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-primary/50 text-white"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center py-12 text-white/20">Cargando flota...</div>
                    ) : couriers?.length === 0 ? (
                        <div className="text-center py-12 text-white/20">No se encontraron repartidores.</div>
                    ) : (
                        couriers?.map((courier) => (
                            <button
                                key={courier.id}
                                onClick={() => setSelectedCourierId(courier.id)}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group ${selectedCourierId === courier.id
                                    ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedCourierId === courier.id ? 'bg-primary text-black' : 'bg-white/10 text-white'
                                    }`}>
                                    {courier.fullName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm ${selectedCourierId === courier.id ? 'text-white' : 'text-white/80'}`}>
                                        {courier.fullName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-white/40 bg-black/30 px-2 py-0.5 rounded">
                                            {courier.role}
                                        </span>
                                        {courier.points > 100 && (
                                            <span className="text-[10px] text-green-400 flex items-center gap-1">
                                                <CheckCircle size={10} /> Verificado
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedCourierId === courier.id && (
                                    <div className="text-primary">
                                        <CheckCircle size={20} />
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5">
                    <button
                        onClick={handleAssign}
                        disabled={!selectedCourierId}
                        className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Confirmar Asignación
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
