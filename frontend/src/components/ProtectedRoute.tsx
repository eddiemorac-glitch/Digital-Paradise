import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
    const { user, token } = useAuthStore();
    const location = useLocation();

    if (!token) {
        // Redirect to home or login page if not authenticated
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (requireAdmin && user?.role?.toUpperCase() !== 'ADMIN') {
        // Redirect to home if admin role is required but user is not admin
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
