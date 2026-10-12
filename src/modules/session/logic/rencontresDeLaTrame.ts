import type { RencontrePreparee } from '../../../types/rencontres.types';

/**
 * **Ce que deviennent les rencontres quand la trame bouge** (2026-10-12).
 *
 * Elles vivent à part des scènes (une rencontre peut n'en avoir aucune) : les
 * gestes qui suppriment, clonent ou fusionnent une scène doivent donc les
 * prévenir. *Une collection séparée doit apprendre à chaque geste qu'elle
 * existe* — c'est le prix de la décision, payé ici en une fois.
 */

/**
 * ⛔ **Une scène disparue rend ses rencontres LIBRES, jamais effacées** : une
 * rencontre préparée est du travail du meneur, et elle reste invocable ailleurs.
 */
export function rencontresSansLesScenes(
    rencontres: readonly RencontrePreparee[] | undefined,
    disparues: ReadonlySet<string>,
): RencontrePreparee[] {
    return (rencontres ?? []).map((r) => {
        if (!r.sceneId || !disparues.has(r.sceneId)) return r;
        const { sceneId: _oubliee, ...libre } = r;
        return libre;
    });
}

/** La fusion : les rencontres de l'absorbée passent à la scène qui reste. */
export function rencontresReportees(
    rencontres: readonly RencontrePreparee[] | undefined,
    deSceneId: string,
    versSceneId: string,
): RencontrePreparee[] {
    return (rencontres ?? []).map((r) => (r.sceneId === deSceneId ? { ...r, sceneId: versSceneId } : r));
}

/**
 * Le clone : les rencontres de la scène sont **recopiées**, avec de nouveaux
 * identifiants, et rattachées au clone. Une scène clonée l'est pour être
 * rejouée — sans ses rencontres, elle le serait à moitié.
 */
export function rencontresDuClone(
    rencontres: readonly RencontrePreparee[] | undefined,
    sourceId: string,
    cloneId: string,
    quand: number,
): RencontrePreparee[] {
    return (rencontres ?? [])
        .filter((r) => r.sceneId === sourceId)
        .map((r, i) => ({
            ...r,
            id: `rencontre-${quand}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            sceneId: cloneId,
            lignes: r.lignes.map((l) => ({ ...l })),
            creeeLe: quand,
        }));
}
