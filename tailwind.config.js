import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import animate from 'tailwindcss-animate'

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
                // Splash Screen Themes
                neonCyan: '#22d3ee',
                neonViolet: '#a855f7',
                amber: {
                    DEFAULT: '#ffb000',
                    dim: '#946300',
                    glitch: '#ffd478'
                },
                parchment: '#f4e4bc',
                leather: '#3e2723',
                arcaneGold: '#d4af37',
                arcaneGlow: '#7e22ce',
                accent: 'var(--app-accent)',
                'app-accent': 'var(--app-accent)',
                'app-bg': 'var(--app-bg)',
                'app-surface': 'var(--app-surface)',
                'app-border': 'var(--app-border)',
                'app-text': 'var(--app-text)',
                /*
                  **Les couleurs de P1.2** (refonte, phase 1) — écrites par
                  `themeDeLInterface.ts`, seul écrivain. L'opacité passe par
                  `color-mix` : `bg-etat-danger/15` donne le fond d'un état,
                  `border-etat-danger/40` sa bordure, sans variable de plus.
                */
                'app-muted': 'var(--app-text-muted)',
                'app-subtle': 'var(--app-text-subtle)',
                'app-surface-2': 'var(--app-surface-2)',
                'app-on-accent': 'var(--app-accent-contrast)',
                'app-soft': 'var(--app-border-soft)',
                'etat-succes': 'var(--etat-succes)',
                'etat-danger': 'var(--etat-danger)',
                'etat-alerte': 'var(--etat-alerte)',
                'etat-info': 'var(--etat-info)',
            },
            fontFamily: {
                // Typographie premium
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
                outfit: ['Outfit', 'sans-serif'],
                // Typographie technique et lisible
                mono: ['"JetBrains Mono"', 'monospace'],
                // P1.4 : le corps a sa police, qui retombe sur celle des titres — l'écran d'aujourd'hui.
                sans: ['var(--font-body, var(--font-display))', 'Inter', 'sans-serif'],
                display: ['var(--font-display)', 'Outfit', 'Orbitron', 'sans-serif'],

                cinematic: ['"Noto Serif"', 'serif'],
                // Splash Screen Fonts
                elite: ['"Special Elite"', 'cursive'],
                medieval: ['"MedievalSharp"', 'cursive'],
                script: ['"Pinyon Script"', 'cursive'],
                fraktur: ['"UnifrakturMaguntia"', 'cursive'],
                cinzel: ['"Cinzel"', 'serif'],
            },
            /*
              **La forme, pilotée par le thème — P1.4 de la refonte, 2026-09-29.**

              Les sept crans se rangent en trois familles, celles du contrat
              (§ 4.5) — décision de David : *« les cartes font 12 px », toutes*.
              Petit (badges, champs) : sm, DEFAULT, md. Moyen (boutons, cartes) :
              lg, xl. Grand (panneaux) : 2xl, 3xl. `rounded-full` et
              `rounded-none` ne bougent jamais.

              **Le repli est la valeur de Tailwind 4, au caractère près** : tant
              qu'un thème ne déclare pas de rayon, rien ne change à l'écran.
            */
            borderRadius: {
                sm: 'var(--rayon-sm, 0.25rem)',
                DEFAULT: 'var(--rayon-sm, 0.25rem)',
                md: 'var(--rayon-sm, 0.375rem)',
                lg: 'var(--rayon-md, 0.5rem)',
                xl: 'var(--rayon-md, 0.75rem)',
                '2xl': 'var(--rayon-lg, 1rem)',
                '3xl': 'var(--rayon-lg, 1.5rem)',
            },
            boxShadow: {
                /*
                  **Le relief, par trois élévations** (§ 4.6) : posé (sm, DEFAULT),
                  flottant (md, lg), dialogue (xl, 2xl). Le repli est l'ombre de
                  Tailwind 4, et il garde `var(--tw-shadow-color)` : c'est ce qui
                  fait marcher `shadow-lg shadow-accent/20`. Une élévation déclarée
                  par le thème apporte ses propres couleurs.
                */
                sm: 'var(--elev-1, 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a))',
                DEFAULT: 'var(--elev-1, 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a))',
                md: 'var(--elev-2, 0 4px 6px -1px var(--tw-shadow-color, #0000001a), 0 2px 4px -2px var(--tw-shadow-color, #0000001a))',
                lg: 'var(--elev-2, 0 10px 15px -3px var(--tw-shadow-color, #0000001a), 0 4px 6px -4px var(--tw-shadow-color, #0000001a))',
                xl: 'var(--elev-3, 0 20px 25px -5px var(--tw-shadow-color, #0000001a), 0 8px 10px -6px var(--tw-shadow-color, #0000001a))',
                '2xl': 'var(--elev-3, 0 25px 50px -12px var(--tw-shadow-color, #00000040))',
                // Effets de lueur Glow pour l'immersion
                'glow-gold': '0 0 15px -3px rgba(234, 179, 8, 0.4)',
                'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.4)',
                'glow-crimson': '0 0 15px -3px rgba(239, 68, 68, 0.4)',
                'glow-violet': '0 0 15px -3px rgba(139, 92, 246, 0.4)',
                'glow-white': '0 0 15px rgba(255, 255, 255, 0.1)',
                'glow-amber': '0 0 15px rgba(255, 176, 0, 0.4)',
                'glow-sky': '0 0 15px -3px rgba(14, 165, 233, 0.5)',
                'glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.5)',
            },
            backgroundImage: {
                // Dégradés pour les cartes et panels
                'glass-gradient': 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.2) 100%)',
            },
            animation: {
                // Animations pour les tours actifs et les états de lecture
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glitch': 'glitch 0.3s cubic-bezier(.25,.46,.45,.94) both infinite',
                'glitch-long': 'glitch 1s infinite linear alternate-reverse',
                'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'flicker': 'flicker 0.15s infinite',
                'scanline': 'scanline 8s linear infinite',
                'glitch-skew': 'glitch-skew 4s infinite linear alternate-reverse',
                'spark': 'spark 0.2s infinite',
                'ping-expand': 'ping-expand 1.5s ease-out forwards',
                // Nexus-HUD animations
                'rise': 'rise 4s ease-in infinite',
                'scan': 'scan 2s linear infinite',
                'shimmer': 'shimmer 1.5s ease-in-out infinite',
            },
            keyframes: {
                glitch: {
                    '0%': { transform: 'translate(0)' },
                    '20%': { transform: 'translate(-2px, 2px)' },
                    '40%': { transform: 'translate(-2px, -2px)' },
                    '60%': { transform: 'translate(2px, 2px)' },
                    '80%': { transform: 'translate(2px, -2px)' },
                    '100%': { transform: 'translate(0)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 10px #22d3ee)' },
                    '50%': { opacity: 0.7, filter: 'drop-shadow(0 0 25px #a855f7)' },
                },
                flicker: {
                    '0%, 100%': { opacity: 0.98 },
                    '5%': { opacity: 0.85 },
                    '10%': { opacity: 0.9 },
                    '15%': { opacity: 0.7 },
                    '20%': { opacity: 0.95 },
                    '25%': { opacity: 0.8 },
                    '30%': { opacity: 0.95 },
                    '70%': { opacity: 0.9 },
                    '72%': { opacity: 0.5 },
                    '75%': { opacity: 0.9 },
                    '80%': { opacity: 0.85 },
                },
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                'glitch-skew': {
                    '0%, 25%, 70%, 75%, 100%': { transform: 'skew(0deg)' },
                    '20%': { transform: 'skew(-5deg)' },
                    '24%': { transform: 'skew(15deg)' },
                    '71%': { transform: 'skew(-10deg)' },
                },
                spark: {
                    '0%, 100%': { opacity: 0 },
                    '50%': { opacity: 1, filter: 'brightness(2)' },
                },
                'ping-expand': {
                    '0%': { transform: 'scale(0.2)', opacity: 0.8 },
                    '100%': { transform: 'scale(2)', opacity: 0 },
                },
                // Nexus-HUD
                'rise': {
                    '0%': { transform: 'translateY(0) scale(1)', opacity: 0.6 },
                    '80%': { opacity: 0.3 },
                    '100%': { transform: 'translateY(-200px) scale(0.5)', opacity: 0 },
                },
                'scan': {
                    '0%': { transform: 'translateY(-100%)', opacity: 0 },
                    '10%': { opacity: 1 },
                    '90%': { opacity: 1 },
                    '100%': { transform: 'translateY(600%)', opacity: 0 },
                },
                'shimmer': {
                    '0%': { transform: 'translateX(-100%)', opacity: 0.5 },
                    '50%': { opacity: 0.8 },
                    '100%': { transform: 'translateX(200%)', opacity: 0.5 },
                },
            }
        },
    },
    plugins: [
        forms,
        typography,
        /*
          **Le greffon qui manquait — posé le 2026-09-03, à la demande de David.**

          `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-*` et l'unique
          `animate-out` du bandeau de toast étaient écrits **125 fois dans 76
          fichiers** et ne produisaient AUCUNE règle : le greffon n'avait jamais
          été installé. *Une classe qui n'existe pas ne prévient pas — rien ne
          casse, il ne se passe simplement rien.*

          C'est lui qui définit les images-clés `enter` / `exit` et les variables
          `--tw-enter-*` que ces classes renseignent, et qui étend `duration-*`,
          `delay-*`, `ease-*` et `fill-mode-*` à l'animation en plus de la
          transition — d'où `duration-500` qui prend enfin son sens à côté d'un
          `animate-in`.
        */
        animate,
    ],
}
