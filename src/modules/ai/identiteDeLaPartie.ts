import { useMemo } from 'react';
import { create } from 'zustand';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { tousLesPilotes } from '../session/store/tousLesPilotes';
import { identiteEnVigueur } from './identiteVisuelle';
import type { IdentiteVisuelle } from '../../types/drivers';

/**
 * **L'identité visuelle de la partie en cours** — 2026-10-17 : celle du jeu de
 * la campagne ouverte, complétée ou remplacée par la campagne.
 *
 * La fenêtre d'invite peut la **suspendre** pour une image à part. Le choix ne
 * se persiste pas : chaque lancement de GM-OS repart avec l'identité appliquée,
 * parce qu'un style oublié en route serait une unité perdue sans que personne
 * ne s'en aperçoive.
 */
export const useIdentiteSuspendue = create<{ suspendue: boolean; suspendre: (oui: boolean) => void }>(set => ({
    suspendue: false,
    suspendre: oui => set({ suspendue: oui }),
}));

export function identiteDeLaPartie(): IdentiteVisuelle | null {
    /*
      **Elle ne bloque jamais une génération** : un magasin incomplet (une
      fenêtre secondaire, un essai) rend « aucune identité », pas une erreur
      qui coûterait l'image.
    */
    const { campaigns, activeCampaignId, customGameDrivers } = useSessionOSStore.getState();
    const campagne = (campaigns ?? []).find(c => c.id === activeCampaignId);
    if (!campagne) return null;
    const pilote = tousLesPilotes(customGameDrivers ?? []).find(d => d.id === campagne.system);
    return identiteEnVigueur(pilote, campagne);
}

/** Ce que la génération applique : rien quand le meneur l'a suspendue. */
export function identiteAAppliquer(): IdentiteVisuelle | null {
    return useIdentiteSuspendue.getState().suspendue ? null : identiteDeLaPartie();
}

/** La même, pour un écran : elle suit la campagne ouverte et les pilotes. */
export function useIdentiteDeLaPartie(): IdentiteVisuelle | null {
    const campaigns = useSessionOSStore(s => s.campaigns);
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
    const customGameDrivers = useSessionOSStore(s => s.customGameDrivers);
    return useMemo(() => {
        const campagne = campaigns.find(c => c.id === activeCampaignId);
        if (!campagne) return null;
        return identiteEnVigueur(tousLesPilotes(customGameDrivers).find(d => d.id === campagne.system), campagne);
    }, [campaigns, activeCampaignId, customGameDrivers]);
}
