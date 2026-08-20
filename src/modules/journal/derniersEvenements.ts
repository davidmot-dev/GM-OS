import type { JournalEvent } from './types';

/**
 * Les N derniers événements d'un journal, **dans l'ordre des faits**.
 *
 * **Le journal empile le plus récent en tête** — `events: [newEvent, ...events]`
 * — et c'est un piège, parce que le tableau n'a pas de sens intrinsèque :
 * partout ailleurs dans l'application on empile à la fin, et `slice(-N)` y
 * désigne bien les derniers. Ici il désigne les premiers.
 *
 * **Ce que ça a coûté.** `AIService.getLiveSessionContext` faisait `slice(-10)`
 * et envoyait donc à l'Oracle **le début de la séance sous un intitulé qui
 * annonce la fin**. Trois heures de jeu plus tard, il répondait sur les dix
 * premières minutes, et rien ne le signalait : ni erreur, ni vide, ni
 * incohérence visible — une réponse plausible, simplement fondée sur ce qui ne
 * se joue plus.
 *
 * **Écrit ici pour n'être su qu'une fois.** Le prochain lecteur qui voudra « les
 * derniers événements » n'aura pas à redécouvrir le sens de la pile ; c'est le
 * même remède que celui appliqué aux trois listes de session et aux onze
 * lecteurs du module de santé.
 *
 * L'ordre rendu est chronologique, du plus ancien au plus récent : *un modèle à
 * qui l'on donne une chronologie à l'envers en tire des causes fausses.*
 */
export function lesDerniersEvenements(
    evenements: readonly JournalEvent[] | undefined,
    combien: number,
): JournalEvent[] {
    if (!evenements || combien <= 0) return [];
    // `slice` rend une copie : `reverse` n'a donc rien à retourner dans le store.
    return evenements.slice(0, combien).reverse();
}
