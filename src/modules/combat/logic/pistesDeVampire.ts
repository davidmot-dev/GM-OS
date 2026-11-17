import type { DamageImpact } from '../../../types/entity.types';
import {
    capaciteLueSurLaFiche, casesSansAggrave, direLEncaissement, ecrireLesMarques, encaisserVampire, lireLesMarques, soignerVampire,
    type NatureDuDegat, type PisteDeVampire,
} from '../../dice/systemes/degatsDeVampire';
import type { RegleDeVampire } from '../../dice/systemes/vampire';
import { maximumDeLaJauge, valeurDuChamp } from './SanteDuCombattant';

/**
 * **Les dégâts de Vampire à la porte des dégâts** — 17/11/2026, à la demande de David
 * (« commence les améliorations pour Vampire »), livre de base p. 126-127.
 *
 * Même porte que Degenesis (`pistesDeDegenesis.ts`) : le panneau de santé et le pupitre du
 * combat passent par `handleApplyImpact`, qui demande ici ce que le coup fait. Le **type**
 * du coup dit la jauge et la nature, avec les mots que le pilote déclare (`damageTypes`) :
 * « Volonté » vise la Volonté, sinon la Santé ; « aggravé » note des « X », sinon des « / » ;
 * « non divisés » note les superficiels sans les diviser par deux (p. 126). Un soin efface
 * des marques de la nature choisie.
 *
 * La Santé principale est la jauge des cases **sans « X »** (`degatsDeVampire.ts`) : elle se
 * recalcule sur les marques à chaque coup, et la porte lui applique la différence — l'écrire
 * ici aussi la compterait deux fois. Un coup à la Volonté ne touche pas la Santé : il écrit la
 * Volonté restante lui-même, et l'impact qui part vers la santé vaut zéro.
 */
type StatsLues = readonly { fieldId: string; max?: string; isMainHP?: boolean }[] | undefined;

export interface DegatDeVampire { jauge: 'sante' | 'volonte'; nature: NatureDuDegat; diviser: boolean }

/** Ce que le type du coup demande. Un type inconnu (« physical ») est un coup superficiel à la Santé. */
export function lireLeTypeDeVampire(type: string | undefined): DegatDeVampire {
    const t = (type ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return {
        jauge: /volont/.test(t) ? 'volonte' : 'sante',
        nature: /aggrav/.test(t) ? 'aggrave' : 'superficiel',
        diviser: !/non divis/.test(t),
    };
}

/** Les types que le pilote 2.1.0 déclare (`combat.damageTypes`), dans l'ordre du panneau. */
export const TYPES_DE_DEGATS_DE_VAMPIRE = [
    'Superficiels', 'Aggravés', 'Superficiels non divisés', 'Volonté — superficiels', 'Volonté — aggravés',
] as const;

const marquesDe = (fiche: Record<string, unknown> | undefined, champ: string): PisteDeVampire => lireLesMarques(fiche?.[champ]);

export function degatsDeVampireSelonLeJeu(
    pilote: { jet?: { vampire?: RegleDeVampire } } | null | undefined,
    fiche: Record<string, unknown> | undefined,
    impact: DamageImpact,
    stats: StatsLues,
): { impact: DamageImpact; fiche: Record<string, unknown>; texte: string } | null {
    const regle = pilote?.jet?.vampire;
    const degats = regle?.degats;
    if (!regle || !degats) return null;
    const lu = lireLeTypeDeVampire(impact.type);
    const champDesMarques = lu.jauge === 'volonte' ? degats.volonte : degats.sante;
    const champDeLaJauge = lu.jauge === 'volonte' ? regle.volonte : degats.jaugeDeSante;
    if (!champDeLaJauge) return null;
    /*
      La capacité : le maximum du pilote (Vigueur + 3). Une créature du livre n'a souvent pas de
      Vigueur (« Physique 4, Santé 6 », p. 371) : on la lit alors sur la fiche, cases sans « X » plus
      « X » — la même lecture que le panneau de jet (17/11/2026, bestiaire relu).
    */
    const portee = valeurDuChamp(fiche, champDeLaJauge);
    const capacite = maximumDeLaJauge(champDeLaJauge, stats, fiche)
        ?? (portee === undefined ? null : capaciteLueSurLaFiche(fiche?.[champDesMarques], portee));
    // Sans capacité lisible, on ne sait pas quand la jauge est pleine : le coup suit la jauge seule.
    if (capacite === null || capacite <= 0) return null;

    const avant = marquesDe(fiche, champDesMarques);
    const nomDeLaJauge = lu.jauge === 'volonte' ? 'Volonté' : 'Santé';
    let piste: PisteDeVampire, texte: string;
    if (impact.isRecovery) {
        const soin = soignerVampire(avant, impact.value, lu.nature);
        piste = soin.piste;
        const mot = lu.nature === 'aggrave' ? '« X »' : '« / »';
        texte = `${nomDeLaJauge} : ${soin.rendus} ${mot} effacé${soin.rendus > 1 ? 's' : ''} — ${ecrireLesMarques(piste) || 'aucune marque'}.`;
    } else {
        const e = encaisserVampire(avant, capacite, impact.value, lu.nature, { diviser: lu.diviser });
        piste = e.piste;
        texte = direLEncaissement(nomDeLaJauge, impact.value, lu.nature, e, { diviser: lu.diviser });
    }
    const restante = casesSansAggrave(piste, capacite);
    const marques = { [champDesMarques]: ecrireLesMarques(piste) };

    if (lu.jauge === 'volonte') {
        return { impact: { ...impact, value: 0 }, fiche: { ...marques, [champDeLaJauge]: restante }, texte };
    }
    // La Santé : la jauge rejoint les marques, la porte applique la différence.
    const santeAvant = valeurDuChamp(fiche, champDeLaJauge) ?? casesSansAggrave(avant, capacite);
    return {
        impact: { ...impact, value: Math.abs(santeAvant - restante), isRecovery: restante > santeAvant },
        fiche: marques,
        texte,
    };
}

