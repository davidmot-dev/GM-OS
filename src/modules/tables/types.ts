/**
 * **Ce qu'une entrée d'oracle donne, quand elle donne quelque chose.**
 *
 * Une table de Table-OS répond à « qu'est-ce qu'il y a ? » : elle rend un texte,
 * qu'on lit à voix haute. Certaines entrées donnent en plus des choses qu'on
 * emporte — et elles le disaient jusqu'ici **en prose**, dans `effect` :
 * *« Gagnez +1d100 Eurodollars et 1d4 munitions »*. Aucun code ne peut en tirer
 * des objets sans deviner, et *un contrôle qui se trompe est pire qu'un contrôle
 * absent* : on ne lit donc pas `effect`, on demande à la table de le déclarer.
 *
 * **Facultatif, et c'est le point.** Les six univers de tables existants ne
 * déclarent rien et continuent de fonctionner mot pour mot ; une entrée sans
 * `butin` reste un pur oracle — elle se lit, elle ne verse pas, et le bouton
 * « Verser au butin » ne s'affiche même pas.
 */
export interface DeclarationDeButin {
    name: string;
    /** `currency` pour de la monnaie, sinon un objet. Défaut : `item`. */
    type?: 'item' | 'currency' | 'other' | string;
    /** Un nombre, ou une formule de dés — « 1d100 », « 2d6+2 ». Défaut : 1. */
    quantite?: number | string;
    rarity?: string;
    value?: number;
    weight?: number;
    description?: string;
}

export interface TableEntry {
    min: number;
    max: number;
    title: string;
    description: string;
    effect?: string;
    /** Ce que cette entrée verse au butin. Absent = elle n'en verse pas. */
    butin?: DeclarationDeButin[];
}

export interface TableData {
    name: string;
    dice: string;
    entries: TableEntry[];
}

export interface TableResult {
    rawRoll: number;
    modifier: number;
    finalValue: number;
    entry: TableEntry;
    timestamp: number;
    tableName: string;
}

/** Ce que le processus principal répond à une écriture. */
export interface ReponseDEcriture {
    ok: boolean;
    /** Le fichier écrit, quand ça a marché. */
    chemin?: string;
    /**
     * Pourquoi ça a échoué. *Un booléen nu ne dirait pas si le refus vient du
     * chemin ou du disque* — et l'écran n'a pas le même mot à dire dans les deux
     * cas.
     */
    motif?: 'chemin-refuse' | 'contenu-vide' | 'ecriture-impossible' | 'suppression-impossible';
}

export interface TableBridge {
    listUniverses: () => Promise<string[]>;
    listTables: (universe: string) => Promise<string[]>;
    loadTable: (universe: string, tableName: string) => Promise<TableData | null>;
    /** Écrit la table. Crée le dossier de l'univers au besoin. */
    saveTable: (universe: string, tableName: string, data: TableData) => Promise<ReponseDEcriture>;
    deleteTable: (universe: string, tableName: string) => Promise<ReponseDEcriture>;
    /**
     * Ouvre un dialogue système et rend ce que le fichier contient — texte,
     * ou image en base64. `null` si le meneur a renoncé.
     */
    ouvrirUneSource: () => Promise<SourceLue | null>;
}

/** Ce qu'un fichier choisi rend. Voir `electron/lectureDeSource.ts`. */
export type SourceLue =
    | { genre: 'texte'; texte: string; nom: string }
    | { genre: 'image'; donnees: string; mimeType: string; nom: string }
    | { genre: 'refus'; motif: 'extension-inconnue' | 'illisible' | 'pdf-indisponible'; nom: string };
