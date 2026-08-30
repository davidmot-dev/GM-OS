/**
 * GM-OS v6 — Deck-OS Domain Types
 *
 * Regroupe les interfaces liées aux paquets de cartes (Deck-OS).
 *
 * @module types/deck
 */

export type CardFormat = 'poker' | 'tarot';
export type CardOrientation = 'portrait' | 'landscape';

export interface DeckManifest {
    id: string;
    name: string;
    systemId: string;       // Liaison au GameDriver (ex: "torg")
    folderPath: string;     // Chemin : "assets/decks/[system_id]/[deck_id]"
    cardCount: number;      // Nombre total de cartes (N)
    format: CardFormat;
    orientation: CardOrientation;
    useDiscard: boolean;    // Si vrai, les cartes tirées vont en défausse
    extension?: string;     // Optionnel : extension de fichier (ex: ".jpg", default: ".png")
    filenamePattern?: string; // Optionnel : pattern (ex: "card_{n}" ou "{n}")
    startAtZero?: boolean;  // Si vrai, l'index commence à 0 (default: false = 1)
    padding?: number;       // Optionnel : nombre de chiffres (ex: 2 pour "01")
    cardMetadata?: Record<number, { name?: string; description?: string }>; // Optionnel : métadonnées par index
    /**
     * **Les joueurs peuvent-ils piocher eux-mêmes dans ce paquet ?**
     *
     * Question de David le 2026-08-30 : *« voir comment un joueur peut tirer
     * lui-même une carte dans un paquet — peut-être dire les paquets qui sont
     * accessibles ou non aux joueurs ? »*. Oui, et il faut le dire à deux
     * endroits : sur la fiche du paquet chez le meneur, et sur la tablette, qui
     * ne montre que les paquets ouverts.
     *
     * **Fermé par défaut, et l'absence vaut fermé.** Les paquets créés avant ce
     * jour n'ont pas ce champ : ils restent au meneur, exactement comme hier,
     * sans migration. *Un défaut qui ouvre est un défaut qu'on découvre en
     * séance, quand un joueur a déjà vu l'oracle du meneur.*
     */
    ouvertAuxJoueurs?: boolean;
}

/**
 * **L'état d'une carte tenue — et le vocabulaire compte ici.**
 *
 * On a d'abord écrit « face visible / face cachée », et David a mis le doigt
 * dessus : *« tant que je ne l'ai pas retournée, il ne sait pas quelle carte il
 * a reçue ? »*. Oui — et c'est bien le problème du mot. « Face visible » se lit
 * comme **publique**, alors que ça veut dire *son porteur la voit, la table
 * non*. Montrer une carte à toute la table est un troisième geste, la
 * projection.
 *
 * À trois heures du matin, cette ambiguïté fait croire qu'on vient de dévoiler
 * un atout devant tout le monde. *Un mot qui décrit mal ce qu'il fait est un
 * défaut, même quand le code est juste.*
 */
export type FaceDeCarte =
    /** Personne ne la connaît, pas même son porteur. Seul le meneur la voit. */
    | 'scellee'
    /** Son porteur la voit sur sa tablette. Les autres joueurs, non. */
    | 'revelee';

/**
 * **Une carte tenue en main** — le quatrième tas, décidé par David le
 * 2026-08-30 après avoir garé l'idée le 23/08.
 *
 * Elle n'est ni dans la pioche, ni dans la défausse, ni la carte retournée du
 * moment : elle appartient à quelqu'un, et elle y reste jusqu'à ce qu'on la
 * joue, la donne ou la rende.
 */
export interface CarteEnMain {
    index: number;
    /**
     * Le personnage qui la tient, ou `null` pour le meneur.
     *
     * *Un tas sans porteur ne dirait pas qui a quoi.* Deux joueurs tenant
     * chacun une carte se retrouveraient dans le même sac, et le paquet ne
     * saurait pas à qui rendre la sienne.
     */
    porteur: string | null;
    face: FaceDeCarte;
}

/**
 * **Une carte qu'un joueur propose à un autre.**
 *
 * Un don ne s'impose pas : il se demande, et le destinataire accepte ou refuse
 * — décidé par David le 2026-08-30. Le meneur peut trancher aussi depuis son
 * écran, *parce qu'un joueur parti aux toilettes ne doit pas bloquer une carte
 * pendant tout un combat.*
 *
 * ⚠ Les objets d'inventaire suivent une règle différente : c'est le meneur qui
 * les approuve, et le destinataire n'a pas voix au chapitre. Les deux rails
 * mériteront d'être alignés un jour ; ils ne le sont pas.
 */
export interface DemandeDeCarte {
    id: string;
    deckId: string;
    index: number;
    /** Le personnage qui propose. `null` : le meneur. */
    deQui: string | null;
    /** Le personnage à qui elle est proposée. */
    versQui: string | null;
    statut: 'en-attente' | 'acceptee' | 'refusee';
    quand: number;
}

export interface DeckSessionState {
    deckId: string;
    remainingIndices: number[];     // Indices [1..N] des cartes dans la pioche
    discardedIndices: number[];     // Indices des cartes en défausse
    currentCardIndex: number | null; // Carte actuellement face visible
    /**
     * Les cartes tenues, par le meneur ou par un personnage.
     *
     * **Le paquet détient la vérité, la fiche l'affiche.** Décision de David :
     * une carte pouvait devenir un objet d'inventaire — elle aurait hérité du
     * transfert entre joueurs sans une ligne de code — mais le paquet aurait
     * cessé de savoir la compter. *Un paquet doit toujours pouvoir dire où sont
     * ses cinquante-deux cartes,* sans quoi il ne sait plus ni ce qu'il reste,
     * ni quoi remélanger.
     *
     * Facultatif : les paquets ouverts avant ce jour n'en ont pas, et se
     * comportent exactement comme hier. Aucune migration.
     */
    enMain?: CarteEnMain[];
}
