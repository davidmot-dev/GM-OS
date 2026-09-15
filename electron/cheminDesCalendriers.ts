import path from 'node:path';
import { strictementSous } from './sousChemin';

/**
 * **Où vivent les calendriers, et ce qu'on accepte d'y viser.**
 *
 * *Écrit le 2026-09-15, avec l'Atelier des calendriers.*
 *
 * ⛔ **Le préalable à l'écriture, et c'est la deuxième fois.** Les deux lecteurs
 * (`clock:list-calendars`, `clock:load-calendar`) composaient leur chemin ainsi :
 *
 * ```ts
 * path.join(appRoot, 'databases', 'calendars', `${id}.json`)
 * ```
 *
 * `id` **vient du renderer**, et rien ne le regardait. C'était déjà une fuite en
 * lecture — `../../package` remonte hors du dossier ; le jour où l'Atelier a le
 * droit d'**écrire**, la même forme devient un moyen d'écraser n'importe quel
 * fichier du dépôt.
 *
 * *On ne branche pas une écriture sur un chemin qu'on ne contient pas* — la
 * règle déjà payée par `cheminDesTables.ts` la veille. **Ce fichier en est le
 * jumeau**, et il est délibérément écrit à part plutôt que généralisé : les deux
 * dossiers n'ont pas la même forme — les tables vivent sous un univers, les
 * calendriers sont à plat — et *une abstraction qui recouvre deux formes
 * différentes finit par autoriser la troisième, celle que personne n'a voulue.*
 */

/** Le dossier des calendriers, pour une racine d'application donnée. */
export function racineDesCalendriers(appRoot: string): string {
    return path.join(appRoot, 'databases', 'calendars');
}

/** Un nom de fichier, sans séparateur ni traversée. */
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
 * Le fichier d'un calendrier, ou `null` s'il sort du dossier.
 *
 * `null` et non une exception : l'appelant rend alors la même réponse que pour
 * un fichier absent — *un chemin refusé et un fichier absent se ressemblent, et
 * c'est très bien : ni l'un ni l'autre ne doit renseigner l'appelant sur ce
 * qu'il y a autour.*
 */
export function cheminDUnCalendrier(appRoot: string, id: string): string | null {
    if (!estUnSegmentSimple(id)) return null;

    const racine = racineDesCalendriers(appRoot);
    const vise = path.resolve(racine, `${id.trim()}.json`);

    if (!strictementSous(vise, racine)) return null;
    /* ⚠️ **Un seul niveau, et pas seulement « sous la racine ».**
       `strictementSous` bloque les `..` mais accepterait `sous/dossier/perdu` —
       un fichier que `clock:list-calendars` ne montrerait jamais, donc un
       calendrier qu'on peut écrire et jamais relire. *Un chemin qu'un seul des
       deux côtés sait produire est un chemin qui se perd.* */
    if (path.dirname(vise) !== path.resolve(racine)) return null;

    return vise;
}

/*
  ⚠️ **Il n'y a pas de fabrique d'identifiant ici, et c'est délibéré.**
  L'Atelier produit le nom de fichier (`identifiantDuCalendrier`, dans
  `formeDuCalendrier.ts`) ; ce module **valide** celui qu'on lui donne, ce que
  lui seul peut faire. *Deux règles de nommage écrites des deux côtés d'un pont
  finiraient par ne plus tomber sur le même fichier* — et l'écran afficherait
  un nom que personne n'écrirait.
*/
