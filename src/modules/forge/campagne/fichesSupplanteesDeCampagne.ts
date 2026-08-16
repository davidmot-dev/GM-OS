import { normaliser } from '../rules/canevas';
import { clefCanoniqueDeCampagne } from './canevasDeCampagne';

/**
 * Ce qu'une publication de campagne remplace, même sous un autre nom de fichier.
 *
 * **Le jumeau de `fichesSupplantees` côté règles, et il lui manquait un axe.**
 * Là-bas, une fiche est identifiée par son seul sujet. Ici, une fiche est
 * identifiée par **un sujet ET un acte** — c'est le second axe de découpage, et
 * il est justement celui qui dérive.
 *
 * **L'incident du 2026-08-16.** Relancée, la structure a rendu
 * « Scénario 3: Voyage en Mésopotamie (ou Voyage en Mésopotamie) » là où août
 * disait « Scénario 3: Voyage en Mésopotamie ». Le titre entre dans le slug :
 * les fiches neuves n'ont donc **rien écrasé**, elles se sont installées à côté.
 * Le corpus a porté deux jeux de fiches pour le même acte — l'un ignoré en
 * silence par la Forge, les deux servis à l'Oracle.
 *
 * La cause est traitée en amont (`retirerLAlternativeRedondante` stabilise le
 * titre). Ce module est le **second filet** : celui qui rattrape une dérive de
 * titre qu'on n'aurait pas prévue, parce qu'il y en aura d'autres.
 *
 * ---
 *
 * **LES TROIS ABSTENTIONS DE LA VERSION RÈGLES TIENNENT ICI AUSSI.** Une fiche
 * sans sujet n'est jamais touchée ; le fichier qu'on vient d'écrire n'est pas
 * son propre doublon ; et le doute penche toujours du côté de **ne rien
 * déplacer**.
 *
 * **La quatrième est propre aux campagnes, et c'est la seule tolérance
 * accordée.** Les sujets se comparent strictement, comme côté règles. Les
 * **actes**, eux, se comparent par préfixe : c'est la forme exacte que prend la
 * dérive — un titre qui gagne une précision, jamais un titre qui change de sens.
 * Deux actes réels dont l'un préfixe l'autre relèveraient d'un livre
 * pathologique ; et si cela arrivait, la fiche part dans `fiches-v1/`, d'où elle
 * se récupère — jamais à la corbeille.
 */

/** Une fiche présente dans `fiches/`, telle que la publication la voit. */
export interface FicheDeCampagnePresente {
    /** Nom du fichier, extension comprise. */
    nom: string;
    /** Le `sujet:` de son frontmatter, ou `null` s'il n'en a pas. */
    sujet: string | null;
    /** Le `partie:` de son frontmatter — l'acte qui la borne. Absent pour les sujets globaux. */
    partie?: string | null;
}

/**
 * Deux titres d'acte désignent-ils le même acte ?
 *
 * Égalité, ou préfixe dans l'un ou l'autre sens. **Le préfixe se juge sur un mot
 * entier** (`+ ' '`) : sans cela, « Acte 1 » avalerait « Acte 12 ».
 */
function memeActe(a: string | null | undefined, b: string | null | undefined): boolean {
    const x = normaliser(a ?? '');
    const y = normaliser(b ?? '');
    // Deux fiches sans acte parlent bien de la même chose : le sujet global.
    if (!x && !y) return true;
    // Une fiche bornée et une fiche globale ne se remplacent jamais.
    if (!x || !y) return false;
    return x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `);
}

/**
 * Les fiches que la publication de `sujet` / `partie` sous `nomPublie` rend
 * caduques.
 *
 * Le sujet est **rabattu sur le canevas** des deux côtés avant comparaison : le
 * carnet rend « Personnages non joueurs majeurs » une fois sur deux, et deux
 * formulations du même sujet doivent se reconnaître. Un sujet hors canevas se
 * compare alors à lui-même, normalisé — donc strictement.
 */
export function fichesSupplanteesDeCampagne(
    sujet: string,
    partie: string | null | undefined,
    nomPublie: string,
    presentes: readonly FicheDeCampagnePresente[],
): string[] {
    const canonique = (valeur: string) => clefCanoniqueDeCampagne(valeur) ?? valeur;

    const vise = normaliser(canonique(sujet));
    if (!vise) return [];

    return presentes
        .filter(f =>
            f.nom !== nomPublie
            && !!f.sujet
            && normaliser(canonique(f.sujet)) === vise
            && memeActe(f.partie, partie))
        .map(f => f.nom);
}

/**
 * Le `partie:` d'un frontmatter, ou `null`.
 *
 * Même prudence que `sujetDuFrontmatter` : `[ \t]*` et non `\s*`, parce que `\s`
 * traverse les retours à la ligne et ramènerait « --- » comme valeur sur un
 * frontmatter tronqué. Deux fiches cassées se seraient alors supplantées
 * mutuellement — le défaut attrapé par un test côté règles avant qu'il
 * n'atteigne un disque.
 */
export function partieDuFrontmatter(contenu: string): string | null {
    const trouve = contenu.match(/^partie:[ \t]*(.+)$/m);
    if (!trouve) return null;
    const valeur = trouve[1].trim().replace(/^["']|["']$/g, '').trim();
    return valeur || null;
}
