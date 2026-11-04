import { describe, expect, it } from 'vitest';
import {
    appliquerLEgoMaximal, calculerLesMaxima, choisirLaBranche, declarerLaBranche, lireLEtatDegenesis, CLE_DEGENESIS,
    type RegleDesMaximaDeDegenesis,
} from './maximaDeDegenesis';

const REGLE: RegleDesMaximaDeDegenesis = {
    ego: {
        champ: 'ego_max', jauge: 'ego_jauge', branches: [
            { cle: 'concentration', libelle: 'Concentration', attribut: 'intellect', competence: 'concentration' },
            { cle: 'pulsions', libelle: 'Pulsions', attribut: 'instinct', competence: 'pulsions' },
        ],
    },
    sporulations: {
        jauge: 'sporulations_jauge', branches: [
            { cle: 'foi', libelle: 'Foi', attribut: 'psyche', competence: 'foi' },
            { cle: 'volonte', libelle: 'Volonté', attribut: 'psyche', competence: 'volonte' },
        ],
    },
    blessures: { jauge: 'blessures_superficielles', champs: ['physique', 'resistance'] },
    traumatismes: { jauge: 'traumatismes', champs: ['physique', 'psyche'] },
    abreviations: { intellect: 'INT', instinct: 'INS', psyche: 'PSY', physique: 'PHY', resistance: 'Résistance' },
};

/** La formule du pilote 2.1.0 : (psyche + foi + volonte) × 2, (physique + resistance) × 2, physique + psyche. */
const pilote = (v: Record<string, number>) => (jauge: string) =>
    jauge === 'sporulations_jauge' ? (v.psyche + v.foi + v.volonte) * 2
        : jauge === 'blessures_superficielles' ? (v.physique + v.resistance) * 2
        : jauge === 'traumatismes' ? v.physique + v.psyche : null;

const FICHE = { intellect: 3, concentration: 2, instinct: 2, pulsions: 0, psyche: 2, foi: 2, volonte: 0, physique: 3, resistance: 2, ego_max: 8, ego_jauge: 6 };

describe('DEG-A3 — les maxima de Degenesis (p. 26, 94)', () => {
    it('INT 3 + Concentration 2 donne Égo max 10, branche déduite (critère de la synthèse)', () => {
        const m = calculerLesMaxima(REGLE, FICHE, pilote(FICHE));
        const ego = m.lignes.find(l => l.cle === 'ego')!;
        expect(m.ego.retenue?.cle).toBe('concentration');
        expect(m.ego.deduite).toBe(true);
        expect(ego).toMatchObject({ surLaFiche: 8, calcule: 10, identique: false, ecrivable: true });
        expect(ego.detail).toBe('(INT 3 + Concentration 2) × 2 (p. 26, 94)');
    });

    it('les trois autres maxima s’expliquent et se comparent à la formule du pilote', () => {
        const m = calculerLesMaxima(REGLE, FICHE, pilote(FICHE));
        expect(m.lignes.map(l => [l.cle, l.calcule, l.identique])).toEqual([
            ['ego', 10, false], ['sporulations', 8, true], ['blessures', 10, true], ['traumatismes', 5, true],
        ]);
        expect(m.lignes.find(l => l.cle === 'traumatismes')!.detail).toBe('PHY 3 + PSY 2 (p. 94)');
    });

    it('appliquer ne remplit pas la jauge : 6 restent 6 sous un maximum de 10', () => {
        const m = calculerLesMaxima(REGLE, FICHE, pilote(FICHE));
        expect(appliquerLEgoMaximal(REGLE, FICHE, m)).toEqual({ ego_max: 10 });
    });

    it('un maximum qui baisse ramène la jauge, sans rien ajouter', () => {
        const fiche = { ...FICHE, concentration: 0, pulsions: 1, ego_max: 10, ego_jauge: 9 };
        const m = calculerLesMaxima(REGLE, fiche, pilote(fiche));
        expect(m.ego.retenue?.cle).toBe('pulsions');
        expect(appliquerLEgoMaximal(REGLE, fiche, m)).toEqual({ ego_max: 6, ego_jauge: 6 });
    });

    it('deux compétences exclusives remplies : à choisir, puis contradiction signalée', () => {
        const fiche = { ...FICHE, pulsions: 1 };
        const avant = calculerLesMaxima(REGLE, fiche, pilote(fiche));
        expect(avant.ego.retenue).toBeUndefined();
        expect(avant.lignes[0].calcule).toBeNull();
        expect(appliquerLEgoMaximal(REGLE, fiche, avant)).toEqual({});

        const declare = { ...fiche, ...declarerLaBranche(fiche, 'ego', 'concentration') };
        const apres = calculerLesMaxima(REGLE, declare, pilote(declare));
        expect(apres.ego.retenue?.cle).toBe('concentration');
        expect(apres.ego.deduite).toBe(false);
        expect(apres.ego.contradictoires.map(b => b.cle)).toEqual(['pulsions']);
        expect(apres.lignes[0].calcule).toBe(10);
    });

    it('Foi et Volonté remplies : la jauge du pilote les additionne, la carte le dit', () => {
        const fiche = { ...FICHE, volonte: 1, ...declarerLaBranche(FICHE, 'sporulations', 'foi') };
        const spor = calculerLesMaxima(REGLE, fiche, pilote(fiche)).lignes.find(l => l.cle === 'sporulations')!;
        expect(spor).toMatchObject({ surLaFiche: 10, calcule: 8, identique: false, ecrivable: false });
        expect(spor.note).toContain('Mettez Volonté à 0');
    });

    it('la déclaration se garde sous la clé cachée, et une branche sans compétence reste choisissable', () => {
        expect(choisirLaBranche(REGLE.ego.branches, { concentration: 0, pulsions: 0 }).retenue).toBeUndefined();
        const maj = declarerLaBranche({}, 'ego', 'pulsions');
        expect(Object.keys(maj)).toEqual([CLE_DEGENESIS]);
        expect(lireLEtatDegenesis(maj).brancheEgo).toBe('pulsions');
        expect(calculerLesMaxima(REGLE, { instinct: 2, pulsions: 0, ...maj }).lignes[0].calcule).toBe(4);
    });
});
