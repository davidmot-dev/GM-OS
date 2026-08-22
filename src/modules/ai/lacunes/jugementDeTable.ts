import { estUneLacune, type Atteinte } from './atteinteDeLaRecherche';

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
 * **Les deux conditions du plan, enfin toutes les deux.** Il dit *« à défaut
 * d'une fiche ET à défaut du livre »* ; le code n'en tenait aucune, il tenait un
 * substitut — *« aucune source retenue »*.
 *
 * Ce substitut a cessé d'être atteignable le jour où le corpus s'est enfin
 * résolu. La sélection n'a **aucun seuil de pertinence** : tout fichier du
 * périmètre devient candidat, et le budget seul décide. Il y a donc toujours au
 * moins une source, et `rien` n'arrive plus jamais. *L'étiquette que David a vue
 * fonctionner le 2026-08-22 marchait parce que le corpus était encore cassé.*
 *
 * **Le livre est ce qui rend la règle sûre.** Sans lui, on apposerait
 * « pas la règle officielle » sur une réponse qu'une fiche voisine couvrait
 * peut-être dans son corps de texte — *se calomnier*, exactement ce que la
 * rédaction précédente redoutait. Avec lui, on ne juge que ce dont **ni le
 * corpus ni l'ouvrage** ne parlent.
 *
 * *L'étiquette doit rester rare pour rester lue* — et deux conditions la gardent
 * plus rare qu'un seuil qu'il faudrait régler.
 */
export function doitJuger(atteinte: Atteinte, leLivreEnParle: boolean): boolean {
    return estUneLacune(atteinte) && !leLivreEnParle;
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
