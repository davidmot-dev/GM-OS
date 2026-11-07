import type { CSSProperties } from 'react';

/**
 * **La grille défilante du bestiaire et du catalogue** — 07/11/2026, David sur Barbarians of
 * Lemuria : « c'est pas mieux ». Faire tenir treize colonnes dans la largeur de la section les
 * rendait illisibles (« A… », titres empilés) ; la coupure par syllabe, elle, n'existe pas sous
 * Windows (Chromium n'y a pas de dictionnaire de césure). Choix de David : **défiler**.
 *
 * Chaque colonne a une **largeur fixe** — un nombre étroit, un texte large, jamais moins que son
 * plus long mot de titre —, la même pour l'en-tête et pour chaque ligne : les lignes sont des grilles
 * séparées, et une largeur tirée du contenu (`max-content`, `auto`) les désalignait. Le nom reste
 * figé à gauche ; la fiche dépliée garde la largeur visible (`100cqw`, le défileur étant un conteneur).
 */
export interface ColonneAffichee {
    libelle: string;
    nature?: 'nombre' | 'texte';
}

/** Rem par lettre d'un titre en petites capitales espacées, et la marge autour. */
const REM_PAR_LETTRE = 0.62;
const MARGE_DU_TITRE = 1.2;

export function largeurDeColonne(c: ColonneAffichee): number {
    const plusLongMot = Math.max(1, ...c.libelle.split(/\s+/).map(m => m.length));
    const titre = plusLongMot * REM_PAR_LETTRE + MARGE_DU_TITRE;
    const base = c.nature === 'texte' ? 12 : 4;
    return Math.round(Math.max(base, titre) * 10) / 10;
}

/** Le modèle de colonnes : le nom (au moins 14 rem, le reste de la place), les colonnes, puis la fin. */
export function grilleDefilante(colonnes: readonly ColonneAffichee[], fin: readonly string[]): CSSProperties {
    return { gridTemplateColumns: ['minmax(14rem, 1fr)', ...colonnes.map(c => `${largeurDeColonne(c)}rem`), ...fin].join(' ') };
}

/**
 * Les classes des trois étages. Le défileur est un conteneur (`container-type: inline-size`) pour
 * que la fiche dépliée mesure `100cqw` ; la largeur intérieure est celle de la ligne la plus longue,
 * jamais moins que la section ; la cellule du nom colle à gauche, sur un fond plein.
 */
export const DEFILEUR = 'overflow-x-auto [container-type:inline-size]';
export const INTERIEUR = 'w-max min-w-full';
export const NOM_FIGE = 'sticky left-0 z-10 bg-app-bg';
export const DEPLIE_VISIBLE = 'sticky left-0 w-[100cqw] max-w-full';
