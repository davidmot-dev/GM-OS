/**
 * **Ranger plusieurs fichiers d'un coup dans le Media Hub.**
 *
 * Point H8 du § 12c, corrigé le 2026-09-05. Le Hub ne lisait que
 * `files?.[0]` : ranger une sonothèque se faisait fichier par fichier, avec une
 * fenêtre de sélection à rouvrir entre chaque.
 *
 * La règle vit ici plutôt que dans `MediaBrowser` parce qu'elle porte deux
 * décisions qu'on ne veut pas voir se perdre — *une logique cachée dans un
 * composant n'est couverte par rien*, la leçon de `horlogesPourLaTable`.
 */

/** Ce dont l'import a besoin, sans rien savoir de l'écran ni du magasin. */
export interface ContexteDImport {
    /** Les médias déjà rangés, pour reconnaître un doublon. */
    existants: { name: string; size: number }[];
    /** Range un fichier. Peut échouer. */
    ajouter: (fichier: File) => Promise<unknown>;
    /** Demande au meneur s'il veut le doublon. `true` = on l'importe quand même. */
    demanderPourLeDoublon: (nom: string) => boolean;
}

export interface ResultatDImport {
    /** Combien sont entrés. */
    ranges: number;
    /** Les noms qui ont échoué, dans l'ordre. */
    echecs: string[];
    /** Combien le meneur a écartés lui-même. */
    ecartes: number;
}

/**
 * @param fichiers Ce que le sélecteur a rendu.
 *
 * Deux règles, et ce sont elles que les tests gardent :
 *
 * 1. **La question du doublon se pose par fichier**, et un refus ne saute que
 *    celui-là. Refuser le troisième d'une série de trente ne doit pas annuler
 *    les vingt-neuf autres.
 * 2. **Un échec n'arrête pas les suivants.** Un fichier refusé par la base est
 *    consigné, et on continue — *un import qui abandonne au premier problème
 *    oblige à tout recommencer en devinant où il s'est arrêté.*
 *
 * L'import est **en série et non en parallèle** : `addMedia` écrit dans
 * IndexedDB, et trente écritures lancées ensemble sur une base fraîchement
 * réhydratée sont exactement la course qu'on a déjà payée ici.
 */
export async function importerPlusieursMedias(
    fichiers: File[],
    contexte: ContexteDImport,
): Promise<ResultatDImport> {
    const aImporter = fichiers.filter((fichier) => {
        const doublon = contexte.existants.some(
            (m) => m.name === fichier.name && m.size === fichier.size,
        );
        return !doublon || contexte.demanderPourLeDoublon(fichier.name);
    });

    const echecs: string[] = [];
    let ranges = 0;

    for (const fichier of aImporter) {
        try {
            await contexte.ajouter(fichier);
            ranges += 1;
        } catch (erreur) {
            console.error('[MediaHub] Import refusé', fichier.name, erreur);
            echecs.push(fichier.name);
        }
    }

    return { ranges, echecs, ecartes: fichiers.length - aImporter.length };
}
