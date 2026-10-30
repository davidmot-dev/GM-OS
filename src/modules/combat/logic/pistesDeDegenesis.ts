import type { GameDriver } from '../../../types/drivers';
import type { DamageImpact } from '../../../types/entity.types';
import { encaisserDegenesis, soignerDegenesis } from '../../dice/systemes/degenesis';
import { maximumDeLaJauge, valeurDuChamp } from './SanteDuCombattant';

/**
 * **La santé de Degenesis à la porte des dégâts** — 30/10/2026, à la demande de David
 * (« finir le pilote », livre Katharsys, pages imprimées).
 *
 * Deux pistes et non une jauge (p. 94, 107) : les dégâts, armure déjà retirée, cochent
 * les **Blessures superficielles** jusqu'à `(PHY+Résistance)×2`, puis le reste devient
 * des **Traumatismes** jusqu'à `PHY+PSY` — chacun −1D, et à leur maximum le personnage
 * ne peut plus être sauvé. La santé principale du pilote est ce qui reste sur les deux
 * pistes : elle perd exactement ce qu'elles retiennent, et atteint zéro avec la mort.
 * Elle se **recalcule** sur les pistes à chaque coup : la fiche HTML ne porte que les
 * pistes, et une piste corrigée à la main ne doit pas laisser la jauge mentir.
 * Une attaque **mentale** ne touche pas la chair : elle retire ses dégâts à l'Égo
 * (p. 107) ; à zéro, le personnage s'effondre.
 */
export type RegleDesPistesDeSante = NonNullable<GameDriver['combat']['pistesDeSante']>;

type StatsLues = readonly { fieldId: string; max?: string; isMainHP?: boolean }[] | undefined;

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

export function pistesDeSanteSelonLeJeu(
    regle: RegleDesPistesDeSante | undefined,
    fiche: Record<string, unknown> | undefined,
    impact: DamageImpact,
    stats: StatsLues,
): { impact: DamageImpact; fiche: Record<string, number>; texte: string } | null {
    if (!regle || regle.mecanique !== 'degenesis') return null;
    const valeur = (champ: string) => Math.max(0, Math.trunc(valeurDuChamp(fiche, champ) ?? 0));

    if (regle.ego && /mental/i.test(impact.type ?? '')) {
        const avant = valeur(regle.ego);
        const max = maximumDeLaJauge(regle.ego, stats, fiche);
        const apres = impact.isRecovery ? Math.min(max ?? Infinity, avant + impact.value) : Math.max(0, avant - impact.value);
        return {
            impact: { ...impact, value: 0 },
            fiche: { [regle.ego]: apres },
            texte: `Attaque mentale : Égo ${avant} → ${apres}`
                + (apres === 0 && !impact.isRecovery ? " — il s'effondre ; à la fin du prochain round, PSY+Foi ou Volonté (2) le relève à 1 point d'Égo, une seule fois (p. 107)." : '.'),
        };
    }

    const blessures = valeur(regle.blessures), traumatismes = valeur(regle.traumatismes);
    const maxB = maximumDeLaJauge(regle.blessures, stats, fiche);
    const maxT = maximumDeLaJauge(regle.traumatismes, stats, fiche);
    // Sans maximum lisible, on ne devine pas où passe la frontière : l'impact suit la jauge seule.
    if (maxB === null || maxT === null) return null;
    const principale = stats?.find(s => s.isMainHP)?.fieldId;
    const restante = (b: number, t: number) => Math.max(0, maxB - b) + Math.max(0, maxT - t);
    const avant = principale !== undefined && valeurDuChamp(fiche, principale) !== undefined ? valeur(principale) : restante(blessures, traumatismes);
    /**
     * La jauge rejoint les pistes : la différence part en dégâts, ou en soin si la jauge
     * était en retard. Elle ne s'écrit pas ici : la porte applique l'impact à la santé
     * principale que porte la fiche, et l'écrire deux fois la compterait deux fois.
     */
    const vers = (b: number, t: number): { impact: DamageImpact; fiche: Record<string, number> } => {
        const apres = restante(b, t);
        return {
            impact: { ...impact, value: Math.abs(avant - apres), isRecovery: apres > avant },
            fiche: { [regle.blessures]: b, [regle.traumatismes]: t },
        };
    };

    if (impact.isRecovery) {
        const soin = soignerDegenesis(impact.value, blessures);
        return {
            ...vers(soin.blessures, traumatismes),
            texte: `${pluriel(soin.rendus, 'Blessure superficielle')} effacée${soin.rendus > 1 ? 's' : ''} ; les Traumatismes se soignent à part.`,
        };
    }

    const s = encaisserDegenesis(impact.value, { blessures, traumatismes }, { blessures: maxB, traumatismes: maxT });
    const nouveaux = s.traumatismes - traumatismes;
    return {
        ...vers(s.blessures, s.traumatismes),
        texte: `${pluriel(impact.value, 'dégât')} : Blessures superficielles ${s.blessures}/${maxB}`
            + (nouveaux > 0 ? `, ${pluriel(nouveaux, 'Traumatisme')} de plus (${s.traumatismes}/${maxT}, −${s.traumatismes}D)` : '')
            + (s.mort ? ' — Traumatismes au maximum : il ne peut plus être sauvé (p. 107).' : '.'),
    };
}
