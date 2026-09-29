/**
 * **Les accents de module, dérivés de l'accent effectif** — règle R7 de la
 * refonte, P1.6, 2026-09-29.
 *
 * Q3, tranchée par David le 2026-09-17 : *les modules restent distinguables,
 * mais tout l'écran appartient au même univers.* Un `theme.css` donne **un**
 * accent, pas cinq : des `gm-*` fixes faisaient lire l'orange rouille d'Alien
 * comme un thème à moitié appliqué, à côté d'un Music-OS resté violet.
 *
 * **La règle** : chaque module garde **sa teinte** d'aujourd'hui — le combat
 * reste rouge, la musique violette, c'est le repère « tu es dans Music » — et
 * prend **la clarté et la saturation de l'accent**, c'est-à-dire l'univers. Le
 * calcul se fait en OKLCH, où ces trois grandeurs sont indépendantes.
 *
 * ⚠️ **Deux garanties, pas une** (R7) :
 * 1. **le contraste** : chaque accent atteint 3 sur le fond, la clarté est
 *    poussée jusque-là ;
 * 2. **la distance entre frères** : une saturation plancher, pour qu'un accent
 *    gris ne rende pas cinq gris. *Une dérivation qui rend cinq fois presque la
 *    même couleur ressemble à une dérivation qui marche.*
 *
 * Appliquée seulement sous l'interrupteur des personnalités (P1.7) : éteint,
 * les `gm-*` gardent leurs valeurs d'aujourd'hui, en repli dans Tailwind.
 */

import { contraste } from './editionDuTheme';

/** Les cinq accents d'aujourd'hui (`gm-teal` et `gm-orange`, employés nulle part, ont disparu). */
export const ACCENTS_D_AUJOURD_HUI = {
    gold: '#eab308',
    violet: '#8b5cf6',
    crimson: '#ef4444',
    cyan: '#06b6d4',
    emerald: '#10b981',
} as const;

export type Module = keyof typeof ACCENTS_D_AUJOURD_HUI;

/** Le contraste minimal d'un accent sur le fond — celui du contrat pour `accent` sur `bg` (§ 6). */
export const CONTRASTE_MINIMAL = 3;
/** La saturation plancher : sous elle, cinq teintes voisines deviennent cinq gris. */
const CHROMA_MIN = 0.09;
/** La saturation plafond : au-delà, l'accent crie plus fort que le jeu. */
const CHROMA_MAX = 0.2;

interface Oklch { L: number; C: number; h: number }

const lineaire = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function versOklab(hex: string): [number, number, number] | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => lineaire(c / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
        0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s,
    ];
}

function versOklch(hex: string): Oklch | null {
    const lab = versOklab(hex);
    if (!lab) return null;
    const [L, a, b] = lab;
    return { L, C: Math.hypot(a, b), h: Math.atan2(b, a) };
}

/** OKLCH → sRGB linéaire, sans borner : hors de [0, 1], la couleur n'existe pas à l'écran. */
function versRvbLineaire({ L, C, h }: Oklch): [number, number, number] {
    const a = C * Math.cos(h);
    const b = C * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
}

const dansLeGamut = (rvb: number[]) => rvb.every(c => c >= -1e-4 && c <= 1 + 1e-4);

/** La couleur affichable la plus proche : on garde la clarté et la teinte, on rend de la saturation. */
function versHex(couleur: Oklch): string {
    let c = couleur.C;
    let rvb = versRvbLineaire({ ...couleur, C: c });
    while (!dansLeGamut(rvb) && c > 0) {
        c = Math.max(0, c - 0.005);
        rvb = versRvbLineaire({ ...couleur, C: c });
    }
    return '#' + rvb
        .map(v => Math.round(gamma(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0'))
        .join('');
}

/** La distance entre deux couleurs, dans OKLab : 0,02 se devine, 0,1 se voit d'un coup d'œil. */
export function distanceOklab(a: string, b: string): number {
    const x = versOklab(a);
    const y = versOklab(b);
    if (!x || !y) return 0;
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/**
 * Les cinq accents de module pour cet accent et ce fond, ou `null` si l'un des
 * deux n'est pas une couleur `#rrggbb` — l'appelant garde alors ceux
 * d'aujourd'hui plutôt que d'en écrire des faux.
 */
export function accentsDeModule(accent: string, fond: string): Record<Module, string> | null {
    const source = versOklch(accent);
    if (!source || !versOklab(fond)) return null;

    const C = Math.min(CHROMA_MAX, Math.max(CHROMA_MIN, source.C));
    const fondSombre = contraste('#ffffff', fond)! > contraste('#000000', fond)!;

    const resultat = {} as Record<Module, string>;
    for (const [module, aujourdhui] of Object.entries(ACCENTS_D_AUJOURD_HUI) as [Module, string][]) {
        const { h } = versOklch(aujourdhui)!;
        let L = source.L;
        let hex = versHex({ L, C, h });
        /*
          **Le contraste d'abord** : on éloigne la clarté du fond, par petits pas,
          jusqu'au seuil. Vers le clair sur un fond sombre, vers le sombre sur un
          fond clair — jamais au-delà de ce qui reste une couleur.
        */
        while ((contraste(hex, fond) ?? 0) < CONTRASTE_MINIMAL && L > 0.2 && L < 0.95) {
            L += fondSombre ? 0.01 : -0.01;
            hex = versHex({ L, C, h });
        }
        resultat[module] = hex;
    }
    return resultat;
}
