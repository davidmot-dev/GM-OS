import type { NoteEntry } from '../useObsidianStore';

/**
 * **Les notes du coffre, à plat** — pour lier une scène à sa note Obsidian
 * (2026-10-12 : *« un lien de la scène vers sa note m'aiderait beaucoup »*).
 *
 * L'arbre de `listNotes` devient la liste des fichiers Markdown, triée, que le
 * champ propose à la saisie. Les dossiers ne sont pas des notes.
 */
export function notesDuCoffre(arbre: readonly NoteEntry[] | undefined): string[] {
    const chemins: string[] = [];
    const parcourir = (entrees: readonly NoteEntry[]) => {
        for (const e of entrees) {
            if (e.type === 'directory') parcourir(e.children ?? []);
            else if (e.path.toLowerCase().endsWith('.md')) chemins.push(e.path);
        }
    };
    parcourir(arbre ?? []);
    return chemins.sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Le nom lisible d'une note : son fichier, sans dossier ni `.md`. */
export const nomDeLaNote = (chemin: string): string =>
    (chemin.split(/[\\/]/).pop() ?? chemin).replace(/\.md$/i, '');
