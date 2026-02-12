import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Bot, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { Button } from '../ui/button';
import { CocoIcon } from '../CocoIcon';
import logo from '../../assets/logo.png';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { playTacticalSound } from '../../utils/tacticalSound';
import { getAvatarById } from '../AvatarIcons';
import { userApi } from '../../api/users'; // Helper for profile fetching

interface MainNavbarProps {
    isSocketConnected: boolean;
    onOpenAuth: (mode: 'login' | 'register') => void;
    onOpenNotifications: () => void;
}

export const MainNavbar = ({ isSocketConnected, onOpenAuth, onOpenNotifications }: MainNavbarProps) => {
    const { t, language, setLanguage } = useLanguageStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch profile locally for points/avatar
    const { data: profile } = useQuery({
        queryKey: ['user-profile'],
        queryFn: userApi.getProfile,
        enabled: !!user,
    });

    const handleBackToHome = () => {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <nav className="fixed top-0 w-full z-[10000] glass border-b border-white/5 px-4 md:px-8 py-2 md:py-4 flex justify-between items-center transition-all duration-300">
            <div className="flex items-center gap-2 md:gap-3">
                <motion.img
                    src={logo}
                    className="w-8 h-8 md:w-10 md:h-10 object-contain filter drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    alt="Logo Tortuga"
                    onClick={handleBackToHome}
                    style={{ cursor: 'pointer' }}
                />
                <span
                    className="text-lg md:text-xl font-black tracking-tighter text-white hidden sm:block cursor-pointer"
                    onClick={handleBackToHome}
                >
                    DIGITAL<span className="text-primary">PARADISE</span>
                </span>
            </div>

            <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-white/50">
                {user?.role !== 'delivery' && (
                    <button onClick={handleBackToHome} className="hover:text-primary transition-colors uppercase">{t('explore')}</button>
                )}
                {user?.role?.toLowerCase() === 'admin' && (
                    <button onClick={() => navigate('/admin')} className="text-secondary font-black uppercase tracking-tighter italic flex items-center gap-1">
                        <Shield size={14} /> {t('admin_panel')}
                    </button>
                )}
                {user?.role === 'merchant' && (
                    <button onClick={() => navigate('/merchant-dashboard')} className="text-primary font-black uppercase tracking-tighter italic">{t('dashboard')}</button>
                )}
                {user?.role === 'delivery' && (
                    <button onClick={() => navigate('/delivery-dashboard')} className="text-accent font-black uppercase tracking-tighter italic">{t('courier_central')}</button>
                )}
                {user?.role !== 'delivery' && (
                    <>
                        <button onClick={() => navigate('/map')} className="hover:text-primary transition-colors text-white/50 font-bold uppercase tracking-widest text-xs">{t('map')}</button>
                        <button onClick={() => navigate('/events')} className="hover:text-primary transition-colors text-white/50 font-bold uppercase tracking-widest text-xs">{t('events')}</button>
                        {user && (
                            <button onClick={() => navigate('/orders')} className="hover:text-primary transition-colors text-white/50 font-bold uppercase tracking-widest text-xs">{t('history')}</button>
                        )}
                    </>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/assistant')}
                    className="text-primary font-black uppercase tracking-tighter flex items-center gap-2 group border-primary/20 hover:border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(0,255,102,0.1)] transition-all duration-500"
                >
                    <Bot size={16} className="group-hover:animate-bounce text-primary" /> COCO Caribeño
                </Button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Tactical Events Button - Caribbean Vibe */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        playTacticalSound('CLICK');
                        navigate('/map');
                    }}
                    className="bg-tactical-events px-4 sm:px-6 py-2 rounded-xl text-background font-black uppercase tracking-widest text-[10px] shadow-tactical animate-sparkle border border-white/20 whitespace-nowrap hidden lg:flex items-center justify-center"
                >
                    {t('events')}
                </motion.button>

                <button
                    onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                    className="glass px-2 py-1.5 md:px-3 md:py-2 rounded-xl text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2 border border-white/10 hover:border-primary/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] font-black uppercase tracking-tighter group"
                    title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                >
                    <span className={language === 'es' ? 'opacity-100 scale-110' : 'opacity-30 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all underline decoration-primary font-light'}>ES</span>
                    <span className="opacity-10 text-[8px]">|</span>
                    <span className={language === 'en' ? 'opacity-100 scale-110' : 'opacity-30 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all underline decoration-primary font-light'}>EN</span>
                    <span className="ml-1 hidden xs:inline">{language === 'es' ? '🇪🇸' : '🇬🇧'}</span>
                </button>

                {user ? (
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Real-time Status Indicator (Phase 34) */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 hidden sm:flex">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-primary shadow-[0_0_8px_rgba(0,255,102,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{t('live')}</span>
                        </div>

                        <button
                            onClick={onOpenNotifications}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full glass border border-white/5 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary/50 transition-all relative group"
                        >
                            <Bell size={16} className="md:w-[18px] md:h-[18px] group-hover:animate-swing" />
                        </button>

                        <div
                            onClick={() => navigate('/rewards')}
                            className="hidden lg:flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5 cursor-pointer transition-all group"
                        >
                            <CocoIcon size={20} className="group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">{t('coco_points')}</p>
                                <p className="text-xs font-black text-white">{profile?.points?.toLocaleString() || '0'}</p>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/profile')}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black cursor-pointer hover:scale-110 hover:border-primary transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)] overflow-hidden"
                        >
                            {(() => {
                                const avatarId = user.avatarId || profile?.avatarId;
                                const AvatarComponent = avatarId ? getAvatarById(avatarId)?.component : null;

                                if (AvatarComponent) {
                                    return <AvatarComponent className="w-full h-full p-0.5 md:p-1" />;
                                }

                                const fullName = (user as any).fullName || (user as any).name;
                                return fullName ? fullName[0] : user.email[0];
                            })()}
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => onOpenAuth('login')}
                        className="bg-primary hover:bg-primary-dark text-background font-black px-4 py-1.5 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,102,0.3)] text-[10px] md:text-xs uppercase tracking-widest"
                    >
                        {t('login')}
                    </button>
                )}
            </div>
        </nav>
    );
};
