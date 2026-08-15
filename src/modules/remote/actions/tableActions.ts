import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { manipulableParUnJoueur, type RessourceDeTable } from '../../table/RessourcesDeTable';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import type { ActionContext, ActionRegistry } from './types';

/**
 * Les réserves de table, manipulées depuis la tablette d'un joueur.
 *
 * **Pourquoi cette action existe.** L'Impulsion de Dune est une réserve
 * **commune aux joueurs** : elle se dépense par décision collective, à la
 * table, sans passer par le meneur. Elle n'existait pourtant que dans la
 * fenêtre du MJ — *une réserve partagée que le groupe ne voit pas n'est pas
 * partagée, c'est la réserve du MJ qu'il annonce à voix haute.*
 *
 * **Ce que le handler vérifie, et pourquoi ici.** `electron/actionPolicy.ts`
 * décide *qui* peut déclencher *quoi* ; il ne connaît ni les pilotes ni les
 * réserves qu'ils déclarent. C'est donc ici qu'on vérifie que la réserve visée
 * est bien **déclarée manipulable par les joueurs** — sans quoi un client
 * pourrait faire monter la Menace du meneur, qui est publique mais intouchable.
 *
 * *On ne refuse rien sans motif écrit* : un refus se journalise avec sa raison,
 * comme les refus de la politique de relais.
 */

/** Les réserves que le pilote de la campagne active déclare. */
function reservesDeLaCampagne(campaignId: string | null): RessourceDeTable[] {
    if (!campaignId) return [];
    const session = useSessionOSStore.getState();
    const campagne = session.campaigns.find(c => c.id === campaignId);
    const pilote = tousLesPilotes(session.customGameDrivers).find(d => d.id === campagne?.system);
    return pilote?.ressourcesDeTable ?? [];
}

/**
 * Un joueur fait bouger une réserve.
 *
 * `delta` négatif dépense, positif crédite. On passe par les mêmes fonctions
 * que le meneur — donc avec le report sur épuisement, le plafond et leurs
 * avertissements : *la règle ne change pas selon qui l'applique.*
 */
const ajusterUneReserve = (payload: any, ctx: ActionContext) => {
    const { ressourceId, delta } = (payload ?? {}) as { ressourceId?: string; delta?: number };
    const campaignId = ctx.activeCampaignId;

    if (!ressourceId || typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) {
        console.warn('[Actions] table:ajuster ignoré — payload inexploitable:', payload);
        return;
    }

    const ressources = reservesDeLaCampagne(campaignId);
    const ressource = ressources.find(r => r.id === ressourceId);
    if (!ressource) {
        console.warn(`[Actions] table:ajuster refusé — « ${ressourceId} » n'est pas une réserve de ce jeu.`);
        return;
    }
    if (!manipulableParUnJoueur(ressource)) {
        console.warn(
            `[Actions] table:ajuster refusé — « ${ressource.label} » n'est pas déclarée manipulable `
            + 'par les joueurs dans le pilote.',
        );
        return;
    }

    const store = useRessourcesDeTableStore.getState();
    const resultat = delta < 0
        ? store.depenser(campaignId!, ressources, ressourceId, -delta)
        : store.gagner(campaignId!, ressources, ressourceId, delta);

    for (const dit of resultat.avertissements) console.log(`[Actions] table:ajuster — ${dit}`);
};

export const tableActions: ActionRegistry = {
    'table:ajuster': ajusterUneReserve,
    'remote:table:ajuster': ajusterUneReserve,
};
