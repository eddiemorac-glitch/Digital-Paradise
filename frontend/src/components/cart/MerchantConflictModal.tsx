import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useLanguageStore } from '../../store/languageStore';

interface MerchantConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    currentMerchantName?: string;
    newMerchantName?: string;
}

export const MerchantConflictModal = ({
    isOpen,
    onClose,
    onConfirm,
    currentMerchantName = 'Otro Comercio',
    newMerchantName = 'Nuevo Comercio'
}: MerchantConflictModalProps) => {
    const { language } = useLanguageStore();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-background/40 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
                    >
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-8 shadow-[0_0_30px_rgba(0,255,102,0.1)]">
                                <AlertCircle size={40} />
                            </div>

                            <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic tracking-tighter">
                                {language === 'es' ? '¿CAMBIAR DE COMERCIO?' : 'CHANGE MERCHANT?'}
                            </h3>

                            <p className="text-white/60 text-sm leading-relaxed mb-10 px-4">
                                {language === 'es'
                                    ? `Ya tienes productos de ${currentMerchantName} en tu carrito. Para agregar artículos de ${newMerchantName}, debemos vaciar tu carrito actual.`
                                    : `You already have items from ${currentMerchantName} in your cart. To add items from ${newMerchantName}, we need to clear your current cart.`}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    variant="glass"
                                    onClick={onClose}
                                    className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    {language === 'es' ? 'MANTENER ACTUAL' : 'KEEP CURRENT'}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={onConfirm}
                                    className="flex-1 h-14 rounded-2xl group"
                                >
                                    <span className="flex items-center gap-2">
                                        <Trash2 size={18} />
                                        {language === 'es' ? 'VACÍAR Y AGREGAR' : 'CLEAR & ADD'}
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {/* Top Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/40"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
