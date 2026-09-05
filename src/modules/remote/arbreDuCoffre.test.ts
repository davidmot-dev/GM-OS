import { describe, it, expect } from 'vitest';
import { toutesLesNotes, contenuDuChemin, range } from './arbreDuCoffre';
import type { NoteEntry } from '../session/useObsidianStore';

/**
 * **Le découpage du coffre est respecté.**
 *
 * Demandé par David le 2026-09-05 : *« peux-tu respecter le découpage dans le
 * Nexus wiki »*. La première version aplatissait les deux mille notes en une
 * liste, le dossier réduit à un sous-titre — *un coffre rangé depuis des années
 * dont le rangement était jeté à l'affichage.*
 */

const note = (name: string, path: string): NoteEntry => ({ name, path, type: 'file' });
const dossier = (name: string, path: string, children: NoteEntry[]): NoteEntry =>
    ({ name, path, type: 'directory', children });

const COFFRE: NoteEntry[] = [
    dossier('PNJ', 'PNJ', [
        note('Milo.md', 'PNJ/Milo.md'),
        dossier('Antagonistes', 'PNJ/Antagonistes', [note('Le Maire.md', 'PNJ/Antagonistes/Le Maire.md')]),
    ]),
    dossier('Lieux', 'Lieux', [note('Auberge.md', 'Lieux/Auberge.md')]),
    note('Journal.md', 'Journal.md'),
];

describe('descendre dans les dossiers', () => {
    it('rend la racine sur un chemin vide', () => {
        expect(contenuDuChemin(COFFRE, [])).toBe(COFFRE);
    });

    it('descend d’un niveau', () => {
        const dedans = contenuDuChemin(COFFRE, ['PNJ']);
        expect(dedans?.map(e => e.name)).toEqual(['Milo.md', 'Antagonistes']);
    });

    it('descend de deux niveaux', () => {
        const dedans = contenuDuChemin(COFFRE, ['PNJ', 'Antagonistes']);
        expect(dedans?.map(e => e.name)).toEqual(['Le Maire.md']);
    });

    it('rend `null` sur un dossier qui n’existe plus — renommé sur le PC', () => {
        /* L'écran retombe alors à la racine : mieux vaut cela qu'un écran vide
           sans explication. */
        expect(contenuDuChemin(COFFRE, ['PNJ', 'Disparu'])).toBeNull();
        expect(contenuDuChemin(COFFRE, ['Inconnu'])).toBeNull();
    });

    it('ne descend PAS dans une note — un fichier n’est pas un dossier', () => {
        expect(contenuDuChemin(COFFRE, ['Journal.md'])).toBeNull();
    });

    it('supporte un dossier sans enfants déclarés', () => {
        const vide: NoteEntry[] = [{ name: 'Vide', path: 'Vide', type: 'directory' }];
        expect(contenuDuChemin(vide, ['Vide'])).toEqual([]);
    });
});

describe('l’ordre d’un niveau', () => {
    it('met les dossiers avant les notes', () => {
        const range_ = range([note('a.md', 'a.md'), dossier('Z', 'Z', []), note('b.md', 'b.md')]);
        expect(range_.map(e => e.name)).toEqual(['Z', 'a.md', 'b.md']);
    });

    it('range les accents à leur place — « Éclaireur » avant « Zone »', () => {
        /* Sans `localeCompare`, le É sort de l'ASCII et passerait après Z. */
        const range_ = range([note('Zone.md', 'Zone.md'), note('Éclaireur.md', 'Éclaireur.md')]);
        expect(range_.map(e => e.name)).toEqual(['Éclaireur.md', 'Zone.md']);
    });

    it('ne modifie pas la liste qu’on lui donne', () => {
        const entree = [note('b.md', 'b'), note('a.md', 'a')];
        range(entree);
        expect(entree.map(e => e.name)).toEqual(['b.md', 'a.md']);
    });
});

describe('aplatir, mais pour la recherche seulement', () => {
    it('trouve les notes de tous les niveaux', () => {
        expect(toutesLesNotes(COFFRE).map(n => n.nom).sort()).toEqual(
            ['Auberge.md', 'Journal.md', 'Le Maire.md', 'Milo.md']);
    });

    it('garde le chemin de dossiers — on doit savoir d’où sort ce qu’on a trouvé', () => {
        const trouvees = toutesLesNotes(COFFRE);
        expect(trouvees.find(n => n.nom === 'Le Maire.md')?.dossier).toBe('PNJ / Antagonistes');
        expect(trouvees.find(n => n.nom === 'Milo.md')?.dossier).toBe('PNJ');
    });

    it('laisse le dossier vide pour une note de la racine', () => {
        expect(toutesLesNotes(COFFRE).find(n => n.nom === 'Journal.md')?.dossier).toBe('');
    });

    it('emporte le chemin d’ouverture, pas le nom', () => {
        /* C'est ce chemin que le meneur reçoit pour lire la note : le confondre
           avec le nom ferait chercher « Milo.md » à la racine du coffre. */
        expect(toutesLesNotes(COFFRE).find(n => n.nom === 'Milo.md')?.chemin).toBe('PNJ/Milo.md');
    });

    it('supporte un coffre vide', () => {
        expect(toutesLesNotes([])).toEqual([]);
    });
});
