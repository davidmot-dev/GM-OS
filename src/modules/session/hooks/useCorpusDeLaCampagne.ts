import { useEffect, useState } from 'react';
import { resoudreCorpus } from '../../../../electron/corpusSysteme';
import { useSessionOSStore } from '../useSessionOSStore';

/**
 * **Le dossier du jeu de la campagne ouverte — `dune`, `blade-runner`.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE N'EST PAS `campaign.system`
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **L'identifiant d'un pilote ne dit rien du jeu.** La Forge le fabrique avec
 * `custom-${Date.now()}` : *tous les pilotes de David sauf Dune portent un
 * horodatage.* Comparer `campaign.system` à `'blade-runner'` ne correspond donc
 * jamais — et le défaut est **muet**, puisqu'une comparaison qui échoue rend
 * simplement une liste vide.
 *
 * C'est exactement le piège que l'ancienne couture de l'afficheur contournait à
 * la main, en cherchant la sous-chaîne « blade » dans le nom du jeu. Le
 * remplacer par une comparaison stricte sur l'identifiant aurait été une
 * **régression déguisée en propreté**.
 *
 * `resoudreCorpus` est la réponse maison à cette question, et elle est déjà
 * celle du thème (`useThemeDuJeu`) et des fiches (`useCorrespondanceDuJeu`).
 * *L'écriture résout exactement comme la lecture* — une asymétrie entre les deux
 * est indétectable par construction.
 *
 * Rend `null` tant que la résolution n'a pas abouti, ou sans campagne ouverte.
 */
export function useCorpusDeLaCampagne(): string | null {
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
    const campaigns = useSessionOSStore(s => s.campaigns);
    const customGameDrivers = useSessionOSStore(s => s.customGameDrivers);

    const [corpusId, setCorpusId] = useState<string | null>(null);

    useEffect(() => {
        let annule = false;

        const resoudre = async () => {
            const campagne = campaigns?.find(c => c.id === activeCampaignId);
            if (!campagne) { setCorpusId(null); return; }

            const pilote = customGameDrivers?.find(d => d.id === campagne.system);
            /*
              La liste des dossiers réels permet à `resoudreCorpus` de
              reconnaître un jeu par son nom affiché. Absente — hors Electron,
              pont pas encore prêt — la résolution retombe sur l'identifiant,
              ce qui reste le comportement d'avant.
            */
            const dossiersConnus = (await window.appBridge?.ai?.listSystems?.()) ?? [];

            const corpus = resoudreCorpus({
                systemId: campagne.system,
                systemName: pilote?.name,
                systemPath: campagne.systemPath,
                corpusId: pilote?.corpusId,
                ragPath: pilote?.ragPath,
                dossiersConnus,
            });

            if (!annule) setCorpusId(corpus.id);
        };

        void resoudre();
        return () => { annule = true; };
    }, [activeCampaignId, campaigns, customGameDrivers]);

    return corpusId;
}
