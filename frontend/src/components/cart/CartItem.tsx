import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, Ticket, Calendar, MapPin } from 'lucide-react';
import { CartItem as ICartItem } from '../../store/cartStore';

interface CartItemProps {
    item: ICartItem;
    onRemove: (id: string) => void;
    onIncrease: (item: ICartItem) => void; // Using addItem to increase
    onDecrease: (id: string) => void;
    isLocked: boolean;
    index: number;
}

export const CartItem = ({ item, onRemove, onIncrease, onDecrease, isLocked, index }: CartItemProps) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all duration-300 ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}
        >
            {/* Sold out overlay */}
            {!item.isAvailable && (
                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                    <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                        Agotado
                    </span>
                </div>
            )}

            <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-white/5 overflow-hidden flex-shrink-0 border border-white/5">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                            {(item.itemType === 'event' || item.itemType === 'event-request')
                                ? <Ticket size={20} />
                                : <span className="text-lg font-black uppercase">{item.name[0]}</span>
                            }
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <h3 className="font-black text-white text-xs uppercase italic tracking-tight truncate">{item.name}</h3>
                            {(item.itemType === 'event' || item.itemType === 'event-request') ? (
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    {item.date && (
                                        <span className="text-[9px] text-white/40 flex items-center gap-0.5">
                                            <Calendar size={8} /> {item.date}
                                        </span>
                                    )}
                                    {item.locationName && (
                                        <span className="text-[9px] text-white/40 flex items-center gap-0.5 truncate max-w-[120px]">
                                            <MapPin size={8} /> {item.locationName}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-[9px] text-primary/40 font-bold uppercase tracking-widest mt-0.5">{item.category}</p>
                            )}
                        </div>
                        <button
                            onClick={() => onRemove(item.id)}
                            disabled={isLocked}
                            className={`text-white/10 hover:text-red-400 transition-colors shrink-0 ${isLocked ? 'cursor-not-allowed opacity-20' : ''}`}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>

                    {/* Price + Quantity */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-primary font-black text-sm tracking-tighter">
                            ₡{(item.price * item.quantity).toLocaleString()}
                        </span>

                        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/5">
                            <button
                                onClick={() => onDecrease(item.id)}
                                disabled={isLocked}
                                className={`w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:bg-white/10 transition-all ${isLocked ? 'opacity-20' : ''}`}
                            >
                                <Minus size={12} />
                            </button>
                            <span className="text-[10px] font-black w-5 text-center text-white">{item.quantity}</span>
                            <button
                                onClick={() => onIncrease(item)}
                                disabled={!item.isAvailable || isLocked}
                                className={`w-7 h-7 rounded-md flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-all ${(!item.isAvailable || isLocked) ? 'opacity-20 cursor-not-allowed' : ''}`}
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
