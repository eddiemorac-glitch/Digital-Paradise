import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="space-y-2 w-full">
                {label && (
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-300" />
                    <input
                        ref={ref}
                        className={`
              relative w-full glass rounded-2xl px-6 py-4 text-sm font-medium text-white 
              placeholder:text-white/20 border border-white/5 outline-none 
              focus:border-primary/30 transition-all duration-300
              ${error ? 'border-red-500/50' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-[10px] font-bold text-red-500/80 ml-4 uppercase tracking-widest">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
