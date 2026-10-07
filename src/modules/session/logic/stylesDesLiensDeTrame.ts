import type { CSSProperties } from 'react';
import type { StyleDeLienDeTrame } from '../../../types/campaign.types';

export const JONCTIONS_DES_LIENS = {
    haut: { nom: 'Haut', accroche: 'haut' }, bas: { nom: 'Bas', accroche: 'bas' },
    gauche: { nom: 'Gauche', accroche: 'entree' }, droite: { nom: 'Droite', accroche: 'sortie' },
} as const;

export function coteDeLAccroche(accroche: string | null | undefined): StyleDeLienDeTrame['depart'] {
    return (Object.keys(JONCTIONS_DES_LIENS) as (keyof typeof JONCTIONS_DES_LIENS)[])
        .find(cote => JONCTIONS_DES_LIENS[cote].accroche === accroche);
}

export const COULEURS_DES_LIENS = {
    accent: { nom: 'Accent', valeur: 'var(--app-accent)' },
    texte: { nom: 'Texte', valeur: 'var(--app-text)' },
    succes: { nom: 'Succès', valeur: 'var(--etat-succes)' },
    alerte: { nom: 'Alerte', valeur: 'var(--etat-alerte)' },
    info: { nom: 'Information', valeur: 'var(--etat-info)' },
} as const;
export const EPAISSEURS_DES_LIENS = {
    fin: { nom: 'Fin', valeur: 1 }, normal: { nom: 'Normal', valeur: 2.5 },
    gras: { nom: 'Gras', valeur: 4 }, 'tres-gras': { nom: 'Très gras', valeur: 6 },
} as const;

/** Les campagnes importées peuvent contenir des valeurs inconnues : jamais de CSS arbitraire. */
export function normaliserLeStyleDeLien(brut: unknown): StyleDeLienDeTrame | undefined {
    if (!brut || typeof brut !== 'object') return undefined;
    const b = brut as Record<string, unknown>, style: StyleDeLienDeTrame = {};
    for (const cle of ['depart', 'arrivee'] as const)
        if (typeof b[cle] === 'string' && Object.hasOwn(JONCTIONS_DES_LIENS, b[cle]))
            style[cle] = b[cle] as StyleDeLienDeTrame['depart'];
    if (b.trace === 'continu' || b.trace === 'tirets' || b.trace === 'points') style.trace = b.trace;
    if (typeof b.epaisseur === 'string' && Object.hasOwn(EPAISSEURS_DES_LIENS, b.epaisseur))
        style.epaisseur = b.epaisseur as StyleDeLienDeTrame['epaisseur'];
    if (typeof b.couleur === 'string') {
        if (Object.hasOwn(COULEURS_DES_LIENS, b.couleur)) style.couleur = b.couleur as StyleDeLienDeTrame['couleur'];
        else if (/^#[\da-f]{6}$/i.test(b.couleur)) style.couleur = b.couleur.toLowerCase() as `#${string}`;
        else if (/^#[\da-f]{3}$/i.test(b.couleur))
            style.couleur = ('#' + [...b.couleur.slice(1)].map(c => c + c).join('').toLowerCase()) as `#${string}`;
    }
    return Object.keys(style).length ? style : undefined;
}

export function apparenceDuLien(style: StyleDeLienDeTrame | undefined, defaut: CSSProperties): CSSProperties {
    const valide = normaliserLeStyleDeLien(style);
    if (!valide || (!valide.trace && !valide.epaisseur && !valide.couleur)) return defaut;
    const couleur = valide.couleur;
    return { ...defaut, opacity: 1,
        stroke: couleur ? (couleur.startsWith('#') ? couleur : COULEURS_DES_LIENS[couleur as keyof typeof COULEURS_DES_LIENS].valeur) : defaut.stroke,
        strokeWidth: valide.epaisseur ? EPAISSEURS_DES_LIENS[valide.epaisseur].valeur : defaut.strokeWidth,
        strokeDasharray: valide.trace === 'tirets' ? '10 6' : valide.trace === 'points' ? '1 6' : undefined,
        strokeLinecap: valide.trace === 'points' ? 'round' : 'butt',
    };
}
