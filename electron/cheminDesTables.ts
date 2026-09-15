import path from 'node:path';
import { strictementSous } from './sousChemin';

/**
 * **Où vivent les tables de Table-OS, et ce qu'on accepte d'y viser.**
 *
 * ⛔ **Le préalable à l'écriture, relevé le 2026-09-15.** Les trois lecteurs
 * (`tables:list-tables`, `tables:load-table`, et le listage des univers)
 * composaient leur chemin ainsi :
 *
 * ```ts
 * path.join(appRoot, 'databases', 'tables', universe, `${tableName}.json`)
 * ```
 *
 * `universe` et `tableName` **viennent du renderer**, et rien ne les regardait.
 * Un `..` sortait du dossier. C'était déjà une fuite en lecture ; le jour où
 * l'Atelier a eu le droit d'**écrire**, la même forme serait devenue un moyen
 * d'écraser n'importe quel fichier du dépôt. *On ne branche pas une écriture sur
 * un chemin qu'on ne contient pas.*
 *
 * ⚠️ **Un seul segment, et pas seulement « sous la racine ».** `strictementSous`
 * suffirait à bloquer les `..`, mais accepterait `Alien/secret/tresor` — un
 * dossier imbriqué que `tables:list-universes` ne montrerait jamais, donc une
 * table qu'on peut écrire et jamais relire. *Un chemin qu'un seul des deux côtés
 * sait produire est un chemin qui se perd.*
 */

/** Le dossier des tables, pour une racine d'application donnée. */
export function racineDesTables(appRoot: string): string {
    return path.join(appRoot, 'databases', 'tables');
}

/** Un nom de dossier ou de fichier, sans séparateur ni traversée. */
function estUnSegmentSimple(nom: string): boolean {
    const n = (nom ?? '').trim();
    if (n === '' || n === '.' || n === '..') return false;
    if (n.includes('/') || n.includes('\\') || n.includes('\0')) return false;
    /* Windows refuse ces caractères dans un nom de fichier ; les accepter ici
       ferait échouer l'écriture avec un message système que personne ne relie à
       la saisie du meneur. */
    if (/[:*?"<>|]/.test(n)) return false;
    return true;
}

/**
 * Le dossier d'un univers, ou `null` s'il sort de la racine.
 *
 * `null` et non une exception : l'appelant rend alors la même réponse que pour
 * un dossier absent — *un chemin refusé et un dossier vide se ressemblent, et
 * c'est très bien : ni l'un ni l'autre ne doit renseigner l'appelant sur ce
 * qu'il y a autour.*
 */
export function cheminDUnUnivers(appRoot: string, univers: string): string | null {
    if (!estUnSegmentSimple(univers)) return null;

    const racine = racineDesTables(appRoot);
    const vise = path.resolve(racine, univers.trim());
    if (!strictementSous(vise, racine)) return null;
    if (path.dirname(vise) !== path.resolve(racine)) return null;

    return vise;
}

/** Le fichier d'une table, ou `null` s'il sort de son univers. */
export function cheminDUneTable(appRoot: string, univers: string, nom: string): string | null {
    const dossier = cheminDUnUnivers(appRoot, univers);
    if (!dossier || !estUnSegmentSimple(nom)) return null;

    /* On ajoute l'extension nous-mêmes. Un nom qui la porte déjà donnerait
       « table.json.json » — le meneur ne verrait pas sa table revenir. */
    const propre = nom.trim().replace(/\.json$/i, '');
    if (!estUnSegmentSimple(propre)) return null;

    const vise = path.resolve(dossier, `${propre}.json`);
    if (!strictementSous(vise, dossier)) return null;
    if (path.dirname(vise) !== dossier) return null;

    return vise;
}
