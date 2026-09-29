/**
 * **La garde de distinction** — refonte, P1.6, 2026-09-29.
 *
 * Quatre thèmes de base qui se ressembleraient ne vaudraient pas quatre
 * thèmes. On les compare deux à deux sur **sept traits**, ceux qui se voient
 * au premier coup d'œil, et deux thèmes doivent différer sur **trois au
 * moins**.
 *
 * Les seuils du plan de la phase 1 (§ P1.6) : 60 de distance de couleur (RVB,
 * euclidienne, sur 441), 4 px d'arrondi, une autre famille de police. Ils
 * retrouvent les comptes relevés sur les valeurs de Stitch (T2.3) : 7/7 pour
 * Cyberpunk et Clair, **3/7 pour Moderne et Clair** — le cadre, l'arrondi et la
 * police. *Sans le cadre, ils tomberaient à 2 et seraient refusés* : c'est
 * pour ça que David l'a retenu.
 */

import { premiereFamille } from './jetonsDeTheme';

export const SEUIL_DE_COULEUR = 60;
export const SEUIL_D_ARRONDI = 4;
export const TRAITS_DISTINCTS_MINIMUM = 3;

export const TRAITS = ['fond', 'surface', 'texte', 'accent', 'fond du cadre', 'arrondi des cartes', 'police de titre'] as const;
export type Trait = typeof TRAITS[number];

function rvb(hex: string | undefined): [number, number, number] | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? '');
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function couleursDifferent(a: string | undefined, b: string | undefined): boolean {
    const x = rvb(a);
    const y = rvb(b);
    if (!x || !y) return a !== b;
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) >= SEUIL_DE_COULEUR;
}

/** L'arrondi des cartes en pixels ; absent, celui de Tailwind (`rounded-lg`, 0,5 rem à 85 %). */
function arrondi(jetons: Record<string, string>): number {
    const m = /^([\d.]+)px$/.exec(jetons['radius-md']?.trim() ?? '');
    return m ? Number(m[1]) : 6.8;
}

/** Les traits sur lesquels deux paquets de jetons diffèrent. */
export function traitsDistincts(a: Record<string, string>, b: Record<string, string>): Trait[] {
    const distincts: Trait[] = [];
    if (couleursDifferent(a.bg, b.bg)) distincts.push('fond');
    if (couleursDifferent(a.surface, b.surface)) distincts.push('surface');
    if (couleursDifferent(a.text, b.text)) distincts.push('texte');
    if (couleursDifferent(a.accent, b.accent)) distincts.push('accent');
    // § 4.8 : absent, le cadre vaut le fond.
    if (couleursDifferent(a['frame-bg'] ?? a.bg, b['frame-bg'] ?? b.bg)) distincts.push('fond du cadre');
    if (Math.abs(arrondi(a) - arrondi(b)) >= SEUIL_D_ARRONDI) distincts.push('arrondi des cartes');
    const pa = premiereFamille(a['font-display'])?.toLowerCase();
    const pb = premiereFamille(b['font-display'])?.toLowerCase();
    if (pa !== pb) distincts.push('police de titre');
    return distincts;
}
