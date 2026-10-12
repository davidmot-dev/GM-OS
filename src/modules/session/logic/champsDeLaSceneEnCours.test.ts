import { describe, it, expect } from 'vitest';
import { fusionnerLesScenes, secondeMoitieDeLaScene, clonerLaScene } from './trame';
import { nomDeLaNote, notesDuCoffre } from './noteDeLaScene';
import type { Scene } from '../../../types/trame.types';

/*
  L'écran « Scène en cours », L1 (2026-10-12) : six champs facultatifs sur la
  scène. *Un champ qu'un geste de la trame oublie est une donnée perdue au
  premier clic.*
*/
const scene = (id: string, patch: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c-1', acteId: 'a-1', ordre: 0, titre: id, resume: '', origine: 'preparee',
    entiteIds: [], indiceIds: [], creeeLe: 1, ...patch,
});

describe('les champs de l’écran « Scène en cours » et les gestes de la trame', () => {
    const pleine = scene('A', {
        descriptionNarrative: 'La pluie sur les néons.', enjeux: 'Retrouver le témoin.',
        repliques: '« Tu n’as rien vu. »', ideesMusicales: 'Synthé lent.',
        morceauxIds: ['pad-1'], noteObsidian: 'Campagne/Scène A.md',
    });

    it('la fusion accole les textes, réunit les morceaux, garde la note de la gardée', () => {
        const absorbee = scene('B', {
            descriptionNarrative: 'Une sirène au loin.', morceauxIds: ['pad-1', 'pad-2'], noteObsidian: 'Autre.md',
        });
        const f = fusionnerLesScenes(pleine, absorbee);
        expect(f.descriptionNarrative).toContain('La pluie sur les néons.');
        expect(f.descriptionNarrative).toContain('Une sirène au loin.');
        expect(f.enjeux).toBe('Retrouver le témoin.');
        expect(f.morceauxIds).toEqual(['pad-1', 'pad-2']);
        expect(f.noteObsidian).toBe('Campagne/Scène A.md');
    });

    it('deux scènes sans ces champs restent sans eux après fusion', () => {
        const f = fusionnerLesScenes(scene('A'), scene('B'));
        expect(f.descriptionNarrative).toBeUndefined();
        expect(f.morceauxIds).toBeUndefined();
        expect(f.noteObsidian).toBeUndefined();
    });

    it('la scission laisse les textes à la première, et donne le décor à la seconde', () => {
        const s = secondeMoitieDeLaScene(pleine, 'A2', 'A (suite)', 1, 2);
        expect(s.descriptionNarrative).toBeUndefined();
        expect(s.enjeux).toBeUndefined();
        expect(s.repliques).toBeUndefined();
        expect(s.ideesMusicales).toBeUndefined();
        expect(s.morceauxIds).toEqual(['pad-1']);
        expect(s.morceauxIds).not.toBe(pleine.morceauxIds);
        expect(s.noteObsidian).toBe('Campagne/Scène A.md');
    });

    it('le clone garde tout', () => {
        const c = clonerLaScene(pleine, 'A3', 'A (bis)', 1, 3);
        expect(c).toMatchObject({
            descriptionNarrative: pleine.descriptionNarrative, enjeux: pleine.enjeux,
            repliques: pleine.repliques, ideesMusicales: pleine.ideesMusicales,
            morceauxIds: ['pad-1'], noteObsidian: pleine.noteObsidian,
        });
    });
});

describe('notesDuCoffre', () => {
    it('met l’arbre à plat, ne garde que le Markdown, et trie', () => {
        expect(notesDuCoffre([
            { name: 'Campagne', path: 'Campagne', type: 'directory', children: [
                { name: 'Zed.md', path: 'Campagne\\Zed.md', type: 'file' },
                { name: 'carte.png', path: 'Campagne\\carte.png', type: 'file' },
            ] },
            { name: 'Accueil.md', path: 'Accueil.md', type: 'file' },
        ])).toEqual(['Accueil.md', 'Campagne\\Zed.md']);
        expect(notesDuCoffre(undefined)).toEqual([]);
    });

    it('nomme une note par son fichier', () => {
        expect(nomDeLaNote('Campagne\\Scène A.md')).toBe('Scène A');
        expect(nomDeLaNote('Campagne/Scène B.MD')).toBe('Scène B');
    });
});
