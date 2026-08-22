import { motsDeLaQuestion } from '../../../../electron/motsDeLaQuestion';

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
 * Les mots porteurs d'un texte — **le dictionnaire est commun.**
 *
 * Il vivait ici, et une deuxième copie vivait dans `bookIndex`, et elles ne se
 * ressemblaient pas : celle-ci connaissait `règle` et `fonctionne`, l'autre
 * connaissait `faire` et `peut`. La recherche dans le livre rendait donc
 * « Résumé des règles de combat p.138 » pour une question sur le piratage
 * informatique. *Deux écritures d'une même vérité finissent par en dire deux.*
 */
export const motsPorteurs = motsDeLaQuestion;


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
