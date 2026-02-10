import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'glass' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-black uppercase tracking-widest transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95';

        const variants = {
            primary: 'bg-primary text-background shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:bg-primary-dark hover:shadow-[0_0_25px_rgba(0,255,102,0.4)]',
            secondary: 'bg-secondary text-background shadow-[0_0_20px_rgba(0,204,255,0.2)] hover:bg-secondary-dark hover:shadow-[0_0_25px_rgba(0,204,255,0.4)]',
            accent: 'bg-accent text-background shadow-[0_0_20px_rgba(255,136,0,0.2)] hover:bg-accent-dark hover:shadow-[0_0_25px_rgba(255,136,0,0.4)]',
            ghost: 'bg-transparent text-white hover:bg-white/5 border border-transparent hover:border-white/10',
            glass: 'glass text-white border border-white/5 hover:border-white/20 hover:bg-white/10 shadow-lg',
            outline: 'bg-transparent text-primary border border-primary/50 hover:bg-primary/10 hover:border-primary',
        };

        const sizes = {
            sm: 'px-4 py-2 text-[10px]',
            md: 'px-6 py-3 text-xs',
            lg: 'px-8 py-4 text-sm',
            icon: 'p-2',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {children as React.ReactNode}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
