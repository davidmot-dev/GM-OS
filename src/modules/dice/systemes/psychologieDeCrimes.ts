import { resoudreLaGarde, type JetGarde } from './potentielGarde';

/**
 * **La psychologie de Crimes** — C4 (2026-10-23), livre p. 409-418.
 *
 * Tout ici est pur : la carte « Psychologie » du panneau lit la fiche, propose,
 * et n'écrit que ce que le meneur confirme.
 */

/** Ce qu'un jet gardé fait à la Névrose (p. 409) : +1 sur un échec, +1 si des réussites n'ont pas été gardées, −1 sur un succès important. */
export function nevroseDuJet(g: JetGarde['garde']): number {
    return (g.bilan === 'echec' || g.bilan === 'echec-critique' ? 1 : 0)
        + (g.reussitesNonGardees > 0 ? 1 : 0)
        - (g.succesImportant ? 1 : 0);
}

/**
 * **Le test psychotique** (p. 410) : Potentiel mental GARDE X contre un seuil
 * de psychose + angoisse. X va de 1 (la mort d'un proche, une créature qui
 * vous tient à sa merci) à 3 (la mort d'un inconnu, un danger indistinct). Pas
 * de dépassement ; **une seule réussite** permet de garder son calme. Un échec :
 * un état de folie selon l'inclinaison, et un point de psychose.
 */
export interface TestPsychotique {
    jet: JetGarde;
    seuil: number;
    garde: number;
    calme: boolean;
}

export function seuilPsychotique(psychose: number, angoisse: number): number {
    return Math.min(10, Math.max(2, Math.max(0, psychose) + Math.max(0, angoisse)));
}

export function resoudreLeTestPsychotique(des: readonly number[], intensite: 1 | 2 | 3, psychose: number, angoisse: number): TestPsychotique {
    const seuil = seuilPsychotique(psychose, angoisse);
    const jet = resoudreLaGarde(des, intensite, seuil);
    // Une réussite gardée suffit, tant que les 1 ne l'emportent pas (échec critique).
    const calme = jet.garde.reussites >= 1 && jet.garde.bilan !== 'echec-critique';
    return { jet, seuil, garde: intensite, calme };
}

/**
 * **L'Innocence** (règle optionnelle, p. 415) : un seuil et un score. Agir en
 * adulte baisse le seuil (le score suit s'il était égal) et fait gagner un point
 * à un Potentiel au choix ; agir en enfant monte le seuil (le score ne suit pas
 * s'il était égal) et en fait perdre un.
 */
export function agirEnAdulte(score: number, seuil: number): { score: number; seuil: number; potentiel: string } {
    const nouveauSeuil = Math.max(0, seuil - 1);
    return {
        seuil: nouveauSeuil,
        score: score >= seuil ? nouveauSeuil : Math.min(score, nouveauSeuil),
        potentiel: 'Un Potentiel au choix gagne un point, tout de suite ou en fin de séance (au plus 5).',
    };
}

export function agirEnEnfant(score: number, seuil: number): { score: number; seuil: number; potentiel?: string } {
    const nouveauSeuil = Math.min(10, seuil + 1);
    return {
        seuil: nouveauSeuil,
        score,
        ...(score >= seuil ? { potentiel: 'Le score n’a pas suivi : un Potentiel au choix perd un point (au moins 1).' } : {}),
    };
}
