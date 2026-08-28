import { useEffect, useState } from 'react';
import { resoudreCorpus } from '../../../electron/corpusSysteme';
import { piloteDuPersonnage } from '../session/logic/piloteDuPersonnage';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { chargerLaCorrespondance } from './chargerLaCorrespondance';
import type { CorrespondanceDeFiche } from './correspondanceDeFiche';
import type { PlayerCharacter } from '../session/store/types';

/**
 * **La correspondance du jeu d'un personnage — déposer un fichier suffit.**
 *
 * Exactement le chemin de `useThemeDuJeu`, et pour la même raison : le dossier
 * du système est déjà rapproché du pilote par `resoudreCorpus`, y compris quand
 * l'identifiant du pilote est un horodatage fabriqué par la Forge — ce qui est
 * le cas de tous les pilotes de David sauf Dune. Aucun registre à compléter,
 * aucun `switch`, aucune recompilation.
 *
 * **Le pilote du PERSONNAGE, pas celui de la campagne ouverte.** La règle vit
 * dans `piloteDuPersonnage` et se partage : deux copies auraient fini par ne
 * plus désigner le même jeu, et une fiche aurait alors été branchée sur la table
 * d'un autre système sans que rien ne le dise. C'est déjà arrivé le 2026-08-15,
 * sur les dés.
 *
 * Rend `null` quand le jeu n'a pas de table — **c'est le cas normal**. La fiche
 * s'affiche alors sans être branchée, plutôt que pas du tout.
 */
export function useCorrespondanceDuJeu(character: PlayerCharacter | null | undefined): CorrespondanceDeFiche | null {
    const campaigns = useSessionOSStore(s => s.campaigns);
    const customGameDrivers = useSessionOSStore(s => s.customGameDrivers);
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);

    const [table, setTable] = useState<CorrespondanceDeFiche | null>(null);

    useEffect(() => {
        let annule = false;
        if (!character) { setTable(null); return; }

        const relire = async () => {
            const pilote = piloteDuPersonnage(character, campaigns, customGameDrivers, activeCampaignId);
            const campagne = campaigns?.find(c => c.id === (character.campaignId ?? activeCampaignId));
            const dossiersConnus = (await window.appBridge?.ai?.listSystems?.()) ?? [];

            const corpus = resoudreCorpus({
                systemId: pilote?.id ?? campagne?.system ?? '',
                systemName: pilote?.name,
                systemPath: campagne?.systemPath,
                corpusId: pilote?.corpusId,
                ragPath: pilote?.ragPath,
                dossiersConnus,
            });

            const lue = await chargerLaCorrespondance(corpus.racine);
            if (annule) return;
            setTable(lue);

            /*
              Dire ce qu'on a retenu — la règle du journal de l'Oracle, qui vaut
              ici aussi : une table qui ne s'applique pas se cherche autrement
              pendant une heure. Un jeu sans table est le cas NORMAL et reste
              silencieux.
            */
            if (lue) {
                console.info(
                    `[Correspondance] « ${character.name} » → docs/${corpus.racine}/fiche/correspondance.json `
                    + `(${lue.champs.length} champs, gabarit « ${lue.gabaritDeLaFiche} »)`,
                );
            }
        };

        void relire();
        return () => { annule = true; };
    }, [character, campaigns, customGameDrivers, activeCampaignId]);

    return table;
}
