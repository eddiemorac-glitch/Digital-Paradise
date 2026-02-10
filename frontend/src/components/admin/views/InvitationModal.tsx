import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Send, Shield, User, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationModalProps {
    onClose: () => void;
}

import { userApi } from '../../../api/users';

// ...

export const InvitationModal: React.FC<InvitationModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('client');
    const [loading, setLoading] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await userApi.inviteUser(email, role);
            if (res.tempPassword) {
                toast.success(`Usuario creado. Contraseña temporal: ${res.tempPassword}`, { duration: 10000 });
                navigator.clipboard.writeText(res.tempPassword);
            } else {
                toast.info(res.message);
            }
            onClose();
        } catch (error) {
            toast.error('Error al invitar usuario');
        } finally {
            setLoading(false);
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
                className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2.5rem] overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Mail className="text-primary" size={20} />
                            Enviar Invitación
                        </h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                            Agregar nuevo usuario al sistema
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleInvite} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-primary/50 text-white"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Rol Asignado</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['client', 'merchant', 'delivery', 'admin'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${role === r ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                        }`}
                                >
                                    {r === 'admin' ? <Shield size={14} /> : r === 'delivery' ? <Truck size={14} /> : <User size={14} />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{r}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                'Enviando...'
                            ) : (
                                <>
                                    <Send size={16} /> Enviar Invitación
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
