/**
 * **La forme d'un registre de purge — une fois, pour les deux.**
 *
 * Une campagne et un pilote ne contiennent pas les mêmes choses, mais on leur
 * pose exactement la même question : *qui détient quelque chose qui porte ton
 * nom, et sait-il le rendre ?* Le contrat vit donc ici, et les deux registres
 * le remplissent — `detenteursDeLaCampagne.ts`, `detenteursDuPilote.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX TEMPS, ET LE SECOND NE RECOMPTE PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `recenser` ne touche à rien et nomme ce qui partirait ; `purger` exécute. La
 * cible passée aux deux est **la même valeur figée** : elle porte non seulement
 * l'identifiant, mais aussi ce qui s'en déduit — les scènes d'une campagne, le
 * corpus d'un pilote. *Sans ça, l'ordre des détenteurs deviendrait un piège :*
 * Session-OS efface les scènes, et Combat-OS, appelé après, ne saurait plus
 * quels combats garés étaient les siens. Le bogue n'apparaîtrait qu'en
 * réordonnant une liste, c'est-à-dire un jour où personne ne cherche ça.
 */

/** Ce qu'un module détient pour une cible — un compte et un mot, jamais un identifiant. */
export interface Lot {
    /** Dit à l'écran : « 12 moments de storyboard ». */
    sujet: string;
    compte: number;
}

/** Un module qui détient de la donnée au nom d'une campagne ou d'un pilote. */
export interface Detenteur<Cible> {
    /** Le module tel qu'il se nomme à l'écran. */
    module: string;
    /**
     * Coché d'avance ?
     *
     * Vrai par défaut. Faux quand purger détruirait du travail réutilisable —
     * le meneur décide alors lui-même, en connaissance de cause.
     */
    parDefaut?: boolean;
    /**
     * Une précision affichée sous le module, quand ce qu'il fait n'est pas ce
     * que « supprimer » laisse croire. Music-OS **détache** au lieu d'effacer.
     */
    note?: string;
    recenser: (cible: Cible) => Lot[];
    purger: (cible: Cible) => void;
}

/** Ce qu'un module a répondu au recensement. */
export interface ReponseDuModule {
    module: string;
    lots: Lot[];
    total: number;
    parDefaut: boolean;
    note?: string;
}

export interface RecensementDesDetenteurs {
    modules: ReponseDuModule[];
    /**
     * Vrai quand **tous** les détenteurs ont répondu.
     *
     * ⛔ Faux, on ne purge pas. Un magasin qui échoue au recensement peut très
     * bien échouer à la purge, et le meneur aurait alors confirmé une liste qui
     * n'était pas la vraie. *Le pire résultat acceptable est d'épargner trop.*
     */
    complet: boolean;
    modulesEnEchec: string[];
}

/** Interroge tous les détenteurs. Ne touche à rien, par construction. */
export function recenserLesDetenteurs<C>(
    detenteurs: readonly Detenteur<C>[],
    cible: C,
): RecensementDesDetenteurs {
    const modules: ReponseDuModule[] = [];
    const modulesEnEchec: string[] = [];

    for (const detenteur of detenteurs) {
        try {
            const lots = detenteur.recenser(cible).filter(l => l.compte > 0);
            if (lots.length === 0) continue;   // rien à dire : on ne l'affiche pas
            modules.push({
                module: detenteur.module,
                lots,
                total: lots.reduce((somme, l) => somme + l.compte, 0),
                parDefaut: detenteur.parDefaut !== false,
                note: detenteur.note,
            });
        } catch (err) {
            console.error(`[Purge] Recensement impossible pour ${detenteur.module} :`, err);
            modulesEnEchec.push(detenteur.module);
        }
    }

    return { modules, complet: modulesEnEchec.length === 0, modulesEnEchec };
}

/** Ce qu'une purge a réellement fait, module par module. */
export interface BilanDesDetenteurs {
    purges: string[];
    echecs: string[];
}

/**
 * Purge les modules nommés, et **eux seuls**.
 *
 * Un module qui échoue n'arrête pas les autres : la purge est un nettoyage, pas
 * une transaction. *S'arrêter au premier échec laisserait le meneur avec une
 * moitié d'état et aucune idée de laquelle.* Ce qui a échoué est nommé.
 */
export function purgerLesDetenteurs<C>(
    detenteurs: readonly Detenteur<C>[],
    cible: C,
    modulesChoisis: readonly string[],
): BilanDesDetenteurs {
    const choisis = new Set(modulesChoisis);
    const purges: string[] = [];
    const echecs: string[] = [];

    for (const detenteur of detenteurs) {
        if (!choisis.has(detenteur.module)) continue;
        try {
            detenteur.purger(cible);
            purges.push(detenteur.module);
        } catch (err) {
            console.error(`[Purge] Purge impossible pour ${detenteur.module} :`, err);
            echecs.push(detenteur.module);
        }
    }

    return { purges, echecs };
}
