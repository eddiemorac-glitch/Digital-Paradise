import { motion } from 'framer-motion';

export const DashboardSkeleton = () => {
    return (
        <div className="min-h-screen bg-background text-white p-4 md:p-8 space-y-6 animate-pulse">
            {/* TACTICAL HEADER SKELETON */}
            <header className="grid grid-cols-2 gap-4">
                <div className="glass p-6 rounded-[2rem] border-white/5 bg-white/5 h-32" />
                <div className="glass p-6 rounded-[2rem] border-white/5 bg-white/5 h-32" />
            </header>

            {/* VERTICAL SWITCHER SKELETON */}
            <div className="flex bg-white/5 p-2 rounded-3xl border border-white/10 h-20" />

            {/* ACTIVE MISSIONS SKELETON */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="w-40 h-8 bg-white/5 rounded-lg" />
                    <div className="w-8 h-8 bg-white/5 rounded-full" />
                </div>

                {[1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="glass overflow-hidden rounded-[2.5rem] border-white/5 bg-white/[0.02] h-64"
                    />
                ))}
            </section>

            {/* POOL SKELETON */}
            <section className="space-y-6 pt-8 border-t border-white/5">
                <div className="w-48 h-8 bg-white/5 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="glass p-6 rounded-[2rem] border-white/5 bg-white/[0.01] h-24" />
                    ))}
                </div>
            </section>
        </div>
    );
};
