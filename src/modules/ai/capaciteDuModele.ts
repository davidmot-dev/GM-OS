import { useAIStore } from '../../stores/useAIStore';

/**
 * **Est-ce que le modèle actif sait REGARDER une image ?**
 *
 * Posé le 2026-09-15, quand David a demandé comment éviter Gemini pour ses PDF
 * et ses images. Le PDF ne passait déjà par aucun modèle — l'extraction est
 * locale. L'image, elle, n'avait qu'un chemin : Gemini.
 *
 * ⭐ **Elle en a désormais deux**, et le second est local : `gemma4:12b` et
 * `gemma4:26b` déclarent la capacité `vision`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI CE MODULE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Un modèle sans vision reçoit l'image, l'ignore, et répond quand même.** On
 * obtient une table inventée à partir de rien : plausible, complète, et fausse
 * de bout en bout. *C'est le mode d'échec le plus cher de ce dépôt — celui qui
 * ne dit rien*, et il aurait été particulièrement cruel ici, puisque la bande de
 * couverture, elle, serait verte.
 *
 * ⚠️ **On distingue trois réponses, pas deux.** « Il voit », « il ne voit pas »,
 * et **« on ne sait pas »** — un Ollama plus ancien ne déclare aucune capacité.
 * Confondre les deux dernières refuserait le geste chez quelqu'un dont le modèle
 * voit très bien. *Une garde qui refuse ce qui marche finit par être
 * contournée.*
 */

export interface VerdictDeVision {
    /** Faux seulement quand on SAIT que non. */
    voit: boolean;
    /** Faux quand la réponse est une supposition — l'écran doit le nuancer. */
    certain: boolean;
    fournisseur: string;
    modele?: string;
    /** Ce qu'on dira au meneur. Toujours rempli quand `voit` est faux. */
    motif?: string;
}

/** La couture d'essai : lire les capacités d'un modèle Ollama. */
export type LecteurDeCapacites = (model: string, endpoint?: string) => Promise<string[] | null>;

const lecteurParDefaut: LecteurDeCapacites = (model, endpoint) =>
    window.appBridge?.ai?.ollamaCapacites?.(model, endpoint) ?? Promise.resolve(null);

/**
 * Les fournisseurs qui reçoivent réellement une pièce jointe.
 *
 * ⛔ **Ce n'est pas une question de modèle mais de CODE** : `AIService` ne
 * compose des images que sur deux branches. Un Claude parfaitement capable de
 * voir ne verra rien tant que sa branche n'en met pas dans sa requête — *et
 * c'est bien le défaut qu'on vient de corriger pour Ollama.*
 */
const FOURNISSEURS_QUI_TRANSMETTENT = new Set(['gemini', 'ollama', 'ollama_cloud']);

export async function leModeleActifVoit(
    lireLesCapacites: LecteurDeCapacites = lecteurParDefaut,
): Promise<VerdictDeVision> {
    const { activeProvider, configs } = useAIStore.getState();
    const modele = configs?.[activeProvider]?.modelId;

    if (!FOURNISSEURS_QUI_TRANSMETTENT.has(activeProvider)) {
        return {
            voit: false, certain: true, fournisseur: activeProvider, modele,
            motif: `GM-OS n’envoie pas d’image à « ${activeProvider} ». `
                + 'Passez sur Ollama avec un modèle qui voit, ou sur Gemini.',
        };
    }

    /* Gemini : le chemin est branché depuis toujours, et le choix du modèle s'y
       fait côté service. On ne va pas interroger une API distante pour ça. */
    if (activeProvider === 'gemini') {
        return { voit: true, certain: true, fournisseur: 'gemini', modele };
    }

    if (!modele) {
        return {
            voit: true, certain: false, fournisseur: activeProvider,
            motif: 'Aucun modèle n’est choisi : impossible de savoir s’il voit.',
        };
    }

    const capacites = await lireLesCapacites(modele, configs?.[activeProvider]?.endpoint);

    if (capacites === null) {
        return {
            voit: true, certain: false, fournisseur: activeProvider, modele,
            motif: `Ollama n’a pas dit ce que « ${modele} » sait faire. `
                + 'Si l’image est ignorée, la table sera inventée.',
        };
    }

    if (capacites.includes('vision')) {
        return { voit: true, certain: true, fournisseur: activeProvider, modele };
    }

    return {
        voit: false, certain: true, fournisseur: activeProvider, modele,
        motif: `« ${modele} » ne sait pas lire d’image. Il répondrait quand même, `
            + 'en inventant. Choisissez un modèle qui déclare « vision ».',
    };
}
