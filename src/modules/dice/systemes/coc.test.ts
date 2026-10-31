import { describe, it, expect } from 'vitest';
import {
    CHOIX_DE_COC, ajouterLeHeros, auTroisD6, bonusDesConditions, bonusDuHeros, desGardes, echelleAuTroisD6, encaisserCoc,
    etatDeSante, lancerCoc, malusDeSante, modeleDEvolution, nombreDeDesDeCoc, preparerCoc, resoudreCoc,
    type ChoixDeCoc, type RegleDeCoc,
} from './coc';

/**
 * Le test de Chroniques Oubliées Contemporain, sur les exemples du livre de règles de la
 * 2e édition (pages imprimées). Voir `coc.ts`.
 */
const REGLE: RegleDeCoc = {
    sante: 'echelle_de_sante',
    physiques: ['agilite', 'constitution', 'force', 'attaque_au_contact', 'attaque_a_distance'],
    evolution: { champ: 'echelle_evolution', modele: 'modele_evolution' },
    volonte: 'volonte',
};
const choix = (maj: Partial<ChoixDeCoc> = {}): ChoixDeCoc => ({ ...CHOIX_DE_COC, ...maj });

describe('le test : d20 + caractéristique contre la difficulté', () => {
    it('saute la haie : 8 au dé + AGI 3 = 11 contre 10, réussi (p. 8)', () => {
        const prep = preparerCoc(REGLE, choix({ difficulte: 10 }), { valeur: 3, champ: 'agilite' }, {});
        const jet = resoudreCoc(prep, [8]);
        expect(jet.coc).toMatchObject({ naturel: 8, resultat: 11, bilan: 'reussite' });
        expect(jet.successes).toBe(1);
        expect(jet.totalDisplay).toBe('Réussite — 8 + 3 = 11 contre 10');
    });

    it('un résultat sous la difficulté échoue', () => {
        const jet = resoudreCoc(preparerCoc(REGLE, choix({ difficulte: 15 }), { valeur: 3 }, {}), [11]);
        expect(jet.coc.bilan).toBe('echec');
        expect(jet.tagSuccess).toBe(false);
    });

    it('un 20 naturel est une réussite critique, même sous la difficulté ; un 1 un échec critique, même au-dessus (p. 58)', () => {
        expect(resoudreCoc(preparerCoc(REGLE, choix({ difficulte: 30 }), { valeur: 2 }, {}), [20]).coc.bilan).toBe('reussite-critique');
        expect(resoudreCoc(preparerCoc(REGLE, choix({ difficulte: 5 }), { valeur: 9 }, {}), [1]).coc.bilan).toBe('echec-critique');
    });

    it('la plage de réussite critique s’élargit : 18 à 20 avec « Cibler » (p. 90)', () => {
        const prep = preparerCoc(REGLE, choix({ difficulte: 30, critiqueDes: 18 }), { valeur: 0 }, {});
        expect(resoudreCoc(prep, [18]).coc.bilan).toBe('reussite-critique');
        expect(resoudreCoc(prep, [17]).coc.bilan).toBe('echec');
    });

    it('la plage d’échec critique aussi : 1 à 3 face à un événement de rang 2 (p. 77)', () => {
        const prep = preparerCoc(REGLE, choix({ difficulte: 15, echecJusqua: 3 }), { valeur: 5, champ: 'volonte' }, {});
        expect(resoudreCoc(prep, [3]).coc.bilan).toBe('echec-critique');
        expect(resoudreCoc(prep, [4]).coc.bilan).toBe('echec');
    });
});

describe('dé bonus et dé malus (p. 59)', () => {
    it('le dé bonus garde le meilleur des deux d20, le dé malus le pire', () => {
        expect(desGardes([5, 17], 1, 'd20')).toEqual([1]);
        expect(desGardes([5, 17], -1, 'd20')).toEqual([0]);
        const bonus = preparerCoc(REGLE, choix({ bonus: 1, difficulte: 15 }), { valeur: 0 }, {});
        expect(resoudreCoc(bonus, [5, 17]).coc).toMatchObject({ naturel: 17, bilan: 'reussite' });
    });

    it('ils ne se cumulent pas et s’annulent : un bonus et un malus, un seul d20 ; deux malus et un bonus, un dé malus', () => {
        expect(preparerCoc(REGLE, choix({ bonus: 1, malus: 1 }), { valeur: 0 }, {}).solde).toBe(0);
        expect(preparerCoc(REGLE, choix({ bonus: 1, malus: 2 }), { valeur: 0 }, {}).solde).toBe(-1);
        expect(preparerCoc(REGLE, choix({ bonus: 3 }), { valeur: 0 }, {}).solde).toBe(1);
        expect(nombreDeDesDeCoc(0, 'd20')).toEqual({ nombre: 1, faces: 20 });
        expect(nombreDeDesDeCoc(1, 'd20')).toEqual({ nombre: 2, faces: 20 });
    });
});

describe('les modificateurs', () => {
    it('deux conditions favorables et une défavorable donnent une favorable : +2 (p. 88)', () => {
        expect(bonusDesConditions(2 - 1)).toBe(2);
        expect(bonusDesConditions(2)).toBe(5);
        expect(bonusDesConditions(5)).toBe(10);
        expect(bonusDesConditions(-2)).toBe(-5);
    });

    it('chaque allié qui aide donne +2 (p. 61), l’état préjudiciable le plus grave retire son malus (p. 64-65)', () => {
        const prep = preparerCoc(REGLE, choix({ aides: 2, etat: 'epuise' }), { valeur: 1, champ: 'intelligence' }, {});
        expect(prep.modificateurs).toEqual([{ label: '2 aides', valeur: 4 }, { label: 'Épuisé', valeur: -5 }]);
        expect(prep.total).toBe(0);
    });

    it('l’état de santé pèse sur les actions physiques seules : 11 échelons, Affaibli, −3 (p. 72)', () => {
        expect(etatDeSante(7)?.label).toBe('Contusionné');
        expect(etatDeSante(11)?.label).toBe('Affaibli');
        expect(malusDeSante(4)).toBe(0);
        expect(malusDeSante(20)).toBe(10);
        const fiche = { echelle_de_sante: 11 };
        expect(preparerCoc(REGLE, choix(), { valeur: 2, champ: 'agilite' }, fiche).modificateurs).toEqual([{ label: 'Affaibli', valeur: -3 }]);
        expect(preparerCoc(REGLE, choix(), { valeur: 2, champ: 'perception' }, fiche).modificateurs).toEqual([]);
        // Le meneur peut dire qu'un test de PER est physique, ou qu'une attaque ne l'est pas.
        expect(preparerCoc(REGLE, choix({ physique: true }), { valeur: 2, champ: 'perception' }, fiche).total).toBe(-1);
    });

    it('le blues aide la VOL et la coercition, gêne les autres interactions : Déstabilisé, ±3 (p. 84)', () => {
        const fiche = { modele_evolution: 'Blues', echelle_evolution: 12 };
        expect(preparerCoc(REGLE, choix(), { valeur: 1, champ: 'volonte' }, fiche).total).toBe(4);
        expect(preparerCoc(REGLE, choix({ blues: 'moins' }), { valeur: 2, champ: 'charisme' }, fiche).total).toBe(-1);
        expect(preparerCoc(REGLE, choix(), { valeur: 2, champ: 'charisme' }, fiche).total).toBe(2);
        // L'échelle du héros ne joue pas avant le jet.
        expect(preparerCoc(REGLE, choix(), { valeur: 1, champ: 'volonte' }, { modele_evolution: 'Héros', echelle_evolution: 12 }).total).toBe(1);
        expect(modeleDEvolution('Héros')).toBe('heros');
        expect(modeleDEvolution('échelle de conscience')).toBe('autre');
    });
});

describe('prendre son temps et le mode rapide et furieux (p. 59)', () => {
    it('prendre son temps vaut 10, sans critique possible', () => {
        const prep = preparerCoc(REGLE, choix({ difficulte: 15, facon: 'temps' }), { valeur: 5 }, {});
        const jet = lancerCoc(prep, () => 20);
        expect(jet.coc).toMatchObject({ naturel: 10, resultat: 15, bilan: 'reussite' });
        expect(jet.rolls).toEqual([]);
    });

    it('la réussite automatique ne s’offre qu’à qui atteint la difficulté ; sinon le dé roule', () => {
        const atteint = lancerCoc(preparerCoc(REGLE, choix({ difficulte: 10, facon: 'rapide' }), { valeur: 10 }, {}), () => 1);
        expect(atteint.coc.bilan).toBe('reussite');
        expect(atteint.totalDisplay).toContain('sans lancer');
        const manque = lancerCoc(preparerCoc(REGLE, choix({ difficulte: 15, facon: 'rapide' }), { valeur: 3 }, {}), () => 1);
        expect(manque.coc.bilan).toBe('echec-critique');
        expect(manque.rolls).toHaveLength(1);
    });
});

describe('l’échelle du héros (p. 81-82)', () => {
    it('au 13e échelon, +5 pour un échelon ou +10 pour deux ; au 1er, +2 ; au 20e, Légende +10', () => {
        expect(bonusDuHeros(13).map(o => [o.echelons, o.bonus])).toEqual([[1, 5], [2, 10]]);
        expect(bonusDuHeros(1).map(o => [o.echelons, o.bonus])).toEqual([[1, 2]]);
        expect(bonusDuHeros(20).at(-1)).toMatchObject({ echelons: 1, bonus: 10, label: 'Légende' });
        expect(bonusDuHeros(0)).toEqual([]);
    });

    it('+2 à un test qu’il vient d’effectuer peut le faire réussir ; un 1 naturel reste un échec critique', () => {
        const prep = preparerCoc(REGLE, choix({ difficulte: 15 }), { valeur: 2 }, {});
        const rate = resoudreCoc(prep, [12]);
        expect(rate.coc.bilan).toBe('echec');
        const sauve = ajouterLeHeros(rate, prep, 2);
        expect(sauve.coc).toMatchObject({ resultat: 16, bilan: 'reussite', heros: 2 });
        expect(sauve.totalDisplay).toBe('Réussite — 12 + 2 + 2 (héros) = 16 contre 15');
        expect(ajouterLeHeros(resoudreCoc(prep, [1]), prep, 10).coc.bilan).toBe('echec-critique');
    });
});

describe('l’option du 3d6 (p. 60-61)', () => {
    const TROIS: RegleDeCoc = { ...REGLE, des: '3d6' };

    it('trois d6 additionnés ; quatre en gardant les trois meilleurs avec un dé bonus ; deux avec un dé malus', () => {
        expect(nombreDeDesDeCoc(0, '3d6')).toEqual({ nombre: 3, faces: 6 });
        expect(nombreDeDesDeCoc(1, '3d6')).toEqual({ nombre: 4, faces: 6 });
        expect(nombreDeDesDeCoc(-1, '3d6')).toEqual({ nombre: 2, faces: 6 });
        const bonus = resoudreCoc(preparerCoc(TROIS, choix({ bonus: 1, difficulte: 14 }), { valeur: 2 }, {}), [1, 5, 4, 6]);
        expect(bonus.coc).toMatchObject({ naturel: 15, resultat: 17, gardes: [1, 2, 3] });
        expect(bonus.rolls[0].isDropped).toBe(true);
    });

    it('le critique sur 18, l’échec critique sur 3', () => {
        const prep = preparerCoc(TROIS, choix({ difficulte: 20 }), { valeur: 0 }, {});
        expect(resoudreCoc(prep, [6, 6, 6]).coc.bilan).toBe('reussite-critique');
        expect(resoudreCoc(prep, [1, 1, 1]).coc.bilan).toBe('echec-critique');
    });

    it('les modificateurs se réduisent : 2, 5, 10 → 1, 3, 5 ; ceux des échelles 1, 3, 5, 10 → 1, 2, 3, 5', () => {
        expect([2, 5, 10, -5].map(v => auTroisD6(v, '3d6'))).toEqual([1, 3, 5, -3]);
        expect([1, 3, 5, 10].map(v => echelleAuTroisD6(v, '3d6'))).toEqual([1, 2, 3, 5]);
        expect(bonusDesConditions(3, '3d6')).toBe(5);
        expect(malusDeSante(15, '3d6')).toBe(3);
        expect(preparerCoc(TROIS, choix({ aides: 2 }), { valeur: 0 }, {}).total).toBe(2);
        expect(bonusDuHeros(13, '3d6').map(o => o.bonus)).toEqual([3, 6]);
    });
});

describe('l’échelle de santé encaisse (p. 71-73, 88-89)', () => {
    it('le revolver d’Amelia : 15 DM moins RD 2 des vêtements épais, 13 (p. 89)', () => {
        expect(encaisserCoc(15, 2, 0, 1)).toMatchObject({ subis: 13, apres: 13, mortInstantanee: false });
    });

    it('7 DM : contusionné ; 4 de plus : affaibli au 11e échelon (p. 72)', () => {
        expect(encaisserCoc(7, 0, 0, 1).franchis.map(e => e.label)).toEqual(['Contusionné']);
        expect(encaisserCoc(4, 0, 7, 1).franchis.map(e => e.label)).toEqual(['Affaibli']);
    });

    it('plus de 20 + CON en une fois tue sur le coup ; un coup sur un mourant appelle le coup de grâce', () => {
        expect(encaisserCoc(23, 0, 0, 2)).toMatchObject({ mortInstantanee: true, apres: 20 });
        expect(encaisserCoc(22, 0, 0, 2).mortInstantanee).toBe(false);
        expect(encaisserCoc(3, 0, 20, 1).coupDeGrace).toBe(true);
        expect(encaisserCoc(3, 4, 20, 1)).toMatchObject({ subis: 0, coupDeGrace: false });
    });
});
