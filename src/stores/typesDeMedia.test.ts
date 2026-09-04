import { describe, it, expect } from 'vitest';
import {
    typeDuFichier,
    filtreDeSelection,
    documentAffichable,
    extensionDe,
    EXTENSIONS_DE_DOCUMENT,
} from './typesDeMedia';

const fichier = (name: string, type = '') => ({ name, type });

describe('classer un fichier', () => {
    it('reconnaît les trois familles par leur type MIME', () => {
        expect(typeDuFichier(fichier('a.mp3', 'audio/mpeg'))).toBe('audio');
        expect(typeDuFichier(fichier('a.mp4', 'video/mp4'))).toBe('video');
        expect(typeDuFichier(fichier('a.png', 'image/png'))).toBe('image');
    });

    it('reconnaît un document par son type ou par son extension', () => {
        expect(typeDuFichier(fichier('regles.pdf', 'application/pdf'))).toBe('document');
        expect(typeDuFichier(fichier('notes.md', ''))).toBe('document');
        expect(typeDuFichier(fichier('LETTRE.DOCX', ''))).toBe('document');
    });

    /*
      Windows rend une chaîne vide pour les formats qu'il ne connaît pas. Sans
      la liste d'extensions, ces images tomberaient dans le repli.
    */
    it("reconnaît une image dont le système ne donne pas le type", () => {
        expect(typeDuFichier(fichier('carte.jfif', ''))).toBe('image');
        expect(typeDuFichier(fichier('PORTRAIT.WEBP', ''))).toBe('image');
        expect(typeDuFichier(fichier('plan.avif', ''))).toBe('image');
    });

    it('range ce qu’il ne sait pas classer en document, et non en image', () => {
        // Avant le 2026-09-04 : `image`, donc une vignette cassée.
        expect(typeDuFichier(fichier('archive.zip', 'application/zip'))).toBe('document');
        expect(typeDuFichier(fichier('inconnu', ''))).toBe('document');
    });
});

describe('le filtre du sélecteur de fichiers', () => {
    it("n'emploie jamais « document/* », qui n'est pas un type MIME", () => {
        const filtre = filtreDeSelection(['document']);
        expect(filtre).not.toContain('document/*');
        expect(filtre).toContain('.pdf');
        expect(filtre.split(',')).toHaveLength(EXTENSIONS_DE_DOCUMENT.length);
    });

    it('emploie le préfixe MIME pour les trois familles média', () => {
        expect(filtreDeSelection(['image'])).toBe('image/*');
        expect(filtreDeSelection(['image', 'video'])).toBe('image/*,video/*');
    });

    it('ouvre tout quand aucun type n’est demandé', () => {
        expect(filtreDeSelection()).toBe('*/*');
        expect(filtreDeSelection([])).toBe('*/*');
    });
});

describe("l'aperçu d'un document", () => {
    it('affiche les PDF et le texte brut', () => {
        expect(documentAffichable('regles.pdf')).toBe(true);
        expect(documentAffichable('NOTES.TXT')).toBe(true);
        expect(documentAffichable('table.csv')).toBe(true);
    });

    it('renonce aux formats bureautiques plutôt que de rendre un cadre blanc', () => {
        expect(documentAffichable('lettre.docx')).toBe(false);
        expect(documentAffichable('vieux.doc')).toBe(false);
        expect(documentAffichable('note.odt')).toBe(false);
    });
});

describe("l'extension affichée", () => {
    it('la rend en majuscules', () => {
        expect(extensionDe('regles.pdf')).toBe('PDF');
        expect(extensionDe('archive.tar.gz')).toBe('GZ');
    });

    it('a un mot pour un fichier sans extension', () => {
        expect(extensionDe('LISEZMOI')).toBe('FICHIER');
    });
});
