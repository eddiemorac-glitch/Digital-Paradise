import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { AVATARS, AVATAR_CATEGORIES } from './AvatarIcons';

interface AvatarSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvatarId: string;
    onSelect: (id: string) => void;
}

export const AvatarSelector = ({ isOpen, onClose, currentAvatarId, onSelect }: AvatarSelectorProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden pointer-events-auto shadow-2xl shadow-primary/10 flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Select Identification</h2>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Choose your tactical avatar</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            </div>

                            {/* Grid */}
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                {Object.values(AVATAR_CATEGORIES).map(category => (
                                    <div key={category} className="mb-8 last:mb-0">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 ml-2">{category}</h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                            {AVATARS.filter(a => a.category === category).map((avatar) => {
                                                const isSelected = currentAvatarId === avatar.id;
                                                return (
                                                    <button
                                                        key={avatar.id}
                                                        onClick={() => onSelect(avatar.id)}
                                                        className={`relative group aspect-square rounded-2xl flex items-center justify-center transition-all ${isSelected
                                                                ? 'bg-primary/20 border-2 border-primary shadow-[0_0_20px_rgba(0,255,102,0.3)]'
                                                                : 'bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <avatar.component className={`w-3/4 h-3/4 transition-transform group-hover:scale-110 ${isSelected ? 'scale-110' : 'opacity-60 group-hover:opacity-100'}`} />

                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                                <Check size={10} className="text-black font-bold" />
                                                            </div>
                                                        )}

                                                        <span className="absolute bottom-2 text-[8px] font-black uppercase tracking-wider text-white/40 group-hover:text-white transition-colors">
                                                            {avatar.name}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
