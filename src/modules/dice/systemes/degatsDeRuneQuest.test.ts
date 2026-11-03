import { describe, it, expect } from 'vitest';
import {
    apresLaParade, composerLesDegats, direLIssue, ecrireLesDegats, issueDuCoup, lancerLesDegats, lireLesDegats,
    retirerLeBonusCompris, speciauxDeLArme, testDeLaceration, usageDuBonusDeLArme,
} from './degatsDeRuneQuest';

/** RQ-A3, 03/11/2026 : les exemples chiffrés du livre de base (pages imprimées). */
const f = (texte: string) => lireLesDegats(texte)!;
const au = (valeur: number) => () => valeur;

describe('les formules de dégâts', () => {
    it('lit les formules de la feuille et du livre', () => {
        expect(f('1D8+1')).toEqual([{ n: 1, faces: 8 }, { n: 1 }]);
        expect(f('1D10+1+3D6')).toEqual([{ n: 1, faces: 10 }, { n: 1 }, { n: 3, faces: 6 }]);
        expect(f('−1D4')).toEqual([{ n: -1, faces: 4 }]);
        expect(f('+1D6*')).toEqual([{ n: 1, faces: 6 }]);
        expect(f('2d6 + 2')).toEqual([{ n: 2, faces: 6 }, { n: 2 }]);
        expect(lireLesDegats('—')).toEqual([]);
        expect(lireLesDegats('')).toEqual([]);
        expect(lireLesDegats('Réussite particulière')).toBeNull();
        expect(ecrireLesDegats(f('1D8+2−1D4'))).toBe('1D8+2−1D4');
    });

    it('retire le bonus déjà compris dans les dégâts de l’arme (prétirés p. 85)', () => {
        expect(retirerLeBonusCompris(f('1D8+1+1D4'), f('+1D4'))).toEqual({ arme: f('1D8+1'), compris: true });
        expect(retirerLeBonusCompris(f('1D8+1'), f('+1D4'))).toEqual({ arme: f('1D8+1'), compris: false });
        // Une arme qui n'est que le bonus (bouclier « 1D4+1D4 ») garde son dé.
        expect(retirerLeBonusCompris(f('1D4'), f('1D4')).compris).toBe(false);
    });

    it('reconnaît le type des armes du livre (p. 208-212)', () => {
        expect(speciauxDeLArme('Épée large')).toEqual(['empalement', 'laceration']);
        expect(speciauxDeLArme('Kopis')).toEqual(['laceration']);
        expect(speciauxDeLArme('Lance courte')).toEqual(['empalement']);
        expect(speciauxDeLArme('Arc composite')).toEqual(['empalement']);
        expect(speciauxDeLArme('Massue')).toEqual(['ecrasement']);
        expect(speciauxDeLArme('Hache de lancer')).toEqual(['laceration']);
        expect(speciauxDeLArme('Dague de lancer')).toEqual(['empalement']);
        expect(speciauxDeLArme('Klanth')).toEqual([]);
        expect(usageDuBonusDeLArme('Arc composite', 'distance')).toBe('aucun');
        expect(usageDuBonusDeLArme('Javelot', 'distance')).toBe('moitie');
        expect(usageDuBonusDeLArme('Javelot', 'melee')).toBe('entier');
    });
});

describe('les dégâts selon le résultat (p. 202-204)', () => {
    const epee = f('1D8+1'), bonus = f('+1D4');

    it('réussite : les dégâts de l’arme et le bonus', () => {
        const c = composerLesDegats({ arme: epee, bonus, usage: 'entier', niveau: 'normaux', special: 'empalement' });
        expect(c.formule).toBe('1D8+1 + 1D4');
        expect(lancerLesDegats(c, au(3)).total).toBe(7);
    });

    it('empalement et lacération : dés et constante doublés, le bonus une fois — 2D8+2 (p. 203)', () => {
        for (const special of ['empalement', 'laceration'] as const) {
            const c = composerLesDegats({ arme: epee, bonus, usage: 'entier', niveau: 'speciaux', special });
            expect(c.formule).toBe('2D8+2 + 1D4');
            expect(lancerLesDegats(c, au(1)).total).toBe(5);
        }
    });

    it('écrasement : la massue 2D8 et +1D4 font 2D8+1D4+4 (p. 203)', () => {
        const c = composerLesDegats({ arme: f('2D8'), bonus, usage: 'entier', niveau: 'speciaux', special: 'ecrasement' });
        expect(lancerLesDegats(c, au(1)).total).toBe(2 + 4 + 1);
        expect(c.formule).toBe('2D8 + max 1D4 (4) + 1D4');
    });

    it('critique : le maximum des dégâts spéciaux, plus le bonus lancé — lance courte 14, épée large 18 (p. 203-204)', () => {
        const lance = composerLesDegats({ arme: f('1D6+1'), bonus: [], usage: 'entier', niveau: 'speciaux-max', special: 'empalement' });
        expect(lancerLesDegats(lance, au(1)).total).toBe(14);
        const epeeCritique = composerLesDegats({ arme: epee, bonus, usage: 'entier', niveau: 'speciaux-max', special: 'laceration' });
        expect(lancerLesDegats(epeeCritique, au(2)).total).toBe(18 + 2);
    });

    it('arme lancée : la moitié du bonus, arrondie au supérieur — javelot 2D10 + ½ 1D4 (p. 204, 212)', () => {
        const c = composerLesDegats({ arme: f('1D10'), bonus, usage: 'moitie', niveau: 'speciaux', special: 'empalement' });
        expect(c.formule).toBe('2D10 + ½ (1D4)');
        expect(lancerLesDegats(c, au(3)).total).toBe(6 + 2);
    });

    it('arc : aucun bonus (Vasana, p. 85) ; un malus ne fait pas descendre sous zéro', () => {
        expect(composerLesDegats({ arme: f('1D8+1'), bonus, usage: 'aucun', niveau: 'normaux' }).formule).toBe('1D8+1');
        const poing = composerLesDegats({ arme: f('1D3'), bonus: f('−1D4'), usage: 'entier', niveau: 'normaux' });
        expect(lancerLesDegats(poing, d => d).total).toBe(0);
    });

    it('le type à choisir : sans lui, une spéciale reste en dégâts normaux et le dit', () => {
        const c = composerLesDegats({ arme: epee, bonus, usage: 'entier', niveau: 'speciaux' });
        expect(c.formule).toBe('1D8+1 + 1D4');
        expect(c.remarques[0]).toMatch(/à choisir/);
    });
});

describe('la défense (tables p. 199 et 201)', () => {
    it('à dégâts et zone identiques, l’attaque ordinaire retire l’armure, la critique l’ignore', () => {
        expect(issueDuCoup('reussite', 'aucune')).toMatchObject({ degats: 'normaux', sansArmure: false });
        expect(issueDuCoup('reussite-critique', 'aucune')).toMatchObject({ degats: 'speciaux-max', sansArmure: true });
        expect(issueDuCoup('reussite-speciale', 'aucune')).toMatchObject({ degats: 'speciaux', sansArmure: false });
        expect(issueDuCoup('echec', 'aucune').degats).toBe('aucun');
        expect(issueDuCoup('echec-critique', 'aucune').echecsCritiques).toEqual(['attaquant']);
    });

    it('lit la table des parades case par case', () => {
        expect(issueDuCoup('reussite-critique', 'parade', 'reussite-critique')).toMatchObject({ degats: 'normaux', bloque: true, sansArmure: false, zone: 'tiree' });
        expect(issueDuCoup('reussite-critique', 'parade', 'reussite')).toMatchObject({ degats: 'speciaux-max', bloque: true, sansArmure: true, zone: 'adjacente', usureDeLaParade: 'tous-les-degats' });
        expect(issueDuCoup('reussite-speciale', 'parade', 'reussite')).toMatchObject({ degats: 'speciaux', zone: 'adjacente', usureDeLaParade: 'au-dessus' });
        expect(issueDuCoup('reussite', 'parade', 'reussite-speciale')).toMatchObject({ degats: 'aucun', riposte: { degats: 'normaux', usure: 'un-si-depasse' } });
        expect(issueDuCoup('echec', 'parade', 'echec-critique')).toMatchObject({ degats: 'normaux', echecsCritiques: ['defenseur'] });
        expect(issueDuCoup('echec-critique', 'parade', 'reussite-critique')).toMatchObject({ riposte: { degats: 'speciaux', usure: 'tous' }, echecsCritiques: ['attaquant'] });
    });

    it('lit la table des esquives case par case', () => {
        expect(issueDuCoup('reussite-critique', 'esquive', 'reussite-speciale')).toMatchObject({ degats: 'speciaux', sansArmure: false });
        expect(issueDuCoup('reussite-critique', 'esquive', 'reussite')).toMatchObject({ degats: 'speciaux', sansArmure: true });
        expect(issueDuCoup('reussite-speciale', 'esquive', 'reussite').degats).toBe('speciaux');
        expect(issueDuCoup('reussite', 'esquive', 'reussite').degats).toBe('aucun');
        expect(issueDuCoup('echec', 'esquive', 'echec-critique')).toMatchObject({ degats: 'normaux', echecsCritiques: ['defenseur'] });
        expect(issueDuCoup('echec-critique', 'esquive', 'echec-critique').echecsCritiques).toEqual(['attaquant', 'defenseur']);
    });

    it('la parade bloque jusqu’à la durabilité : Vostor, 33 contre un grand bouclier à 16 (p. 204)', () => {
        const issue = issueDuCoup('reussite-speciale', 'parade', 'reussite');
        expect(apresLaParade(33, issue, 16)).toMatchObject({ passent: 17, usure: 17 });
        expect(apresLaParade(10, issueDuCoup('reussite', 'parade', 'reussite'), 12)).toEqual({ passent: 0, usure: 0, note: undefined });
        expect(apresLaParade(14, issueDuCoup('reussite', 'parade', 'reussite'), 12).usure).toBe(1);
        expect(apresLaParade(14, issueDuCoup('reussite', 'aucune'), 12)).toEqual({ passent: 14 });
        expect(apresLaParade(14, issueDuCoup('reussite', 'parade', 'reussite'), undefined).passent).toBe(14);
    });

    it('dit la case avec sa page', () => {
        expect(direLIssue(issueDuCoup('reussite-critique', 'aucune'), 'aucune'))
            .toBe('Maximum des dégâts spéciaux ; sans tenir compte de l’armure (p. 200).');
        expect(direLIssue(issueDuCoup('reussite', 'esquive', 'reussite'), 'esquive')).toMatch(/esquivée.*p\. 201/);
    });

    it('le test de lacération : Vostor, CON 15, 5 points au bras — 50 % (p. 204)', () => {
        expect(testDeLaceration(15, 5)).toBe(50);
        expect(testDeLaceration(8, 12)).toBe(0);
    });
});

