import React from 'react';

export const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="space-y-4">
                    <h1 className="text-5xl font-black italic tracking-tighter text-primary">POLÍTICA DE PRIVACIDAD</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Cumplimiento Ley No. 8968 - Costa Rica</p>
                </header>

                <section className="glass p-8 rounded-[2rem] border-white/5 space-y-6 text-white/80 leading-relaxed">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. Responsable del Tratamiento</h2>
                        <p>Caribe Digital CR, con domicilio en Limón, Costa Rica, es el responsable del tratamiento de sus datos personales recolectados a través de esta plataforma.</p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. Datos Recolectados</h2>
                        <p>Recolectamos datos de identificación, contacto, ubicación en tiempo real (para deliverys) y detalles financieros procesados de forma segura por terceros (Stripe/Tilopay).</p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Derechos ARCO</h2>
                        <p>Usted tiene derecho al Acceso, Rectificación, Cancelación y Oposición de sus datos. Puede ejercer estos derechos enviando una solicitud a través de su perfil o al correo soporte@caribedigital.cr.</p>
                    </div>

                    <div className="space-y-4 text-xs text-white/40 pt-10">
                        <p>Última actualización: 5 de febrero, 2026</p>
                    </div>
                </section>
            </div>
        </div>
    );
};
