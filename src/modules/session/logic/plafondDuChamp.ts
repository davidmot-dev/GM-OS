import type { SheetField } from '../../../data/defaultSheetTemplates';

/**
 * **Le plafond d'un champ, lu sur un autre** (`SheetField.maxSur`) — Nephilim,
 * 2026-10-18 : la Stase ne dépasse pas le Ka dominant, dont le degré se calcule
 * (une formule sur le choix « Ka dominant » et les cinq Ka du Pentacle).
 *
 * `undefined` quand il n'y a pas de plafond, ou qu'il ne se lit pas : un champ
 * visé absent, une formule en erreur, un nombre illisible — **ou un plafond nul**,
 * qui dit un champ visé pas encore rempli (le Ka dominant pas choisi). *Mieux
 * vaut ne pas borner que borner à zéro* — une Stase bloquée à 0 par une fiche
 * incomplète serait une perte silencieuse (vu par David le 2026-10-18).
 */
export function plafondDuChamp(
    field: Pick<SheetField, 'maxSur'>,
    champs: readonly Pick<SheetField, 'id' | 'type' | 'formula'>[],
    lire: (id: string) => unknown,
    evaluer: (formule: string) => unknown,
): number | undefined {
    if (!field.maxSur) return undefined;
    const vise = champs.find(c => c.id === field.maxSur);
    if (!vise) return undefined;
    const brut = vise.type === 'formula' ? evaluer(vise.formula ?? '') : lire(vise.id);
    if (brut === '' || brut === null || brut === undefined) return undefined;
    const n = Number(brut);
    return Number.isFinite(n) && n > 0 ? n : undefined;
}
