import { useEffect, useMemo, useState } from 'react';
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

    const pilote = piloteDuPersonnage(character, campaigns, customGameDrivers, activeCampaignId);
    const campagne = campaigns?.find(c => c.id === (character?.campaignId ?? activeCampaignId));
    const personnageId = character?.id;
    const personnageNom = character?.name;
    const systemId = pilote?.id ?? campagne?.system ?? '';
    const systemName = pilote?.name;
    const systemPath = campagne?.systemPath;
    const corpusId = pilote?.corpusId;
    const ragPath = pilote?.ragPath;
    // Les données éditées de la fiche ne changent pas sa table de correspondance.
    const contexte = useMemo(() => personnageId === undefined ? null : ({
        personnageId, personnageNom, systemId, systemName, systemPath, corpusId, ragPath,
    }), [personnageId, personnageNom, systemId, systemName, systemPath, corpusId, ragPath]);
    const [lecture, setLecture] = useState<{ contexte: typeof contexte; table: CorrespondanceDeFiche | null } | null>(null);

    useEffect(() => {
        if (!contexte) return;
        let annule = false;

        const relire = async () => {
            const dossiersConnus = (await window.appBridge?.ai?.listSystems?.()) ?? [];
            if (annule) return;

            const corpus = resoudreCorpus({
                systemId: contexte.systemId,
                systemName: contexte.systemName,
                systemPath: contexte.systemPath,
                corpusId: contexte.corpusId,
                ragPath: contexte.ragPath,
                dossiersConnus,
            });

            const lue = await chargerLaCorrespondance(corpus.racine);
            if (annule) return;
            setLecture({ contexte, table: lue });

            /*
              Dire ce qu'on a retenu — la règle du journal de l'Oracle, qui vaut
              ici aussi : une table qui ne s'applique pas se cherche autrement
              pendant une heure. Un jeu sans table est le cas NORMAL et reste
              silencieux.
            */
            if (lue) {
                console.info(
                    `[Correspondance] « ${contexte.personnageNom} » → docs/${corpus.racine}/fiche/correspondance.json `
                    + `(${lue.champs.length} champs, gabarit « ${lue.gabaritDeLaFiche} »)`,
                );
            }
        };

        void relire().catch(err => {
            if (annule) return;
            console.error('[Correspondance] Résolution du jeu impossible :', err);
            setLecture({ contexte, table: null });
        });
        return () => { annule = true; };
    }, [contexte]);

    return contexte && lecture?.contexte === contexte ? lecture.table : null;
}
