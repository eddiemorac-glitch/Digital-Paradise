import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, Edit2, Leaf } from 'lucide-react';
import { EventRequest } from '../../../../types/event';

interface EventRequestListProps {
    requests: EventRequest[];
    onPromote: (request: EventRequest) => void;
    onReject: (payload: { id: string; reason: string }) => void;
}

export const EventRequestList: React.FC<EventRequestListProps> = ({
    requests,
    onPromote,
    onReject
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
                {(!requests || requests.length === 0) ? (
                    <div className="col-span-2 text-center py-20 opacity-40">
                        <Leaf className="mx-auto mb-4" size={48} />
                        <p>No hay solicitudes pendientes</p>
                    </div>
                ) : (
                    requests.map((req: any) => (
                        <motion.div
                            key={req.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="glass p-6 rounded-[2rem] border-white/5 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <h1 className="text-4xl font-black">{req.adTier}</h1>
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${req.adTier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-500' :
                                                req.adTier === 'SILVER' ? 'bg-slate-400/20 text-slate-400' :
                                                    'bg-orange-500/20 text-orange-500'
                                                }`}>
                                                {req.adTier}
                                            </span>
                                            <span className="text-[10px] text-white/40 font-bold uppercase">{req.category}</span>
                                        </div>
                                        <h3 className="text-xl font-black">{req.title}</h3>
                                        <p className="text-xs text-white/60 mt-1 line-clamp-2">{req.description}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-white/50 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} /> {req.date}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={12} /> {req.user?.fullName || 'Usuario'}
                                    </div>
                                    <div className="flex items-center gap-2 col-span-2">
                                        <MapPin size={12} /> {req.locationName}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onReject({ id: req.id, reason: 'Reject via Admin' })}
                                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Rechazar
                                    </button>
                                    <button
                                        onClick={() => onPromote(req)}
                                        className="flex-[2] py-3 bg-primary text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={12} />
                                        Aprobar y Editar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
    );
};
