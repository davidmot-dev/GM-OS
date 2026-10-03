import { useEffect, useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { jeuDeLaCampagneActive } from '../../../theme/jeuDeLaCampagne';
import { adresseDeLaBanniere } from '../logic/banniereDuPilote';

/**
 * **L'adresse de la bannière du jeu ouvert**, ou `null` — voir
 * `banniereDuPilote.ts`. Le dossier du jeu se résout comme pour son thème
 * (`jeuDeLaCampagneActive`) : *deux endroits qui résolvent le même dossier
 * finissent par ne plus le résoudre pareil.*
 */
export function useBanniereDuJeu(): string | null {
    const campagneId = useSessionOSStore(s => s.activeCampaignId);
    const banniere = useSessionOSStore(s => {
        const systeme = s.campaigns.find(c => c.id === s.activeCampaignId)?.system;
        return s.customGameDrivers?.find(d => d.id === systeme)?.banniere;
    });
    const [adresse, setAdresse] = useState<string | null>(null);

    useEffect(() => {
        if (!banniere) { setAdresse(null); return; }
        let vivant = true;
        void jeuDeLaCampagneActive(campagneId)
            .then(jeu => { if (vivant) setAdresse(jeu ? adresseDeLaBanniere(jeu.racine, banniere) : null); })
            .catch(() => { if (vivant) setAdresse(null); });
        return () => { vivant = false; };
    }, [campagneId, banniere]);

    return adresse;
}
