import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import api from '../api/api';
import { motion } from 'framer-motion';

export const Login = ({ onToggle }: { onToggle: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const { t } = useLanguageStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user, data.access_token, data.refresh_token);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-3xl w-full max-w-md border border-white/10"
        >
            <h2 className="text-3xl font-black mb-6 text-gradient">{t('welcome_jungle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{t('email_label')}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                        placeholder="tu@email.com"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{t('password_label')}</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                        placeholder="••••••••"
                        required
                    />
                </div>
                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-background font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {loading ? t('loading') : t('enter_paradise')}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-white/40">
                {t('no_account')} <button onClick={onToggle} className="text-primary font-bold hover:underline">{t('register')}</button>
            </p>
        </motion.div>
    );
};
