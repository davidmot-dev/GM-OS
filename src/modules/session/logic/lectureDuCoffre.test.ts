import { describe, it, expect } from 'vitest';
import { liensInternes, tableDesMatieres, trouverLaNote, compterLesNotes, nomDeLaNote, sansLeTitreRepete, PREFIXE_DE_LIEN_INTERNE } from './lectureDuCoffre';
import type { NoteEntry } from '../useObsidianStore';

const ARBRE: NoteEntry[] = [
    { name: 'PNJ', path: 'PNJ', type: 'directory', children: [
        { name: 'Roy Batty.md', path: 'PNJ\\Roy Batty.md', type: 'file' },
        { name: 'Gaff.md', path: 'PNJ\\Gaff.md', type: 'file' },
    ] },
    { name: 'Lieux', path: 'Lieux', type: 'directory', children: [
        { name: 'Bradbury Building.md', path: 'Lieux\\Bradbury Building.md', type: 'file' },
    ] },
    { name: 'Index.md', path: 'Index.md', type: 'file' },
];

describe('les liens internes [[…]]', () => {
    it('deviennent des liens vers la note, avec leur alias', () => {
        expect(liensInternes('Traqué par [[Gaff]].')).toBe(`Traqué par [Gaff](${PREFIXE_DE_LIEN_INTERNE}Gaff).`);
        expect(liensInternes('[[Roy Batty|le chef]]')).toBe(`[le chef](${PREFIXE_DE_LIEN_INTERNE}Roy%20Batty)`);
        expect(liensInternes('[[Roy Batty#Profil]]')).toBe(`[Roy Batty](${PREFIXE_DE_LIEN_INTERNE}Roy%20Batty)`);
    });

    it('laissent les images embarquées et le code tranquilles', () => {
        expect(liensInternes('![[carte.png]]')).toBe('![[carte.png]]');
        expect(liensInternes('```\n[[Gaff]]\n```')).toBe('```\n[[Gaff]]\n```');
    });
});

describe('la table des matières', () => {
    it('suit les titres de la note, hors blocs de code', () => {
        const note = '# Roy Batty\nTexte\n## Profil\n```\n# pas un titre\n```\n### Les **liens** avec [[Gaff]]\n#### trop profond';
        expect(tableDesMatieres(note)).toEqual([
            { niveau: 1, titre: 'Roy Batty' },
            { niveau: 2, titre: 'Profil' },
            { niveau: 3, titre: 'Les liens avec Gaff' },
        ]);
    });
});

describe("retrouver une note dans l'arborescence", () => {
    it('par son nom, sans la casse, dans les dossiers', () => {
        expect(trouverLaNote(ARBRE, 'roy batty')).toBe('PNJ\\Roy Batty.md');
        expect(trouverLaNote(ARBRE, 'Bradbury Building')).toBe('Lieux\\Bradbury Building.md');
        expect(trouverLaNote(ARBRE, 'Tour Tyrell')).toBeNull();
    });

    it('compte les notes et nomme une note sans son chemin', () => {
        expect(compterLesNotes(ARBRE)).toBe(4);
        expect(nomDeLaNote('PNJ\\Roy Batty.md')).toBe('Roy Batty');
    });
});

describe('le titre répété', () => {
    it('disparaît quand il redit le nom de la note, et seulement alors', () => {
        expect(sansLeTitreRepete('# Roy Batty\nTexte', 'Roy Batty')).toBe('Texte');
        expect(sansLeTitreRepete('# Autre titre\nTexte', 'Roy Batty')).toBe('# Autre titre\nTexte');
        expect(sansLeTitreRepete('Texte\n# Roy Batty\n', 'Roy Batty')).toBe('Texte\n# Roy Batty\n');
    });
});
