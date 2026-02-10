import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/api';
import { useLanguageStore } from '../../store/languageStore';
import {
    Shield,
    Key,
    FileUp,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Building2,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';

interface HaciendaTerminalProps {
    merchantId: string;
    currentStatus?: 'ACTIVE' | 'INVALID' | 'NOT_CONFIGURED';
}

export const HaciendaTerminal = ({ merchantId, currentStatus }: HaciendaTerminalProps) => {
    const queryClient = useQueryClient();
    const { language } = useLanguageStore();
    const [p12File, setP12File] = useState<File | null>(null);

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await api.post(`/merchants/${merchantId}/hacienda-credentials`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success(language === 'es' ? 'Configuración de Hacienda guardada correctamente' : 'Hacienda configuration saved successfully');
            queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || (language === 'es' ? 'Error al guardar credenciales' : 'Error saving credentials'));
        }
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        if (!p12File && currentStatus === 'NOT_CONFIGURED') {
            toast.error(language === 'es' ? 'El archivo llave (.p12) es obligatorio para la primera configuración' : 'Key file (.p12) is mandatory for first-time setup');
            return;
        }

        if (p12File) {
            formData.append('p12File', p12File);
        }

        uploadMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${currentStatus === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                        {currentStatus === 'ACTIVE' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                        <h3 className="font-black uppercase tracking-widest text-xs text-white">{language === 'es' ? 'Estado Hacienda v4.4' : 'Hacienda Status v4.4'}</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">
                            {currentStatus === 'ACTIVE'
                                ? (language === 'es' ? 'Conexión Establecida y Operativa' : 'Connection Established & Operational')
                                : (language === 'es' ? 'Requiere Configuración Legal' : 'Requires Legal Configuration')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-background/40 px-4 py-2 rounded-xl border border-white/5">
                    <Lock size={12} className="text-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">{language === 'es' ? 'Encriptación de Grado Bancario' : 'Bank-Grade Encryption'}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass p-10 rounded-[3rem] border-white/5 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Shield size={120} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Key size={14} className="text-primary" />
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">{language === 'es' ? 'Credenciales API (ATV)' : 'API Credentials (ATV)'}</label>
                        </div>
                        <div className="space-y-4">
                            <input
                                name="username"
                                placeholder={language === 'es' ? 'Usuario (Nombre de Usuario ATV)' : 'Username (ATV Username)'}
                                required
                                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                            />
                            <input
                                name="password"
                                type="password"
                                placeholder={language === 'es' ? 'Contraseña de Acceso API' : 'API Access Password'}
                                required
                                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileUp size={14} className="text-primary" />
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">{language === 'es' ? 'Llave Criptográfica (.p12)' : 'Cryptographic Key (.p12)'}</label>
                        </div>
                        <div className="space-y-4">
                            <div
                                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer ${p12File ? 'border-primary/40 bg-primary/5' : 'border-white/5 hover:border-white/10 bg-white/[0.02]'}`}
                                onClick={() => document.getElementById('p12-upload')?.click()}
                            >
                                <FileUp size={32} className={p12File ? 'text-primary' : 'text-white/10 group-hover:text-white/20'} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-center text-white/40 group-hover:text-white/60">
                                    {p12File ? p12File.name : (language === 'es' ? 'Subir Archivo .p12' : 'Upload .p12 File')}
                                </span>
                                <input
                                    id="p12-upload"
                                    type="file"
                                    accept=".p12"
                                    className="hidden"
                                    onChange={(e) => setP12File(e.target.files?.[0] || null)}
                                />
                            </div>
                            <input
                                name="pin"
                                type="password"
                                maxLength={4}
                                placeholder={language === 'es' ? 'PIN de Llave (4 dígitos)' : 'Key PIN (4 digits)'}
                                required
                                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono text-center tracking-[1em]"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 size={14} className="text-primary" />
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">{language === 'es' ? 'Actividad Económica Principal' : 'Primary Economic Activity'}</label>
                    </div>
                    <input
                        name="economicActivityCode"
                        placeholder={language === 'es' ? 'Código de 6 dígitos (ej: 561001)' : '6-digit code (e.g., 561001)'}
                        required
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white outline-none focus:border-primary/50 transition-all font-mono"
                    />
                    <p className="text-[8px] font-bold text-white/20 mt-2 uppercase tracking-wide">
                        * {language === 'es'
                            ? 'Ingrese el código CIIU 4 autorizado por Hacienda para su negocio.'
                            : 'Enter the CIIU 4 code authorized by Hacienda for your business.'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={uploadMutation.isPending}
                        className="flex-1 bg-primary text-background font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {uploadMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <Shield size={18} />
                                <span>{language === 'es' ? 'Firmar y Enlazar con Hacienda' : 'Sign & Link with Hacienda'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                <div className="flex gap-4">
                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-[9px] font-bold text-amber-500/80 uppercase leading-relaxed">
                        {language === 'es'
                            ? 'Sus credenciales se utilizan exclusivamente para firmar facturas generadas en esta plataforma. Caribe Digital no almacena claves maestras de su cuenta ATV, solo las credenciales de la API de comprobantes electrónicos necesarias para el funcionamiento legal.'
                            : 'Your credentials are used exclusively to sign invoices generated on this platform. Caribe Digital does not store master keys from your ATV account, only the electronic voucher API credentials necessary for legal operation.'}
                    </p>
                </div>
            </div>
        </div>
    );
};
