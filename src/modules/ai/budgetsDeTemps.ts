/**
 * **Combien de temps on accorde à une requête, et pourquoi — axes D.4 et D.5.**
 *
 * *« Le prévisible vaut mieux que le rapide : 90 s systématiques valent mieux
 * que 30 s le plus souvent et 8 min parfois. »*
 *
 * **Ce que ce module remplace.** Trois plafonds vivaient chacun de leur côté et
 * ne s'accordaient sur rien : 45 minutes pour le modèle (`AIService`, écrit deux
 * fois), 10 minutes pour le MCP (`ForgeService`), et **rien du tout** pour la
 * génération d'image. Aucun ne consultait le moment de jeu, alors que le signal
 * existe depuis toujours — une séance ouverte ou non — et qu'il change tout :
 * quarante-cinq minutes d'attente en préparation sont normales, en pleine partie
 * elles sont absurdes.
 *
 * **Le budget suit le moment, jamais l'usage.** Une Forge lancée en séance ne
 * mérite pas plus de patience qu'autre chose : c'est le meneur qui attend, et
 * ses joueurs avec lui.
 */

/** Les deux moments, tels que le § 1.1 du plan du 2026-08-07 les nomme. */
export type MomentDeJeu = 'preparation' | 'partie';

/**
 * Les budgets, en millisecondes.
 *
 * **Ils viennent d'un constat de David, pas d'une intuition** : chercher une
 * règle dans un livre papier prend déjà une à deux minutes, donc une réponse
 * d'Oracle en 90 s n'est pas un échec. Le Cortex est plus serré — non parce
 * qu'il serait plus lent, mais parce que **son conseil se périme** : un avis
 * tactique arrivé après que le joueur a agi ne vaut rien, alors qu'une réponse
 * de règle reste valable.
 */
export const BUDGETS: Record<MomentDeJeu, number> = {
    /**
     * En préparation, on travaille en tâche de fond. Quarante-cinq minutes
     * étaient déjà le plafond du modèle ; on le garde, faute d'une mesure qui
     * justifierait de le baisser — *ça se mesure, ça ne s'intuite pas.*
     */
    preparation: 45 * 60 * 1000,
    /**
     * En partie, cinq minutes. C'est déjà long — le § 1.1 vise une à deux
     * minutes pour l'Oracle — mais c'est un PLAFOND, pas une cible : il n'est
     * là que pour empêcher l'attente sans fin, et il doit laisser passer une
     * Forge courte lancée par mégarde plutôt que de la couper au milieu.
     */
    partie: 5 * 60 * 1000,
};

/**
 * Le moment de jeu, **lu globalement et jamais par campagne**.
 *
 * **La précaution que le § 1.2 exige, et la raison est vicieuse.** Les lecteurs
 * d'interface testent `activeCampaign.activeSessionId`. Or une seule séance est
 * active globalement : changer de campagne ferait passer l'indicateur à `null`
 * et **éteindrait le mode sans que rien ne soit terminé**, débloquant en silence
 * les budgets longs en pleine partie.
 *
 * **Un seul signal, celui que le meneur contrôle.** D'autres existent — combat
 * en cours, Hub ouvert, tablette connectée — et les mélanger serait une erreur :
 * *toute la valeur du signal vient de ce qu'il est déclaré, pas inféré.* Un mode
 * mi-déclaré mi-deviné redevient imprévisible, donc indigne de confiance.
 */
export function momentDeJeu(sessions: readonly { status?: string }[] | undefined): MomentDeJeu {
    return sessions?.some(s => s.status === 'active') ? 'partie' : 'preparation';
}

/** Le budget du moment courant. */
export function budgetDuMoment(sessions: readonly { status?: string }[] | undefined): number {
    return BUDGETS[momentDeJeu(sessions)];
}

/**
 * Ce qu'on annonce à l'écran plutôt qu'une animation indéterminée — **axe D.5.**
 *
 * **Le défaut : « réception de la vision… » sans fin annoncée.** Une attente
 * qu'on ne peut pas borner *se ressent* plus longue qu'elle n'est, et rien ne
 * distinguait une réponse qui arrive d'une requête perdue. Le plan est explicite
 * sur le remède : afficher une estimation, pas une animation.
 *
 * **On annonce le PLAFOND, pas une prédiction.** Prédire la durée d'une
 * génération demanderait de connaître la machine, le modèle et la longueur de la
 * réponse ; se tromper en annonçant « 20 s » ferait plus de mal que de ne rien
 * dire. Le plafond, lui, est une promesse qu'on tient toujours : *au pire,
 * ça s'arrête là.*
 */
export function attenteAnnoncee(budget: number): string {
    /*
      Le seuil porte sur la DURÉE, pas sur les minutes arrondies : 90 s
      s'arrondissaient à 2 minutes et s'annonçaient donc « 2 min au plus »,
      c'est-à-dire une promesse plus lâche que la vraie. Un plafond annoncé
      au-dessus du plafond réel est le seul sens dans lequel ce message peut
      mentir sans qu'on s'en aperçoive.
    */
    if (budget < 120_000) return `${Math.round(budget / 1000)} s au plus`;
    return `${Math.round(budget / 60000)} min au plus`;
}
