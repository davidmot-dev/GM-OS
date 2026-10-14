import { describe, it, expect } from 'vitest';
import type { DieResult, RollResult } from '../DiceEngine';
import {
    conditionRemplie, entreeDeLaTable, forcagesPermis, forcerLeJet, pourquoiNePasForcer,
    prixDuForcage, reussitesDuDe, testDePanique, type RegleDuForcage,
} from './yearZero';

/**
 * Les règles viennent de `docs/systems/alien/rules/forcer-le-test.md`,
 * `la-mecanique-de-stress-et-de-panique.md` et
 * `docs/systems/blade-runner/rules/mecanique-forcer-un-jet.md`.
 */

/** Un dé truqué, qui rend les faces données dans l'ordre. */
const truque = (...faces: number[]) => () => {
    const f = faces.shift();
    if (f === undefined) throw new Error('le dé truqué est épuisé');
    return f;
};

const jet = (rolls: DieResult[]): RollResult => ({ total: 0, rolls, modifier: 0, totalDisplay: '' });
const base = (val: number, sides = 6): DieResult => ({ val, sides, source: 'base' });
const stress = (val: number): DieResult => ({ val, sides: 6, source: 'gear', isCritMin: val === 1 });

const ALIEN: RegleDuForcage = {
    garde: 'reussites',
    bloqueParLaSeconde: true,
    monteeDeLaSeconde: 1,
    interdit: [{ si: { champ: 'type_personnage', contient: ['androïde', 'synthétique'] }, raison: 'Un androïde ne force jamais.' }],
};

const BLADE_RUNNER: RegleDuForcage = {
    garde: 'reussites-et-uns',
    foisSi: [{ si: { champ: 'nature', contient: ['réplicant'] }, fois: 2 }],
    prixDesUns: {
        champ: 'sante', label: 'Santé',
        si: [
            { si: { champ: 'nature', contient: ['réplicant'] }, champ: 'sangFroid', label: 'Sang-froid' },
            { si: { composante: 'attribut', parmi: ['intelligence', 'empathie'] }, champ: 'sangFroid', label: 'Sang-froid' },
        ],
    },
};

describe('les réussites d’un dé Year Zero', () => {
    it('six ou plus en vaut une, dix ou plus deux', () => {
        expect([1, 5, 6, 9, 10, 12].map(reussitesDuDe)).toEqual([0, 0, 1, 1, 2, 2]);
    });
});

describe('les conditions lues sur la fiche', () => {
    it('ignore la casse et les accents', () => {
        expect(conditionRemplie({ champ: 'nature', contient: ['réplicant'] }, { nature: 'REPLICANT' }, {})).toBe(true);
        expect(conditionRemplie({ champ: 'nature', contient: ['réplicant'] }, { nature: 'Humain' }, {})).toBe(false);
    });
    it('lit la composante retenue pour le jet', () => {
        const si = { composante: 'attribut', parmi: ['intelligence', 'empathie'] };
        expect(conditionRemplie(si, {}, { attribut: 'empathie' })).toBe(true);
        expect(conditionRemplie(si, {}, { attribut: 'vigueur' })).toBe(false);
    });
    it('une condition vide n’est jamais remplie', () => {
        expect(conditionRemplie({}, { nature: 'x' }, { attribut: 'y' })).toBe(false);
    });
});

describe('Alien — forcer le test', () => {
    it('garde les six, relance tout le reste, et ajoute le nouveau dé de Stress', () => {
        const premier = jet([base(6), base(3), base(1), stress(4)]);
        const force = forcerLeJet(premier, ALIEN, { famille: 'reserve', desEnPlus: 1, libelleDuUn: 'Panique', de: truque(6, 2, 5, 6) });
        expect(force.rolls.map(d => d.val)).toEqual([6, 6, 2, 5, 6]);
        expect(force.rolls.map(d => d.relance)).toEqual([false, true, true, true, true]);
        expect(force.rolls[4].source).toBe('gear');
        expect(force.successes).toBe(3);
        expect(force.tagSuccess).toBe(true);
    });

    it('un 1 sur un dé de Stress relancé est une Panique ; sur un dé de base, rien', () => {
        const force = forcerLeJet(jet([base(2), stress(3)]), ALIEN, { famille: 'reserve', libelleDuUn: 'Panique', de: truque(1, 1) });
        expect(force.fails).toBe(1);
        expect(force.rolls[0].isCritMin).toBe(false);
        expect(force.rolls[1].isCritMin).toBe(true);
        expect(force.totalDisplay).toBe('0 Succès / 1 Panique — jet forcé');
    });

    it('une Panique au premier lancer interdit de forcer', () => {
        const raison = pourquoiNePasForcer(ALIEN, {
            resultat: jet([base(3), stress(1)]), valeurs: {}, choix: {}, dejaForce: 0, libelleDuUn: 'Panique',
        });
        expect(raison).toMatch(/^Panique/);
    });

    it('une seule fois par test', () => {
        const contexte = { resultat: jet([base(3)]), valeurs: {}, choix: {} };
        expect(pourquoiNePasForcer(ALIEN, { ...contexte, dejaForce: 0 })).toBeNull();
        expect(pourquoiNePasForcer(ALIEN, { ...contexte, dejaForce: 1 })).toBe('Ce jet a déjà été forcé.');
    });

    it('un androïde ne force jamais', () => {
        expect(pourquoiNePasForcer(ALIEN, {
            resultat: jet([base(3)]), valeurs: { type_personnage: 'Androïde' }, choix: {}, dejaForce: 0,
        })).toBe('Un androïde ne force jamais.');
    });

    it('rien à relancer quand tout a réussi', () => {
        expect(pourquoiNePasForcer(ALIEN, { resultat: jet([base(6), base(6)]), valeurs: {}, choix: {}, dejaForce: 0 }))
            .toBe('Aucun dé à relancer.');
    });

    it('le forçage d’Alien ne coûte rien d’autre que le Stress', () => {
        expect(prixDuForcage(ALIEN, { resultat: jet([base(1)]), valeurs: {}, choix: {}, dejaPayes: 0 })).toBeNull();
    });
});

describe('Blade Runner — forcer un jet', () => {
    it('les réussites et les 1 restent, le reste se relance, à sa taille', () => {
        const de: number[] = [];
        const premier = jet([base(8, 10), base(1, 8), base(4, 12)]);
        const force = forcerLeJet(premier, BLADE_RUNNER, { famille: 'echelonnee', de: faces => { de.push(faces); return 11; } });
        expect(de).toEqual([12]);
        expect(force.rolls.map(d => d.val)).toEqual([8, 1, 11]);
        expect(force.successes).toBe(3);
        expect(force.fails).toBe(1);
    });

    it('l’humain force une fois, le réplicant deux', () => {
        expect(forcagesPermis(BLADE_RUNNER, { nature: 'Humain' }, {})).toBe(1);
        expect(forcagesPermis(BLADE_RUNNER, { nature: 'Réplicant' }, {})).toBe(2);
    });

    it('chaque 1, jet initial compris, coûte un point de Santé sur un jet physique', () => {
        const force = jet([base(1, 10), base(1, 8), base(7, 6)]);
        expect(prixDuForcage(BLADE_RUNNER, { resultat: force, valeurs: { nature: 'Humain' }, choix: { attribut: 'vigueur' }, dejaPayes: 0 }))
            .toEqual({ champ: 'sante', label: 'Santé', points: 2, uns: 2 });
    });

    it('…de Sang-froid sur un jet mental', () => {
        const prix = prixDuForcage(BLADE_RUNNER, { resultat: jet([base(1, 10)]), valeurs: { nature: 'Humain' }, choix: { attribut: 'empathie' }, dejaPayes: 0 });
        expect(prix?.champ).toBe('sangFroid');
    });

    it('…et toujours de Sang-froid pour un réplicant', () => {
        const prix = prixDuForcage(BLADE_RUNNER, { resultat: jet([base(1, 10)]), valeurs: { nature: 'Réplicant' }, choix: { attribut: 'vigueur' }, dejaPayes: 0 });
        expect(prix).toMatchObject({ champ: 'sangFroid', label: 'Sang-froid', points: 1 });
    });

    it('au second forçage du réplicant, un crâne déjà payé ne se repaie pas', () => {
        const prix = prixDuForcage(BLADE_RUNNER, { resultat: jet([base(1, 10), base(1, 8)]), valeurs: { nature: 'Réplicant' }, choix: {}, dejaPayes: 1 });
        expect(prix?.points).toBe(1);
    });

    it('un jet sans autre dé que des réussites et des 1 n’a rien à relancer', () => {
        expect(pourquoiNePasForcer(BLADE_RUNNER, { resultat: jet([base(1, 10), base(9, 8)]), valeurs: {}, choix: {}, dejaForce: 0 }))
            .toBe('Aucun dé à relancer.');
    });
});

describe('le test de Panique', () => {
    const TABLE = [
        { min: 1, max: 6, title: 'JE TIENS LE COUP' },
        { min: 7, max: 7, title: 'TRESSAILLEMENT NERVEUX' },
        { min: 15, max: 20, title: 'CATATONIE' },
    ];

    it('un dé, plus le Niveau de Stress', () => {
        expect(testDePanique(3, 6, truque(4))).toEqual({ de: 4, niveau: 3, total: 7 });
    });

    it('lit la ligne qui couvre le total', () => {
        expect(entreeDeLaTable(TABLE, 7)?.title).toBe('TRESSAILLEMENT NERVEUX');
        expect(entreeDeLaTable(TABLE, 4)?.title).toBe('JE TIENS LE COUP');
    });

    it('au-delà de « 15+ », c’est encore la Catatonie', () => {
        expect(entreeDeLaTable(TABLE, 22)?.title).toBe('CATATONIE');
    });
});
