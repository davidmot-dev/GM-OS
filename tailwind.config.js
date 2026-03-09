/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // La base Obsidian & Slate
                obsidian: {
                    DEFAULT: '#0f172a', // bg-obsidian
                    dark: '#020617',
                    light: '#1e293b',
                },
                // Les accents Neon par Module
                gm: {
                    gold: '#eab308',    // Session OS
                    violet: '#8b5cf6',  // Music/Sound/Voice OS
                    teal: '#0d9488',    // Ambient OS
                    crimson: '#ef4444', // Combat OS
                    cyan: '#06b6d4',    // Map OS
                    emerald: '#10b981', // NPC/Table OS
                    orange: '#f97316',  // Web/Dice OS
                },
                accent: 'var(--app-accent)',
            },
            fontFamily: {
                // Typographie technique et lisible
                mono: ['"JetBrains Mono"', 'monospace'],
                sans: ['Inter', 'sans-serif'],
                display: ['Orbitron', 'sans-serif'], // Optionnel pour les grands titres "OS"
                cinematic: ['"Noto Serif"', 'serif'],
            },
            boxShadow: {
                // Effets de lueur Glow pour l'immersion
                'glow-gold': '0 0 15px -3px rgba(234, 179, 8, 0.4)',
                'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.4)',
                'glow-crimson': '0 0 15px -3px rgba(239, 68, 68, 0.4)',
                'glow-violet': '0 0 15px -3px rgba(139, 92, 246, 0.4)',
                'glow-white': '0 0 15px rgba(255, 255, 255, 0.1)',
            },
            backgroundImage: {
                // Dégradés pour les cartes et panels
                'glass-gradient': 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.2) 100%)',
            },
            animation: {
                // Animations pour les tours actifs et les états de lecture
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glitch': 'glitch 0.3s cubic-bezier(.25,.46,.45,.94) both infinite',
            },
            keyframes: {
                glitch: {
                    '0%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(-2px, -2px)' },
                    '60%': { transform: 'translate(2px, 2px)' },
                    '80%': { transform: 'translate(2px, -2px)' },
                    '100%': { transform: 'translate(0)' },
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
