import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
    variant?: 'default' | 'glass' | 'accent';
    noPadding?: boolean;
}

export const Card = ({ className = '', variant = 'default', noPadding = false, children, ...props }: CardProps) => {
    const baseStyles = 'rounded-[2.5rem] overflow-hidden border border-white/5 transition-all duration-300';

    const variants = {
        default: 'bg-card/40 backdrop-blur-md shadow-2xl',
        glass: 'glass shadow-2xl',
        accent: 'border-primary/20 bg-primary/5 shadow-[0_0_30px_rgba(0,255,102,0.05)]',
    };

    return (
        <motion.div
            className={`${baseStyles} ${variants[variant]} ${noPadding ? '' : 'p-6 sm:p-8'} ${className}`}
            style={{ willChange: 'backdrop-filter', transform: 'translateZ(0)' }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const CardHeader = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <div className={`mb-6 ${className}`}>{children}</div>
);

export const CardTitle = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tighter ${className}`}>{children}</h3>
);

export const CardDescription = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <p className={`text-sm text-white/40 font-medium ${className}`}>{children}</p>
);

export const CardContent = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <div className={className}>{children}</div>
);

export const CardFooter = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
    <div className={`mt-8 ${className}`}>{children}</div>
);
