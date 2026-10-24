import { describe, expect, it } from 'vitest';
import {
    armeLente, facteurDInitiative, initiativeDuRound, maladresse, ordreDuRound, porteeDuTir, rangDeLongueur,
    type DeclarationDeRound,
} from './roundDeReveDeDragon';

const declarer = (id: string, plus: Partial<DeclarationDeRound>): DeclarationDeRound => ({
    id, nom: id, categorie: 'melee', arme: 'Épée sorde', facteur: 8, etatGeneral: 0, demiSurprise: false, charge: false, groupe: 0, ...plus,
});

describe('Le round de combat de Rêve de Dragon (Livre des Voyageurs 2.3.1, p. 120–139)', () => {
    it('calcule le facteur d’initiative des exemples du livre', () => {
        expect(facteurDInitiative(10, 0)).toBe(5); // Nitouche, Lancer 10, Dague de jet 0
        expect(facteurDInitiative(14, 3)).toBe(10); // Brucelin, Mêlée 14, Épée +3
    });

    it('ajoute le d6, l’état général et la mêlée inégale, jamais un bonus d’état', () => {
        expect(initiativeDuRound(declarer('a', { facteur: 10, d6: 4, etatGeneral: -2 }))).toBe(12);
        expect(initiativeDuRound(declarer('b', { facteur: 5, d6: 1, groupe: 3 }))).toBe(9);
        expect(initiativeDuRound(declarer('c', { categorie: 'tir', facteur: 5, d6: 1, groupe: 3 }))).toBe(6);
        expect(initiativeDuRound(declarer('d', { facteur: 5, d6: 1, etatGeneral: 2 }))).toBe(6);
        expect(initiativeDuRound(declarer('e', {}))).toBeNull();
    });

    it('reconnaît les armes de la table de longueur', () => {
        expect(rangDeLongueur('Arme d’hast')).toBe(0);
        expect(rangDeLongueur('Épée à une main')).toBeNull();
        expect(rangDeLongueur('Dague de mêlée')).toBe(15);
        expect(rangDeLongueur('Corps à corps')).toBe(16);
        expect(rangDeLongueur('Hache de bataille')).toBeLessThan(rangDeLongueur('Masse lourde')!);
    });

    it('range les tirs, puis les lancers, puis la mêlée, dans leurs phases', () => {
        const ordre = ordreDuRound([
            declarer('melee', { d6: 6 }), declarer('arc', { categorie: 'tir', d6: 1 }), declarer('dague', { categorie: 'lancer', d6: 3 }),
            declarer('sort', { categorie: 'magie' }),
        ], false);
        expect(ordre.map(p => [p.phase.numero, p.rangs.map(r => r.id)])).toEqual([
            [2, ['sort']], [3, ['arc']], [4, ['dague']], [5, ['melee']], [6, []], [7, []],
        ]);
    });

    it('au round d’engagement, l’arme la plus longue frappe d’abord', () => {
        const [, , , melee] = ordreDuRound([
            declarer('dague', { arme: 'Dague', facteur: 12, d6: 6 }), declarer('lance', { arme: 'Lance', facteur: 3, d6: 1 }),
        ], true);
        expect(melee.rangs.map(r => r.id)).toEqual(['lance', 'dague']);
        expect(melee.rangs[0].motif).toMatch(/longueur/);
    });

    it('une charge rend l’initiative aléatoire pour toute la mêlée d’engagement', () => {
        const [, , , melee] = ordreDuRound([
            declarer('lance', { arme: 'Lance', facteur: 3, d6: 1 }), declarer('chargeur', { arme: 'Gourdin', facteur: 6, d6: 5, charge: true }),
        ], true);
        expect(melee.rangs.map(r => r.id)).toEqual(['chargeur', 'lance']);
        expect(melee.remarques.join(' ')).toMatch(/aléatoire/);
    });

    it('le demi-surpris n’a jamais l’initiative, et une égalité de mêlée laisse le round nul', () => {
        const [, , , melee] = ordreDuRound([
            declarer('sonne', { facteur: 20, d6: 6, demiSurprise: true }), declarer('a', { facteur: 5, d6: 3 }), declarer('b', { facteur: 6, d6: 2 }),
        ], false);
        expect(melee.rangs.map(r => r.id)).toEqual(['a', 'b', 'sonne']);
        expect(melee.remarques.join(' ')).toMatch(/round nul/);
    });

    it('lit la table des maladresses telle qu’imprimée', () => {
        expect(maladresse(5, true).nom).toBe('Désarmé');
        expect(maladresse(5, false).nom).toBe('Déséquilibré');
        expect(maladresse(11, true).nom).toBe('Faux mouvement');
        expect(maladresse(20, false).nom).toBe('Assommé net');
        expect(() => maladresse(1, true)).toThrow();
    });

    it('allonge la portée de la dague avec la FORCE, comme Brucelin', () => {
        expect(porteeDuTir('Dague', 8, 15)).toBe('courte');
        expect(porteeDuTir('Dague', 13, 15)).toBe('moyenne');
        expect(porteeDuTir('Dague', 20, 15)).toBe('extreme');
        expect(porteeDuTir('Dague', 21, 15)).toBe('hors');
        expect(porteeDuTir('Dague', 4, 9)).toBe('moyenne'); // Nitouche
        expect(porteeDuTir('Fouet', 3)).toBe('hors');
    });

    it('les armes lentes n’ont pas la rapidité', () => {
        expect(armeLente('Épée bâtarde')).toBe(true);
        expect(armeLente('Fléau léger')).toBe(true);
        expect(armeLente('Épée cyane')).toBe(false);
        expect(armeLente('Épée cyane', true)).toBe(true);
    });
});
