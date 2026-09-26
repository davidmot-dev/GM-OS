import { describe, it, expect } from 'vitest';
import { PALETTES, accentDuTheme, variablesDuTheme, type ThemeID } from './themeDeLInterface';

/**
 * **L'apparence d'aujourd'hui, figée — la garde de la phase 1 de la refonte.**
 *
 * David, 2026-09-27 : *« je ne veux pas que mon interface change maintenant »*.
 * La phase 1 réécrit la table des thèmes de base (paquets de jetons, échelles
 * nouvelles) **à pixel constant** ; les personnalités de Stitch n'arrivent qu'à
 * la fin, derrière un réglage des Paramètres éteint par défaut
 * (`documentation/Planning/2026-09-27-refonte-phase-1.md`).
 *
 * Ces valeurs ont été relevées sur `variablesDuTheme` **avant** la première
 * modification. Chaque variable posée hier doit l'être encore, avec la même
 * valeur ; une variable **ajoutée** ne casse rien — c'est tout l'objet de la
 * phase. Les captures de référence (T0.1) prouvent le reste à l'écran.
 */
const AUJOURD_HUI: Record<ThemeID, Record<string, string>> = {
    cyberpunk: {
        '--app-accent': '#06b6d4',
        '--app-accent-glow': 'rgba(6, 182, 212, 0.45)',
        '--app-accent-rgb': '6, 182, 212',
        '--app-bg': '#020617',
        '--app-border': '#1e293b',
        '--app-surface': '#0f172a',
        '--app-text': '#f8fafc',
        '--font-display': '"Orbitron", "JetBrains Mono", sans-serif',
        '--font-mono': "'JetBrains Mono', monospace",
        '--glass-bg': 'rgba(2, 6, 23, 0.6)',
        '--glass-border': 'rgba(34, 211, 238, 0.15)',
        '--glass-highlight': 'rgba(34, 211, 238, 0.25)',
    },
    medieval: {
        '--app-accent': '#d4af37',
        '--app-accent-glow': 'rgba(212, 175, 55, 0.45)',
        '--app-accent-rgb': '212, 175, 55',
        '--app-bg': '#181411',
        '--app-border': '#332c26',
        '--app-surface': '#24201c',
        '--app-text': '#e7e5e4',
        '--font-display': '"Cinzel", "MedievalSharp", serif',
        '--font-mono': "'UnifrakturMaguntia', cursive",
        '--glass-bg': 'rgba(28, 25, 23, 0.65)',
        '--glass-border': 'rgba(217, 119, 6, 0.12)',
        '--glass-highlight': 'rgba(217, 119, 6, 0.2)',
    },
    modern: {
        '--app-accent': '#3b82f6',
        '--app-accent-glow': 'rgba(59, 130, 246, 0.45)',
        '--app-accent-rgb': '59, 130, 246',
        '--app-bg': '#0f172a',
        '--app-border': '#334155',
        '--app-surface': '#1e293b',
        '--app-text': '#f8fafc',
        '--font-display': '"Outfit", "Inter", sans-serif',
        '--font-mono': "'JetBrains Mono', monospace",
        '--glass-bg': 'rgba(15, 23, 42, 0.5)',
        '--glass-border': 'rgba(255, 255, 255, 0.1)',
        '--glass-highlight': 'rgba(255, 255, 255, 0.2)',
    },
    claire: {
        '--app-accent': '#c2410c',
        '--app-accent-glow': 'rgba(194, 65, 12, 0.45)',
        '--app-accent-rgb': '194, 65, 12',
        '--app-bg': '#fbfbf9',
        '--app-border': '#e7e5e4',
        '--app-surface': '#ffffff',
        '--app-text': '#2c2420',
        '--font-display': '"Inter", sans-serif',
        '--font-mono': "'JetBrains Mono', monospace",
        '--glass-bg': 'rgba(255, 255, 255, 0.6)',
        '--glass-border': 'rgba(0, 0, 0, 0.08)',
        '--glass-highlight': 'rgba(255, 255, 255, 0.5)',
    },
};

describe('la phase 1 ne change pas l’apparence d’aujourd’hui', () => {
    it.each(Object.keys(AUJOURD_HUI) as ThemeID[])('%s : chaque variable d’hier garde sa valeur', (theme) => {
        const v = variablesDuTheme(PALETTES[theme], accentDuTheme(theme));
        for (const [nom, valeur] of Object.entries(AUJOURD_HUI[theme])) {
            expect(v[nom], `${theme} ${nom}`).toBe(valeur);
        }
    });
});
