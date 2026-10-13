import { useSessionOSStore } from '../../session/useSessionOSStore';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import { appliquerAuGroupe, campagneDuGroupe, lireLEcritureDuGroupe } from '../../session/logic/groupeDeLaCampagne';
import type { ActionRegistry } from './types';

/**
 * **Un joueur écrit dans la fiche du groupe, depuis sa tablette** — la Cabale
 * de NOC, commune à toute la table (2026-10-13).
 *
 * Le message ne dit que **qui** écrit et **quoi**. La campagne se déduit du
 * personnage, que `actionPolicy` a déjà authentifié : un joueur n'écrit que dans
 * le groupe de SA campagne, et seulement si le jeu en déclare un.
 *
 * `updateCampaign` et non `remoteEcrireLeGroupe`, qui rediffuserait l'écriture
 * à la tablette qui vient de l'envoyer.
 */
const ecrireLeGroupe = (payload: unknown) => {
    const lu = lireLEcritureDuGroupe(payload);
    if (!lu) return;

    const store = useSessionOSStore.getState();
    const personnage = store.players.flatMap(p => p.characters).find(c => c.id === lu.characterId);
    if (!personnage) return;

    const campagne = campagneDuGroupe(personnage, store.campaigns, store.activeCampaignId);
    const pilote = campagne && tousLesPilotes(store.customGameDrivers).find(d => d.id === campagne.system);
    if (!campagne || !pilote?.ficheDeGroupe) {
        console.warn(`[Actions] groupe:ecrire refusé — la campagne de « ${personnage.name} » n'a pas de fiche de groupe.`);
        return;
    }

    store.updateCampaign(campagne.id, { groupe: appliquerAuGroupe(campagne.groupe, { aEcrire: lu.sheetData }) });
};

export const groupeActions: ActionRegistry = {
    'groupe:ecrire': ecrireLeGroupe,
    'remote:groupe:ecrire': ecrireLeGroupe,
};
