import path from 'node:path';

/**
 * **Ce chemin est-il dans cette racine ?**
 *
 * La question se posait à quatre endroits du processus principal, et elle y
 * recevait quatre réponses différentes — dont deux fausses. Ce module est la
 * seule réponse, pour qu'il n'y ait plus qu'un endroit à corriger la prochaine
 * fois.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE PIÈGE, ET POURQUOI `startsWith` NE SUFFIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `startsWith(racine)` seul acceptait `C:\Coffre-prive` quand le coffre est
 * `C:\Coffre` : le préfixe correspond, le dossier n'a rien à voir. C'était sans
 * portée tant que le chemin venait de l'écran du meneur ; **il arrive du réseau
 * depuis le 2026-09-05**, quand la tablette a reçu l'accès au coffre.
 *
 * `path.relative` sur deux chemins résolus ferme les deux cas d'un coup : les
 * `..` sont normalisés avant la comparaison, et le voisin ressort avec un `..`
 * en tête de chemin relatif. *Un chemin qui vient d'ailleurs ne se croit pas sur
 * parole.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX FONCTIONS, PARCE QUE LA RACINE N'EST PAS TOUJOURS ADMISE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Servir un fichier et créer un dossier ne veulent pas la même réponse pour la
 * racine elle-même : `serveurDesFiches` doit la refuser (elle n'est pas un
 * fichier), `obsidian:ensure-directory` doit l'accepter (elle existe déjà, il
 * n'y a rien à faire). Les deux versions justes du dépôt différaient d'ailleurs
 * sur exactement ce point, en silence.
 *
 * Le choix se fait donc au nom de la fonction appelée, pas par un défaut qui
 * serait faux la moitié du temps.
 */

/** Résout et, sur Windows, replie la casse : `C:\Docs` et `c:\docs` sont le même dossier. */
function normaliser(chemin: string): string {
    const resolu = path.resolve(chemin);
    return process.platform === 'win32' ? resolu.toLowerCase() : resolu;
}

type Relation = 'dehors' | 'egal' | 'dessous';

function relation(enfant: string, parent: string): Relation {
    const relatif = path.relative(normaliser(parent), normaliser(enfant));
    if (relatif === '') return 'egal';

    /*
      On compare le PREMIER SEGMENT à `..`, et non le début de la chaîne : un
      fichier nommé `..notes` est dans le dossier, alors qu'un
      `relatif.startsWith('..')` le mettrait dehors. Le refus serait sans danger,
      mais il serait faux — et une garde qui se trompe finit par être contournée.
    */
    const [premier] = relatif.split(path.sep);
    if (premier === '..' || path.isAbsolute(relatif)) return 'dehors';

    return 'dessous';
}

/**
 * `enfant` est-il **strictement à l'intérieur** de `parent` ?
 *
 * La racine elle-même est refusée. C'est ce qu'il faut pour servir ou lire un
 * fichier : un dossier n'est pas un fichier.
 */
export function strictementSous(enfant: string, parent: string): boolean {
    return relation(enfant, parent) === 'dessous';
}

/**
 * `enfant` est-il `parent` **ou** quelque part dessous ?
 *
 * C'est ce qu'il faut pour autoriser une racine et tout son contenu, ou pour
 * détecter que deux arbres se recouvrent.
 */
export function sousOuEgal(enfant: string, parent: string): boolean {
    return relation(enfant, parent) !== 'dehors';
}
