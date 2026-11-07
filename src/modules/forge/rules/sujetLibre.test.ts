import { describe, expect, it } from 'vitest';
import { avecLeSujetLibre, sansLeSujetLibre } from './sujetLibre';
import { candidatsDesSujets, sujetsDesCandidats, MARQUE_SUPPLEMENT } from './supplements';
import type { BrainstormCandidate } from './types';

/*
 * Le sujet libre, pour le livre de base et pour un supplément — 07/11/2026, David : « je voudrais
 * que l'on active le "sujet de forge libre" pour les Suppléments », le temps de le forger.
 */
const retenus = candidatsDesSujets([
    { titre: 'Pistolets', mecanique: 'm', sections: ['Pistols'] },
    { titre: 'Explosifs', mecanique: 'm', sections: [] },
]);
const nouveau = (titre: string, id: string): BrainstormCandidate =>
    ({ id, title: titre, category: 'rule', summary: '', tags: ['oui', MARQUE_SUPPLEMENT, 'sujet libre'] });

describe('avecLeSujetLibre / sansLeSujetLibre', () => {
    it('un sujet inédit passe en tête ; un sujet retenu est marqué et déplacé, sans doublon', () => {
        expect(avecLeSujetLibre(retenus, 'Armes lourdes', nouveau).map(c => c.title)).toEqual(['Armes lourdes', 'Pistolets', 'Explosifs']);
        const retrouve = avecLeSujetLibre(retenus, 'explosifs', nouveau);
        expect(retrouve.map(c => c.title)).toEqual(['Explosifs', 'Pistolets']);
        expect(retrouve[0].tags).toContain('sujet libre retrouvé');
    });

    it('changer ou effacer la saisie ne laisse aucune trace', () => {
        const une = avecLeSujetLibre(retenus, 'Armes lourdes', nouveau);
        expect(avecLeSujetLibre(une, 'Grenades', nouveau).map(c => c.title)).toEqual(['Grenades', 'Pistolets', 'Explosifs']);
        const retrouve = avecLeSujetLibre(retenus, 'Pistolets', nouveau);
        expect(avecLeSujetLibre(retrouve, '', nouveau).every(c => !c.tags.includes('sujet libre retrouvé'))).toBe(true);
    });

    it('ce qu’on enregistre dans sujets.json ne contient jamais le sujet libre ni ses marques', () => {
        const liste = avecLeSujetLibre(avecLeSujetLibre(retenus, 'Armes lourdes', nouveau), 'Pistolets', nouveau);
        expect(sujetsDesCandidats(sansLeSujetLibre(liste))).toEqual([
            { titre: 'Pistolets', mecanique: 'm', sections: ['Pistols'] },
            { titre: 'Explosifs', mecanique: 'm', sections: [] },
        ]);
    });
});
