import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Bot, X, MessageCircle, ShoppingBag, Package
} from 'lucide-react';
import { socketService } from '../api/socket';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Login } from '../components/Login';
import { Register } from '../components/Register';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { CartSidebar } from '../components/CartSidebar';
import { GlobalNotifications } from '../components/GlobalNotifications';
import { CookieBanner } from '../components/CookieBanner';
import { MainFooter } from '../components/layout/MainFooter';
import { MainNavbar } from '../components/layout/MainNavbar';
import { MobileNav } from '../components/MobileNav';
import { MissionTracker } from '../components/MissionTracker';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { NotificationHub } from '../components/NotificationHub';
import { PushNotificationPrompt } from '../components/PushNotificationPrompt';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { SWUpdatePrompt } from '../components/SWUpdatePrompt';
import { useLanguageStore } from '../store/languageStore';
import { useQueryClient } from '@tanstack/react-query';
import { MapFilters } from '../components/MapFilters';
import { useNotificationStore } from '../store/notificationStore';
import { CocoWelcomeBubble } from '../components/CocoWelcomeBubble';

export const RootLayout = () => {
    const { language, t } = useLanguageStore();
    const { addNotification } = useNotificationStore();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    // Global State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [activeMission, setActiveMission] = useState<any | null>(null);
    const [isNotificationHubOpen, setIsNotificationHubOpen] = useState(false);
    const [activePrompt, setActivePrompt] = useState<string | null>(null);

    const [isSocketConnected, setIsSocketConnected] = useState(false);

    const { user, logout } = useAuthStore();
    const cartItemCount = useCartStore((state) => state.itemCount());



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
                    description: t('status_update_toast'),
                    icon: <Bell size={16} className="text-primary" />,
                }
            );
        });

        // Global New Order (for Merchants)
        socketService.onNewOrder((order) => {
            if (user.role === 'merchant') {
                queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
                const clientName = order.user?.fullName || 'Anon';
                toast.success(t('new_order_received'), {
                    description: `${t('client')}: ${clientName}`,
                    duration: 5000,
                });
                new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play().catch(() => { });
            }
        });

        // Global Mission Available (for Delivery/Logistics)
        socketService.onMissionAvailable((mission) => {
            if (user.role === 'delivery') {
                queryClient.invalidateQueries({ queryKey: ['available-deliveries'] });
                toast.info(t('new_mission'), {
                    description: mission.merchant?.name || t('mission_desc'),
                    action: {
                        label: t('explore'),
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
            toast.info(t('driver_arriving'));
        });

        // Global Product Update (Phase 36)
        socketService.onProductUpdate(() => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['merchant-products-all'] });
            queryClient.invalidateQueries({ queryKey: ['merchant-status'] });
            queryClient.invalidateQueries({ queryKey: ['my-merchant'] });

            toast.info(t('inventory_updated'), {
                description: t('inventory_desc'),
                icon: <Package size={16} />
            });
        });

        const handleSocketAuthError = () => {
            addNotification({
                title: t('session_expired'),
                message: t('session_expired_desc'),
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
    }, [user, queryClient, language, addNotification, t]);

    // UI Signal Listeners (Phase 35)
    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        window.addEventListener('open_cart_sidebar', handleOpenCart);
        return () => window.removeEventListener('open_cart_sidebar', handleOpenCart);
    }, []);



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
            <MainNavbar
                isSocketConnected={isSocketConnected}
                onOpenAuth={(mode) => {
                    setAuthMode(mode);
                    setIsAuthModalOpen(true);
                }}
                onOpenNotifications={() => setIsNotificationHubOpen(true)}
            />

            <GlobalNotifications />
            <OfflineIndicator />
            <CookieBanner />
            <PushNotificationPrompt
                delay={15000}
                blocked={activePrompt !== null && activePrompt !== 'push'}
                onOpen={() => setActivePrompt('push')}
                onClose={() => setActivePrompt(null)}
            />
            <PWAInstallPrompt
                blocked={activePrompt !== null && activePrompt !== 'pwa'}
                onOpen={() => setActivePrompt('pwa')}
                onClose={() => setActivePrompt(null)}
            />
            <SWUpdatePrompt
                blocked={activePrompt !== null && activePrompt !== 'update'}
                onOpen={() => setActivePrompt('update')}
                onClose={() => setActivePrompt(null)}
            />
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
            <main className={
                location.pathname === '/'
                    ? "w-full pb-24 lg:pb-0" // Home: Full width, no top padding, handles own layout
                    : "pt-24 sm:pt-32 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto pb-24 lg:pb-0" // Others: Standard constrained layout
            }>
                <Outlet context={{ setActiveMission }} />
            </main>

            {/* Footer */}
            <MainFooter />

            {/* Floating Action Button Stack (WhatsApp + Cart) */}
            <motion.div
                initial={false}
                animate={{
                    y: activePrompt ? 100 : 0,
                    opacity: activePrompt ? 0 : 1
                }}
                className={`fixed ${user ? 'bottom-[104px] lg:bottom-[88px]' : 'bottom-6'} right-4 z-[9000] flex flex-col items-end gap-3 pointer-events-none transition-all duration-300`}
            >

                {/* WhatsApp Button */}
                <motion.a
                    href="https://wa.me/50600000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className={`pointer-events-auto glass p-2 rounded-2xl border-white/10 shadow-2xl group flex items-center gap-2 ${activePrompt ? 'pointer-events-none' : ''}`}
                >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#25D366] rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,211,102,0.4)]">
                        <MessageCircle size={20} className="lg:w-6 lg:h-6" />
                    </div>
                </motion.a>

                {/* Floating Cart Button */}
                {user?.role !== 'delivery' && (
                    <motion.button
                        onClick={() => setIsCartOpen(true)}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={!!activePrompt}
                        className="pointer-events-auto w-14 h-14 lg:w-16 lg:h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,255,102,0.4)] group relative disabled:opacity-50 disabled:grayscale"
                    >
                        <ShoppingBag className="text-background group-hover:animate-bounce" size={24} />
                        {cartItemCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 lg:w-6 lg:h-6 bg-accent rounded-full border-4 border-background flex items-center justify-center text-[10px] font-black text-white">
                                {cartItemCount}
                            </div>
                        )}
                    </motion.button>
                )}
            </motion.div>

            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onAuth={(mode) => {
                    setAuthMode(mode);
                    setIsAuthModalOpen(true);
                    setIsCartOpen(false);
                }}
            />

            {/* Sentinel AI Floating Button */}
            <motion.button
                onClick={() => navigate('/assistant')}
                whileHover={{ scale: 1.1, rotate: -10, y: -5 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                    y: activePrompt ? 100 : 0,
                    opacity: activePrompt ? 0 : 1
                }}
                disabled={!!activePrompt}
                className={`fixed ${user ? 'bottom-[104px] lg:bottom-[88px]' : 'bottom-6'} left-4 w-14 h-14 lg:w-16 lg:h-16 glass shadow-[0_0_40px_rgba(0,255,102,0.2)] rounded-[1.8rem] flex items-center justify-center z-[9000] group border border-primary/20 overflow-hidden transition-all duration-300`}
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
