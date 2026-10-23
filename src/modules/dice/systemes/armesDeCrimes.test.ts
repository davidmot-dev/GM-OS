import { describe, it, expect } from 'vitest';
import { ARMES_A_FEU, ARMES_BLANCHES, ARMES_DE_CRIMES, incidentsDuTir, resoudreLAttaque } from './armesDeCrimes';

/** **Les armes de Crimes** — C6, livre p. 344–346 et 389–395. Les cas sont ceux du livre. */
const arme = (id: string) => ARMES_DE_CRIMES.find(a => a.id === id)!;

describe('les tableaux du livre', () => {
    it('treize armes blanches, vingt-huit armes à feu, des identifiants uniques', () => {
        expect(ARMES_BLANCHES).toHaveLength(13);
        expect(ARMES_A_FEU).toHaveLength(28);
        expect(new Set(ARMES_DE_CRIMES.map(a => a.id)).size).toBe(ARMES_DE_CRIMES.length);
    });
    it('quelques lignes relues : Clic-clac 20 m, 6 coups, 4 dégâts, T ; Lebel 400 m, 9 ; canne-épée Physique + 2, blessure', () => {
        expect(arme('clic-clac')).toMatchObject({ portee: 20, munitions: 6, degats: 4, critiques: ['T'], rechargement: 2 });
        expect(arme('lebel')).toMatchObject({ portee: 400, munitions: 10, degats: 9 });
        expect(arme('derringer')).toMatchObject({ degats: 5, degatsMinores: 4 });
        expect(arme('canne-epee')).toMatchObject({ famille: 'blanche', degats: 2, atteinte: 'blessures' });
        expect(arme('matraque')).toMatchObject({ degats: 1, atteinte: 'epuisement' });
    });
});

describe('l’attaque', () => {
    it('l’exemple du livre : 2 succès + 5 (dégât fixe) − 0 − 3 (Physique) − 0 = 4 blessures (p. 395)', () => {
        const coup = resoudreLAttaque({ arme: { ...arme('clic-clac'), degats: 5 }, reussites: 2, adverses: 0, physiqueAttaquant: 4, physiqueCible: 3, protection: 0 });
        expect(coup).toMatchObject({ touche: true, degats: 4, atteinte: 'blessures' });
        expect(coup.calcul).toMatch(/= 4$/);
    });

    it('au moins un point d’atteinte, quelle que soit la protection', () => {
        expect(resoudreLAttaque({ arme: arme('protector'), reussites: 1, adverses: 0, physiqueAttaquant: 2, physiqueCible: 5, protection: 3 }).degats).toBe(1);
    });

    it('la mêlée : la canne-épée frappe du Physique + 2 ; à égalité, aucune blessure (p. 392)', () => {
        const coup = resoudreLAttaque({ arme: arme('canne-epee'), reussites: 1, adverses: 0, physiqueAttaquant: 4, physiqueCible: 3, protection: 0 });
        expect(coup).toMatchObject({ touche: true, degats: 4 });
        expect(resoudreLAttaque({ arme: arme('canne-epee'), reussites: 1, adverses: 1, physiqueAttaquant: 4, physiqueCible: 3, protection: 0 }).touche).toBe(false);
    });

    it('au-delà de la portée utile, une réussite de moins ; au-delà du double, impossible (p. 389)', () => {
        const base = { arme: arme('clic-clac'), reussites: 2, adverses: 0, physiqueAttaquant: 3, physiqueCible: 3, protection: 0 };
        expect(resoudreLAttaque({ ...base, distance: 20 }).malusDePortee).toBe(0);
        expect(resoudreLAttaque({ ...base, distance: 30 })).toMatchObject({ malusDePortee: 1, degats: 2 });
        expect(resoudreLAttaque({ ...base, distance: 41 }).impossible).toMatch(/portée maximale \(40 m\)/);
        expect(resoudreLAttaque({ ...base, reussites: 1, distance: 30 }).touche).toBe(false);
    });

    it('les incidents d’un échec critique, et l’explosion à deux 1 gardés', () => {
        expect(incidentsDuTir(arme('revol-cycle'), 1)).toHaveLength(3);
        expect(incidentsDuTir(arme('clic-clac'), 2).at(-1)).toMatch(/exploser/);
        expect(incidentsDuTir(arme('canne-epee'), 2)).toEqual([]);
    });
});
