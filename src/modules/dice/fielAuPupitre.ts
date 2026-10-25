import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import { ressourcesDeLaTable } from '../table/reservesDuGroupe';
import type { DescripteurDeJet } from './DescripteurDeJet';
import { herosDeLaCampagne } from '../table/gestesDesHeros';
import { ecrireLesHeros } from '../table/ecrireLesHeros';
import { desDuDixDisponibles } from './suiteDuDestinAuPupitre';

/**
 * **Les 1 d'un jet de destin lancé au pupitre** — NOC, 2026-10-16.
 *
 * Le panneau de fiche verse le Fiel tout seul : il sait qu'un Héros lance. Le
 * pupitre ne le sait pas, et la règle change selon qui lance : *« lorsqu'un
 * Rouage hostile obtient un 1, la jauge collective de Fiel diminue d'une goutte
 * (au lieu d'augmenter). Si elle est déjà à 0, l'un des Héros, désigné par la
 * Loi, gagne 1 point de Singularité »* (carnet « NOC », « ROUAGES ET FORCES
 * OCCULTES »). Le meneur dit donc qui a lancé, une fois par jet.
 */

/** Les 1 d'un jet de d10 — les dés écartés ne comptent pas. */
export function unsDuJetDeDestin(jet: Pick<RollRecord, 'rolls'>): number {
    return jet.rolls.filter(d => !d.isDropped && d.val === 1 && (d.sides === undefined || d.sides === 10)).length;
}

/** Ce jet du pupitre est-il un jet de destin dont on peut attribuer les 1 ? */
export function jetDeDestinAAttribuer(jet: RollRecord | null | undefined, descripteur: DescripteurDeJet | undefined): boolean {
    return !!jet && !!descripteur?.destin?.fiel && !jet.fielAttribue && unsDuJetDeDestin(jet) > 0
        && (!descripteur.destin.desSurDixAuChoix || jet.destinClos || desDuDixDisponibles(jet) === 0)
        && jet.rolls.every(d => d.sides === undefined || d.sides === 10);
}

/**
 * Attribue les 1 du dernier jet : un Héros les verse dans le Fiel, un Rouage
 * hostile en retire autant. Rend ce qui s'est passé, dit pour le meneur.
 */
export function attribuerLeFielDuDernierJet(qui: 'heros' | 'rouage', beneficiaire?: { joueurId: string; id: string }): string[] {
    const des = useDiceStore.getState();
    // Le même jet que celui que le pupitre affiche — comme le forçage.
    const jet = des.history[0];
    const session = useSessionOSStore.getState();
    const pilote = session.getActiveDriver?.();
    const campaignId = session.activeCampaignId;
    const fiel = pilote?.jet?.destin?.fiel;
    if (!jet || !fiel || !campaignId || !jetDeDestinAAttribuer(jet, pilote?.jet)) return [];

    const ressources = ressourcesDeLaTable(pilote, session.campaigns.find(c => c.id === campaignId));
    const label = ressources.find(r => r.id === fiel)?.label ?? fiel;
    const table = useRessourcesDeTableStore.getState();
    const uns = unsDuJetDeDestin(jet);
    const avant = table.etatDe(campaignId, ressources)[fiel] ?? 0;
    const retirees = Math.min(uns, Math.max(0, avant));
    const reste = uns - retirees;
    const champ = pilote?.jet?.destin?.singularite;
    const heros = qui === 'rouage' && reste > 0 && champ
        ? herosDeLaCampagne(session.players, campaignId).find(h => h.id === beneficiaire?.id && h.joueurId === beneficiaire?.joueurId)
        : undefined;
    // Vérifier AVANT toute dépense : un choix périmé ne consomme pas le jet ni le Fiel.
    if (qui === 'rouage' && reste > 0 && champ && !heros) return ['Choisissez le Héros qui reçoit la Singularité.'];
    des.annoterLeJet(jet.id, { fielAttribue: qui });

    if (qui === 'heros') {
        const r = table.gagner(campaignId, ressources, fiel, uns, `${jet.title} : ${uns} × 1 d'un Héros`);
        return [`${uns} goutte${uns > 1 ? 's' : ''} de ${label} versée${uns > 1 ? 's' : ''}.`, ...r.avertissements];
    }
    const dits: string[] = [];
    if (retirees > 0) {
        const r = table.depenser(campaignId, ressources, fiel, retirees, `${jet.title} : ${retirees} × 1 d'un Rouage hostile`);
        dits.push(`Rouage hostile : ${label} −${retirees}.`, ...r.avertissements);
    }
    if (reste > 0) {
        if (heros && champ) {
            const brut = Number(heros.valeurs[champ]);
            const valeur = Math.max(0, Number.isFinite(brut) ? Math.floor(brut) : 0) + reste;
            ecrireLesHeros([{ joueurId: heros.joueurId, herosId: heros.id, nom: heros.nom,
                maj: { [champ]: valeur }, lignes: [`Singularité +${reste} (Rouage hostile)`] }], session);
            dits.push(`${heros.nom} : Singularité +${reste} → ${valeur}.`);
        } else dits.push(`${label} déjà à 0 : un Héros désigné par la Loi gagne ${reste} point${reste > 1 ? 's' : ''} de Singularité.`);
    }
    return dits;
}
