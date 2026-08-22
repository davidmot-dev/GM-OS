import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAIStore } from '../../stores/useAIStore';
import type { AIProvider } from './types';

/**
 * **Quel moteur pour quelle Forge — axe J.**
 *
 * *Arbitrage de David : « cloud accepté pour les Forges, choix explicite à
 * chaque lancement, jamais de bascule automatique. »*
 *
 * **Les trois mots comptent.** *Accepté* : une Forge n'a pas le contexte vivant
 * d'une séance, donc l'envoyer au loin ne coûte pas la même chose qu'y envoyer
 * une question de table. *Explicite* : le meneur voit et décide. *Jamais
 * automatique* : rien ne bascule dans son dos — c'est aussi pourquoi l'axe F ne
 * dérive pas le fournisseur du moment de jeu.
 *
 * **Mémorisé par Forge, mais toujours affiché.** Le plan insiste sur les deux
 * moitiés : mémoriser sans montrer redonnerait un réglage qu'on a oublié
 * d'avoir posé — *exactement le défaut du coffre Obsidian renseigné en dur*,
 * qui remplaçait la racine documentaire à chaque question sans que personne
 * l'ait demandé.
 */

/** Ce qui distingue deux Forges du point de vue du choix de moteur. */
export type NomDeForge = 'systeme' | 'campagne' | 'trame';

interface EtatDuMoteur {
    /** Le dernier choix par Forge. Absent : on suit le réglage global. */
    choix: Partial<Record<NomDeForge, AIProvider>>;
    retenir: (forge: NomDeForge, provider: AIProvider | undefined) => void;
}

export const useMoteurParForge = create<EtatDuMoteur>()(persist((set) => ({
    choix: {},
    retenir: (forge, provider) => set(etat => {
        const choix = { ...etat.choix };
        // `undefined` veut dire « suivre le réglage global », et c'est un
        // troisième état : le garder sous forme de clé absente évite qu'un
        // `undefined` enregistré se lise plus tard comme un choix.
        if (provider) choix[forge] = provider; else delete choix[forge];
        return { choix };
    }),
}), {
    name: 'gmos-moteur-par-forge',
    partialize: (etat) => ({ choix: etat.choix }),
}));

/**
 * Ce qu'on annonce avant de lancer, **et d'où viennent les chiffres.**
 *
 * Ils sont **mesurés**, pas devinés : ce sont ceux du § 5 du plan du 2026-08-07,
 * pour une Forge Système complète.
 *
 * | | |
 * |---|---|
 * | CPU seul, avant les axes A et E | ~24 à 30 min |
 * | Après A et E | ~9 à 15 min |
 * | Après I — NotebookLM distille | **~2 à 5 min** |
 * | Gemini Flash | **~30 s** |
 *
 * **Une fourchette, jamais un chiffre.** Annoncer « 3 min » et en mettre neuf
 * fait plus de mal que de ne rien dire — c'est déjà la règle d'`attenteAnnoncee`
 * pour les plafonds. *Le meneur doit pouvoir décider, pas être rassuré.*
 */
export const DUREE_ESTIMEE: Partial<Record<AIProvider, string>> = {
    ollama: '~2 à 5 min',
    ollama_cloud: '~1 min',
    gemini: '~30 s',
    openai: '~30 s',
    anthropic: '~30 s',
};

/** Le moteur retenu pour cette Forge, ou celui du réglage global. */
export function moteurDeLaForge(
    forge: NomDeForge,
    choix: Partial<Record<NomDeForge, AIProvider>>,
    global: AIProvider,
): AIProvider {
    return choix[forge] ?? global;
}

/**
 * Cette Forge rentre-t-elle dans le temps de pause qui reste ?
 *
 * *« Pause de 15 min : cette Forge en demande 4, on y va. »* Le plan relève la
 * convergence : **à 25 minutes une Forge ne rentre dans aucune pause honnête ;
 * à 2-5 minutes elle rentre confortablement dans un quart d'heure.**
 *
 * On rend la borne HAUTE de la fourchette : c'est la seule qui permette de dire
 * oui sans se tromper.
 */
export function minutesHautesEstimees(provider: AIProvider): number | undefined {
    const texte = DUREE_ESTIMEE[provider];
    if (!texte) return undefined;
    if (texte.includes('s') && !texte.includes('min')) return 1;
    const nombres = texte.match(/\d+/g);
    if (!nombres) return undefined;
    return Number(nombres[nombres.length - 1]);
}

/**
 * Le moteur d'une Forge, **hors écran** — ce que les services passent en
 * `{ provider }`.
 *
 * Relu au moment de l'appel et jamais mémorisé ailleurs : *un choix recopié
 * quelque part est un choix qui divergera.*
 */
export function moteurRetenu(forge: NomDeForge): AIProvider {
    return moteurDeLaForge(forge, useMoteurParForge.getState().choix, useAIStore.getState().activeProvider);
}
