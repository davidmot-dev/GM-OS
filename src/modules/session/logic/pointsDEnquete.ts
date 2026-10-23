import type { Clue } from '../../../types/chronicle.types';
import type { StyleDEnquete } from '../../../types/drivers';
import type { BilanDeLaGarde } from '../../dice/systemes/potentielGarde';

/**
 * **Les points d'enquête** — Crimes, C5 (2026-10-22), livre p. 436–440.
 *
 * Chaque enquêteur a cinq styles (Condé, Limier, Illuminé, Mentaliste,
 * Fouineur). Une routine de son style qui fait **réellement** avancer l'affaire
 * lui rapporte des points — le meneur en juge, l'outil propose le compte. Les
 * points s'accumulent : un indice s'obtient « à partir d'un certain total »,
 * dans l'un des styles qu'il cite. Ils ne se dépensent pas.
 *
 * Tout ici est pur : l'écran lit la fiche et l'indice, et écrit ce qu'on lui rend.
 */

/** Un enquêteur, vu par le dossier : son nom et sa fiche. */
export interface Enqueteur { id: string; nom: string; fiche: Record<string, unknown> }

const nombre = (v: unknown) => Math.max(0, Number(v) || 0);

/** Le niveau d'un style sur la fiche : 0 à 3. */
export function niveauDuStyle(fiche: Record<string, unknown>, style: StyleDEnquete): number {
    return nombre(fiche[style.niveau]);
}

/** Les points de l'affaire en cours dans ce style. */
export function pointsDuStyle(fiche: Record<string, unknown>, style: StyleDEnquete): number {
    return nombre(fiche[style.points]);
}

/** « Il ne pourra gagner un point que dans le style d'enquête qu'il possède » (p. 437). */
export function peutGagner(fiche: Record<string, unknown>, style: StyleDEnquete): boolean {
    return niveauDuStyle(fiche, style) > 0;
}

/**
 * Ce qu'un test rapporte, en règle générale (p. 436) : 1 point pour un succès,
 * 2 pour un succès à deux réussites, −1 pour un échec critique, rien sur un
 * échec. « Une action particulièrement difficile » vaut aussi 2 : au meneur.
 */
export function pointsDuJet(bilan: BilanDeLaGarde, reussites: number): number {
    if (bilan === 'echec-critique') return -1;
    if (bilan === 'echec') return 0;
    return reussites >= 2 ? 2 : 1;
}

/** Les points après un gain ou une perte : jamais sous zéro. */
export function apresLeGain(fiche: Record<string, unknown>, style: StyleDEnquete, delta: number): number {
    return Math.max(0, pointsDuStyle(fiche, style) + delta);
}

/** Un indice à portée : qui l'atteint, et par quel seuil. */
export interface IndiceAPortee {
    indice: Clue;
    enqueteur: Enqueteur;
    seuil: { style: StyleDEnquete; points: number; atteints: number };
}

/**
 * **Les indices que quelqu'un peut obtenir** : pas encore révélés à la table,
 * pas encore connus de lui, et dont il atteint l'un des seuils (p. 440). Un
 * indice sans seuil — évident — n'y figure pas : il se révèle comme avant.
 */
export function indicesAPortee(indices: Clue[], enqueteurs: Enqueteur[], styles: StyleDEnquete[]): IndiceAPortee[] {
    const parId = new Map(styles.map(s => [s.id, s]));
    const portee: IndiceAPortee[] = [];
    for (const indice of indices) {
        if (indice.isRevealed || !indice.seuilsDEnquete?.length) continue;
        for (const enqueteur of enqueteurs) {
            if (indice.connuDe?.includes(enqueteur.id)) continue;
            const atteint = indice.seuilsDEnquete
                .map(s => ({ style: parId.get(s.style), points: s.points }))
                .filter((s): s is { style: StyleDEnquete; points: number } => !!s.style)
                .map(s => ({ ...s, atteints: pointsDuStyle(enqueteur.fiche, s.style) }))
                .find(s => s.atteints >= s.points);
            if (atteint) portee.push({ indice, enqueteur, seuil: atteint });
        }
    }
    return portee;
}

/**
 * **Révéler un indice à un seul enquêteur** : il le connaît, et l'origine est
 * notée — elle reste quand on le partage ensuite à la table. Les gains de
 * l'indice vont à lui, dans les styles qu'il possède ; les autres se disent.
 */
export function revelerA(
    indice: Clue, enqueteur: Enqueteur, styles: StyleDEnquete[], style?: string, quand = Date.now(),
): { indice: Partial<Clue>; ecrits: Record<string, number>; dits: string[] } {
    const ecrits: Record<string, number> = {};
    const dits: string[] = [];
    for (const gain of indice.gainsDEnquete ?? []) {
        const s = styles.find(x => x.id === gain.style);
        if (!s || gain.points === 0) continue;
        if (!peutGagner(enqueteur.fiche, s)) {
            dits.push(`${s.label} : ${enqueteur.nom} ne possède pas ce style, il n'y gagne rien.`);
            continue;
        }
        ecrits[s.points] = apresLeGain({ ...enqueteur.fiche, ...ecrits }, s, gain.points);
        dits.push(`${s.label} ${gain.points > 0 ? '+' : ''}${gain.points} → ${ecrits[s.points]}`);
    }
    return {
        indice: {
            connuDe: [...new Set([...(indice.connuDe ?? []), enqueteur.id])],
            trouvePar: indice.trouvePar ?? { personnageId: enqueteur.id, nom: enqueteur.nom, ...(style ? { style } : {}), quand },
        },
        ecrits,
        dits,
    };
}

/** « Nouvelle affaire » : les points de chaque style reviennent au niveau du style. */
export function nouvelleAffaire(fiche: Record<string, unknown>, styles: StyleDEnquete[]): Record<string, number> {
    return Object.fromEntries(styles.map(s => [s.points, niveauDuStyle(fiche, s)]));
}

export { indicesPourLeLecteur } from './indicesDuLecteur';
