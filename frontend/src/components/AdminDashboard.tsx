import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, RefreshCw, LayoutDashboard,
    Truck, Store, Sparkles, Users,
    FileText, LogOut, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { merchantApi } from '../api/merchants';
import {
    Overview,
    LogisticsHub,
    MerchantNexus,
    EventManager,
    UserVault,
    ContentManager
} from './admin/views';
import { devLog } from '../utils/devLog';

// --- Types ---
type AdminView = 'overview' | 'logistics' | 'merchants' | 'events' | 'users' | 'content';

interface NavItem {
    id: AdminView;
    label: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'overview', label: 'Control', icon: <LayoutDashboard size={18} /> },
    { id: 'logistics', label: 'Logística', icon: <Truck size={18} /> },
    { id: 'merchants', label: 'Comercios', icon: <Store size={18} /> },
    { id: 'events', label: 'Eventos', icon: <Sparkles size={18} /> },
    { id: 'users', label: 'Usuarios', icon: <Users size={18} /> },
    { id: 'content', label: 'Contenido', icon: <FileText size={18} /> },
];

// --- Sub-Components ---

interface AdminHeaderProps {
    isScrolled: boolean;
    currentView: AdminView;
    onViewChange: (view: AdminView) => void;
    onRefresh: () => void;
    onLogout: () => void;
    pendingMerchantsCount: number;
}

const AdminHeader = ({ isScrolled, currentView, onViewChange, onRefresh, onLogout, pendingMerchantsCount }: AdminHeaderProps) => (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="glass p-4 md:px-8 rounded-[2rem] border-white/5 flex justify-between items-center relative overflow-hidden">
                {/* Status Beam */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background shadow-lg shadow-primary/20">
                        <Shield size={20} />
                    </div>
                    <div className="hidden md:block">
                        <h1 className="text-xl font-black uppercase tracking-tighter">
                            Caribe <span className="text-primary italic">Digital</span>
                        </h1>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Control Center v3.0</p>
                    </div>
                </div>

                {/* Navigation Tabs - Desktop */}
                <nav className="hidden lg:flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative ${currentView === item.id ? 'bg-primary text-background shadow-sm' : 'text-white/40 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                            {item.id === 'merchants' && pendingMerchantsCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0f18] animate-pulse" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                        aria-label="Refresh Data"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white relative">
                        <Bell size={18} />
                        {pendingMerchantsCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a1f2b] animate-pulse" />
                        )}
                    </button>
                    <div className="h-8 w-[1px] bg-white/10 mx-1 hidden md:block" />
                    <button
                        onClick={onLogout}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <LogOut size={16} />
                        Salir
                    </button>
                </div>
            </div>
        </div>
    </header>
);

interface AdminMobileNavProps {
    currentView: AdminView;
    onViewChange: (view: AdminView) => void;
    pendingMerchantsCount: number;
}

const AdminMobileNav = ({ currentView, onViewChange, pendingMerchantsCount }: AdminMobileNavProps) => (
    <div className="lg:hidden flex overflow-x-auto pb-4 gap-2 no-scrollbar">
        {NAV_ITEMS.map((item) => (
            <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border relative ${currentView === item.id
                    ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-white/40 border-white/10'
                    }`}
            >
                {item.icon}
                {item.label}
                {item.id === 'merchants' && pendingMerchantsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0f18] animate-pulse" />
                )}
            </button>
        ))}
    </div>
);

// --- Main Component ---

export const AdminDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [view, setView] = useState<AdminView>('overview');
    const [isScrolled, setIsScrolled] = useState(false);

    const { data: pendingMerchants } = useQuery({
        queryKey: ['pending-merchants-count'],
        queryFn: () => merchantApi.getPending(),
        refetchInterval: 30000,
    });

    const pendingCount = pendingMerchants?.length || 0;

    useEffect(() => {
        const isAdmin = user?.role?.toLowerCase() === 'admin';
        if (!isAdmin && user !== undefined) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const refreshGlobalData = () => {
        queryClient.invalidateQueries();
    };

    const handleLogout = () => {
        if (typeof logout === 'function') {
            logout();
            navigate('/login');
        } else {
            devLog("Logout triggered");
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f18] text-white pb-20">
            <AdminHeader
                isScrolled={isScrolled}
                currentView={view}
                onViewChange={setView}
                onRefresh={refreshGlobalData}
                onLogout={handleLogout}
                pendingMerchantsCount={pendingCount}
            />

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 pt-40">
                <AdminMobileNav currentView={view} onViewChange={setView} pendingMerchantsCount={pendingCount} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="glass p-8 rounded-[3rem] border-white/5 shadow-2xl overflow-hidden min-h-[70vh]"
                    >
                        {view === 'overview' && <Overview onNavigate={setView} />}
                        {view === 'logistics' && <LogisticsHub />}
                        {view === 'merchants' && <MerchantNexus />}
                        {view === 'events' && <EventManager />}
                        {view === 'users' && <UserVault />}
                        {view === 'content' && <ContentManager />}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Background Tactical Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>
        </div>
    );
};
