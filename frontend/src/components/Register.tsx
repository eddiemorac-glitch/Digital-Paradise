import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/api';
import { motion } from 'framer-motion';
import { PrivacyModal } from './PrivacyModal';
import { AvatarSelector } from './AvatarSelector';
import { getAvatarById } from './AvatarIcons';

export const Register = ({ onToggle }: { onToggle: () => void }) => {
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [role, setRole] = useState<'client' | 'merchant' | 'delivery'>('client');
    const [merchantName, setMerchantName] = useState('');
    const [category, setCategory] = useState('RESTAURANT'); // Default
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('MOTORCYCLE');
    const [vehiclePlate, setVehiclePlate] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreedToPrivacyPolicy) {
            setError('Debes aceptar la Política de Privacidad para continuar.');
            return;
        }

        setLoading(true);
        try {
            let endpoint = '/auth/register';
            let payload: any = {
                email,
                password,
                fullName,
                avatarId: selectedAvatarId,
                agreedToPrivacyPolicy,
                privacyPolicyVersion: '1.0'
            };

            if (role === 'merchant') {
                endpoint = '/auth/register-merchant';
                payload = {
                    ...payload,
                    merchantName,
                    category,
                    address,
                    phone,
                    latitude: 9.9333, // Default San Jose for now
                    longitude: -84.0833
                };
            } else if (role === 'delivery') {
                endpoint = '/auth/register-courier';
                payload = {
                    ...payload,
                    vehicleType,
                    vehiclePlate
                };
            }

            const { data } = await api.post(endpoint, payload);
            if (role === 'client') {
                setAuth(data.user, data.access_token, data.refresh_token);
            } else {
                // Merchants and Couriers might need approval, so just notify
                setError('Registro exitoso. Revisa tu correo o espera aprobación.');
                setTimeout(() => onToggle(), 3000);
            }

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
            className="glass p-8 rounded-3xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto"
        >
            <h2 className="text-3xl font-black mb-6 text-gradient text-center">Únete al Enjambre</h2>

            {/* Role Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                {(['client', 'merchant', 'delivery'] as const).map((r) => (
                    <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${role === r
                                ? 'bg-primary text-background shadow-lg'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {r === 'client' ? 'Usuario' : r === 'merchant' ? 'Comercio' : 'Repartidor'}
                    </button>
                ))}
            </div>

            {/* Avatar Selection UI */}
            {role === 'client' && (
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
            )}

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

                {/* Merchant Fields */}
                {role === 'merchant' && (
                    <>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Nombre del Comercio</label>
                            <input
                                type="text"
                                value={merchantName}
                                onChange={(e) => setMerchantName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                                placeholder="Mi Restaurante"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Categoría</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors text-white"
                            >
                                <option value="RESTAURANT">Restaurante</option>
                                <option value="GROCERY">Supermercado</option>
                                <option value="PHARMACY">Farmacia</option>
                                <option value="STORE">Tienda</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Dirección</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                                placeholder="Dirección física"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Teléfono</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                                placeholder="8888-8888"
                                required
                            />
                        </div>
                    </>
                )}

                {/* Courier Fields */}
                {role === 'delivery' && (
                    <>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Tipo de Vehículo</label>
                            <select
                                value={vehicleType}
                                onChange={(e) => setVehicleType(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors text-white"
                            >
                                <option value="MOTORCYCLE">Motocicleta</option>
                                <option value="BICYCLE">Bicicleta</option>
                                <option value="CAR">Automóvil</option>
                                <option value="VAN">Furgoneta</option>
                            </select>
                        </div>
                        {vehicleType !== 'BICYCLE' && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Placa</label>
                                <input
                                    type="text"
                                    value={vehiclePlate}
                                    onChange={(e) => setVehiclePlate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                                    placeholder="AAA-123"
                                    required
                                />
                            </div>
                        )}
                    </>
                )}


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
                    {loading ? 'Registrando...' : role === 'client' ? 'Crear mi Cuenta' : 'Solicitar Registro'}
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
