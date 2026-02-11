import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Token refresh state
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token, refresh_token: newRefreshToken, user } = response.data;

                    // Update store and localStorage
                    useAuthStore.getState().setAuth(user, access_token, newRefreshToken);

                    processQueue(null, access_token);
                    isRefreshing = false;

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    isRefreshing = false;

                    // Refresh token failed, logout user
                    useAuthStore.getState().logout();
                    return Promise.reject(refreshError);
                }
            } else {
                useAuthStore.getState().logout();
            }
        }

        if (error.response?.status === 429) {
            useNotificationStore.getState().addNotification({
                id: 'rate-limit',
                title: 'Límite excedido',
                message: 'Por seguridad, espera un momento antes de realizar más acciones.',
                type: 'warning'
            });
        }

        if (error.response?.status >= 500) {
            useNotificationStore.getState().addNotification({
                id: 'server-error',
                title: 'Error de servidor',
                message: 'Estamos experimentando dificultades técnicas. Reintenta en unos minutos.',
                type: 'error'
            });
        }

        return Promise.reject(error);
    }
);

export default api;
