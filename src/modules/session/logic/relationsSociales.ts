import type { EntityRelation } from '../../../types/entity.types';

/**
 * **Ce qu'est une relation sociale — une seule écriture, quatre lecteurs.**
 *
 * Avant ce module, la même vérité était écrite **quatre fois** : l'union des
 * types dans `entity.types.ts`, la palette dans un `switch` de `SocialGraph`,
 * la même palette recopiée dans `NodeDetailPanel`, et la liste des choix dans
 * `RelationForm`. Elles avaient divergé — et pas discrètement.
 *
 * **Le défaut que ça corrige, trouvé le 2026-08-31.** Trois types n'avaient
 * aucun libellé (`romantic`, `mentor`, `other`) et trois libellés n'avaient
 * aucun type (`friend`, `subordinate`, `superior`). Le formulaire avait comblé
 * l'écart **en empruntant le libellé du voisin** :
 *
 * | Ce que le meneur choisissait | Ce qui était enregistré |
 * | --- | --- |
 * | « Ami » | `romantic` |
 * | « Neutre » *(première ligne)* | `mentor` |
 * | « Neutre » *(seconde ligne)* | `neutral` |
 *
 * Deux entrées portaient donc le même mot, déclarer une amitié posait une
 * romance, et `other` n'était pas proposé du tout. *Un contrôle qui enregistre
 * autre chose que ce qu'il affiche est pire qu'un contrôle absent : on ne
 * soupçonne pas ce qu'on a soi-même choisi.*
 *
 * **Le typage rend la table exhaustive** : `Record<EntityRelation['type'], …>`
 * refuse de compiler si l'on ajoute un type à l'union sans lui donner ici sa
 * couleur, son libellé et son affinité. *Un nouveau type ne peut plus naître
 * muet.*
 */
export interface NatureDeRelation {
    /** La clé i18n, sous `modules:session.social_graph.legend`. */
    cle: string;
    /** Sa couleur dans le graphe et sur les étiquettes. */
    couleur: string;
    /**
     * **Ce que la relation fait à la physique du graphe.**
     *
     * Un facteur appliqué à la distance de lien réglée par le meneur : au-dessous
     * de 1, les deux nœuds se rapprochent ; au-dessus, ils s'écartent. La
     * distance globale reste son curseur — *on module ce qu'il a choisi, on ne
     * le remplace pas.*
     *
     * Les valeurs disent quelque chose de simple et lisible à l'œil : une
     * famille se tient serrée, une hostilité se tient à distance, et le reste
     * flotte entre les deux.
     */
    affinite: number;
}

/**
 * Les huit natures, et tout ce qu'on en sait.
 *
 * L'ordre est celui du formulaire : les liens chaleureux, puis les tièdes, puis
 * les froids. *Une liste de choix se lit, elle ne se trie pas par ordre
 * d'apparition dans le code.*
 */
export const NATURES_DE_RELATION: Record<EntityRelation['type'], NatureDeRelation> = {
    family:   { cle: 'family',   couleur: '#eab308', affinite: 0.6 },
    ally:     { cle: 'ally',     couleur: '#22c55e', affinite: 0.7 },
    romantic: { cle: 'romantic', couleur: '#d946ef', affinite: 0.6 },
    mentor:   { cle: 'mentor',   couleur: '#3b82f6', affinite: 0.8 },
    neutral:  { cle: 'neutral',  couleur: '#94a3b8', affinite: 1 },
    other:    { cle: 'other',    couleur: '#94a3b8', affinite: 1 },
    rival:    { cle: 'rival',    couleur: '#f97316', affinite: 1.3 },
    hostile:  { cle: 'hostile',  couleur: '#ef4444', affinite: 1.5 },
};

/** Les natures dans l'ordre où on les propose. */
export const NATURES_ORDONNEES = Object.keys(NATURES_DE_RELATION) as EntityRelation['type'][];

/**
 * La nature d'un type, **y compris quand il n'en est pas un**.
 *
 * Les liens du graphe portent un `type: string` — ils viennent de données
 * persistées, écrites par des versions antérieures et par la Forge. *Une
 * campagne d'avril ne doit pas faire tomber un écran de septembre* : un type
 * inconnu retombe sur `other`, gris et neutre, plutôt que sur `undefined`.
 */
export function natureDe(type: string): NatureDeRelation {
    return NATURES_DE_RELATION[type as EntityRelation['type']] ?? NATURES_DE_RELATION.other;
}

/** La couleur d'une relation — l'unique écriture, désormais. */
export const couleurDeRelation = (type: string): string => natureDe(type).couleur;

/**
 * **La distance que ce lien impose, à partir de celle que le meneur a réglée.**
 *
 * C'est l'« influence sur la physique du graphe » du jalon d'avril 2026. Elle
 * n'existait pas : `d3Force('link').distance(graphDistance)` posait **la même
 * distance pour tout le monde**, et le graphe disait donc exactement autant
 * qu'un tableau — les couleurs distinguaient, la disposition non.
 *
 * *Une famille qu'on voit serrée et une inimitié qu'on voit à l'écart, c'est
 * l'information que le meneur cherche en ouvrant un graphe plutôt qu'une
 * liste.*
 */
export const distanceDeRelation = (type: string, distanceDeBase: number): number =>
    Math.round(distanceDeBase * natureDe(type).affinite);

/**
 * **Le nom que le meneur donne à CETTE relation, ou celui de sa nature.**
 *
 * *Le patron est celui de `RangeInfo` du Cortex* — `category` est canonique et
 * sert à comparer, `label` est le mot que le jeu emploie. Ici, `type` décide de
 * la couleur et de la physique, `libelle` décide de ce qui s'affiche.
 *
 * **C'est ce qui rend les types personnalisés gratuits** : « Serment de sang »
 * fondé sur `ally` s'attire comme un allié, se colore comme un allié, et porte
 * son nom. Aucune migration, aucune donnée existante invalidée, et le graphe
 * continue de vouloir dire quelque chose — *un type entièrement libre aurait
 * rendu la physique et la palette indécidables.*
 */
export function libelleDeRelation(
    /*
      `type: string` et non l'union : les liens du graphe viennent de données
      persistées, et `natureDe` sait déjà retomber sur `other`. *Resserrer le
      type ici forcerait un cast chez l'appelant, c'est-à-dire une affirmation
      que rien ne vérifie.*
    */
    relation: { type: string; libelle?: string },
    traduire: (cle: string) => string,
): string {
    const propre = relation.libelle?.trim();
    if (propre) return propre;
    return traduire(`modules:session.social_graph.legend.${natureDe(relation.type).cle}`);
}
