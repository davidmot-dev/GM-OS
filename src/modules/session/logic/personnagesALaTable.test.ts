import { describe, it, expect } from 'vitest';
import { personnagesDeLaSeance, seulementLesConnectes } from './personnagesALaTable';

/**
 * Ce que ces essais protègent — David, 11/11/2026 : « lorsqu'on est à Table, je
 * voudrais quand je vais sur un joueur, ne voir que ses personnages actifs dans
 * la partie. Même chose dans le centre de liaison, je ne veux voir que les
 * personnages connectés. »
 */

const pj = (id: string) => ({ id, name: id });

describe('personnagesDeLaSeance', () => {
    it('à la Table, seulement ceux ajoutés à la séance ; le nombre masqué est dit', () => {
        expect(personnagesDeLaSeance([pj('a'), pj('b'), pj('c')], { sessionEntityIds: ['b', 'pnj-1'] }))
            .toEqual({ visibles: [pj('b')], masques: 2 });
    });

    it('sans séance (Atelier, ou rien en cours), tous', () => {
        expect(personnagesDeLaSeance([pj('a'), pj('b')], undefined)).toEqual({ visibles: [pj('a'), pj('b')], masques: 0 });
    });

    it('une séance sans personnage ajouté n’en montre aucun', () => {
        expect(personnagesDeLaSeance([pj('a')], {})).toEqual({ visibles: [], masques: 1 });
    });
});

describe('seulementLesConnectes', () => {
    it('ceux qu’une tablette tient, et eux seuls', () => {
        expect(seulementLesConnectes([pj('a'), pj('b')], { b: 'tablette-1' })).toEqual([pj('b')]);
        expect(seulementLesConnectes([pj('a')], undefined)).toEqual([]);
    });
});
