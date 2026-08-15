/**
 * GM-OS — La trame narrative : actes et scènes.
 *
 * **Le constat d'origine, 2026-08-08** : *« GM-OS modélise un monde et des
 * séances, mais jamais une histoire. »* `StoryboardMoment` est une ambiance
 * technique — `musicPadId`, `lightSceneId`, `mapUrl` — et sa liste est plate.
 * `GameSession` n'a aucune structure interne. `ChronicleForgeResult` fabrique un
 * décor, jamais une progression.
 *
 * **Deux niveaux, pas quatre.** Pas d'objet « scénario » distinct : l'acte en
 * tient lieu. Décision de David — *« dans une séance, on est censé savoir dans
 * quel acte on se trouve, et a priori quelles scènes seront jouées. »* Et pas de
 * chapitres, de beats ni d'arcs secondaires : un seul développeur maintient
 * cela.
 *
 * ```text
 * Campagne ──> Actes ──> Scènes
 *                          ▲
 * Séance ───────────────────┘   (traverse des scènes ; n'en est pas le parent)
 * ```
 *
 * **La séance n'est PAS le parent d'une scène.** Une séance coupe la trame
 * arbitrairement : ce sont deux axes qui se croisent, pas une hiérarchie.
 *
 * ---
 *
 * **CE QUI N'EST DÉLIBÉRÉMENT PAS ICI.** Le parcours réel — quelles scènes une
 * séance a traversées, à quelle scène rattacher un événement de journal —
 * appartient à la **capture en partie**, une autre temporalité (plan du
 * 2026-08-15, § 0). Poser ces champs maintenant en ferait des *champs morts qui
 * ont l'air vivants* : rien ne les écrirait, et un écran finirait par les lire
 * comme s'ils disaient quelque chose. Ils viendront avec le code qui les
 * remplit.
 */

/**
 * Comment une scène est née.
 *
 * **Ce n'est pas un choix qu'on demande au meneur.** Le code qui crée la scène
 * le sait : préparée depuis l'écran de trame, ou née d'un combat lancé sans
 * scène active. *« Deux types distincts forceraient à choisir au pire moment :
 * au milieu d'une partie, quand on ne sait pas encore si ce qu'on improvise
 * deviendra important. »* D'où un champ sur un objet unique, et non deux
 * objets — une scène improvisée est une scène ordinaire dont le taux de
 * remplissage est bas.
 */
export type OrigineDeScene = 'preparee' | 'improvisee';

export interface Acte {
    id: string;
    campaignId: string;
    /**
     * Rang dans la campagne.
     *
     * On trie dessus plutôt que de se fier à la position dans le tableau : le
     * store est une liste plate toutes campagnes confondues, et une insertion
     * ailleurs ne doit pas réordonner celle-ci.
     */
    ordre: number;
    titre: string;
    /** L'enjeu de l'acte — ce qui doit se jouer, en une phrase ou deux. */
    resume: string;
    /** Ce que seul le meneur sait. */
    notesDuMeneur?: string;
    /** Vrai quand l'acte est derrière soi. Il reste lisible : on n'efface rien. */
    acheve?: boolean;
}

export interface Scene {
    id: string;
    /**
     * Redondant avec l'acte, et volontairement.
     *
     * Filtrer les scènes d'une campagne est l'opération la plus fréquente de
     * tous les écrans ; passer par l'acte à chaque fois ferait dépendre cette
     * lecture de l'intégrité d'un second lien. `deplacerLaScene` maintient les
     * deux ensemble.
     */
    campaignId: string;
    acteId: string;
    ordre: number;
    titre: string;
    /** Ce qui s'y joue, du point de vue du meneur. */
    resume: string;
    notesDuMeneur?: string;
    origine: OrigineDeScene;

    /*
      LES RENVOIS SONT DES IDENTIFIANTS, JAMAIS DES CONTENUS.

      Précédent et piège, relevé le 2026-08-08 : `SessionModuleSnapshot` capture
      déjà musique, son, ambiance et lumières — mais il embarque les playlists et
      les atmosphères COMPLÈTES en charge utile. Une scène qui ferait pareil
      pèserait des mégaoctets par marquage, et il y en aura une dizaine par
      séance.
    */

    /** Le lieu, dans l'Atlas. */
    lieuId?: string;
    /** Les PNJ présents. */
    entiteIds: string[];
    /** Les indices qui peuvent tomber ici. */
    indiceIds: string[];
    /**
     * L'ambiance qui accompagne la scène.
     *
     * **On LIE, on ne fusionne pas.** Une même ambiance sert plusieurs scènes,
     * et une scène peut changer d'ambiance en cours de route. Confondre les deux
     * objets aurait obligé à dupliquer un moment de storyboard par scène.
     */
    momentDeStoryboardId?: string;

    creeeLe: number;
}
