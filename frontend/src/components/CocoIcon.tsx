import { motion } from 'framer-motion';

export const CocoIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        initial={{ scale: 0.9, rotate: -5 }}
        animate={{ scale: 1, rotate: 5 }}
        transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
        }}
    >
        <defs>
            <linearGradient id="cocoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8D6E63" />
                <stop offset="100%" stopColor="#5D4037" />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F5F5F5" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Aura de brillo externa */}
        <circle cx="50" cy="50" r="45" fill="#00FF66" fillOpacity="0.05" />

        {/* Cáscara Exterior (Forma perfecta y elegante) */}
        <path
            d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C72.1 90 90 72.1 90 50C90 27.9 72.1 10 50 10Z"
            fill="url(#cocoGradient)"
            stroke="#3E2723"
            strokeWidth="1"
        />

        {/* El "Corte" del Coco (Estilo Minimalista/Premium) */}
        <path
            d="M50 15C30.7 15 15 30.7 15 50C15 69.3 30.7 85 50 85C69.3 85 85 69.3 85 50C85 30.7 69.3 15 50 15Z"
            fill="#3E2723"
            fillOpacity="0.3"
        />

        {/* El interior blanco (Pulpa) - Solo una sección para que parezca abierto con estilo */}
        <path
            d="M50 20C33.4 20 20 33.4 20 50C20 66.6 33.4 80 50 80C66.6 80 80 66.6 80 50C80 33.4 66.6 20 50 20Z"
            fill="url(#innerGradient)"
        />

        {/* Los 3 puntos icónicos del coco (Estilizados, no como huecos) */}
        <circle cx="50" cy="35" r="4" fill="#5D4037" fillOpacity="0.6" />
        <circle cx="40" cy="45" r="4" fill="#5D4037" fillOpacity="0.6" />
        <circle cx="60" cy="45" r="4" fill="#5D4037" fillOpacity="0.6" />

        {/* Brillo de superficie Premium */}
        <path
            d="M30 30C35 25 45 22 55 25"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.4"
        />

        {/* Símbolo de "Moneda" o "Punto" sutil en el centro */}
        <circle cx="50" cy="55" r="10" stroke="#00FF66" strokeWidth="2" strokeDasharray="2 4" opacity="0.5" />
        <path d="M47 55L50 52L53 55M50 52V58" stroke="#00FF66" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

    </motion.svg>
);
