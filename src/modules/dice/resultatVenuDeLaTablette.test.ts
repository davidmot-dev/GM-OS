import { describe, it, expect } from 'vitest';
import { lireLeResultatDeLaTablette } from './resultatVenuDeLaTablette';

/**
 * **Ce qui vient du réseau se relit champ par champ** (2026-09-30). Le meneur
 * croit le résultat d'un joueur, pas la forme de son message.
 */
describe('un résultat venu de la tablette', () => {
    const BON = {
        characterId: 'p1', titre: 'Combat + Devoir', totalDisplay: '2 Succès',
        total: 2, modifier: 0, successes: 2, tagSuccess: true, degre: 'reussite-normale',
        rolls: [{ val: 3, sides: 20 }, { val: 17, sides: 20, isDropped: true, displayStr: '(17)' }],
    };

    it('garde ce que l’écran sait afficher', () => {
        const lu = lireLeResultatDeLaTablette(BON)!;
        expect(lu.characterId).toBe('p1');
        expect(lu.titre).toBe('Combat + Devoir');
        expect(lu.resultat).toEqual({
            total: 2, modifier: 0, totalDisplay: '2 Succès', successes: 2, tagSuccess: true, degre: 'reussite-normale',
            rolls: [{ val: 3, sides: 20 }, { val: 17, sides: 20, isDropped: true, displayStr: '(17)' }],
        });
    });

    it('jette ce qu’il n’attend pas', () => {
        const lu = lireLeResultatDeLaTablette({
            ...BON, degre: 'triomphe-absolu', total: 'beaucoup', pirate: true,
            rolls: [{ val: 3, cssClass: 'x', onclick: 'alert(1)' }, 'rien', null],
        })!;
        expect(lu.resultat.degre).toBeUndefined();
        expect(lu.resultat.total).toBe(0);
        expect(lu.resultat.rolls).toEqual([{ val: 3 }]);
        expect(lu.resultat).not.toHaveProperty('pirate');
    });

    it('borne les textes', () => {
        const lu = lireLeResultatDeLaTablette({ ...BON, titre: 'x'.repeat(500) })!;
        expect(lu.titre).toHaveLength(120);
    });

    it('refuse un message sans personnage, sans titre ou sans résultat', () => {
        expect(lireLeResultatDeLaTablette({ ...BON, characterId: '' })).toBe(null);
        expect(lireLeResultatDeLaTablette({ ...BON, titre: undefined })).toBe(null);
        expect(lireLeResultatDeLaTablette({ ...BON, totalDisplay: 42 })).toBe(null);
        expect(lireLeResultatDeLaTablette(null)).toBe(null);
    });
});
