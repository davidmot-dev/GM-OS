import type { Atteinte } from './atteinteDeLaRecherche';

/**
 * Le jugement de table — **étage 3 de l'axe M.**
 *
 * *« À défaut d'une fiche et à défaut du livre, une proposition en deux lignes,
 * annoncée comme n'étant pas la règle officielle. »*
 *
 * **C'est l'étage le plus incertain, et c'est aussi le plus rapide** : deux
 * lignes font une soixantaine de jetons, soit une dizaine de secondes. Le plan
 * le relève comme une propriété heureuse — *on ne fait pas attendre le meneur
 * pour la réponse dont on est le moins sûr.*
 *
 * **Quatre exigences, et elles ne se négocient pas.** Elles sont dans le plan du
 * 2026-08-07, et chacune porte sa raison.
 */

/**
 * Faut-il juger plutôt que répondre ?
 *
 * **Seulement quand la recherche n'a RIEN atteint.** Un document non vérifié a
 * beau être faible, il est une source : la réponse qu'il nourrit n'est pas une
 * invention, et l'annoncer comme un jugement de table serait se calomnier.
 *
 * *L'étiquette doit rester rare pour rester lue* — apposée sur tout ce qui n'est
 * pas une fiche, elle deviendrait un ornement que l'œil saute.
 */
export function doitJuger(atteinte: Atteinte): boolean {
    return atteinte === 'rien';
}

/**
 * Ce qu'on ajoute à l'invite quand aucune source n'a répondu.
 *
 * **Trois des quatre exigences vivent ici** ; la quatrième — l'étiquette avant
 * le contenu — est posée par l'écran, et c'est délibéré : *une consigne de
 * placement se perd, un composant ne se trompe pas.* Un modèle qui oublie de
 * commencer par « Jugement de table » produirait exactement le défaut que
 * l'exigence existe pour empêcher.
 */
export const CONSIGNE_DE_JUGEMENT = [
    'AUCUNE RÈGLE DU CORPUS NE COUVRE CETTE QUESTION.',
    // **La longueur EST le signal.** Une réponse courte se lit comme une
    // proposition, une longue comme une autorité — et le meneur adopte ce qui a
    // l'air d'une autorité.
    'Réponds en DEUX LIGNES MAXIMUM, comme une proposition de jugement de table,',
    'pas comme une règle.',
    // **Un ruling qui cite a l'apparence d'une règle**, et l'absence de source
    // EST l'information : c'est elle qui dit au meneur qu'il décide.
    'NE CITE AUCUNE SOURCE, aucun numéro de page, aucun titre de section :',
    'tu n\'en as aucune, et en inventer une ferait passer ta proposition pour la règle.',
    'N\'annonce pas non plus que tu juges — l\'application le dit déjà.',
].join(' ');

/**
 * Le mot que l'écran pose **avant** la réponse.
 *
 * *Placée après, l'étiquette arrive quand le meneur a déjà adopté la réponse* —
 * c'est l'exigence la plus subtile des quatre, et celle qu'on aurait perdue en
 * la confiant au modèle.
 */
export const ETIQUETTE_DU_JUGEMENT = 'Jugement de table — pas la règle officielle';
