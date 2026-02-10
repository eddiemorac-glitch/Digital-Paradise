import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantOrderApi } from '../api/merchantOrders';
import { Merchant, merchantApi } from '../api/merchants';
import { reviewApi } from '../api/reviews';
import { useLanguageStore } from '../store/languageStore';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    UtensilsCrossed,
    ClipboardList,
    Star,
    Shield
} from 'lucide-react';

import { toast } from 'sonner';
import api from '../api/api';
import { socketService } from '../api/socket';
import { OrderChat } from './OrderChat';
import { ProductManagement } from './ProductManagement';
import { EventStore } from './events/EventStore';
import { MerchantProfile } from './merchant/MerchantProfile';
import { HaciendaTerminal } from './merchant/HaciendaTerminal';
import { DateRangePicker } from './shared/DateRangePicker';
import { Order } from '../api/orders';
import { Review } from '../api/reviews';

// New Modular Components
import { OperationsBar } from './merchant/dashboard/OperationsBar';
import { FinancialInsights } from './merchant/dashboard/FinancialInsights';
import { LiveOrders } from './merchant/dashboard/LiveOrders';
import { QuickStockToggle } from './merchant/dashboard/QuickStockToggle';
import { ReviewsList } from './merchant/dashboard/ReviewsList';
import { NewOrderOverlay } from './merchant/dashboard/NewOrderOverlay';

export const MerchantDashboard = () => {
    const queryClient = useQueryClient();
    const { language } = useLanguageStore();
    const [view, setView] = useState<'orders' | 'menu' | 'events' | 'profile' | 'hacienda'>('orders');
    const [newOrderNotify, setNewOrderNotify] = useState<Order | null>(null);
    const [activeChat, setActiveChat] = useState<Order | null>(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    // Date Range State (Default: Last 7 Days)
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const { data: merchant } = useQuery<Merchant>({
        queryKey: ['my-merchant'],
        queryFn: merchantApi.getMyMerchant,
    });

    const merchantId = merchant?.id;

    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket) {
            setIsSocketConnected(socket.connected);
            const handleConnect = () => setIsSocketConnected(true);
            const handleDisconnect = () => setIsSocketConnected(false);
            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            return () => {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
            };
        }
    }, []);

    const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
        queryKey: ['merchant-orders'],
        queryFn: merchantOrderApi.getMyOrders,
        refetchInterval: 60000,
    });

    const { data: reviews } = useQuery<Review[]>({
        queryKey: ['merchant-reviews', merchantId],
        queryFn: () => reviewApi.getByMerchant(merchantId!),
        enabled: !!merchantId
    });

    const { data: stats } = useQuery({
        queryKey: ['merchant-stats', merchantId, dateRange.start, dateRange.end],
        queryFn: () => merchantApi.getMyStats(dateRange.start, dateRange.end),
        enabled: !!merchantId,
        refetchInterval: 60000,
    });

    // Unified Socket Listeners
    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket && merchantId) {
            const handleNewOrder = (order: Order) => {
                if (order.merchantId === merchantId) {
                    setNewOrderNotify(order);
                    queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
                    queryClient.invalidateQueries({ queryKey: ['merchant-stats'] });
                }
            };
            socket.on('order.new', handleNewOrder);
            return () => { socket.off('order.new', handleNewOrder); };
        }
    }, [merchantId, queryClient]);

    const toggleStatusMutation = useMutation({
        mutationFn: (isActive: boolean) => {
            if (!merchantId) throw new Error('Merchant ID not found');
            return merchantApi.update(merchantId, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
            toast.success(language === 'es' ? 'Estado de tienda actualizado' : 'Store status updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || (language === 'es' ? 'Error al actualizar estado' : 'Error updating status'));
        }
    });

    const toggleBusyMutation = useMutation({
        mutationFn: (isBusy: boolean) => {
            if (!merchantId) throw new Error('Merchant ID not found');
            return merchantApi.updateOperationalSettings(merchantId, { isBusy });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
            toast.success(language === 'es' ? 'Modo de servicio actualizado' : 'Service mode updated');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, metadata }: { id: string; status: string, metadata?: any }) =>
            api.patch(`/orders/${id}/status`, { status, metadata }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
            queryClient.invalidateQueries({ queryKey: ['merchant-stats'] });
            toast.success(language === 'es' ? 'Estado actualizado' : 'Status updated');
        }
    });

    if (ordersLoading && !merchant) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Sincronizando Command Center...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Chat Modal Layer */}
            <AnimatePresence>
                {activeChat && (
                    <OrderChat
                        orderId={activeChat.id}
                        partnerName={activeChat.user?.fullName || (language === 'es' ? 'Cliente' : 'Client')}
                        partnerRole="client"
                        onClose={() => setActiveChat(null)}
                    />
                )}
            </AnimatePresence>

            {/* Real-time Toast Notification */}
            <AnimatePresence>
                {newOrderNotify && (
                    <NewOrderOverlay
                        order={newOrderNotify}
                        onClose={() => setNewOrderNotify(null)}
                        language={language}
                    />
                )}
            </AnimatePresence>

            {/* 1. OPERATIONS BAR */}
            <OperationsBar
                merchant={merchant}
                isSocketConnected={isSocketConnected}
                onToggleStatus={(isActive) => toggleStatusMutation.mutate(isActive)}
                onToggleBusy={(isBusy) => toggleBusyMutation.mutate(isBusy)}
                onViewProfile={() => setView('profile')}
                isStatusPending={toggleStatusMutation.isPending}
                isBusyPending={toggleBusyMutation.isPending}
                language={language}
            />

            {/* 2. DATE SELECTOR & NAVIGATION */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-y border-white/5 py-8">
                <div className="flex bg-white/5 p-1.5 rounded-[2rem] border border-white/5 w-full lg:max-w-fit backdrop-blur-3xl overflow-x-auto scrollbar-hide">
                    <TabButton
                        active={view === 'orders'}
                        onClick={() => setView('orders')}
                        icon={<ClipboardList size={16} />}
                        label={language === 'es' ? 'Comando' : 'Command'}
                    />
                    <TabButton
                        active={view === 'menu'}
                        onClick={() => setView('menu')}
                        icon={<UtensilsCrossed size={16} />}
                        label={language === 'es' ? 'Inventario' : 'Inventory'}
                    />
                    <TabButton
                        active={view === 'events'}
                        onClick={() => setView('events')}
                        icon={<Star size={16} />}
                        label={language === 'es' ? 'Marketing' : 'Marketing'}
                        special="events"
                    />
                    <TabButton
                        active={view === 'hacienda'}
                        onClick={() => setView('hacienda')}
                        icon={<Shield size={16} />}
                        label={language === 'es' ? 'Hacienda' : 'Hacienda'}
                        special="legal"
                    />
                </div>

                <DateRangePicker
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onChange={(start, end) => setDateRange({ start, end })}
                />
            </div>

            {/* 3. MAIN CONTENT VIEW */}
            <AnimatePresence mode="wait">
                {view === 'orders' ? (
                    <motion.div
                        key="orders"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                        {/* Financial Intelligence Tier */}
                        <FinancialInsights
                            stats={stats}
                            chartData={stats?.chartData || []}
                            language={language}
                        />

                        {/* Tactical Operations Tier */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-8">
                            {/* Orders Queue (Main) */}
                            <div className="lg:col-span-3">
                                <LiveOrders
                                    orders={orders || []}
                                    isLoading={ordersLoading}
                                    language={language}
                                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                                    onViewReceipt={(order) => setActiveChat(order)}
                                />
                            </div>

                            {/* Sidebar: Reviews & Quick Stock */}
                            <div className="space-y-12 lg:col-span-1">
                                <QuickStockToggle
                                    merchantId={merchantId!}
                                    language={language}
                                />
                                <ReviewsList
                                    reviews={reviews || []}
                                    language={language}
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : view === 'menu' ? (
                    <motion.div key="menu" {...fadeIn}>
                        {merchantId && <ProductManagement merchantId={merchantId} />}
                    </motion.div>
                ) : view === 'profile' ? (
                    <motion.div key="profile" {...fadeIn}>
                        <MerchantProfile merchant={merchant} />
                    </motion.div>
                ) : view === 'events' ? (
                    <motion.div key="events" {...fadeIn}>
                        <EventStore />
                    </motion.div>
                ) : (
                    <motion.div key="hacienda" {...fadeIn}>
                        {merchantId && <HaciendaTerminal merchantId={merchantId} currentStatus={merchant?.haciendaStatus} />}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Sub-components (Helpers) ---

const fadeIn = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.3 }
};

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    special?: 'events' | 'legal';
}

const TabButton = ({ active, onClick, icon, label, special }: TabButtonProps) => {
    let activeStyle = "bg-white/10 text-white shadow-xl";
    if (special === 'events' && active) activeStyle = "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl";
    if (special === 'legal' && active) activeStyle = "bg-primary/20 text-primary border border-primary/20 shadow-xl";
    if (!special && active) activeStyle = "bg-primary text-background shadow-caribe-glow";

    return (
        <button
            onClick={onClick}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${active ? activeStyle : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
        >
            {icon}
            {label}
        </button>
    );
};
