import type { GameDriver } from '../../../types/drivers';
import type { DamageImpact } from '../../../types/entity.types';
import { EFFETS_DES_ETATS, encaisserCoc } from '../../dice/systemes/coc';
import { valeurDuChamp } from './SanteDuCombattant';

/**
 * **L'échelle de santé de COC à la porte des dégâts** — 31/10/2026, à la demande de David
 * (« finir le pilote », livre de règles de la 2e édition, pages imprimées).
 *
 * Les DM noircissent les échelons (p. 71) : les cases de santé (`combat.casesDeSante`) le
 * font déjà. Ce que le livre ajoute, et qu'elles ne savent pas : la **RD** de la protection
 * se retire de chaque coup (p. 88) — sauf pour un dégât qui ne passe pas par elle (chute,
 * feu, poison) —, plus de **20 + CON** DM en une fois tuent sur le coup, un nouveau coup sur
 * un **mourant** demande un test de CON 20 (p. 73), et chaque état franchi a ses effets
 * (p. 72), que le journal dit au meneur. Le soin passe tel quel.
 */
export type RegleDEncaissement = NonNullable<GameDriver['combat']['encaissement']>;

export function encaissementSelonLeJeu(
    regle: RegleDEncaissement | undefined,
    fiche: Record<string, unknown> | undefined,
    impact: DamageImpact,
): { impact: DamageImpact; fiche: Record<string, number>; texte: string } | null {
    if (!regle || regle.mecanique !== 'coc' || impact.isRecovery) return null;
    const nombre = regle.nombre ?? 20;
    const sansProtection = /sans protection|chute|feu|poison|maladie/i.test(impact.type ?? '');
    const rd = !sansProtection && regle.rd ? Math.max(0, Math.trunc(valeurDuChamp(fiche, regle.rd) ?? 0)) : 0;
    const avant = Math.max(0, Math.min(nombre, Math.trunc(valeurDuChamp(fiche, regle.sante) ?? 0)));
    const constitution = regle.constitution ? Math.trunc(valeurDuChamp(fiche, regle.constitution) ?? 0) : 0;
    const e = encaisserCoc(impact.value, rd, avant, constitution, nombre);
    const morceaux = [
        `${e.subis} DM${rd ? ` (${impact.value} − RD ${rd})` : ''} : échelle de santé ${avant} → ${e.apres}`,
        ...(e.mortInstantanee ? [`plus de 20 + CON (${20 + constitution}) en une fois : tué sur le coup (p. 73)`] : []),
        ...(!e.mortInstantanee && e.coupDeGrace ? ['déjà mourant : test de CON difficulté 20, ou la mort (coup de grâce, p. 73)'] : []),
        ...(!e.mortInstantanee ? e.franchis.map(etat => `${etat.label} — ${EFFETS_DES_ETATS[etat.label]}`) : []),
    ];
    return {
        // Les cases avancent de ce qui a passé la protection ; la mort instantanée les noircit toutes.
        impact: { ...impact, value: e.apres - avant },
        fiche: {},
        texte: `${morceaux.join(' ; ')}.`,
    };
}
