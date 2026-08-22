/**
 * Les options de génération du modèle local — **une seule écriture, deux
 * lecteurs.**
 *
 * **Pourquoi un fichier à part.** Le service Ollama vit dans le processus
 * principal et importe les API d'Electron ; la Forge, qui a besoin de connaître
 * la fenêtre de contexte pour ne pas envoyer quatre fois ce qui y entre, vit
 * dans le renderer. L'importer depuis `OllamaService` a fait tomber deux
 * fichiers de tests d'un coup — *`require is not defined in ES module scope`*,
 * le piège du greffon Electron déjà consigné.
 *
 * Recopier le nombre aurait été pire : **deux écritures d'une même vérité**, et
 * celle de la Forge aurait vieilli sans que rien ne le dise. C'est le motif de
 * la semaine, et il ne coûte ici qu'un fichier de constantes.
 */

export const OPTIONS_PAR_DEFAUT = {
    /**
     * Fenêtre demandée. Ne la fixe pas au maximum de l'architecture : le cache
     * clé-valeur est alloué en conséquence, et il partage la mémoire de l'iGPU
     * avec le modèle.
     */
    num_ctx: 16384,
    /**
     * Plafond de génération. Un fragment de pilote fait quelques centaines de
     * tokens ; deux mille laissent de la marge sans permettre la fuite.
     */
    num_predict: 2048,
} as const;
