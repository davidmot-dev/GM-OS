import type { NoteEntry } from '../session/useObsidianStore';

/**
 * **Le découpage du coffre Obsidian, tel qu'on le parcourt.**
 *
 * Demandé par David le 2026-09-05 : *« peux-tu respecter le découpage dans le
 * Nexus wiki »*. La première version de l'écran **aplatissait tout** — deux
 * mille notes en une liste, le dossier réduit à un sous-titre. *Un coffre rangé
 * depuis des années dont le rangement était jeté à l'affichage :* les dossiers
 * sont un classement que le meneur a fait, et les ignorer lui demande de le
 * refaire de tête à chaque consultation.
 *
 * Ces trois fonctions vivent hors du composant **parce qu'elles sont ce qui
 * peut se tromper** : descendre un chemin, ranger un niveau, aplatir pour la
 * recherche. *Ce qui est caché dans un composant n'est couvert par rien* — la
 * leçon de `horlogesPourLaTable`, reprise ici.
 */

/** Une note trouvée par la recherche, avec le chemin de dossiers qui la porte. */
export interface NoteTrouvee {
    nom: string;
    chemin: string;
    dossier: string;
}

/**
 * Toutes les notes du coffre, à plat — **pour la recherche uniquement**.
 *
 * *Quand on cherche, on ne sait pas où c'est rangé — c'est même souvent pour
 * cela qu'on cherche.* Le dossier est conservé sur chaque résultat, pour qu'on
 * sache d'où sort ce qu'on a trouvé.
 */
export function toutesLesNotes(entrees: NoteEntry[], prefixe = ''): NoteTrouvee[] {
    return entrees.flatMap((entree) => {
        if (entree.type === 'directory') {
            return toutesLesNotes(entree.children ?? [], prefixe ? `${prefixe} / ${entree.name}` : entree.name);
        }
        return [{ nom: entree.name, chemin: entree.path, dossier: prefixe }];
    });
}

/**
 * Le contenu d'un dossier, en descendant le chemin ouvert.
 *
 * Rend `null` quand le chemin ne mène nulle part — un dossier renommé sur le PC
 * pendant qu'on le regardait, ou un coffre rechargé qui a changé de forme.
 * *L'appelant retombe alors à la racine : mieux vaut cela que rester devant un
 * écran vide sans savoir pourquoi.*
 */
export function contenuDuChemin(racine: NoteEntry[], chemin: readonly string[]): NoteEntry[] | null {
    let niveau = racine;
    for (const nom of chemin) {
        const dossier = niveau.find(e => e.type === 'directory' && e.name === nom);
        if (!dossier) return null;
        niveau = dossier.children ?? [];
    }
    return niveau;
}

/**
 * Dossiers d'abord, puis les notes — chacun dans l'ordre alphabétique.
 *
 * `localeCompare` et non `<` : sans lui, « Éclaireur » se rangerait après
 * « Zone » parce que le É sort de l'alphabet ASCII.
 */
export function range(entrees: NoteEntry[]): NoteEntry[] {
    return [...entrees].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}
