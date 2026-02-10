import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { playTacticalSound } from '../../utils/tacticalSound';

interface MapToolsFABProps {
    isOpen: boolean;
    onClick: () => void;
}

export const MapToolsFAB: React.FC<MapToolsFABProps> = ({ isOpen, onClick }) => {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
                onClick();
                playTacticalSound('CLICK');
            }}
            className={`
                md:hidden absolute right-4 bottom-4 z-[1002] w-14 h-14 
                glass rounded-full flex items-center justify-center 
                transition-all duration-500 border-2
                ${isOpen
                    ? 'border-red-500/40 text-red-400 rotate-90 bg-red-500/10'
                    : 'border-primary/40 text-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,102,0.3)]'
                }
            `}
        >
            {isOpen ? <X size={24} /> : <Filter size={24} />}

            {!isOpen && (
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/20 pointer-events-none"
                />
            )}
        </motion.button>
    );
};
