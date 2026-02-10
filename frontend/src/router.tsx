import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { LoadingScreen } from './components/LoadingScreen';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load all pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AssistantPage = lazy(() => import('./pages/AssistantPage').then(m => ({ default: m.AssistantPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const SustainabilityPage = lazy(() => import('./pages/SustainabilityPage').then(m => ({ default: m.SustainabilityPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const RewardsPage = lazy(() => import('./pages/RewardsPage').then(m => ({ default: m.RewardsPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const PaymentCallbackPage = lazy(() => import('./pages/PaymentCallbackPage').then(m => ({ default: m.PaymentCallbackPage })));
const DeliveryDashboard = lazy(() => import('./components/DeliveryDashboard').then(m => ({ default: m.DeliveryDashboard })));
const MerchantDashboard = lazy(() => import('./components/MerchantDashboard').then(m => ({ default: m.MerchantDashboard })));

const Loadable = (Component: any) => (props: any) => (
    <Suspense fallback={<LoadingScreen />}>
        <Component {...props} />
    </Suspense>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        errorElement: (
            <div className="text-white text-center pt-40 px-6 space-y-6">
                <h1 className="text-5xl font-black italic tracking-tighter text-primary">ANOMALÍA DETECTADA</h1>
                <div className="max-w-md mx-auto p-6 glass border-red-500/20 rounded-[2rem]">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Error de Sincronización Sentinel</p>
                    <p className="text-sm border-l-2 border-primary pl-4 py-2 bg-white/5 rounded text-left">
                        {window.location.pathname === '/admin'
                            ? "Error de inicialización del panel táctico. Verifique la conexión al núcleo o reinicie la sesión."
                            : "La ruta solicitada no se encuentra en el radar o ha colapsado."}
                    </p>
                </div>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-4 bg-primary text-background font-black rounded-2xl uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                    Reiniciar Sistema
                </button>
            </div>
        ),
        children: [
            { index: true, element: Loadable(HomePage)({}) },
            { path: 'admin', element: <ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute> },
            { path: 'map', element: Loadable(MapPage)({}) },
            { path: 'events', element: Loadable(EventsPage)({}) },
            { path: 'profile', element: Loadable(ProfilePage)({}) },
            { path: 'assistant', element: Loadable(AssistantPage)({}) },
            { path: 'orders', element: Loadable(OrdersPage)({}) },
            { path: 'orders/track/:orderId', element: Loadable(OrderTrackingPage)({}) },
            { path: 'invoices', element: Loadable(InvoicesPage)({}) },
            { path: 'about', element: Loadable(AboutPage)({}) },
            { path: 'sustainability', element: Loadable(SustainabilityPage)({}) },
            { path: 'blog', element: Loadable(BlogPage)({}) },
            { path: 'rewards', element: Loadable(RewardsPage)({}) },
            { path: 'terms', element: Loadable(TermsPage)({}) },
            { path: 'privacy', element: Loadable(PrivacyPage)({}) },
            { path: 'payment/callback', element: Loadable(PaymentCallbackPage)({}) },
            { path: 'merchant-dashboard', element: <ProtectedRoute><MerchantDashboard /></ProtectedRoute> },
            { path: 'delivery-dashboard', element: <ProtectedRoute><DeliveryDashboard /></ProtectedRoute> },
        ],
    },
]);
