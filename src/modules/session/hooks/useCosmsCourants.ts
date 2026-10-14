import { useMemo } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { tousLesPilotes } from '../store/tousLesPilotes';
import { cosmsDesIds, idsDesCosmsCourants } from '../logic/cosmsCourants';
import type { CosmDuJeu } from '../../../types/drivers';

/**
 * **Les cosms courants de la campagne active** — Torg, 2026-10-14.
 *
 * Chez le meneur, calculés depuis la scène en cours et la campagne ; sur la
 * tablette, qui n'a pas les scènes, reçus avec la séance (`cosmsCourants`). Vide
 * pour un jeu sans cosms.
 *
 * Les sélecteurs ne rendent que des références du magasin : un tableau neuf à
 * chaque lecture ferait boucler le rendu.
 */
export function useCosmsCourants(): CosmDuJeu[] {
    const campagnes = useSessionOSStore(s => s.campaigns);
    const idCampagne = useSessionOSStore(s => s.activeCampaignId);
    const scenes = useSessionOSStore(s => s.scenes);
    const pilotesPerso = useSessionOSStore(s => s.customGameDrivers);
    const recus = useSessionOSStore(s => s.cosmsCourants);
    return useMemo(() => {
        const campagne = campagnes.find(c => c.id === idCampagne);
        if (!campagne) return [];
        const pilote = tousLesPilotes(pilotesPerso).find(d => d.id === campagne.system);
        if (!pilote?.cosms?.length) return [];
        return cosmsDesIds(pilote.cosms, recus ?? idsDesCosmsCourants(campagne, scenes ?? []));
    }, [campagnes, idCampagne, scenes, pilotesPerso, recus]);
}

/** Les cosms que déclare le jeu d'une campagne — pour les choisir. Vide hors de Torg. */
export function useCosmsDuJeu(campagneId: string | null | undefined): CosmDuJeu[] {
    const campagnes = useSessionOSStore(s => s.campaigns);
    const pilotesPerso = useSessionOSStore(s => s.customGameDrivers);
    return useMemo(() => {
        const campagne = campagnes.find(c => c.id === campagneId);
        return (campagne && tousLesPilotes(pilotesPerso).find(d => d.id === campagne.system)?.cosms) || [];
    }, [campagnes, pilotesPerso, campagneId]);
}
