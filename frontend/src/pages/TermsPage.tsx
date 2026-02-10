import React from 'react';

export const TermsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="space-y-4">
                    <h1 className="text-5xl font-black italic tracking-tighter text-primary">TÉRMINOS Y CONDICIONES</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Contrato de Uso de Plataforma</p>
                </header>

                <section className="glass p-8 rounded-[2rem] border-white/5 space-y-6 text-white/80 leading-relaxed">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. Aceptación de los Términos</h2>
                        <p>Al acceder o utilizar DIGITAL PARADISE, usted acepta estar sujeto a estos términos y condiciones y a todas las leyes y regulaciones aplicables.</p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. Servicios</h2>
                        <p>Nuestra plataforma conecta a usuarios con comercios locales y servicios de mensajería en la región de Limón.</p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Responsabilidad</h2>
                        <p>DIGITAL PARADISE actúa como intermediario. La calidad y entrega de los productos son responsabilidad del comercio y el repartidor respectivo.</p>
                    </div>

                    <div className="space-y-4 text-xs text-white/40 pt-10">
                        <p>Última actualización: 5 de febrero, 2026</p>
                    </div>
                </section>
            </div>
        </div>
    );
};
