import React from 'react';
import { Star } from 'lucide-react';

interface ReviewsListProps {
    reviews: any[];
    language: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, language }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
                {language === 'es' ? 'Feedback de Clientes' : 'Customer Feedback'}
                <div className="px-3 py-1 bg-accent/10 rounded-full border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest">
                    {reviews?.length || 0} {language === 'es' ? 'Reseñas' : 'Reviews'}
                </div>
            </h2>
            <div className="glass p-8 rounded-[2.5rem] border-white/5 h-[620px] flex flex-col overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16" />

                <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pr-2 relative z-10">
                    {!reviews || reviews.length === 0 ? (
                        <div className="text-center py-20 opacity-20 font-black italic uppercase tracking-widest">
                            {language === 'es' ? 'Sin reseñas aún' : 'No reviews yet'}
                        </div>
                    ) : (
                        reviews.map((review: any) => (
                            <div key={review.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black uppercase text-primary border border-primary/10 group-hover:bg-primary/20 transition-colors">
                                            {review.user?.fullName?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-white">{review.user?.fullName || 'Usuario Caribe'}</p>
                                            <div className="flex text-yellow-400 gap-0.5 mt-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={8} className={i < review.rating ? 'fill-current' : 'opacity-20'} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="relative">
                                    <p className="text-xs text-white/50 leading-relaxed font-medium italic relative z-10 pl-4 border-l-2 border-primary/20">
                                        "{review.comment || (language === 'es' ? 'Excelente servicio' : 'Excellent service')}"
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
