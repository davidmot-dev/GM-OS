/**
 * Ce qu'une question demande — **un seul dictionnaire, un seul découpage.**
 *
 * **Le défaut qu'il corrige.** Quatre listes de mots sans portée vivaient dans
 * le dépôt, toutes différentes, et toutes censées répondre à la même question :
 * *« quels mots de cette phrase désignent un sujet ? »*
 *
 * | Liste | Connaissait | Ignorait |
 * |---|---|---|
 * | `ficheQuiRepond` | `règle`, `jeu`, `fonctionne` | `faire`, `peut`, `quand` |
 * | `bookIndex` | `faire`, `fait`, `peut`, `quand` | `règle`, `jeu`, `fonctionne` |
 * | `atteinteDeLaRecherche` | les pronoms | les verbes |
 * | `ragSelection` | le vocabulaire de table | — |
 *
 * Conséquence mesurée le 2026-08-22 sur le corpus Rêves de Dragons : la
 * recherche dans le livre rendait **« Résumé des règles de combat p.138 »** pour
 * une question sur le piratage informatique, parce que `règles` comptait comme
 * un mot porteur de son côté et pas de l'autre. *Le meneur allait à la page
 * indiquée et n'y trouvait rien.*
 *
 * `ragSelection` garde la sienne à dessein : elle sert à **classer des
 * documents**, pas à comprendre une question, et y retirer un mot ne fait perdre
 * qu'un peu de rang. Ici, un mot de trop fait échouer un recouvrement strict, et
 * un mot de moins fait citer une page au hasard.
 *
 * Module sans dépendance à `electron` ni à `node` : utilisable des deux côtés du
 * pont, comme `corpusSysteme`.
 */

/**
 * Les mots qui ne distinguent rien, et qu'on ne compte donc pas.
 *
 * **Les verbes de la dernière ligne interrogent la FORME, jamais le sujet.**
 * « Comment fonctionne l'initiative ? » et « l'initiative » demandent la même
 * chose : le verbe dit qu'on pose une question, il ne dit pas sur quoi.
 *
 * **Un seul verbe y figure à toutes ses formes, et c'est la mesure qui l'a
 * décidé.** Le premier jet ajoutait `résoudre`, `calculer`, `gérer`,
 * `dérouler` — et « Comment se résolvent les jets ? » s'est mise à répondre
 * *Jets opposés, aide et coopération* : **la mauvaise fiche**, parce que la
 * question privée de son verbe ne pesait plus que `jets`. Ces verbes-là
 * **nomment un sujet** dans un corpus de règles — résolution, calcul,
 * déroulement. `fonctionner` non, il ne titre jamais rien.
 *
 * *Retirer un mot qui pouvait être le sujet coûte une règle exacte et hors
 * sujet, ce qui est pire que la question restée sans réponse.*
 */
export const MOTS_SANS_PORTEE = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'que', 'qui',
    'quoi', 'quel', 'quelle', 'quelles', 'quels', 'est', 'sont', 'ce', 'ces',
    'cette', 'pour', 'sur', 'dans', 'avec', 'en', 'au', 'aux', 'comment',
    'combien', 'pourquoi', 'quand', 'faire', 'fait', 'peut',
    'regle', 'regles', 'jeu', 'marche',

    'fonctionne', 'fonctionnent', 'fonctionner',
]);

/**
 * Les mots porteurs d'un texte, sans accents ni casse, au singulier.
 *
 * **Le même découpage des deux côtés de toute comparaison.** Une question se
 * compare au `sujet:` d'une fiche, au titre d'une entrée d'index, à une autre
 * question — et si les deux côtés ne se découpent pas pareil, la comparaison
 * ment. *C'était le cas : la recherche dans le livre comparait des mots normalisés
 * à des titres bruts, par sous-chaîne, et `fonctionne` attrapait « Fonctionnement ».*
 */
export function motsDeLaQuestion(texte: string): string[] {
    return texte
        .normalize('NFD')
        // `\p{Mn}` plutôt qu'un intervalle littéral de diacritiques : la source
        // reste en ASCII pur, et survit à un aller-retour d'encodage.
        .replace(/\p{Mn}/gu, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(m => m.length >= 4 && !MOTS_SANS_PORTEE.has(m))
        .map(m => (m.length > 4 && /[sx]$/.test(m) ? m.slice(0, -1) : m));
}
