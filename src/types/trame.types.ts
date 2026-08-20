/**
 * GM-OS — La trame narrative : actes et scènes.
 *
 * **Le constat d'origine, 2026-08-08** : *« GM-OS modélise un monde et des
 * séances, mais jamais une histoire. »* `StoryboardMoment` est une ambiance
 * technique — `musicPadId`, `lightSceneId`, `mapUrl` — et sa liste est plate.
 * `GameSession` n'a aucune structure interne. `ChronicleForgeResult` fabrique un
 * décor, jamais une progression.
 *
 * *(La Forge de chronique a été retirée le 2026-08-17, et `ChronicleForgeResult`
 * avec elle. Le constat reste : c'est lui qui a fait naître ce modèle. C'est la
 * Forge de campagne qui écrit désormais actes et scènes.)*
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
 * **LE PARCOURS RÉEL EST ARRIVÉ, LE 2026-08-17.** Ce bloc disait jusqu'ici qu'il
 * était écarté — *« poser ces champs maintenant en ferait des champs morts qui
 * ont l'air vivants ; ils viendront avec le code qui les remplit. »* La condition
 * est remplie : `passages` et `termineeLe` naissent avec les boutons qui les
 * écrivent (Commencer, Terminer, et la reprise à l'ouverture d'une séance).
 *
 * Le déclencheur est un constat de David, vérifié : il déclarait son acte et ses
 * scènes en préparation, puis lançait la séance — et **aucun écran de jeu ne
 * montrait la trame**. `PanneauDeTrameDeSeance` n'était monté que dans
 * `SessionFocusEditor`, l'écran de préparation. Le plan existait, on le perdait
 * de vue au moment de jouer.
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

/**
 * Une tranche de jeu passée dans une scène, bornée.
 *
 * **Pourquoi une LISTE et non deux dates.** Décision de David le 2026-08-17,
 * contre le modèle simple : une scène reprise après une pause perdrait son
 * premier passage, et *le journal ne saurait plus rattacher ce qui s'y est dit
 * ce soir-là*. Le journal vient ensuite ; changer de modèle après coup aurait
 * demandé de réécrire les scènes déjà jouées.
 *
 * Un passage sans `fin` est **le passage en cours** — il n'y en a jamais deux.
 */
export interface PassageDeScene {
    debut: number;
    /** Absente tant que la scène est ouverte. */
    fin?: number;
    /**
     * La séance pendant laquelle ce passage a eu lieu.
     *
     * Facultative parce qu'une scène peut s'ouvrir hors séance — on ne refuse
     * pas au meneur d'avancer sa trame un dimanche après-midi.
     */
    seanceId?: string;
}

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
    /**
     * Les personnages joueurs présents dans cette scène.
     *
     * **Le champ sans lequel les scènes simultanées ne servent à rien.** Le
     * modèle sait depuis le 2026-08-17 qu'un groupe séparé, ce sont deux scènes
     * ouvertes en même temps — mais rien ne disait **qui est où**, et c'est
     * pourtant la seule chose que le meneur ait besoin de relire à ce
     * moment-là. Relevé par David en voyant le panneau tourner.
     *
     * Facultatif, comme `passages` : les scènes d'avant n'en portent pas, et le
     * déclarer obligatoire le rendrait `undefined` à l'exécution en prétendant
     * le contraire.
     *
     * **Il n'entre pas dans le taux de préparation.** Qui est présent est un
     * fait de partie, pas un élément qu'on prépare : le compter ferait chuter la
     * pastille de toutes les scènes déjà écrites, et pour une raison fausse.
     */
    personnagesIds?: string[];
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

    /**
     * Ce que la scène a réellement vécu, dans l'ordre.
     *
     * **Facultatif, et lu partout avec `?? []`.** Les scènes écrites avant le
     * 2026-08-17 n'en portent pas — les 29 du « Secret de Milo » entre autres.
     * Le déclarer obligatoire le rendrait `undefined` à l'exécution en
     * prétendant le contraire, exactement le défaut déjà réglé pour
     * `scenesPrevuesIds`.
     */
    passages?: PassageDeScene[];

    /**
     * Quand le meneur a déclaré la scène close. C'est elle qui la barre.
     *
     * **Distincte de la pause.** Une scène qu'on quitte en fin de séance ferme
     * son passage et reste *en pause* : elle reprendra à la séance suivante.
     * Terminer est une décision, pas une conséquence de l'horloge.
     *
     * Une scène terminée **sans aucun passage** n'a jamais été jouée — l'acte
     * s'est achevé avant qu'on n'y passe. Les deux ne se confondent pas à
     * l'écran : barrée dans les deux cas, grisée dans celui-là.
     */
    termineeLe?: number;

    /**
     * Mise de côté à la curation : la scène ne part pas au résumé.
     *
     * **Jeter au sens de la chronique, jamais au sens des données.** Le § 4.1 du
     * plan du 2026-08-08 demande de pouvoir *« jeter celles qui n'étaient
     * rien »* — une scène ouverte par erreur, une bascule sans suite. La scène
     * reste dans la trame et ses événements dans le journal : **on n'efface
     * rien**, c'est la règle déjà tenue par l'acte achevé et la scène terminée,
     * qui restent lisibles.
     *
     * Facultatif, et lu avec `=== true` : les scènes d'avant le 2026-08-20 n'en
     * portent pas, et une scène sans réponse n'est pas une scène écartée.
     */
    ecarteeDeLaChronique?: boolean;

    creeeLe: number;
}
