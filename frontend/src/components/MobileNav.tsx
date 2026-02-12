import { motion, AnimatePresence } from 'framer-motion';
import { Home, Map, Calendar, ShoppingBag, User, Zap, MessageSquare, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

interface MobileNavProps {
    activeView: 'home' | 'map' | 'events' | 'orders' | 'profile';
    onNavigate: (view: 'home' | 'map' | 'events' | 'orders' | 'profile' | 'delivery-dashboard') => void;
    cartCount: number;
}

export const MobileNav = ({ activeView, onNavigate, cartCount }: MobileNavProps) => {
    const { user } = useAuthStore();
    const { t } = useLanguageStore();
    const isCourier = user?.role === 'delivery';

    const handleNavigate = (view: any) => {
        if ('vibrate' in navigator) navigator.vibrate(10);
        onNavigate(view);
    };

    const NavButton = ({ view, icon: Icon, label, isActive, badge }: any) => (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNavigate(view)}
            className={`flex flex-col items-center gap-1 touch-target relative ${isActive ? 'text-primary' : 'text-white/40'}`}
        >
            <Icon size={20} className="xs:w-[22px] xs:h-[22px]" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-center">
                {label}
            </span>
            {badge && <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-background shadow-[0_0_10px_rgba(255,136,0,0.5)]" />}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );

    return (
        <nav
            className="fixed bottom-[calc(1rem+var(--sab))] xs:bottom-[calc(1.5rem+var(--sab))] left-4 right-4 lg:hidden glass-dark border border-white/10 px-2 py-2 flex justify-around items-center z-[10001] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-slide-up-entry safe-area-x"
        >
            <NavButton
                view={isCourier ? 'delivery-dashboard' : 'home'}
                icon={Home}
                label={isCourier ? 'Misiones' : t('explore')}
                isActive={activeView === 'home'}
            />

            {!isCourier ? (
                <>
                    <NavButton
                        view="map"
                        icon={Map}
                        label={t('map')}
                        isActive={activeView === 'map'}
                    />
                    <NavButton
                        view="events"
                        icon={Calendar}
                        label={t('events')}
                        isActive={activeView === 'events'}
                    />
                    <NavButton
                        view="orders"
                        icon={ShoppingBag}
                        label={t('my_orders')}
                        isActive={activeView === 'orders'}
                        badge={cartCount > 0}
                    />
                </>
            ) : (
                <>
                    <NavButton
                        view="map"
                        icon={Map}
                        label="Ruta"
                        isActive={activeView === 'map'}
                    />
                    <NavButton
                        view="earn"
                        icon={Zap}
                        label="Ganancias"
                        isActive={false}
                    />
                    <NavButton
                        view="chat"
                        icon={MessageSquare}
                        label="Chat"
                        isActive={false}
                    />
                </>
            )}

            <NavButton
                view="profile"
                icon={user?.role?.toLowerCase() === 'admin' ? Shield : User}
                label={user?.role?.toLowerCase() === 'admin' ? 'Admin' : 'Perfil'}
                isActive={activeView === 'profile'}
            />
        </nav>
    );
};
