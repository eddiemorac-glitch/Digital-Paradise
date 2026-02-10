import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, ArrowLeft, Loader2, Ticket, Heart, Sparkles, CheckCircle } from 'lucide-react';
import { CocoIcon } from './CocoIcon';
import { rewardsApi } from '../api/rewards';
import { useLanguageStore } from '../store/languageStore';
import { userApi } from '../api/users';
import { useNotificationStore } from '../store/notificationStore';

interface RewardsHubProps {
    onBack: () => void;
    onNavigate: (view: string, params?: any) => void;
}

export const RewardsHub = ({ onBack, onNavigate }: RewardsHubProps) => {
    const { language } = useLanguageStore();
    const queryClient = useQueryClient();
    const { addNotification } = useNotificationStore();
    const [activeTab, setActiveTab] = useState<'available' | 'my-rewards'>('available');

    const { data: profile } = useQuery({
        queryKey: ['user-profile'],
        queryFn: userApi.getProfile
    });

    const { data: rewards = [] } = useQuery({
        queryKey: ['rewards'],
        queryFn: rewardsApi.getAll
    });

    const { data: redemptions = [] } = useQuery({
        queryKey: ['my-redemptions'],
        queryFn: rewardsApi.getMyRedemptions,
        enabled: activeTab === 'my-rewards'
    });

    const redeemMutation = useMutation({
        mutationFn: rewardsApi.redeem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
            addNotification({
                title: language === 'es' ? '¡Canje exitoso!' : 'Redemption successful!',
                message: language === 'es' ? 'Revisa "Mis Regalos"' : 'Check "My Gifts"',
                type: 'success'
            });
        },
        onError: (error: any) => {
            addNotification({
                title: 'Error',
                message: error.response?.data?.message || (language === 'es' ? 'Error al canjear' : 'Redemption failed'),
                type: 'error'
            });
        }
    });

    const points = profile?.points || 0;

    const getIcon = (type: string) => {
        switch (type) {
            case 'discount': return <Ticket className="text-accent" />;
            case 'donation': return <Heart className="text-primary" />;
            default: return <Gift className="text-secondary" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        <ArrowLeft size={14} /> {language === 'es' ? 'Volver' : 'Back'}
                    </button>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none">
                        COCO <span className="text-primary italic">REWARDS</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">
                        {language === 'es' ? 'Tus Cocos hacen la Diferencia' : 'Your Cocos make the Difference'}
                    </p>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border-primary/20 bg-primary/5 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
                        <CocoIcon size={48} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Coco Puntos</p>
                        <p className="text-4xl font-black text-white">{points.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/5 pb-1">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'available' ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                >
                    Catálogo de Premios
                    {activeTab === 'available' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('my-rewards')}
                    className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'my-rewards' ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                >
                    Mis Canjes
                    {activeTab === 'my-rewards' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'available' ? (
                    <motion.div
                        key="available"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {rewards.map((reward, i) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass rounded-[3rem] border-white/5 overflow-hidden group hover:border-primary/20 transition-all flex flex-col"
                            >
                                <div className="h-48 relative overflow-hidden">
                                    <img src={reward.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={reward.title} />
                                    <div className="absolute top-4 right-4 glass px-4 py-2 rounded-2xl border-white/10 text-primary font-black text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                                        <CocoIcon size={16} /> {reward.pointCost}
                                    </div>
                                </div>
                                <div className="p-8 space-y-4 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            {getIcon(reward.type)}
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white">{reward.title}</h3>
                                    </div>
                                    <p className="text-white/40 text-sm font-medium flex-1">{reward.description}</p>
                                    <button
                                        disabled={points < reward.pointCost || redeemMutation.isPending}
                                        onClick={() => redeemMutation.mutate(reward.id)}
                                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                            ${points >= reward.pointCost
                                                ? 'bg-primary text-background hover:shadow-[0_0_25px_rgba(0,255,102,0.3)]'
                                                : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                                    >
                                        {redeemMutation.isPending && redeemMutation.variables === reward.id ? <Loader2 className="animate-spin mx-auto" size={16} /> : (points >= reward.pointCost ? 'Canjear Ahora' : 'Puntos Insuficientes')}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="my-rewards"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {redemptions.length > 0 ? redemptions.map((red) => (
                            <div key={red.id} className="glass p-8 rounded-[2.5rem] border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 group">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden">
                                        <img src={red.reward.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white">{red.reward.title}</h3>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Canjeado el {new Date(red.redeemedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded-2xl text-center">
                                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Código de Canje</p>
                                        <p className="text-2xl font-black text-white font-mono tracking-widest">{red.code}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${red.isUsed ? 'bg-white/10 text-white/40' : 'bg-primary/20 text-primary'}`}>
                                            <CheckCircle size={24} />
                                        </div>
                                        <p className="text-[8px] font-black uppercase tracking-widest mt-2">{red.isUsed ? 'Usado' : 'Disponible'}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-24 text-center glass rounded-[3rem] border-dashed border-white/10 space-y-4">
                                <Gift size={40} className="mx-auto text-white/10" />
                                <p className="text-white/20 font-bold uppercase tracking-[0.2em] text-xs">Aún no has canjeado ningún premio</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Coming Soon Banner */}
            <div className="relative rounded-[3.5rem] p-10 md:p-16 border border-primary/20 overflow-hidden isolate">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 -z-10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-accent text-background text-[10px] font-black uppercase tracking-widest animate-bounce" style={{ animationDuration: '2s' }}>
                            <Sparkles size={14} /> {language === 'es' ? 'Muy Pronto' : 'Coming Soon'}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none italic">
                            {language === 'es' ? (
                                <>Premios <span className="text-primary">Épicos</span> están por llegar</>
                            ) : (
                                <><span className="text-primary">Epic</span> Rewards are coming</>
                            )}
                        </h2>
                        <p className="text-white/60 text-lg font-medium">
                            {language === 'es'
                                ? 'Estamos preparando un catálogo de premios increíbles para ti. Descuentos exclusivos, experiencias únicas y sorpresas que vas a amar. ¡Seguí acumulando tus Coco Puntos!'
                                : "We're building an amazing prize catalog just for you. Exclusive discounts, unique experiences and surprises you'll love. Keep collecting your Coco Points!"}
                        </p>

                        {/* Hype indicators */}
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                                    {language === 'es' ? 'En desarrollo' : 'In development'}
                                </span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-2">
                                <CocoIcon size={16} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                    {language === 'es' ? 'Tus puntos serán válidos' : 'Your points will be valid'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Visual element — animated gift preview */}
                    <div className="relative">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                            <Gift size={64} className="text-primary relative z-10 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                                <Sparkles size={12} className="text-background" />
                            </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 glass px-5 py-2 rounded-2xl border-primary/20 whitespace-nowrap">
                            <p className="text-[8px] font-black uppercase tracking-widest text-primary">
                                {language === 'es' ? '🎁 Canjeos disponibles pronto' : '🎁 Redemptions coming soon'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
