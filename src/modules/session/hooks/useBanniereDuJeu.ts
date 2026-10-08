import { useEffect, useMemo, useState } from 'react';
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
    const campagne = useSessionOSStore(s => s.campaigns.find(c => c.id === s.activeCampaignId));
    const pilote = useSessionOSStore(s => {
        const systeme = s.campaigns.find(c => c.id === s.activeCampaignId)?.system;
        return s.customGameDrivers?.find(d => d.id === systeme);
    });
    const systeme = campagne?.system;
    const systemPath = campagne?.systemPath;
    const nomDuPilote = pilote?.name;
    const corpusId = pilote?.corpusId;
    const ragPath = pilote?.ragPath;
    const banniere = pilote?.banniere;
    // Le dossier peut changer même si l'identifiant et le fichier ne changent pas.
    const contexte = useMemo(() => ({ campagneId, systeme, systemPath, nomDuPilote, corpusId, ragPath, banniere }),
        [campagneId, systeme, systemPath, nomDuPilote, corpusId, ragPath, banniere]);
    const [lecture, setLecture] = useState<{ contexte: typeof contexte; adresse: string | null } | null>(null);

    useEffect(() => {
        const { campagneId, banniere } = contexte;
        if (!banniere) return;
        let vivant = true;
        void jeuDeLaCampagneActive(campagneId)
            .then(jeu => { if (vivant) setLecture({ contexte, adresse: jeu ? adresseDeLaBanniere(jeu.racine, banniere) : null }); })
            .catch(() => { if (vivant) setLecture({ contexte, adresse: null }); });
        return () => { vivant = false; };
    }, [contexte]);

    // Masquer la lecture précédente dès le rendu du nouveau contexte, avant l'effet.
    return lecture?.contexte === contexte ? lecture.adresse : null;
}
