import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { CocoIcon } from './CocoIcon';

interface UserVitalsProps {
    points: number;
    sustainabilityScore: number;
    language: 'es' | 'en';
    role?: string;
}

export const UserVitals = ({ points, sustainabilityScore, language, role }: UserVitalsProps) => {
    const isCourier = role?.toLowerCase() === 'delivery';

    const stats = [
        {
            label: language === 'es' ? 'COCO PUNTOS' : 'COCO POINTS',
            value: points.toLocaleString(),
            icon: <CocoIcon size={20} />,
            color: 'text-primary',
            borderColor: 'border-primary/20',
            bgColor: 'bg-primary/5'
        },
        {
            label: isCourier
                ? (language === 'es' ? 'PROXIMIDAD' : 'PROXIMITY')
                : (language === 'es' ? 'SOSTENIBILIDAD' : 'SUSTAINABILITY'),
            value: isCourier ? 'ACTIVA' : `${sustainabilityScore}%`,
            icon: <Leaf size={20} className="text-emerald-400" />,
            color: 'text-emerald-400',
            borderColor: 'border-emerald-400/20',
            bgColor: 'bg-emerald-400/5'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className={`glass p-4 rounded-3xl border ${stat.borderColor} flex items-center gap-4 ${stat.bgColor} group hover:scale-[1.02] transition-transform`}
                >
                    <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                        {stat.icon}
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className={`text-[8px] font-black uppercase tracking-widest ${stat.color} opacity-70 truncate`}>
                            {stat.label}
                        </p>
                        <p className="text-sm font-black text-white truncate">
                            {stat.value}
                        </p>
                    </div>
                </div>
            ))}
        </motion.div>
    );
};
