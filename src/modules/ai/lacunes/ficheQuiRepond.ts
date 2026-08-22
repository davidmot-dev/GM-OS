/**
 * Quand la fiche **est** la réponse — étage 1 de l'axe M.
 *
 * *« Recherche dans les fiches. Aucun modèle invoqué. »* Et le plan dit
 * pourquoi, en une phrase qui vaut tout le reste : **« la valeur de l'étage 1
 * n'est pas la milliseconde, c'est la TRAÇABILITÉ. »**
 *
 * Une fiche a été forgée depuis un livre, relue par un humain, et elle porte ses
 * sources et ses sections. La faire paraphraser par un modèle n'ajoute rien —
 * *et ajoute une occasion de se tromper*, sur le seul chemin où l'on tenait
 * enfin une réponse dont on connaît l'origine.
 *
 * **Le risque est de répondre avec la mauvaise fiche**, et il est plus grave
 * qu'une paraphrase maladroite : le meneur lirait une règle exacte, tirée d'une
 * source vérifiée, qui ne répond pas à sa question. D'où un rapprochement
 * volontairement **strict**, sans score ni seuil à régler.
 */

/**
 * Les mots qui ne distinguent rien, et qu'on ne compte donc pas.
 *
 * **Les verbes de la seconde moitié interrogent la FORME, jamais le sujet.**
 * « Comment fonctionne l'initiative ? » et « l'initiative » demandent la même
 * chose : le verbe dit qu'on pose une question, il ne dit pas sur quoi.
 *
 * Cette liste connaissait déjà `fonctionne` et `marche` — **au singulier
 * seulement**, et c'est ce qui a coûté quatre fiches sur vingt-et-une le
 * 2026-08-22. « Comment fonctionnent les points de tâche ? » gardait
 * `fonctionnent` parmi ses mots porteurs, et la fiche *Les points de tâche* ne
 * pouvait plus le recouvrir : le rapprochement est un recouvrement STRICT, donc
 * **un seul mot parasite suffit à le faire échouer**.
 *
 * *Une liste qui couvre un verbe à une forme et pas aux autres est une liste qui
 * ne le couvre pas.* Les trois formes qu'une question emploie — troisième
 * personne du singulier, du pluriel, infinitif — sont donc écrites ensemble.
 *
 * **Un seul verbe y entre, et la mesure a dit pourquoi.** Le premier jet
 * ajoutait aussi `résoudre`, `calculer`, `gérer`, `dérouler`, `utiliser`,
 * `appliquer` — et « Comment se résolvent les jets ? » s'est mise à répondre
 * *Jets opposés, aide et coopération*. **La mauvaise fiche.** Privée de son
 * verbe, la question se réduisait à `jets`, un mot générique qui recouvre la
 * première fiche venue.
 *
 * Ces verbes-là **nomment un sujet** dans un corpus de règles : résolution,
 * calcul, déroulement, application. `fonctionner` non — il ne titre jamais
 * rien. *Retirer un mot qui pouvait être le sujet coûte une règle exacte et
 * hors sujet, ce qui est pire que la question restée sans réponse.*
 *
 * `marche` était là avant, seul et au singulier ; on ne le complète pas, parce
 * que la marche est un déplacement autant qu'un verbe et que la même mesure
 * manque pour trancher.
 */
const MOTS_SANS_PORTEE = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'que', 'qui',
    'quoi', 'quel', 'quelle', 'quelles', 'quels', 'est', 'sont', 'ce', 'ces',
    'cette', 'pour', 'sur', 'dans', 'avec', 'en', 'au', 'aux', 'comment',
    'combien', 'pourquoi', 'regle', 'regles', 'jeu',

    'marche',
    'fonctionne', 'fonctionnent', 'fonctionner',
]);

/** Les mots porteurs d'un texte, sans accents ni casse, au singulier. */
export function motsPorteurs(texte: string): string[] {
    return texte
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(m => m.length >= 4 && !MOTS_SANS_PORTEE.has(m))
        .map(m => (m.length > 4 && /[sx]$/.test(m) ? m.slice(0, -1) : m));
}

/**
 * Le sujet de cette fiche recouvre-t-il la question ?
 *
 * **Un recouvrement, et pas un score.** Tous les mots porteurs de l'un doivent
 * se trouver dans l'autre — dans un sens ou dans l'autre, parce que « éthylisme »
 * et « Éthylisme (jet, degrés et malus) » se répondent, mais qu'aucun n'est
 * inclus dans l'autre au sens des chaînes.
 *
 * *Un seuil à régler serait un seuil à re-régler*, et chaque réglage se paierait
 * en réponses exactes hors sujet. Le recouvrement, lui, ne se discute pas : ou
 * bien la question ne parle que de ce dont la fiche parle, ou bien on passe la
 * main au modèle.
 *
 * **Il faut au moins un mot.** Une question sans mot porteur — « et alors ? » —
 * recouvrirait tout, et répondrait avec la première fiche venue.
 */
export function laFicheRepondSeule(sujet: string | undefined, question: string): boolean {
    if (!sujet) return false;

    const deLaFiche = motsPorteurs(sujet);
    const deLaQuestion = motsPorteurs(question);
    if (deLaFiche.length === 0 || deLaQuestion.length === 0) return false;

    const tousDedans = (petits: string[], grands: string[]) =>
        petits.every(m => grands.includes(m));

    return tousDedans(deLaQuestion, deLaFiche) || tousDedans(deLaFiche, deLaQuestion);
}

/**
 * La section « Règle » d'une fiche, ou tout son corps à défaut.
 *
 * **C'est la section qui répond.** Les fiches v3 portent « Règle », « Valeurs »,
 * « À la table », « Cas limites » et « Non couvert » : rendre le tout noierait
 * la réponse sous l'inventaire, et rendre autre chose que « Règle » demanderait
 * de deviner ce que le meneur cherche.
 *
 * **Le corps entier en secours, jamais rien.** Une fiche sans section « Règle »
 * est une fiche ancienne ou faite à la main : la taire reviendrait à perdre la
 * seule réponse traçable qu'on avait.
 */
export function extraireLaRegle(markdown: string): string {
    const sansEntete = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
    const lignes = sansEntete.split(/\r?\n/);

    /*
      **Un decoupage par lignes, pas une expression.** La premiere redaction
      cherchait la section d'un seul motif, avec une reprise paresseuse et une
      assertion de fin : elle rendait du VIDE et retombait sur le corps entier —
      donc elle « marchait », en montrant tout. *Un repli qui masque l'echec du
      chemin nominal est pire qu'une erreur.*
    */
    const debut = lignes.findIndex(l => /^##\s+R[èe]gle\s*$/i.test(l.trim()));
    if (debut === -1) return sansEntete.trim();

    const suite = lignes.slice(debut + 1);
    const fin = suite.findIndex(l => /^##\s/.test(l));
    const texte = (fin === -1 ? suite : suite.slice(0, fin)).join('\n').trim();

    return texte || sansEntete.trim();
}
