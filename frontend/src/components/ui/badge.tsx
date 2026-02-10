import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'glass';
}

export const Badge = ({ className = '', variant = 'primary', children, ...props }: BadgeProps) => {
    const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all';

    const variants = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary/10 text-secondary border-secondary/20',
        accent: 'bg-accent/10 text-accent border-accent/20',
        outline: 'bg-transparent text-white/60 border-white/10',
        glass: 'glass text-white/80 border-white/5',
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    );
};
