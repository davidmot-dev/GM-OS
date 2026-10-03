import type { AIModelConfig } from './types';
import { modeleDuMoment, type ModeleDuMoment } from './modeleDuMoment';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { uneSeanceEstOuverte } from '../session/logic/seanceOuverte';

/** Vrai quand une séance de la campagne active est ouverte — la règle du préchauffage. */
export function seanceOuverteMaintenant(): boolean {
    const s = useSessionOSStore.getState();
    return uneSeanceEstOuverte(s.campaigns, s.sessions, s.activeCampaignId);
}

/**
 * **Le modèle Ollama qui répond maintenant**, et sa fenêtre — lu au moment de
 * la requête. Un seul lecteur pour tous ceux qui parlent à Ollama : la requête,
 * le flux de l'Oracle, la garde de vision. *Deux lectures d'une même vérité
 * finissent par en dire deux.*
 */
export function modeleOllamaActuel(config: Partial<AIModelConfig> | undefined): ModeleDuMoment {
    return modeleDuMoment(config, seanceOuverteMaintenant());
}
