import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, Utensils, Home } from 'lucide-react';

interface OrderTimelineProps {
    status: string;
}

export const OrderTimeline = ({ status }: OrderTimelineProps) => {
    const steps = [
        { id: 'PENDING', label: 'Recibido', icon: Package },
        { id: 'PREPARING', label: 'Cocinando', icon: Utensils },
        { id: 'READY', label: 'Listo', icon: CheckCircle2 },
        { id: 'ON_WAY', label: 'En camino', icon: Truck },
        { id: 'DELIVERED', label: 'Entregado', icon: Home },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === status);

    return (
        <div className="py-6 px-2 w-full">
            <div className="relative flex justify-between items-center w-full">
                {/* Background Line */}
                <div className="absolute top-5 left-2 right-2 h-[3px] bg-white/5 z-0 rounded-full" />

                {/* Progress Line */}
                <motion.div
                    className="absolute top-5 left-2 h-[3px] bg-primary z-0 rounded-full bg-gradient-to-r from-primary/50 to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 w-1/5">
                            <motion.div
                                animate={isCurrent ? {
                                    scale: [1, 1.15, 1],
                                    boxShadow: ["0 0 0px var(--primary)", "0 0 20px var(--primary)", "0 0 0px var(--primary)"]
                                } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted
                                        ? 'bg-[#0a0f18] border-primary text-primary shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                                        : 'bg-[#0a0f18] border-white/5 text-white/10'
                                    }`}
                            >
                                <Icon size={16} strokeWidth={isCompleted ? 3 : 2} />
                            </motion.div>

                            <motion.span
                                animate={{ opacity: isCompleted ? 1 : 0.3, y: isCompleted ? 0 : 2 }}
                                className={`text-[9px] font-black uppercase tracking-widest text-center absolute -bottom-6 w-24 transition-colors duration-500 ${isCurrent ? 'text-primary' : isCompleted ? 'text-white' : 'text-white/20'
                                    }`}
                            >
                                {step.label}
                            </motion.span>
                        </div>
                    );
                })}
            </div>

            {/* Active Status Text Space */}
            <div className="h-6" />
        </div>
    );
};
