import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Bot, X, MessageCircle, ShoppingBag, Shield, Package
} from 'lucide-react';
import { socketService } from '../api/socket';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Toaster } from 'sonner';
import logo from '../assets/logo.png';
import { Login } from '../components/Login';
import { Register } from '../components/Register';
import { playTacticalSound } from '../utils/tacticalSound';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { CartSidebar } from '../components/CartSidebar';
import { GlobalNotifications } from '../components/GlobalNotifications';
import { CookieBanner } from '../components/CookieBanner';
import { PrivacyModal } from '../components/PrivacyModal';
import { MobileNav } from '../components/MobileNav';
import { MissionTracker } from '../components/MissionTracker';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { NotificationHub } from '../components/NotificationHub';
import { PushNotificationPrompt } from '../components/PushNotificationPrompt';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { SWUpdatePrompt } from '../components/SWUpdatePrompt';
import { getAvatarById } from '../components/AvatarIcons';
import { CocoIcon } from '../components/CocoIcon';
import { useLanguageStore } from '../store/languageStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/users';
import { MapFilters } from '../components/MapFilters';
import { useNotificationStore } from '../store/notificationStore';
import { CocoWelcomeBubble } from '../components/CocoWelcomeBubble';

export const RootLayout = () => {
    const { t, language, setLanguage } = useLanguageStore();
    const { addNotification } = useNotificationStore();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    // Global State
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [activeMission, setActiveMission] = useState<any | null>(null);
    const [isNotificationHubOpen, setIsNotificationHubOpen] = useState(false);

    const [isSocketConnected, setIsSocketConnected] = useState(false);

    const { user, logout } = useAuthStore();
    const cartItemCount = useCartStore((state) => state.itemCount());

    const { data: profile } = useQuery({
        queryKey: ['user-profile'],
        queryFn: userApi.getProfile,
        enabled: !!user,
    });

    // 🔗 GLOBAL SERVICE ORCHESTRATOR (Phase 34)
    useEffect(() => {
        if (!user) {
            socketService.disconnect();
            setIsSocketConnected(false);
            return;
        }

        const socket = socketService.connect();
        setIsSocketConnected(socket.connected);

        const handleConnect = () => setIsSocketConnected(true);
        const handleDisconnect = () => setIsSocketConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Join relevant rooms based on role
        if ((user as any).role === 'merchant') {
            socketService.joinMerchantRoom(user.id);
        } else if ((user as any).role === 'delivery') {
            socketService.joinLogisticsPool();
        } else if ((user as any).role?.toLowerCase() === 'admin') {
            socketService.joinAdminRoom();
        }

        // Global Order Status Listener
        socketService.onOrderStatusUpdate((order) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
            queryClient.invalidateQueries({ queryKey: ['my-orders'] });

            toast.info(
                language === 'es'
                    ? `Orden #${order.id.slice(0, 4)}: ${order.status}`
                    : `Order #${order.id.slice(0, 4)}: ${order.status}`,
                {
                    description: language === 'es' ? 'Estado actualizado en tiempo real' : 'Status updated in real-time',
                    icon: <Bell size={16} className="text-primary" />,
                }
            );
        });

        // Global New Order (for Merchants)
        socketService.onNewOrder((order) => {
            if (user.role === 'merchant') {
                queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
                toast.success('¡Nuevo Pedido Recibido!', {
                    description: `Cliente: ${order.user?.fullName || 'Anon'}`,
                    duration: 5000,
                });
                new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play().catch(() => { });
            }
        });

        // Global Mission Available (for Delivery/Logistics)
        socketService.onMissionAvailable((mission) => {
            if (user.role === 'delivery') {
                queryClient.invalidateQueries({ queryKey: ['available-deliveries'] });
                toast.info('🚀 Nueva misión disponible', {
                    description: mission.merchant?.name || 'Comercio cercano necesita recolecta',
                    action: {
                        label: 'Ver',
                        onClick: () => navigate('/delivery')
                    }
                });
                new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play().catch(() => { });
            }
        });

        // Global Mission Updated
        socketService.onMissionUpdated((mission) => {
            queryClient.invalidateQueries({ queryKey: ['my-deliveries'] });
            queryClient.invalidateQueries({ queryKey: ['courier-stats'] });

            // Update active mission if it's the one updated
            setActiveMission((prev: any) => {
                if (prev?.id === mission.id) {
                    return { ...prev, ...mission };
                }
                return prev;
            });
        });

        // Global Driver Location Updated (Phase 27)
        socketService.onDriverLocationUpdated((data) => {
            setActiveMission((prev: any) => {
                if (prev?.id === data.missionId || prev?.orderId === data.orderId) {
                    return {
                        ...prev,
                        currentLat: data.lat,
                        currentLng: data.lng,
                        metersToDestination: data.metersToDestination,
                        tripState: data.tripState
                    };
                }
                return prev;
            });
        });

        // Driver Arriving Alert
        socketService.onDriverArriving((data: any) => {
            setActiveMission((prev: any) => {
                if (prev?.id === data.missionId) {
                    return { ...prev, tripState: 'NEAR_DESTINATION' };
                }
                return prev;
            });
            toast.info(language === 'es' ? '🚀 ¡El repartidor está llegando!' : '🚀 Driver is arriving!');
        });

        // Global Product Update (Phase 36)
        socketService.onProductUpdate(() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['merchant-products-all'] });
            queryClient.invalidateQueries({ queryKey: ['merchant-status'] });
            queryClient.invalidateQueries({ queryKey: ['my-merchant'] });

            toast.info(language === 'es' ? 'Inventario actualizado' : 'Inventory updated', {
                description: language === 'es'
                    ? 'La disponibilidad de productos ha cambiado.'
                    : 'Product availability has changed.',
                icon: <Package size={16} />
            });
        });

        const handleSocketAuthError = () => {
            addNotification({
                title: 'Sesión Expirada',
                message: 'Tu sesión de tiempo real ha caducado. Reingresando...',
                type: 'warning'
            });
            handleLogout();
        };

        window.addEventListener('socket_auth_error', handleSocketAuthError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            window.removeEventListener('socket_auth_error', handleSocketAuthError);
        };
    }, [user, queryClient, language, addNotification]);

    // UI Signal Listeners (Phase 35)
    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        window.addEventListener('open_cart_sidebar', handleOpenCart);
        return () => window.removeEventListener('open_cart_sidebar', handleOpenCart);
    }, []);

    const handleBackToHome = () => {
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLogout = () => {
        socketService.disconnect(); // Explicit disconnect
        logout();
        navigate('/');
    };

    // 🚀 TACTICAL REDIRECT: If courier lands on home, send to their mission center
    useEffect(() => {
        if (user?.role === 'delivery' && location.pathname === '/') {
            navigate('/delivery-dashboard');
        }
    }, [user, location.pathname, navigate]);

    // Helper to determine active view for MobileNav
    const getActiveView = () => {
        const path = location.pathname;
        if (path.includes('map')) return 'map';
        if (path.includes('delivery-dashboard')) return 'home'; // Courier home
        if (path.includes('events')) return 'events';
        if (path.includes('orders')) return 'orders';
        if (path.includes('profile')) return 'profile';
        return 'home';
    };

    return (
        <div className="min-h-screen bg-mesh selection:bg-primary/30 pb-20">
            <MapFilters />
            {/* Phase 3: Mission Tracker Overlay */}
            <AnimatePresence>
                {activeMission && (
                    <MissionTracker mission={activeMission} onClose={() => setActiveMission(null)} />
                )}
            </AnimatePresence>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-[10000] glass border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <motion.img
                        src={logo}
                        className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        alt="Logo Tortuga"
                        onClick={handleBackToHome}
                        style={{ cursor: 'pointer' }}
                    />
                    <span
                        className="text-xl font-black tracking-tighter text-white hidden sm:block cursor-pointer"
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
                        className="bg-tactical-events px-4 sm:px-6 py-2 rounded-xl text-background font-black uppercase tracking-widest text-[10px] shadow-tactical animate-sparkle border border-white/20 whitespace-nowrap lg:flex items-center justify-center"
                    >
                        EVENTOS
                    </motion.button>

                    <button
                        onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                        className="glass px-3 py-2 rounded-xl text-xs flex items-center gap-2 border border-white/10 hover:border-primary/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] font-black uppercase tracking-tighter group"
                        title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                    >
                        <span className={language === 'es' ? 'opacity-100 scale-110' : 'opacity-30 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all underline decoration-primary font-light'}>ES</span>
                        <span className="opacity-10 text-[8px]">|</span>
                        <span className={language === 'en' ? 'opacity-100 scale-110' : 'opacity-30 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all underline decoration-primary font-light'}>EN</span>
                        <span className="ml-1">{language === 'es' ? '🇪🇸' : '🇬🇧'}</span>
                    </button>

                    {user ? (
                        <div className="flex items-center gap-3">
                            {/* Real-time Status Indicator (Phase 34) */}
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 hidden sm:flex">
                                <div className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-primary shadow-[0_0_8px_rgba(0,255,102,0.8)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]'}`} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Live</span>
                            </div>

                            <button
                                onClick={() => setIsNotificationHubOpen(true)}
                                className="w-10 h-10 rounded-full glass border border-white/5 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary/50 transition-all relative group"
                            >
                                <Bell size={18} className="group-hover:animate-swing" />
                            </button>

                            <div
                                onClick={() => navigate('/rewards')}
                                className="hidden lg:flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-2xl border border-white/5 cursor-pointer transition-all group"
                            >
                                <CocoIcon size={20} className="group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">Coco Puntos</p>
                                    <p className="text-xs font-black text-white">{profile?.points?.toLocaleString() || '0'}</p>
                                </div>
                            </div>

                            <div
                                onClick={() => navigate('/profile')}
                                className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black cursor-pointer hover:scale-110 hover:border-primary transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)] overflow-hidden"
                            >
                                {(() => {
                                    const avatarId = user.avatarId || profile?.avatarId;
                                    const AvatarComponent = avatarId ? getAvatarById(avatarId)?.component : null;

                                    if (AvatarComponent) {
                                        return <AvatarComponent className="w-full h-full p-1" />;
                                    }

                                    const fullName = (user as any).fullName || (user as any).name;
                                    return fullName ? fullName[0] : user.email[0];
                                })()}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => { setIsAuthModalOpen(true); setAuthMode('login'); }}
                            className="bg-primary hover:bg-primary-dark text-background font-black px-6 py-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,255,102,0.3)] text-xs uppercase tracking-widest"
                        >
                            {t('login')}
                        </button>
                    )}
                </div>
            </nav>

            <GlobalNotifications />
            <OfflineIndicator />
            <CookieBanner />
            <PushNotificationPrompt delay={15000} />
            <PWAInstallPrompt />
            <SWUpdatePrompt />
            <NotificationHub
                isOpen={isNotificationHubOpen}
                onClose={() => setIsNotificationHubOpen(false)}
                onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)}
            />

            <AnimatePresence>
                {isAuthModalOpen && !user && (
                    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAuthModalOpen(false)}
                            className="absolute inset-0 bg-background/90 backdrop-blur-2xl"
                        />
                        <div className="relative z-10 w-full max-w-md">
                            <button
                                onClick={() => setIsAuthModalOpen(false)}
                                className="absolute -top-12 right-0 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={32} />
                            </button>
                            {authMode === 'login' ? (
                                <Login onToggle={() => setAuthMode('register')} />
                            ) : (
                                <Register onToggle={() => setAuthMode('login')} />
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="pt-24 sm:pt-32 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto pb-24 lg:pb-0">
                <Outlet context={{ setActiveMission }} />
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-white/5 pt-20 pb-24 lg:pb-10 px-4 md:px-8 safe-area-bottom">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12 mb-20">
                        <div className="space-y-6 col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-3">
                                <img src={logo} className="w-8 h-8 object-contain" alt="Logo" />
                                <span className="text-lg font-black tracking-tighter">DIGITAL<span className="text-primary">PARADISE</span></span>
                            </div>
                            <p className="text-white/40 text-sm font-medium leading-relaxed">
                                La plataforma definitiva para el Caribe Sur. Comida, logística y comunidad.
                            </p>
                        </div>
                        {user?.role !== 'delivery' && (
                            <div>
                                <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">{t('explore')}</h4>
                                <ul className="space-y-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                                    <li><button onClick={handleBackToHome} className="hover:text-primary transition-colors text-left w-full">{t('restaurants')}</button></li>
                                    <li><button onClick={() => navigate('/map')} className="hover:text-primary transition-colors text-left w-full">{t('map')}</button></li>
                                    <li><button onClick={() => navigate('/events')} className="hover:text-primary transition-colors text-left w-full">{t('events')}</button></li>
                                </ul>
                            </div>
                        )}
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Comunidad</h4>
                            <ul className="space-y-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                                <li><button onClick={() => navigate('/about')} className="hover:text-primary transition-colors text-left w-full">{t('about')}</button></li>
                                <li><button onClick={() => navigate('/sustainability')} className="hover:text-primary transition-colors text-left w-full">{t('sustainability')}</button></li>
                                <li><button onClick={() => navigate('/blog')} className="hover:text-primary transition-colors text-left w-full">{t('blog')}</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Legal</h4>
                            <ul className="space-y-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                                <li><button onClick={() => setIsPrivacyOpen(true)} className="hover:text-primary transition-colors text-left w-full">Privacidad (Ley 8968)</button></li>
                                <li><button onClick={() => addNotification({ title: 'Términos de Uso', message: '¡Próximamente! Los términos están en revisión legal.', type: 'info' })} className="hover:text-primary transition-colors text-left w-full">Términos de Uso</button></li>
                                <li><button onClick={() => addNotification({ title: 'Reembolsos', message: '¡Próximamente! Estamos definiendo la política de reembolsos.', type: 'info' })} className="hover:text-primary transition-colors text-left w-full">Reembolsos</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-white/5 text-white/20 text-[10px] font-black uppercase tracking-widest">
                        <p>© 2026 DIGITAL PARADISE. {t('rights_reserved')}</p>
                        <div className="flex gap-8">
                            <span>{t('made_with_love')}</span>
                            <span className="text-primary/40 text-xs">{t('pura_vida')}</span>
                        </div>
                    </div>
                </div>
            </footer>

            <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

            {/* Compact WhatsApp Support Above Cart */}
            <motion.a
                href="https://wa.me/50600000000"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-48 lg:bottom-12 right-8 flex items-center gap-2 glass p-2 rounded-2xl border-white/10 shadow-2xl z-[9000] group"
            >
                <div className="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,211,102,0.4)]">
                    <MessageCircle size={24} />
                </div>
            </motion.a>

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onAuth={(mode) => {
                    setAuthMode(mode);
                    setIsAuthModalOpen(true);
                    setIsCartOpen(false);
                }}
            />

            {/* Floating Cart - Hidden for Couriers */}
            {
                user?.role !== 'delivery' && (
                    <motion.button
                        onClick={() => setIsCartOpen(true)}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="fixed bottom-28 lg:bottom-24 right-8 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,255,102,0.4)] z-[9000] group"
                    >
                        <ShoppingBag className="text-background group-hover:animate-bounce" size={24} />
                        {cartItemCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full border-4 border-background flex items-center justify-center text-[10px] font-black text-white">
                                {cartItemCount}
                            </div>
                        )}
                    </motion.button>
                )
            }

            {/* Sentinel AI Floating Button */}
            <motion.button
                onClick={() => navigate('/assistant')}
                whileHover={{ scale: 1.1, rotate: -10, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-28 left-8 w-16 h-16 glass shadow-[0_0_40px_rgba(0,255,102,0.2)] rounded-[1.8rem] flex items-center justify-center z-[9000] group border border-primary/20 overflow-hidden"
            >
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,102,0.5)]" />
                <Bot className="text-primary relative z-10" size={28} />
            </motion.button>

            {user && (
                <MobileNav
                    activeView={getActiveView()}
                    onNavigate={(view) => navigate(view === 'home' ? '/' : `/${view}`)}
                    cartCount={cartItemCount}
                />
            )}
            <CocoWelcomeBubble onOpenChat={() => navigate('/assistant')} />
            <Toaster position="top-right" richColors theme="dark" />
        </div >
    );
};
