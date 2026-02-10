import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';
import { motion } from 'framer-motion';
import { PrivacyModal } from './PrivacyModal';
import { AvatarSelector } from './AvatarSelector';
import { getAvatarById } from './AvatarIcons';

export const Register = ({ onToggle }: { onToggle: () => void }) => {
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
    const [selectedAvatarId, setSelectedAvatarId] = useState('jaguar');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [agreedToPrivacyPolicy, setAgreedToPrivacyPolicy] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreedToPrivacyPolicy) {
            setError('Debes aceptar la Política de Privacidad para continuar.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', {
                email,
                password,
                fullName,
                avatarId: selectedAvatarId,
                agreedToPrivacyPolicy,
                privacyPolicyVersion: '1.0'
            });
            setAuth(data.user, data.access_token, data.refresh_token);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al registrarse. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 rounded-3xl w-full max-w-md border border-white/10"
        >
            <h2 className="text-3xl font-black mb-6 text-gradient">Únete al Enjambre</h2>

            {/* Avatar Selection UI */}
            <div className="flex flex-col items-center mb-8 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center border-2 border-primary shadow-[0_0_30px_rgba(0,255,102,0.2)] p-2">
                        {(() => {
                            const Avatar = getAvatarById(selectedAvatarId).component;
                            return <Avatar className="w-full h-full text-primary" />;
                        })()}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAvatarSelectorOpen(true)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors py-2 px-4 bg-primary/10 rounded-full border border-primary/20"
                >
                    Cambiar Avatar
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Nombre Completo</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                        placeholder="John Doe"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Email</label>
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        required
                    />
                </div>

                <div className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        id="privacy"
                        checked={agreedToPrivacyPolicy}
                        onChange={(e) => setAgreedToPrivacyPolicy(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                        required
                    />
                    <label htmlFor="privacy" className="text-sm text-white/60 text-left">
                        Acepto la <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-primary hover:underline font-bold">Política de Privacidad</button> y el procesamiento de mis datos según la Ley 8968.
                    </label>
                </div>

                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-background font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {loading ? 'Creando cuenta...' : 'Crear mi Cuenta'}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-white/40">
                ¿Ya tienes cuenta? <button onClick={onToggle} className="text-primary font-bold hover:underline">Inicia sesión</button>
            </p>

            <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

            <AvatarSelector
                isOpen={isAvatarSelectorOpen}
                onClose={() => setIsAvatarSelectorOpen(false)}
                currentAvatarId={selectedAvatarId}
                onSelect={(id) => {
                    setSelectedAvatarId(id);
                    setIsAvatarSelectorOpen(false);
                }}
            />
        </motion.div>
    );
};
