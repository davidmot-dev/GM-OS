import type { NoteEntry } from '../useObsidianStore';

/**
 * **Lire une note du coffre comme Obsidian la lit** — refonte, L6
 * (2026-10-03), maquette retenue de Nexus (`stitch/outillage/outillage-nexus.png`) :
 * *les liens internes `[[…]]` cliquables, la table des matières de la note.*
 *
 * Nexus **lit** le coffre, il ne l'écrit pas : l'écran le dit, et la maquette
 * (« Nouvelle note », « Mode édition ») ne l'a pas fait changer d'avis.
 */

/**
 * Le préfixe des liens internes. Un **fragment** (`#…`), et non un protocole à
 * nous : le rendu markdown vide les adresses dont il ne connaît pas le
 * protocole, et un lien interne deviendrait un lien mort.
 */
export const PREFIXE_DE_LIEN_INTERNE = '#nexus/';

/**
 * `[[Roy Batty]]`, `[[Roy Batty|le chef]]`, `[[Roy Batty#Profil]]` deviennent
 * des liens markdown vers la note. Le titre affiché est l'alias s'il y en a un,
 * le nom sinon. Les blocs de code ne sont pas touchés.
 */
export function liensInternes(contenu: string): string {
    return contenu
        .split(/(```[\s\S]*?```)/g)
        .map((morceau, i) => i % 2 === 1 ? morceau : morceau.replace(
            /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g,
            (tout, image: string, cible: string, alias?: string) => {
                // `![[image.png]]` est une image embarquée : on la laisse telle quelle.
                if (image) return tout;
                const nom = cible.trim();
                return `[${(alias ?? nom).trim()}](${PREFIXE_DE_LIEN_INTERNE}${encodeURIComponent(nom)})`;
            },
        ))
        .join('');
}

export interface EntreeDeTable {
    niveau: 1 | 2 | 3;
    titre: string;
}

/**
 * Les titres de la note (`#`, `##`, `###`), dans l'ordre — hors blocs de code,
 * où un `#` est un commentaire. L'ordre est ce qui relie une entrée à son titre
 * dans la page : l'écran vise le n-ième titre rendu.
 */
export function tableDesMatieres(contenu: string): EntreeDeTable[] {
    const entrees: EntreeDeTable[] = [];
    let dansDuCode = false;
    for (const ligne of contenu.split(/\r?\n/)) {
        if (/^\s*```/.test(ligne)) { dansDuCode = !dansDuCode; continue; }
        if (dansDuCode) continue;
        const m = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(ligne);
        if (m) entrees.push({ niveau: m[1].length as 1 | 2 | 3, titre: m[2].replace(/[*_`]/g, '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b ?? a) });
    }
    return entrees;
}

/**
 * Le titre `# Nom` en tête de note, quand il répète le nom du fichier : l'écran
 * l'affiche déjà en grand, le rendre une seconde fois ferait deux titres
 * identiques l'un sous l'autre. Les autres titres ne bougent pas.
 */
export function sansLeTitreRepete(contenu: string, nom: string): string {
    const m = /^\s*#\s+(.+?)\s*\r?\n/.exec(contenu);
    if (!m || m[1].trim().toLowerCase() !== nom.trim().toLowerCase()) return contenu;
    return contenu.slice(m[0].length);
}

/** Le nom d'une note sans son dossier ni son extension. */
export const nomDeLaNote = (chemin: string) => chemin.split(/[\\/]/).pop()!.replace(/\.md$/i, '');

/**
 * Retrouver la note d'un lien `[[Cible]]` dans l'arborescence : par son nom,
 * sans tenir compte de la casse — comme Obsidian. `null` si elle n'existe pas :
 * un lien vers une note qu'on n'a pas encore écrite est courant.
 */
export function trouverLaNote(arbre: NoteEntry[], cible: string): string | null {
    const voulu = nomDeLaNote(cible).toLowerCase();
    for (const entree of arbre) {
        if (entree.type === 'directory') {
            const trouve = trouverLaNote(entree.children ?? [], cible);
            if (trouve) return trouve;
        } else if (nomDeLaNote(entree.path).toLowerCase() === voulu) {
            return entree.path;
        }
    }
    return null;
}

/** Combien de notes le coffre compte — calculé, jamais écrit. */
export function compterLesNotes(arbre: NoteEntry[]): number {
    return arbre.reduce((n, e) => n + (e.type === 'directory' ? compterLesNotes(e.children ?? []) : 1), 0);
}
