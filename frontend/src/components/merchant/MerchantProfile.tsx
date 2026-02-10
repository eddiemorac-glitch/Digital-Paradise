import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Merchant, merchantApi } from '../../api/merchants';
import { useLanguageStore } from '../../store/languageStore';
import { toast } from 'sonner';
import { Save, User, MapPin, Clock, Truck, Globe, Mail, Leaf } from 'lucide-react';
import { LocationPicker } from './LocationPicker';
import { ImageUploader } from '../ImageUploader';

export const MerchantProfile = ({ merchant }: { merchant: Merchant | undefined }) => {
    const queryClient = useQueryClient();
    const { language } = useLanguageStore();

    const [formData, setFormData] = useState({
        name: merchant?.name || '',
        description: merchant?.description || '',
        address: merchant?.address || '',
        email: merchant?.email || '',
        latitude: merchant?.latitude || 0,
        longitude: merchant?.longitude || 0,
        phone: merchant?.phone || '',
        isSustainable: merchant?.isSustainable || false,
        prepTimeMinutes: merchant?.prepTimeMinutes || 30,
        deliveryRadius: merchant?.deliveryRadius || 5,
        baseDeliveryFee: merchant?.baseDeliveryFee || 1500,
        kmFee: merchant?.kmFee || 200,
        isBusy: merchant?.operationalSettings?.isBusy || false,
        autoCloseOnOversaturation: merchant?.operationalSettings?.autoCloseOnOversaturation || false,
        maxConcurrentOrders: merchant?.operationalSettings?.maxConcurrentOrders || 10,
        openingHours: merchant?.openingHours || {
            lunes: { open: '08:00', close: '22:00', closed: false },
            martes: { open: '08:00', close: '22:00', closed: false },
            miercoles: { open: '08:00', close: '22:00', closed: false },
            jueves: { open: '08:00', close: '22:00', closed: false },
            viernes: { open: '08:00', close: '22:00', closed: false },
            sabado: { open: '08:00', close: '22:00', closed: false },
            domingo: { open: '08:00', close: '22:00', closed: false },
        },
        socialLinks: merchant?.socialLinks || {
            whatsapp: '',
            instagram: '',
            facebook: '',
            website: ''
        },
        logoUrl: merchant?.logoUrl || '',
        bannerUrl: merchant?.bannerUrl || ''
    });

    // Sync formData when merchant prop changes (after a successful refetch)
    useEffect(() => {
        if (merchant) {
            setFormData({
                name: merchant.name || '',
                description: merchant.description || '',
                address: merchant.address || '',
                email: merchant.email || '',
                latitude: merchant.latitude || 0,
                longitude: merchant.longitude || 0,
                phone: merchant.phone || '',
                isSustainable: merchant.isSustainable || false,
                prepTimeMinutes: merchant.prepTimeMinutes || 30,
                deliveryRadius: merchant.deliveryRadius || 5,
                baseDeliveryFee: merchant.baseDeliveryFee || 1500,
                kmFee: merchant.kmFee || 200,
                isBusy: merchant.operationalSettings?.isBusy || false,
                autoCloseOnOversaturation: merchant.operationalSettings?.autoCloseOnOversaturation || false,
                maxConcurrentOrders: merchant.operationalSettings?.maxConcurrentOrders || 10,
                openingHours: merchant.openingHours || formData.openingHours,
                socialLinks: merchant.socialLinks || formData.socialLinks,
                logoUrl: merchant.logoUrl || '',
                bannerUrl: merchant.bannerUrl || ''
            });
        }
    }, [merchant]);

    const updateProfileMutation = useMutation({
        mutationFn: (data: Partial<Merchant>) => {
            if (!merchant?.id) throw new Error("No merchant id");
            return merchantApi.update(merchant.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
            toast.success(language === 'es' ? 'Perfil actualizado' : 'Profile updated');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error updating profile');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { isBusy, autoCloseOnOversaturation, maxConcurrentOrders, openingHours, socialLinks, isSustainable, ...rest } = formData;

        updateProfileMutation.mutate({
            ...rest,
            openingHours,
            socialLinks,
            isSustainable,
            operationalSettings: {
                ...merchant?.operationalSettings,
                isBusy,
                autoCloseOnOversaturation,
                maxConcurrentOrders
            }
        });
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
        <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon size={16} />
            </div>
            <h3 className="text-sm font-black italic uppercase tracking-wider">{title}</h3>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

            {/* COLUMN 1: Identity & Location */}
            <div className="space-y-8">

                {/* BRANDING */}
                <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden">
                    <SectionHeader icon={User} title="Identidad de Marca" />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Logo</label>
                            <div className="w-32 h-32 mx-auto">
                                <ImageUploader
                                    currentImageUrl={formData.logoUrl}
                                    onImageChange={(url) => setFormData({ ...formData, logoUrl: url || '' })}
                                    endpoint="/uploads/merchant-image" // Passing this prop, need to add it to ImageUploader
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Banner</label>
                            <div className="w-full h-32">
                                <ImageUploader
                                    currentImageUrl={formData.bannerUrl}
                                    onImageChange={(url) => setFormData({ ...formData, bannerUrl: url || '' })}
                                    endpoint="/uploads/merchant-image"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="flex items-center gap-3">
                                    <Leaf className="text-primary" size={18} />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">{language === 'es' ? 'Negocio Sostenible' : 'Sustainable Business'}</p>
                                        <p className="text-[9px] text-white/40">{language === 'es' ? 'Promueve prácticas eco-amigables' : 'Promote eco-friendly practices'}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isSustainable: !formData.isSustainable })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.isSustainable ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isSustainable ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">{language === 'es' ? 'Correo de Contacto' : 'Contact Email'}</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Nombre Comercial</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Descripción Corta</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-medium focus:border-primary/50 outline-none transition-all resize-none h-24"
                            />
                        </div>
                    </div>
                </div>

                {/* LOCATION */}
                <div className="glass p-8 rounded-[2.5rem] border-white/5">
                    <SectionHeader icon={MapPin} title="Ubicación Geográfica" />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Dirección Física</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>

                        <LocationPicker
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                        />
                    </div>
                </div>
            </div>

            {/* COLUMN 2: Operations & Logistics */}
            <div className="space-y-8">

                {/* OPERATIONS */}
                <div className="glass p-8 rounded-[2.5rem] border-white/5">
                    <SectionHeader icon={Clock} title="Operaciones & Horarios" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Tiempo Prep (Min)</label>
                            <input
                                type="number"
                                value={formData.prepTimeMinutes}
                                onChange={e => setFormData({ ...formData, prepTimeMinutes: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Capacidad Max</label>
                            <input
                                type="number"
                                value={formData.maxConcurrentOrders}
                                onChange={e => setFormData({ ...formData, maxConcurrentOrders: parseInt(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Modo Saturado</span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isBusy: !formData.isBusy })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${formData.isBusy ? 'bg-amber-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.isBusy ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <p className="text-[9px] text-white/40">Si se activa, la tienda aparecerá como "Ocupada" y no aceptará nuevos pedidos temporalmente.</p>
                    </div>

                    <div className="space-y-4">
                        {Object.entries(formData.openingHours).map(([day, schedule]: [string, any]) => (
                            <div key={day} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-20 text-[9px] font-black uppercase tracking-widest text-white/60">{day}</div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newHours = { ...formData.openingHours } as any;
                                        newHours[day].closed = !newHours[day].closed;
                                        setFormData({ ...formData, openingHours: newHours });
                                    }}
                                    className={`text-[8px] font-black uppercase px-2 py-1 rounded-md w-16 text-center ${schedule.closed ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}
                                >
                                    {schedule.closed ? 'Cerrado' : 'Abierto'}
                                </button>

                                {!schedule.closed && (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="time"
                                            value={schedule.open}
                                            onChange={e => {
                                                const newHours = { ...formData.openingHours } as any;
                                                newHours[day].open = e.target.value;
                                                setFormData({ ...formData, openingHours: newHours });
                                            }}
                                            className="bg-transparent text-xs text-white outline-none border-b border-white/10 focus:border-primary w-full text-center"
                                        />
                                        <span className="text-white/20">-</span>
                                        <input
                                            type="time"
                                            value={schedule.close}
                                            onChange={e => {
                                                const newHours = { ...formData.openingHours } as any;
                                                newHours[day].close = e.target.value;
                                                setFormData({ ...formData, openingHours: newHours });
                                            }}
                                            className="bg-transparent text-xs text-white outline-none border-b border-white/10 focus:border-primary w-full text-center"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* LOGISTICS */}
                <div className="glass p-8 rounded-[2.5rem] border-white/5">
                    <SectionHeader icon={Truck} title="Logística de Entrega" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Radio (km)</label>
                            <input
                                type="number"
                                value={formData.deliveryRadius}
                                onChange={e => setFormData({ ...formData, deliveryRadius: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Base (₡)</label>
                            <input
                                type="number"
                                value={formData.baseDeliveryFee}
                                onChange={e => setFormData({ ...formData, baseDeliveryFee: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Por Km (₡)</label>
                            <input
                                type="number"
                                value={formData.kmFee}
                                onChange={e => setFormData({ ...formData, kmFee: parseFloat(e.target.value) })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Teléfono</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* DIGITAL */}
                <div className="glass p-8 rounded-[2.5rem] border-white/5">
                    <SectionHeader icon={Globe} title="Presencia Digital" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">WhatsApp</label>
                            <input
                                type="text"
                                value={formData.socialLinks.whatsapp}
                                placeholder="https://wa.me/"
                                onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, whatsapp: e.target.value } })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2">Instagram</label>
                            <input
                                type="text"
                                value={formData.socialLinks.instagram}
                                placeholder="@usuario"
                                onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary/50 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="sticky bottom-4 z-10">
                    <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="w-full bg-primary text-background font-black uppercase tracking-[0.2em] py-5 rounded-3xl shadow-[0_10px_40px_rgba(0,255,102,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                    >
                        {updateProfileMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </form>
    );
};
