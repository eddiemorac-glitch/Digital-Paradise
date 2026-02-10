import React, { useEffect, useRef, useMemo } from 'react';
import { TimeOfDay } from '../../hooks/useTimeAwareness';

interface TropicalParticlesProps {
    timeOfDay: TimeOfDay;
    intensity?: number; // 0-1
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    angle: number;
    wobble: number;
}

export const TropicalParticles: React.FC<TropicalParticlesProps> = ({
    timeOfDay,
    intensity = 0.5
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const frameRef = useRef<number>(0);

    const particleConfig = useMemo(() => {
        switch (timeOfDay) {
            case 'SUNRISE':
                return { count: 20, color: 'rgba(255, 200, 100, 0.6)', type: 'rays' };
            case 'DAY':
                return { count: 15, color: 'rgba(255, 255, 255, 0.3)', type: 'dust' };
            case 'GOLDEN':
                return { count: 25, color: 'rgba(255, 150, 50, 0.5)', type: 'rays' };
            case 'NIGHT':
                return { count: 40, color: 'rgba(180, 255, 180, 0.8)', type: 'fireflies' };
            case 'STEALTH':
                return { count: 10, color: 'rgba(100, 200, 255, 0.3)', type: 'mist' };
            default:
                return { count: 15, color: 'rgba(255, 255, 255, 0.3)', type: 'dust' };
        }
    }, [timeOfDay]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Initialize particles
        const count = Math.floor(particleConfig.count * intensity);
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 4 + 2,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3,
            angle: Math.random() * Math.PI * 2,
            wobble: Math.random() * 100
        }));

        let lastFrame = 0;
        const targetFPS = 30;
        const frameInterval = 1000 / targetFPS;

        const animate = (timestamp: number) => {
            if (timestamp - lastFrame < frameInterval) {
                frameRef.current = requestAnimationFrame(animate);
                return;
            }
            lastFrame = timestamp;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((p) => {
                ctx.beginPath();

                if (particleConfig.type === 'fireflies') {
                    // Firefly glow effect
                    const glowIntensity = Math.sin(timestamp / 500 + p.wobble) * 0.5 + 0.5;
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                    gradient.addColorStop(0, `rgba(180, 255, 180, ${glowIntensity * p.opacity})`);
                    gradient.addColorStop(0.5, `rgba(100, 255, 100, ${glowIntensity * p.opacity * 0.5})`);
                    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
                    ctx.fillStyle = gradient;
                    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                    ctx.fill();

                    // Organic movement
                    p.x += Math.sin(timestamp / 1000 + p.wobble) * 0.8;
                    p.y += Math.cos(timestamp / 1200 + p.wobble) * 0.5 - 0.1;

                } else if (particleConfig.type === 'rays') {
                    // Sun ray streak
                    ctx.strokeStyle = particleConfig.color;
                    ctx.lineWidth = p.size / 2;
                    ctx.lineCap = 'round';
                    const length = 30 + Math.sin(timestamp / 300 + p.wobble) * 10;
                    const angle = p.angle + Math.sin(timestamp / 2000) * 0.1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + Math.cos(angle) * length, p.y + Math.sin(angle) * length);
                    ctx.globalAlpha = p.opacity * (0.5 + Math.sin(timestamp / 400 + p.wobble) * 0.5);
                    ctx.stroke();
                    ctx.globalAlpha = 1;

                    // Slow drift
                    p.y += p.speed * 0.3;

                } else if (particleConfig.type === 'mist') {
                    // Misty blob
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
                    gradient.addColorStop(0, particleConfig.color);
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = gradient;
                    ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
                    ctx.fill();

                    p.x += Math.sin(timestamp / 3000 + p.wobble) * 0.5;
                    p.y += Math.cos(timestamp / 4000 + p.wobble) * 0.3;

                } else {
                    // Dust particles
                    ctx.fillStyle = particleConfig.color;
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();

                    p.y += p.speed;
                    p.x += Math.sin(timestamp / 1000 + p.wobble) * 0.3;
                }

                // Wrap around screen
                if (p.y > canvas.height + 20) p.y = -20;
                if (p.y < -20) p.y = canvas.height + 20;
                if (p.x > canvas.width + 20) p.x = -20;
                if (p.x < -20) p.x = canvas.width + 20;
            });

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(frameRef.current);
        };
    }, [particleConfig, intensity]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-[450] pointer-events-none"
            style={{ mixBlendMode: timeOfDay === 'NIGHT' ? 'screen' : 'overlay' }}
        />
    );
};
