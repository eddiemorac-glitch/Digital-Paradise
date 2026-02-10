import { useEffect, useRef, useState, RefObject } from 'react';
import { SceneticEffect, MapLayers } from '../types/map';

interface UseRainEngineProps {
    sceneticEffect: SceneticEffect;
    layers: MapLayers;
    centerRef: RefObject<[number, number]>;
}

interface UseRainEngineReturn {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    isLightningActive: boolean;
}

export const useRainEngine = ({
    sceneticEffect,
    layers,
    centerRef
}: UseRainEngineProps): UseRainEngineReturn => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLightningActive, setIsLightningActive] = useState(false);

    useEffect(() => {
        if (!layers.weather || sceneticEffect !== 'RAIN' || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animationFrame: number;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const dots: { x: number; y: number; l: number; s: number }[] = [];
        const MAX_DOTS = window.innerWidth < 768 ? 80 : 150; // Performance: Lower count on mobile
        for (let i = 0; i < MAX_DOTS; i++) {
            dots.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                l: Math.random() * 20 + 20,
                s: Math.random() * 15 + 10
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Environmental Reactivity (Jungle Pulse)
            const c = centerRef.current || [9.93, -84.10]; // Default to center if null
            const jungleFactor = Math.min(1.5, Math.max(0.5, (9.70 - c[0]) * 10));
            const density = Math.floor(150 * jungleFactor);

            ctx.strokeStyle = `rgba(174, 194, 224, ${0.1 * jungleFactor})`;
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';

            dots.slice(0, density).forEach(d => {
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + d.l * 0.1, d.y + d.l);
                ctx.stroke();

                d.y += d.s * (layers.scanlines ? 1.2 : 1.0);
                d.x += d.s * 0.05;
                if (d.y > canvas.height) {
                    d.y = -d.l;
                    d.x = Math.random() * canvas.width;
                }
            });

            // Random Lightning (Subtle)
            if (Math.random() > 0.998) {
                setIsLightningActive(true);
                setTimeout(() => setIsLightningActive(false), 50);
            }

            animationFrame = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, [sceneticEffect, layers.weather, layers.scanlines]);

    return { canvasRef, isLightningActive };
};
