import { rangParId } from './archetypes';

/**
 * **Combien d'exemplaires fabriquer, et qui décide.**
 *
 * *Défaut trouvé par David le 2026-09-03, capture d'écran à l'appui : il demande
 * UN tireur, il en reçoit DEUX — « Tireur (Aguerri) 1 » et « Tireur (Aguerri)
 * 2 ».*
 *
 * ⛔ **La cause était une commodité qui se prend pour une décision.** Chaque rang
 * porte un nombre suggéré — quatre piétailles, un boss —, et le sélecteur de
 * rang le posait **dans le champ, à chaque changement** :
 *
 * ```
 * onChange={e => { setRangId(e.target.value); setNombre(rangParId(...).nombreSuggere); }}
 * ```
 *
 * Poser 1 puis choisir « Aguerri » remettait donc 2, en silence. La brute de la
 * même capture est seule parce que l'ordre inverse — rang d'abord, nombre
 * ensuite — donnait le bon résultat : *un défaut qui dépend de l'ordre des
 * gestes est invisible une fois sur deux, et c'est ce qui le rend coûteux.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE : SUGGÉRER TANT QUE PERSONNE N'A TRANCHÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le nombre suit le rang **jusqu'à ce que le meneur y touche**. Après quoi il
 * lui appartient, et aucun réglage ne le reprend. La suggestion reste visible à
 * côté du champ, et un clic la réapplique — *on n'enlève pas la commodité, on
 * lui retire le droit de décider.*
 *
 * C'est exactement la règle déjà tenue ailleurs dans ce projet : l'atelier
 * propose la répartition des champs, le meneur la corrige, et sa correction est
 * retenue.
 */

export interface EtatDuNombre {
    /** Ce qu'affiche le champ. */
    nombre: number;
    /** Le meneur l'a-t-il saisi lui-même ? */
    choisiParLeMeneur: boolean;
}

/** Les bornes du champ : au moins un adversaire, et pas une horde ingérable. */
export const NOMBRE_MIN = 1;
export const NOMBRE_MAX = 20;

/** Ce que devient le nombre quand le rang change. */
export function nombreApresChangementDeRang(etat: EtatDuNombre, rangId: string): EtatDuNombre {
    if (etat.choisiParLeMeneur) return etat;
    return { nombre: rangParId(rangId).nombreSuggere, choisiParLeMeneur: false };
}

/** Ce que devient le nombre quand le meneur le saisit : il devient le sien. */
export function nombreSaisi(valeur: number): EtatDuNombre {
    const borne = Number.isFinite(valeur) ? Math.round(valeur) : NOMBRE_MIN;
    return {
        nombre: Math.max(NOMBRE_MIN, Math.min(NOMBRE_MAX, borne)),
        choisiParLeMeneur: true,
    };
}

/** Réapplique la suggestion du rang — un geste explicite, donc il l'emporte. */
export function reprendreLaSuggestion(rangId: string): EtatDuNombre {
    return { nombre: rangParId(rangId).nombreSuggere, choisiParLeMeneur: false };
}
