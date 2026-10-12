import { describe, it, expect } from 'vitest';
import { rencontresDuClone, rencontresReportees, rencontresSansLesScenes } from './rencontresDeLaTrame';
import type { RencontrePreparee } from '../../../types/rencontres.types';

const rencontre = (id: string, sceneId?: string): RencontrePreparee => ({
    id, campaignId: 'c-1', sceneId, nom: id, creeeLe: 1,
    lignes: [{ genre: 'archetype', archetypeId: 'brute', rangId: 'pietaille', nombre: 2 }],
});

describe('les rencontres suivent la trame', () => {
    it('⛔ une scène supprimée rend ses rencontres LIBRES, jamais effacées', () => {
        const suite = rencontresSansLesScenes([rencontre('r1', 'sc-1'), rencontre('r2', 'sc-2')], new Set(['sc-1']));
        expect(suite.map(r => r.id), 'une rencontre préparée a disparu avec sa scène').toEqual(['r1', 'r2']);
        expect(suite[0].sceneId).toBeUndefined();
        expect('sceneId' in suite[0], 'la clé reste, avec une scène qui n’existe plus').toBe(false);
        expect(suite[1].sceneId).toBe('sc-2');
    });

    it('la fusion passe les rencontres de l’absorbée à la scène qui reste', () => {
        const suite = rencontresReportees([rencontre('r1', 'absorbee'), rencontre('r2', 'autre')], 'absorbee', 'gardee');
        expect(suite.map(r => r.sceneId)).toEqual(['gardee', 'autre']);
    });

    it('le clone recopie les rencontres de sa scène, avec de nouveaux identifiants', () => {
        const source = [rencontre('r1', 'sc-1'), rencontre('r2', 'sc-2')];
        const copies = rencontresDuClone(source, 'sc-1', 'clone', 5);
        expect(copies).toHaveLength(1);
        expect(copies[0].sceneId).toBe('clone');
        expect(copies[0].id).not.toBe('r1');
        expect(copies[0].lignes, 'la copie partage ses lignes avec l’original').not.toBe(source[0].lignes);
        expect(copies[0].lignes).toEqual(source[0].lignes);
    });
});
