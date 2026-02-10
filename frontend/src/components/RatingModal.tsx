import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, MessageSquare, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../api/reviews';

interface RatingModalProps {
    orderId: string;
    merchantName: string;
    onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ orderId, merchantName, onClose }) => {
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');

    const mutation = useMutation({
        mutationFn: () => reviewApi.create({ orderId, rating, comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-orders'] });
            onClose();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        mutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass w-full max-w-md p-8 rounded-[3rem] border-white/10 relative z-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-2">Tu Opinión Importa</p>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        ¿Qué tal estuvo <span className="text-primary">{merchantName}</span>?
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Stars */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                className="group relative"
                            >
                                <Star
                                    size={40}
                                    className={`transition-all duration-300 ${(hover || rating) >= star
                                        ? 'fill-primary text-primary drop-shadow-[0_0_10px_rgba(0,255,102,0.5)] scale-110'
                                        : 'text-white/10'
                                        }`}
                                />
                                {(hover || rating) >= star && (
                                    <motion.div
                                        layoutId="star-aura"
                                        className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Comment */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest pl-2">
                            <MessageSquare size={12} />
                            Comentarios (Opcional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Escribe tu reseña aquí..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white min-h-[120px] outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={rating === 0 || mutation.isPending}
                        className="w-full bg-primary hover:bg-primary-dark text-background font-black py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(0,255,102,0.2)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {mutation.isPending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>Publicar Reseña</>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
