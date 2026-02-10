import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

export const PrivacyModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative z-10 w-full max-w-2xl glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 max-h-[80vh] overflow-y-auto"
                    >
                        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white">
                            <X size={24} />
                        </button>

                        <header className="mb-12">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter uppercase">Política de <span className="text-gradient">Privacidad</span></h2>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">Cumplimiento Ley No. 8968 - Costa Rica</p>
                        </header>

                        <div className="space-y-8 text-white/60 leading-relaxed font-medium">
                            <section className="space-y-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Lock size={14} className="text-primary" /> 1. Recolección de Datos
                                </h3>
                                <p>Recopilamos su nombre, correo electrónico y datos transaccionales para procesar pedidos y pagos. Sus datos están protegidos bajo los más altos estándares de seguridad en la nube.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <FileText size={14} className="text-primary" /> 2. Uso de la Información
                                </h3>
                                <p>Su información se utiliza exclusivamente para: proveer el servicio de DIGITAL PARADISE, generar facturas electrónicas válidas ante el Ministerio de Hacienda y coordinar entregas logísticas.</p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-primary" /> 3. Sus Derechos (ARCO)
                                </h3>
                                <p>Usted tiene derecho al Acceso, Rectificación, Cancelación y Oposición de sus datos. Puede solicitar cualquier cambio escribiendo a privacidad@digitalparadise.cr.</p>
                            </section>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-12 w-full py-4 bg-primary text-background font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-[1.02] transition-all"
                        >
                            He Leído y Acepto
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
