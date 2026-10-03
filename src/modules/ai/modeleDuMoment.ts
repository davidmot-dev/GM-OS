import type { AIModelConfig } from './types';

/**
 * **Un modèle pour préparer, un autre pour jouer** — demandé par David le
 * 2026-10-03 : *« utiliser gemma4 quand je suis hors session (pour forger…) et
 * lfm2.5 en session pour avoir des réponses plus rapides »*.
 *
 * **Le signal est la séance ouverte** (`uneSeanceEstOuverte`), le même que le
 * préchauffage — **pause comprise** : une pause qui rebasculerait sur le
 * modèle de préparation déchargerait l'un et rechargerait l'autre deux fois en
 * un quart d'heure, sur une mémoire partagée avec l'iGPU.
 *
 * Sans modèle de séance déclaré, rien ne change : c'est le cas de toute
 * installation d'avant ce réglage.
 */
export interface ModeleDuMoment {
    model: string;
    /** La fenêtre de contexte demandée ; absente, le service garde son défaut (16 384). */
    num_ctx?: number;
    /** Vrai quand c'est le modèle de séance qui répond. */
    enSeance: boolean;
}

/** Les fenêtres proposées au meneur — des puissances de deux, celles qu'Ollama alloue sans perte. */
export const FENETRES_DE_CONTEXTE = [8192, 16384, 32768, 65536] as const;

/** Une fenêtre lisible, ou `undefined` : une valeur hors des bornes ne part jamais vers Ollama. */
export function fenetreValide(n: number | undefined): number | undefined {
    return typeof n === 'number' && Number.isInteger(n) && n >= 2048 && n <= 131072 ? n : undefined;
}

export function modeleDuMoment(
    config: Partial<AIModelConfig> | undefined,
    seanceOuverte: boolean,
    repli = 'phi3',
): ModeleDuMoment {
    const deSeance = config?.modeleEnSeance?.trim();
    if (seanceOuverte && deSeance) {
        return { model: deSeance, num_ctx: fenetreValide(config?.contexteEnSeance), enSeance: true };
    }
    return { model: config?.modelId || repli, num_ctx: fenetreValide(config?.contexte), enSeance: false };
}
