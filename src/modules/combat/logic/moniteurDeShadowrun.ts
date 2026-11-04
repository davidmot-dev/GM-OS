import type { DamageImpact } from '../../../types/entity.types';
import {
    CAPACITES_DU_MONITEUR, EFFETS_DES_GRAVITES, LIBELLES_DES_GRAVITES, encaisserShadowrun, graviteDe, seuilsDeBlessure,
    type Gravite, type Moniteur, type RegleDuMoniteurShadowrun,
} from '../../dice/systemes/shadowrun';
import { valeurDuChamp } from './SanteDuCombattant';
import { ajouterBlessureShadowrun, suivreLesCompteurs, compteursShadowrun, ecrireSuiviShadowrun,
    refusDuSoinShadowrun, HEURES_DE_REPOS, lireSuiviShadowrun } from '../../dice/systemes/suiviDeShadowrun';

/**
 * **Le moniteur d'état de Shadowrun : Anarchy 2.0 à la porte des dégâts** — 31/10/2026, à la
 * demande de David (« finir le pilote », livre de base, pages imprimées).
 *
 * La valeur saisie est la **VD** finale, succès nets compris. Elle se compare aux seuils
 * (FOR/VOL + protection, +3, +6) : il faut les DÉPASSER, et une attaque n'inflige qu'une
 * blessure (p. 68). Les seuils se lisent sur la fiche, qui les précalcule (sans armure,
 * armure principale, secondaire, mental) ; vides, ils se calculent sur la Force ou la
 * Volonté seule. Une case pleine passe au degré supérieur (p. 69).
 *
 * Les trois compteurs de la fiche font foi ; les cases de santé de GM-OS montrent la
 * **pire** blessure : les légères, puis la grave, puis l'incapacitante. Un soin efface les
 * blessures les plus graves d'abord, dans l'ordre de la guérison naturelle (p. 70).
 */
export type RegleDuMoniteur = RegleDuMoniteurShadowrun;

type Seuils = Record<Gravite, number>;
const CLES: Record<Gravite, keyof Moniteur> = { legere: 'legeres', grave: 'graves', incapacitante: 'incapacitantes' };

/** La position des cases : les légères cochées, puis la grave, puis l'incapacitante. */
export function positionDuMoniteur(m: Moniteur, capacites: Moniteur = CAPACITES_DU_MONITEUR): number {
    if (m.incapacitantes > 0) return capacites.legeres + capacites.graves + 1;
    if (m.graves > 0) return capacites.legeres + Math.min(m.graves, capacites.graves);
    return Math.min(m.legeres, capacites.legeres);
}

/** Les seuils selon le type de dégâts : mentaux, sans armure, armure secondaire, ou armure principale. */
function seuilsSelonLeType(regle: RegleDuMoniteur, fiche: Record<string, unknown> | undefined, type: string): { seuils: Seuils; source: string } {
    const famille = /mental/i.test(type) ? 'mental' : /sans armure/i.test(type) ? 'sans_armure' : /secondaire/i.test(type) ? 'secondaire' : 'principale';
    const lus = regle.seuils?.[famille];
    const lire = (g: Gravite) => (lus?.[g] ? valeurDuChamp(fiche, lus[g]) : undefined);
    const legere = lire('legere');
    if (legere !== undefined && legere > 0) {
        return {
            seuils: { legere, grave: lire('grave') ?? legere + 3, incapacitante: lire('incapacitante') ?? legere + 6 },
            source: { mental: 'seuils mentaux', sans_armure: 'seuils sans armure', secondaire: 'seuils de l’armure secondaire', principale: 'seuils de l’armure principale' }[famille],
        };
    }
    const mental = famille === 'mental';
    const champ = mental ? regle.volonte : regle.force;
    const base = champ ? valeurDuChamp(fiche, champ) ?? 0 : 0;
    return { seuils: seuilsDeBlessure(base), source: `${mental ? 'Volonté' : 'Force'} ${base} sans protection (seuils vides sur la fiche)` };
}

export function moniteurSelonLeJeu(
    regle: RegleDuMoniteur | undefined,
    fiche: Record<string, unknown> | undefined,
    impact: DamageImpact,
): { impact: DamageImpact; fiche: Record<string, unknown>; texte: string } | null {
    if (!regle || regle.mecanique !== 'shadowrun') return null;
    if (regle.suivi && lireSuiviShadowrun(fiche ?? {}).essenceMortConfirmee)
        return { impact: { ...impact, value: 0 }, fiche: {}, texte: 'Mort par Essence confirmée : les soins ne ramènent pas le personnage (p. 60).' };
    const compte = (champ: string | undefined) => Math.max(0, Math.trunc(champ ? valeurDuChamp(fiche, champ) ?? 0 : 0));
    const capacites: Moniteur = {
        legeres: Math.max(1, compte(regle.capacites?.legeres) || CAPACITES_DU_MONITEUR.legeres),
        graves: Math.max(1, compte(regle.capacites?.graves) || CAPACITES_DU_MONITEUR.graves),
        incapacitantes: 1,
    };
    const avant: Moniteur = { legeres: compte(regle.legeres), graves: compte(regle.graves), incapacitantes: compte(regle.incapacitantes) };
    // Les cases partent de ce que la fiche en dit : un moniteur corrigé à la main se rattrape au coup suivant.
    const casesLues = regle.sante ? valeurDuChamp(fiche, regle.sante) : undefined;
    const positionAvant = casesLues !== undefined && Number.isFinite(casesLues) ? Math.max(0, Math.trunc(casesLues)) : positionDuMoniteur(avant, capacites);
    /*
      La position (`sante`) ne s'écrit pas ici : la porte cale les cases sur la fiche déjà
      mise à jour, puis leur applique l'impact — l'écrire aussi compterait le coup deux fois.
      Les cases reportent leur compte dans ce champ d'elles-mêmes (`updateCharacterHealth`).
    */
    const ecrire = (m: Moniteur) => ({ [regle.legeres]: m.legeres, [regle.graves]: m.graves, [regle.incapacitantes]: m.incapacitantes });
    // Les cases avancent ou reculent de la différence de position ; la porte l'applique à la santé.
    const vers = (m: Moniteur): DamageImpact => {
        const ecart = positionDuMoniteur(m, capacites) - positionAvant;
        return { ...impact, value: Math.abs(ecart), isRecovery: ecart < 0 };
    };

    if (impact.isRecovery) {
        if (regle.suivi) {
            const s = suivreLesCompteurs(regle, fiche ?? {});
            const soin = impact.shadowrun?.soin ?? 'premiers-soins';
            const ordre = { incapacitante: 0, grave: 1, legere: 2 };
            const candidates = [...s.blessures].sort((a, b) => ordre[a.gravite] - ordre[b.gravite]);
            const b = impact.shadowrun?.blessureId ? candidates.find(x => x.id === impact.shadowrun!.blessureId) : candidates[0];
            const refus = b && (refusDuSoinShadowrun(b, soin)
                || (soin === 'repos' && b.id !== candidates[0]?.id ? 'Le repos soigne la plus grave blessure en premier (p. 70).' : undefined)
                || (soin === 'repos' && (impact.shadowrun?.heures ?? 0) < HEURES_DE_REPOS[b.gravite] ? `Repos insuffisant : ${HEURES_DE_REPOS[b.gravite]} heures requises (p. 70).` : undefined));
            if (!b || refus || impact.value <= 0) return { impact: { ...impact, value: 0 }, fiche: {}, texte: refus ?? 'Aucune blessure à soigner.' };
            const apres = { ...s, blessures: s.blessures.filter(x => x.id !== b.id) };
            return { impact: vers(compteursShadowrun(apres)), fiche: ecrireSuiviShadowrun(regle, apres, false), texte: `Blessure ${b.gravite} (${b.origine}) soignée : ${soin}.` };
        }
        const apres = { ...avant };
        let soignees = 0;
        for (let n = 0; n < Math.max(0, Math.trunc(impact.value)); n++) {
            const g = (['incapacitantes', 'graves', 'legeres'] as const).find(k => apres[k] > 0);
            if (!g) break;
            apres[g] -= 1;
            soignees += 1;
        }
        return {
            impact: vers(apres), fiche: ecrire(apres),
            texte: soignees === 0 ? 'Aucune blessure à soigner.'
                : `${soignees} case${soignees > 1 ? 's' : ''} soignée${soignees > 1 ? 's' : ''}, la plus grave d'abord : `
                + `${apres.legeres} légère${apres.legeres > 1 ? 's' : ''}, ${apres.graves} grave${apres.graves > 1 ? 's' : ''}, `
                + `${apres.incapacitantes ? 'incapacitante' : 'pas d’incapacitante'}.`,
        };
    }

    const { seuils, source } = seuilsSelonLeType(regle, fiche, impact.type ?? '');
    const gravite = impact.shadowrun?.gravite ?? graviteDe(impact.value, seuils);
    if (!gravite) {
        return {
            impact: { ...impact, value: 0 }, fiche: {},
            texte: `VD ${impact.value} : ne dépasse pas ${seuils.legere} (${source}), aucune blessure (p. 68).`,
        };
    }
    const e = encaisserShadowrun(gravite, avant, capacites);
    const suivi = regle.suivi ? ajouterBlessureShadowrun(regle, fiche ?? {}, gravite,
        impact.shadowrun?.origine ?? (/mental/i.test(impact.type ?? '') ? 'mental' : 'physique'), crypto.randomUUID()) : undefined;
    return {
        impact: vers(e.moniteur), fiche: suivi ? ecrireSuiviShadowrun(regle, suivi, false) : ecrire(e.moniteur),
        texte: `VD ${impact.value} contre ${seuils.legere}/${seuils.grave}/${seuils.incapacitante} (${source}) : `
            + `${LIBELLES_DES_GRAVITES[gravite].toLowerCase()}`
            + (e.aggravee ? `, cases pleines : aggravée en ${LIBELLES_DES_GRAVITES[e.cochee].toLowerCase()} (p. 69)` : '')
            + ` — ${EFFETS_DES_GRAVITES[e.cochee]}.`
            + (avant[CLES[e.cochee]] === e.moniteur[CLES[e.cochee]] ? ' Le moniteur est déjà plein.' : ''),
    };
}
