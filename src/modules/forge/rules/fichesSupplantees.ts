import { normaliser } from './canevas';

/**
 * Ce qu'une publication remplace, et qui traînait sans que rien ne le dise.
 *
 * **Le défaut, relevé par David le 2026-08-14 : « quand je reforge le corpus,
 * j'ai beaucoup de reliquat qui reste ».** Une reforge produit un **slug neuf**
 * — `initiative-et-deroulement-du-tour.md` là où l'ancienne s'appelait
 * `initiative-et-tour.md` — donc rien n'est écrasé, et les deux versions du
 * même sujet restent côte à côte dans `rules/`. L'Oracle recevait les deux,
 * dont celle que la reforge venait précisément de remplacer.
 *
 * Ce n'est pas une découverte : le test d'unicité de `ragSelection` avait
 * trouvé **huit doublons dans quatre systèmes** le 2026-08-11, et trois
 * subsistaient encore au 2026-08-14 sur NOC et Rêves de Dragons. Ce qui
 * manquait n'était pas le constat, c'était le geste au bon moment.
 *
 * **Le rattachement se fait par le `sujet:` normalisé**, jamais par le nom de
 * fichier — c'est déjà la règle de `fichesDuGroupe`, et c'est la seule qui
 * survive à une reforge, puisque le slug est justement ce qui change.
 */

/** Une fiche présente dans `rules/`, telle que la publication la voit. */
export interface FichePresente {
    /** Nom du fichier, extension comprise. */
    nom: string;
    /** Le `sujet:` de son frontmatter, ou `null` s'il n'en a pas. */
    sujet: string | null;
}

/**
 * Les fiches que la publication de `sujet` sous `nomPublie` rend caduques.
 *
 * **Trois abstentions, et elles comptent plus que la règle elle-même.**
 *
 * 1. **Une fiche sans `sujet:` n'est jamais touchée.** Elle n'entre dans aucun
 *    groupe et ne peut donc pas être le doublon de quoi que ce soit —
 *    l'inventaire des mécaniques est dans ce cas, et l'archiver couperait la
 *    reprise à froid d'une série.
 * 2. **Le fichier qu'on vient d'écrire n'est pas son propre doublon.** Une
 *    reforge qui retombe sur le même slug écrase, ce qui est le comportement
 *    voulu ; l'archiver reviendrait à supprimer ce qu'on publie.
 * 3. **On ne compare que des sujets, jamais des titres approchants.** Le
 *    rapprochement flou appartient à `fichesDuGroupe`, où une erreur ne coûte
 *    qu'une fiche mal rangée. Ici elle déplacerait un fichier : deux sujets
 *    voisins mais distincts — « Santé et blessures » et « Dégâts et types de
 *    dégâts » — doivent rester deux fiches.
 */
export function fichesSupplantees(
    sujet: string,
    nomPublie: string,
    presentes: readonly FichePresente[],
): string[] {
    const vise = normaliser(sujet);
    if (!vise) return [];

    return presentes
        .filter(f => f.nom !== nomPublie && f.sujet && normaliser(f.sujet) === vise)
        .map(f => f.nom);
}

/**
 * Le `sujet:` d'un frontmatter, ou `null`.
 *
 * Volontairement minuscule : on ne lit que la première occurrence, en tête de
 * fichier, et on ne cherche pas à interpréter le reste. Une fiche dont le
 * frontmatter est cassé rend `null` et sera donc **laissée en place** — c'est
 * le bon défaut, puisque le doute doit toujours pencher du côté de ne rien
 * déplacer.
 */
export function sujetDuFrontmatter(contenu: string): string | null {
    /*
      `[ \t]*` et non `\s*` : `\s` traverse les retours à la ligne. Sur un
      frontmatter tronqué — `sujet:` suivi d'une ligne vide puis de `---` — la
      capture ramenait « --- » comme sujet. Deux fiches cassées se seraient
      alors supplantées mutuellement, et l'archivage aurait mangé la seconde.
      Attrapé par le test avant d'atteindre un disque.
    */
    const trouve = contenu.match(/^sujet:[ \t]*(.+)$/m);
    if (!trouve) return null;
    const valeur = trouve[1].trim().replace(/^["']|["']$/g, '').trim();
    return valeur || null;
}
