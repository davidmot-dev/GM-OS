import { useEffect, useMemo, useState } from 'react';
import { resoudreCorpus } from '../../../electron/corpusSysteme';
import { chargerLaCorrespondance } from './chargerLaCorrespondance';
import type { CorrespondanceDeFiche } from './correspondanceDeFiche';
import type { Campaign } from '../../types/campaign.types';
import type { GameDriver } from '../../types/drivers';

/**
 * **La correspondance de la fiche de groupe** — `fiche/correspondance-groupe.json`.
 *
 * Le même chemin que `useCorrespondanceDuJeu`, à une différence près : le jeu
 * est celui de la **campagne**, puisque le groupe n'appartient à aucun joueur.
 * Le dossier du système se résout comme pour les personnages, par
 * `resoudreCorpus`, y compris quand le pilote porte un identifiant de Forge.
 *
 * Rend `null` tant que la table n'est pas lue, et quand le jeu n'en dépose pas.
 */
export function useCorrespondanceDuGroupe(
    campagne: Campaign | undefined,
    pilote: GameDriver | undefined,
): CorrespondanceDeFiche | null {
    const campagneId = campagne?.id;
    const systemId = pilote?.id ?? campagne?.system ?? '';
    const systemName = pilote?.name;
    const systemPath = campagne?.systemPath;
    const corpusId = pilote?.corpusId;
    const ragPath = pilote?.ragPath;
    const avecGroupe = !!pilote?.ficheDeGroupe;

    const contexte = useMemo(() => !campagneId || !avecGroupe ? null : ({
        campagneId, systemId, systemName, systemPath, corpusId, ragPath,
    }), [campagneId, avecGroupe, systemId, systemName, systemPath, corpusId, ragPath]);
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
            const lue = await chargerLaCorrespondance(corpus.racine, 'correspondance-groupe.json');
            if (annule) return;
            setLecture({ contexte, table: lue });

            if (lue) {
                console.info(
                    `[Correspondance] groupe → docs/${corpus.racine}/fiche/correspondance-groupe.json `
                    + `(${lue.champs.length} champs, gabarit « ${lue.gabaritDeLaFiche} »)`,
                );
            } else {
                // Un pilote qui DÉCLARE une fiche de groupe sans table : ce n'est
                // pas le cas normal, et la fiche s'afficherait sans remonter.
                console.warn(`[Correspondance] le pilote déclare une fiche de groupe, mais docs/${corpus.racine}/fiche/correspondance-groupe.json est absente.`);
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
