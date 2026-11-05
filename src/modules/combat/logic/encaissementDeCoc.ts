import type { GameDriver } from '../../../types/drivers';
import type { DamageImpact } from '../../../types/entity.types';
import { EFFETS_DES_ETATS, encaisserCoc } from '../../dice/systemes/coc';
import { valeurDuChamp } from './SanteDuCombattant';
import { lireProfilCoc, tailleSanteCoc, etatsDuProfilCoc } from '../../dice/systemes/profilsDeCoc';
import { CLE_SUIVI_COC, lireSuiviCoc, signalerBlessureCoc } from '../../dice/systemes/suiviDeCoc';
import { CLE_AVANTAGES_COC, avancerAvantagesCoc, bonusAvantageCoc } from '../../dice/systemes/avantagesDeCoc';

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
): { impact: DamageImpact; fiche: Record<string, unknown>; texte: string } | null {
    if (!regle || regle.mecanique !== 'coc' || impact.isRecovery) return null;
    const f = fiche ?? {}, profil = lireProfilCoc(f), suivi = lireSuiviCoc(f);
    const nombre = profil ? tailleSanteCoc(profil) : regle.nombre ?? 20;
    if (impact.coc?.id && suivi.recus.includes(impact.coc.id)) return { impact: { ...impact, value: 0 }, fiche: {}, texte: 'Coup déjà appliqué.' };
    const sansProtection = /sans protection|chute|feu|poison|maladie/i.test(impact.type ?? '');
    const rd = !sansProtection && regle.rd ? Math.max(0, Math.trunc(valeurDuChamp(fiche, regle.rd) ?? 0)) : 0;
    const avant = Math.max(0, Math.min(nombre, Math.trunc(valeurDuChamp(fiche, regle.sante) ?? 0)));
    const constitution = regle.constitution ? Math.trunc(valeurDuChamp(fiche, regle.constitution) ?? 0) : 0;
    if (profil?.bande) {
        const ajoute = impact.coc?.touche && avant < nombre ? 1 : 0;
        return { impact: { ...impact, value: ajoute }, fiche: impact.coc?.id ? { [CLE_SUIVI_COC]: { ...suivi, recus: [...suivi.recus, impact.coc.id] } } : {},
            texte: ajoute ? `Touche confirmée : 1 sbire retiré ; ${nombre - avant - 1} membres restants, sans jet de DM (p. 92).` : 'Bande : confirmer une touche, sans jet de DM.' };
    }
    const heros = regle.heroisme ? bonusAvantageCoc(f, 'dm-subis') : 0;
    const e = encaisserCoc(Math.max(0, impact.value - heros), rd, avant, constitution, nombre);
    const franchis = etatsDuProfilCoc(profil).filter(x => avant < x.echelon && e.apres >= x.echelon);
    const apres = regle.suivi && e.subis > 0 ? signalerBlessureCoc(f, avant, e.apres, !!impact.coc?.critique, e.mortInstantanee) : suivi;
    const morceaux = [
        `${e.subis} DM${rd || heros ? ` (${impact.value}${heros ? ` − héros ${heros}` : ''} − RD ${rd})` : ''} : échelle de santé ${avant} → ${e.apres}`,
        ...(e.mortInstantanee ? [`plus de 20 + CON (${20 + constitution}) en une fois : tué sur le coup (p. 73)`] : []),
        ...(!e.mortInstantanee && e.coupDeGrace ? ['déjà mourant : test de CON difficulté 20, ou la mort (coup de grâce, p. 73)'] : []),
        ...(!e.mortInstantanee ? franchis.map(etat => `${etat.label} — ${EFFETS_DES_ETATS[etat.label]}`) : []),
    ];
    return {
        // Les cases avancent de ce qui a passé la protection ; la mort instantanée les noircit toutes.
        impact: { ...impact, value: e.apres - avant },
        fiche: { ...(regle.suivi || impact.coc?.id ? { [CLE_SUIVI_COC]: { ...apres, recus: [...apres.recus, ...(impact.coc?.id ? [impact.coc.id] : [])] } } : {}),
            ...(heros && impact.value > 0 ? { [CLE_AVANTAGES_COC]: avancerAvantagesCoc(f, 'dm-subis', impact.coc?.id ?? crypto.randomUUID()) } : {}) },
        texte: `${morceaux.join(' ; ')}.`,
    };
}
