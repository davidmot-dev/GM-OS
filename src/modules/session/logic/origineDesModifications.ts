/**
 * **D'où vient une modification de fiche** — H1 de l'audit du 2026-10-22.
 *
 * Le magasin ne sait pas qui l'appelle : une tablette, un geste de table, un
 * jet, le meneur au clavier. Les chemins qui le savent posent leur origine le
 * temps de leur écriture ; l'historique des fiches (`useHistoriqueDesFiches`)
 * la lit au moment où le magasin le prévient — zustand prévient ses abonnés
 * **pendant** l'écriture, donc dans la portée de `avecOrigine`.
 *
 * `silencieuse` : ce que le journal dit déjà (un coup, un soin, une séquelle
 * notée) ne s'y redit pas. Sans origine posée, c'est le meneur.
 */
export type OrigineDeModification = 'meneur' | 'tablette' | 'tablette du meneur' | 'geste de table' | 'jet' | 'silencieuse';

let courante: OrigineDeModification = 'meneur';

/** L'origine des écritures en cours, `meneur` par défaut. */
export const origineCourante = (): OrigineDeModification => courante;

/** Exécute `ecrire` sous cette origine, et rend la précédente ensuite — même en cas d'erreur. */
export function avecOrigine<T>(origine: OrigineDeModification, ecrire: () => T): T {
    const precedente = courante;
    courante = origine;
    try {
        return ecrire();
    } finally {
        courante = precedente;
    }
}
