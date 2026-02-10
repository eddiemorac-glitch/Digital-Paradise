import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TropicalParticles } from './TropicalParticles';

interface AtmosphericEffectsProps {
    weatherLayer: boolean;
    scanlinesLayer: boolean;
    sceneticEffect: string; // 'RAIN' | 'SUN' | 'NONE'
    isLightningActive: boolean;
    atmosphere: {
        atmosphereClass: string;
        neonIntensity: number;
        timeOfDay: string;
    };
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const AtmosphericEffects: React.FC<AtmosphericEffectsProps> = ({
    weatherLayer,
    scanlinesLayer,
    sceneticEffect,
    isLightningActive,
    atmosphere,
    canvasRef
}) => {
    return (
        <>
            {/* SCENETIC OVERLAYS */}
            {weatherLayer && (
                <>
                    {sceneticEffect === 'RAIN' && (
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 z-[400] pointer-events-none opacity-60"
                        />
                    )}
                    {sceneticEffect === 'SUN' && (
                        <div className="absolute top-0 right-0 w-full h-full bg-orange-500/5 blur-[120px] rounded-full pointer-events-none z-[400]" />
                    )}
                    <AnimatePresence>
                        {isLightningActive && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-[401] pointer-events-none"
                            />
                        )}
                    </AnimatePresence>
                </>
            )}

            {scanlinesLayer && (
                <div className="absolute inset-0 z-[1000] pointer-events-none overflow-hidden opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay">
                    <div className="absolute inset-0 scanlines" />
                </div>
            )}

            {/* ATMOSPHERIC OVERLAY */}
            <div
                className={`absolute inset-0 z-[399] pointer-events-none transition-all duration-1000 ${atmosphere.atmosphereClass}`}
                style={{ opacity: atmosphere.neonIntensity * 0.5 }}
            />

            {/* TROPICAL PARTICLES */}
            {weatherLayer && (
                <TropicalParticles timeOfDay={atmosphere.timeOfDay as any} intensity={0.6} />
            )}
        </>
    );
};
