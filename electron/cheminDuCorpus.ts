import path from 'node:path';
import { strictementSous } from './sousChemin';
import { slug } from './corpusSysteme';
import type { GenreDeCorpus } from './groupesDuCorpus';

/**
 * **Quel dossier une purge a le droit de toucher — la seule barrière.**
 *
 * Le chemin vient du rendu. `strictementSous` bloquerait les `..`, mais
 * accepterait `docs/` lui-même, `docs/fiches`, ou `docs/systems/alien/rules` :
 * trois façons de faire passer pour « le corpus d'un pilote » quelque chose qui
 * n'en est pas un, dont une qui viderait le dossier de tous les jeux. On exige
 * donc **exactement deux segments**, dont le premier est l'une des deux racines
 * connues. *Un chemin qu'un seul des deux côtés sait produire est un chemin qui
 * se perd* — c'est la leçon de `cheminDesTables`, et elle s'applique mot pour
 * mot dès qu'on branche une écriture, à plus forte raison un déménagement.
 *
 * Séparé de `purgeDesCorpus.ts` pour une raison de banc d'essai : ce module-ci
 * n'importe pas `electron`, donc la barrière est éprouvable dans le projet de
 * tests `electron` — *une garde qu'on ne peut pas exécuter dans un test est une
 * garde qu'on relit.*
 */

/** Où atterrit ce qu'on retire d'un corpus, sous la racine des docs. */
export const DOSSIER_DES_PURGES = '_purges';

/** Les deux racines qu'on accepte de purger, et rien d'autre. */
export const RACINES_PURGEABLES: Record<string, GenreDeCorpus> = {
    systems: 'systeme',
    campaigns: 'campagne',
};

/** Un nom de dossier sans séparateur ni traversée. */
function estUnSegmentSimple(nom: string): boolean {
    const n = (nom ?? '').trim();
    if (n === '' || n === '.' || n === '..') return false;
    if (n.includes('/') || n.includes('\\') || n.includes('\0')) return false;
    /* Windows refuse ces caractères dans un nom de fichier ; les accepter ici
       ferait échouer l'opération avec un message système que personne ne relie
       à la demande. */
    if (/[:*?"<>|]/.test(n)) return false;
    return true;
}

export interface CorpusVise {
    /** Chemin absolu du dossier du corpus. */
    absolu: string;
    /** Le même, relatif à `docs/` et en `/` — `systems/alien`. */
    relatif: string;
    genre: GenreDeCorpus;
}

/**
 * Le dossier désigné, ou `null` s'il ne peut pas être un corpus.
 *
 * `null` plutôt qu'une exception : l'appelant rend alors la même chose que pour
 * un dossier absent. *Un chemin refusé et un dossier vide se ressemblent, et
 * c'est très bien — ni l'un ni l'autre ne renseigne sur ce qu'il y a autour.*
 */
export function corpusVise(racineDocs: string, demande: string): CorpusVise | null {
    const nu = (demande ?? '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const segments = nu.split('/').filter(Boolean);
    if (segments.length !== 2) return null;

    const [racine, dossier] = segments;
    const genre = RACINES_PURGEABLES[racine.toLowerCase()];
    if (!genre) return null;
    if (!estUnSegmentSimple(dossier)) return null;

    const base = path.resolve(racineDocs);
    const parent = path.resolve(base, racine.toLowerCase());
    const absolu = path.resolve(parent, dossier.trim());
    if (!strictementSous(absolu, base)) return null;
    if (path.dirname(absolu) !== parent) return null;

    return { absolu, relatif: `${racine.toLowerCase()}/${dossier.trim()}`, genre };
}

/** `2026-09-18-221407-reves-de-dragons` — daté d'abord, pour que le tri soit chronologique. */
export function nomDeLaQuarantaine(etiquette: string, quand: Date): string {
    const deux = (n: number) => String(n).padStart(2, '0');
    const horodatage = `${quand.getFullYear()}-${deux(quand.getMonth() + 1)}-${deux(quand.getDate())}`
        + `-${deux(quand.getHours())}${deux(quand.getMinutes())}${deux(quand.getSeconds())}`;
    return `${horodatage}-${slug(etiquette) || 'sans-nom'}`;
}
