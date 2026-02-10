/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            screens: {
                '2xs': '320px',
                'xs': '380px',
                'tall': { 'raw': '(min-height: 800px)' },
                'short': { 'raw': '(max-height: 700px)' },
            },
            colors: {
                primary: {
                    DEFAULT: "#00ff9d",
                    dark: "#00cc7a",
                    glow: "rgba(0, 255, 157, 0.4)",
                },
                secondary: {
                    DEFAULT: "#00e5ff",
                    dark: "#00b8cc",
                    glow: "rgba(0, 229, 255, 0.4)",
                },
                accent: {
                    DEFAULT: "#ff9100",
                    dark: "#e68200",
                    glow: "rgba(255, 145, 0, 0.4)",
                },
                background: "#020408",
                surface: "#0a1018",
                card: "rgba(10, 20, 30, 0.6)",
                border: "rgba(255, 255, 255, 0.08)",
            },
            boxShadow: {
                'caribe-glow': '0 0 30px rgba(0, 255, 157, 0.15)',
            },
            spacing: {
                'safe': 'env(safe-area-inset-bottom, 0)',
            },
            fontSize: {
                'fluid-xs': 'var(--text-xs)',
                'fluid-sm': 'var(--text-sm)',
                'fluid-base': 'var(--text-base)',
                'fluid-lg': 'var(--text-lg)',
                'fluid-xl': 'var(--text-xl)',
                'fluid-2xl': 'var(--text-2xl)',
                'fluid-hero': 'var(--text-hero)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                'neon-gradient': 'linear-gradient(135deg, #00ff66 0%, #00ccff 100%)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                }
            },
            backdropBlur: {
                'xs': '2px',
            }
        },
    },
    plugins: [],
}
