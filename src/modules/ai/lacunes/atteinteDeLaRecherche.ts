import { laFicheRepondSeule } from './ficheQuiRepond';

/**
 * Ce que la recherche a atteint — **le socle du journal des lacunes.**
 *
 * **Axe M du plan du 2026-08-07, étage 4**, que le plan appelle *« la meilleure
 * idée du lot »* : chaque question note ce que la recherche a atteint, et les
 * catégories qui ne sont pas une fiche **sont la file de travail de la Forge**.
 *
 * **Ce que ça change.** Les sujets à forger cessent d'être choisis à
 * l'intuition : *l'usage réel en séance les désigne.* On ne forge plus ce qu'on
 * imagine manquant, on forge ce qui a manqué.
 *
 * **Et il se remplit sans intervention.** Décision du plan : **pas de pouces
 * haut/bas** — à table, ils créent une friction et ne sont jamais cliqués. Une
 * question posée est déjà le signal ; une question reformulée dans la minute en
 * est un second, gratuit.
 */

/**
 * Les états qu'une recherche peut atteindre, **du plus solide au plus fragile.**
 *
 * **`fiche-hors-sujet` a été ajouté le 2026-08-22, sur un cas de table.**
 * « Comment se calculent les dégâts de chute ? » retenait deux fiches — *Dégâts
 * et types de dégâts*, *Environnement et dangers* — dont aucune ne parle de la
 * chute. Le meneur repartait sans règle, **sans renvoi au livre et sans que la
 * Forge apprenne le manque** : la recherche avait touché une fiche, donc tout
 * allait bien.
 *
 * Deux verdicts portaient déjà sur la même chose et se contredisaient : l'étage
 * 1 disait *« aucune fiche ne couvre cette question »* pendant que l'étage 4
 * disait *« une fiche a répondu »*. **Deux écrivains pour une même vérité.**
 * C'est désormais le test de l'étage 1 qui tranche, ici comme là-bas.
 *
 * Un état distinct plutôt qu'un repli sur `document` : *« rien du tout »* et
 * *« des fiches voisines, mais aucune qui couvre »* sont deux manques de nature
 * différente, et ils ne se forgent pas pareil — le second dit même **où** aller,
 * puisqu'il nomme les fiches à étendre.
 *
 * `index` manque à cette liste, et c'est délibéré : il appartient à l'étage 2 de
 * l'axe M — la référence dans le livre — qui n'est pas construit. *Déclarer une
 * valeur qu'aucun chemin ne produit ferait un champ mort de plus*, et le dépôt
 * en a compté trois en une seule journée.
 */
export const ATTEINTES = ['fiche', 'fiche-hors-sujet', 'document', 'rien'] as const;
export type Atteinte = typeof ATTEINTES[number];

/**
 * Une source telle que le moteur la rend.
 *
 * Le `sujet:` compte autant que la provenance : c'est lui qui dit si la fiche
 * parle de ce qu'on a demandé, ou seulement de quelque chose de voisin.
 */
export interface SourceAtteinte {
    provenance: string;
    sujet?: string;
}

/**
 * Classe une réponse d'après ce qui l'a nourrie.
 *
 * **Une fiche du corpus est la seule réponse pleine.** Elle a été forgée depuis
 * un livre, elle porte ses sources et ses sections, et l'Oracle sait dire d'où
 * elle vient. Tout le reste — une décharge brute, des notes de campagne — a
 * répondu **sans être une règle vérifiée**, et mérite d'entrer dans la file.
 *
 * **Aucune source du tout, c'est le cas le plus grave** : le modèle a répondu de
 * lui-même, et rien dans sa réponse ne le dit. *Une recherche qui n'atteint rien
 * produit tout de même une réponse confiante.*
 *
 * **La question est un paramètre, et elle devait l'être.** « Une fiche a-t-elle
 * répondu ? » ne se juge pas sur la seule provenance : une fiche voisine est
 * retenue par la recherche sans rien dire de ce qu'on demandait. Le juge est
 * `laFicheRepondSeule`, **le même que celui de l'étage 1** — le rendre commun
 * était tout l'objet du correctif.
 */
export function atteinteDeLaRecherche(
    sources: readonly SourceAtteinte[],
    question: string,
): Atteinte {
    if (sources.length === 0) return 'rien';

    const fiches = sources.filter(s => s.provenance === 'fiche');
    if (fiches.length === 0) return 'document';

    return fiches.some(f => laFicheRepondSeule(f.sujet, question))
        ? 'fiche'
        : 'fiche-hors-sujet';
}

/**
 * Cette question a-t-elle sa place dans la file de travail ?
 *
 * **Une fiche voisine ne comble pas le manque.** « Dégâts et types de dégâts »
 * a beau être retenue pour « comment se calculent les dégâts de chute ? », elle
 * ne dit rien de la chute — et le meneur repartait sans règle, sans renvoi au
 * livre, et sans que la Forge apprenne qu'il lui manquait quelque chose.
 */
export function estUneLacune(atteinte: Atteinte): boolean {
    return atteinte !== 'fiche';
}

/**
 * La clé sous laquelle deux questions se regroupent.
 *
 * **« Regrouper avant de forger », dit le plan, sinon dix questions sur
 * l'ivresse produisent dix fiches au lieu d'une.** Le regroupement se fait sur
 * la question normalisée — sans accents, sans casse, sans ponctuation — et pas
 * plus : *un rapprochement approximatif fusionnerait deux sujets voisins mais
 * distincts, et on forgerait une fiche pour une question que personne n'a
 * posée.*
 *
 * Les mots vides les plus courants tombent, parce que « quelle est la règle pour
 * l'ivresse » et « règles d'ivresse » sont la même demande — et que les garder
 * ferait deux entrées pour un seul manque.
 */
const MOTS_VIDES = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l', 'et', 'ou',
    'que', 'qui', 'quoi', 'quel', 'quelle', 'quelles', 'quels', 'est', 'sont',
    'ce', 'ces', 'cette', 'pour', 'sur', 'dans', 'avec', 'en', 'a', 'au', 'aux',
    'comment', 'combien', 'pourquoi', 'je', 'il', 'on', 'y', 'se', 'sa', 'son',
]);

/**
 * Une règle unique et grossière : le pluriel français tombe.
 *
 * **Le projet refuse ce genre de rapprochement ailleurs**, et à raison : le
 * rapprochement flou de `fichesSupplantees` a été écarté parce qu'*« ici une
 * erreur déplacerait un fichier »*. Ici, une erreur de regroupement coûte **une
 * ligne de trop dans une file de travail** — et la refuser coûterait deux
 * entrées pour un seul manque, ce qui est exactement le défaut que le
 * regroupement existe pour éviter.
 *
 * Bornée aux mots de plus de trois lettres, pour que « pas » et « bois » ne se
 * fassent pas amputer.
 */
function auSingulier(mot: string): string {
    return mot.length > 3 && /[sx]$/.test(mot) ? mot.slice(0, -1) : mot;
}

export function clefDeRegroupement(question: string): string {
    return question
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .filter(mot => mot && !MOTS_VIDES.has(mot))
        .map(auSingulier)
        .sort()
        .join(' ');
}
