import { useEffect, useRef } from 'react';
import { useAIStore } from '../../stores/useAIStore';
import type { AIProvider, AIModelConfig } from './types';

/**
 * **Charger le modèle avant la première question — mesuré le 2026-08-31.**
 *
 * `keep_alive` garde le modèle trente minutes **après une réponse** ; rien ne le
 * chargeait *avant* la première. Le meneur payait donc la montée sur l'iGPU au
 * pire moment possible : sa première question, devant la table qui attend.
 *
 * | | chargement | prefill du RAG | coût de la question |
 * | --- | --- | --- | --- |
 * | modèle froid | 13 – 20 s | 47,5 s | **~62 s** |
 * | modèle chaud | 0 s | 43,4 s | **~50 s** |
 *
 * **Ce que ce crochet retire, c'est la colonne du chargement, et elle seule.**
 * Le prefill se paie à chaque question parce que le contexte RAG est neuf à
 * chaque question — le cache de préfixe d'Ollama ne couvre que la persona et
 * les consignes.
 *
 * ⚠️ *Annoncé « de ~50 s à ~10 s » le jour même, sur la foi d'un banc dont
 * l'invite se répétait : 660 tok/s de prefill était un cache, pas un débit. Le
 * geste reste juste, sa mesure était fausse.* Treize secondes rendues au premier
 * moment d'une soirée valent qu'on les prenne — mais ce sont treize secondes.
 *
 * Le remède ne demande aucun modèle plus rapide ni aucun réglage : une requête
 * sans invite, à l'ouverture de la séance.
 */

/**
 * **Seulement Ollama local.**
 *
 * `ollama_cloud` est écarté volontairement : le coût qu'on évite ici est la
 * montée d'un modèle sur *cet* iGPU. Une instance distante a son propre cycle
 * de chargement, que GM-OS ne connaît pas — et lui envoyer une requête à
 * l'ouverture de chaque séance serait agir sur une machine qui ne nous a rien
 * demandé. *On ne préchauffe que ce qu'on héberge.*
 */
export function modeleAPrechauffer(
    provider: AIProvider,
    configs: Partial<Record<AIProvider, AIModelConfig>>,
): { model: string; endpoint?: string } | null {
    if (provider !== 'ollama') return null;
    const config = configs[provider];
    const model = config?.modelId;
    if (!model) return null;
    return { model, endpoint: config?.endpoint };
}

/**
 * Le renouvellement, **plus court que `DUREE_DE_CHARGE`** (trente minutes,
 * `electron/OllamaService.ts`).
 *
 * Une séance dure des heures et rien ne garantit qu'on interroge le modèle
 * régulièrement : entre l'ouverture et la première question de règle, il peut
 * s'écouler une heure de mise en place. Sans renouvellement, le préchauffage ne
 * couvrirait que la demi-heure suivant l'ouverture — *un filet qui ne tient que
 * pendant qu'on le regarde.*
 *
 * Vingt minutes laissent dix minutes de marge : un préchauffage qui échoue une
 * fois — réseau, Ollama redémarré — a le temps d'être repris avant que le
 * modèle ne se décharge.
 */
export const RENOUVELLEMENT_MS = 20 * 60 * 1000;

/**
 * Le délai en deçà duquel on ne repréchauffe pas.
 *
 * **Il existe pour `StrictMode`**, qui monte chaque effet deux fois : sans lui,
 * l'ouverture d'une séance enverrait deux chargements, dont un pour rien. C'est
 * le même piège que celui payé le 30/08 sur la restitution de l'afficheur, en
 * beaucoup moins cher — *mais le motif est identique, et il se répète.*
 */
export const PAS_AVANT_MS = 60 * 1000;

/**
 * Le préchauffage, branché sur l'ouverture de la séance.
 *
 * **Pourquoi la séance et non le démarrage de GM-OS.** Le § 1.1 du plan du
 * 07/08 pose deux moments et deux budgets : en préparation, une Forge de
 * quarante-cinq minutes est normale et cinquante secondes de montée ne se
 * remarquent pas ; en partie, le meneur attend et ses joueurs avec lui.
 * *Préchauffer au lancement occuperait 8,4 Gio de mémoire partagée pour une
 * soirée d'écriture de notes qui n'interrogera jamais le modèle.*
 *
 * **Il vit dans `Shell`, comme les deux autres battements**, et pour la même
 * raison : accroché à un panneau, il s'arrêterait dès qu'on quitte l'écran.
 */
export function usePrechauffageDuModele(seanceOuverte: boolean): void {
    const activeProvider = useAIStore(e => e.activeProvider);
    const configs = useAIStore(e => e.configs);

    /** Quand on a chargé pour la dernière fois — le garde de `StrictMode`. */
    const dernier = useRef(0);

    useEffect(() => {
        if (!seanceOuverte) return;

        const cible = modeleAPrechauffer(activeProvider, configs);
        if (!cible) return;

        const pont = window.appBridge?.ai?.ollamaPrechauffer;
        // Un pont plus ancien ne l'expose pas : on s'en passe en silence
        // plutôt que d'échouer sur une optimisation.
        if (!pont) return;

        const chauffer = () => {
            const maintenant = Date.now();
            if (maintenant - dernier.current < PAS_AVANT_MS) return;
            dernier.current = maintenant;
            // Sans `await` ni remontée d'erreur : le service journalise, et un
            // échec ne rend rien pire qu'avant.
            void pont(cible.model, cible.endpoint).catch(() => undefined);
        };

        chauffer();
        const battement = setInterval(chauffer, RENOUVELLEMENT_MS);
        return () => clearInterval(battement);
    }, [seanceOuverte, activeProvider, configs]);
}
