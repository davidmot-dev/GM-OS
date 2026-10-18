import { describe, it, expect } from 'vitest';
import {
    reservesDuGroupe, ressourcesDeLaTable, stockRetenu, effetDesApports, apportsDisponibles,
    idDeReserveDuGroupe, niveauDuGroupe,
} from './reservesDuGroupe';
import type { ApportDuGroupe, GameDriver } from '../../types/drivers';

/**
 * La Cabale de NOC — `docs/systems/noc/rules/la-cabale.md` : ses Domaines sont
 * des réserves de dés rechargées à chaque scénario, ses Atouts des réserves de
 * points ; son Espoir et son Vécu se lisent sur les pistes de sa feuille.
 */
const DES: ApportDuGroupe = {
    id: 'des', label: 'Dés de la Cabale', effet: 'des', parPoint: 1, epuisement: 'scenario', composante: 'domaine',
    stocks: [{ champ: 'domains.action', label: 'Action', pour: 'action' }, { champ: 'domains.life', label: 'Vie', pour: 'vie' }],
};
const ESPOIR: ApportDuGroupe = {
    id: 'espoir', label: 'Espoir de la Cabale', effet: 'des', parPoint: 3, epuisement: 'piste',
    stocks: [{ champ: 'tracks.espoir', label: 'Espoir' }],
};
const ATOUT: ApportDuGroupe = {
    id: 'atout', label: 'Atout', effet: 'bonus', parPoint: 1, epuisement: 'scenario',
    stocks: [{ champ: 'assets.action.armory', label: 'Armurerie' }, { champ: 'assets.technical.clean_room', label: 'Salle blanche' }],
};
const PILOTE = {
    ressourcesDeTable: [{ id: 'Menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0 }],
    ficheDeGroupe: { libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale', apports: [DES, ESPOIR, ATOUT] },
} as unknown as GameDriver;
const CAMPAGNE = { groupe: { sheetData: {
    'domains.action': 3, 'domains.life': '2', 'tracks.espoir': 4,
    'assets.action.armory': 2, 'assets.technical.clean_room': -1,
} as Record<string, unknown> } };

describe('les réserves que le groupe tient pour la table', () => {
    it('une par stock « scenario », au niveau écrit sur la feuille', () => {
        const r = reservesDuGroupe(PILOTE, CAMPAGNE);
        expect(r.map(x => [x.id, x.max])).toEqual([
            ['groupe:domains.action', 3],
            ['groupe:domains.life', 2],
            ['groupe:assets.action.armory', 2],
            ['groupe:assets.technical.clean_room', 0],
        ]);
        expect(r.every(x => x.remiseAuDepartParScenario && x.horsDuBandeau && x.manipulableParLesJoueurs)).toBe(true);
    });

    it("une Faille (Atout à −1) ne fournit rien, et ne descend pas sous zéro", () => {
        const faille = reservesDuGroupe(PILOTE, CAMPAGNE).find(r => r.id === idDeReserveDuGroupe('assets.technical.clean_room'))!;
        expect([faille.depart, faille.min, faille.max]).toEqual([0, 0, 0]);
    });

    it("l'Espoir, une piste, n'en a pas besoin", () => {
        expect(reservesDuGroupe(PILOTE, CAMPAGNE).some(r => r.id.includes('tracks.espoir'))).toBe(false);
    });

    it('la liste de la table : celles du pilote, puis celles du groupe', () => {
        expect(ressourcesDeLaTable(PILOTE, CAMPAGNE).map(r => r.id)[0]).toBe('Menace');
        expect(ressourcesDeLaTable(PILOTE, CAMPAGNE)).toHaveLength(5);
        expect(ressourcesDeLaTable(undefined, undefined)).toEqual([]);
        expect(ressourcesDeLaTable(null, CAMPAGNE)).toEqual([]);
    });

    it('un niveau illisible vaut zéro', () => {
        expect(niveauDuGroupe({ a: 'trois' }, 'a')).toBe(0);
        expect(niveauDuGroupe(undefined, 'a')).toBe(0);
        expect(niveauDuGroupe({ a: '2' }, 'a')).toBe(2);
    });
});

describe("le stock qu'un apport vise", () => {
    it("un stock unique s'applique d'office", () => {
        expect(stockRetenu(ESPOIR, {})?.champ).toBe('tracks.espoir');
    });
    it('la composante du jet désigne le Domaine', () => {
        expect(stockRetenu(DES, { domaine: 'vie' })?.champ).toBe('domains.life');
        expect(stockRetenu(DES, {})).toBeUndefined();
    });
    it('sinon le joueur choisit son Atout', () => {
        expect(stockRetenu(ATOUT, {}, 'assets.action.armory')?.label).toBe('Armurerie');
        expect(stockRetenu(ATOUT, {})).toBeUndefined();
    });
});

describe('ce que les points rapportent', () => {
    it('des dés, ou un bonus', () => {
        expect(effetDesApports([
            { apport: DES, points: 2 }, { apport: ESPOIR, points: 1 }, { apport: ATOUT, points: 1 },
        ])).toEqual({ des: 5, bonus: 1, annule: 0, degres: 0 });
    });

    it('des degrés ajoutés à la cible — la Stase et l’Effet Mnémos de Nephilim', () => {
        const stase = { effet: 'degres' as const, parPoint: 1 };
        const mnemos = { effet: 'degres' as const, parPoint: 2 };
        expect(effetDesApports([{ apport: stase, points: 3 }, { apport: mnemos, points: 1 }]))
            .toEqual({ des: 0, bonus: 0, annule: 0, degres: 5 });
    });

    it("l'engagement est ramené à ce qui reste", () => {
        const d = apportsDisponibles(
            [DES, ESPOIR], { domaine: 'action' }, {}, { des: 9, espoir: 9 },
            CAMPAGNE.groupe.sheetData, { [idDeReserveDuGroupe('domains.action')]: 1 },
        );
        expect(d.map(x => [x.apport.id, x.dispo, x.points])).toEqual([['des', 1, 1], ['espoir', 4, 4]]);
    });
});

describe("l'Atout Capital — plusieurs points, sur le Talent Fortune seulement", () => {
    // Carnet « NOC », section « Capital » (2026-10-16) : les autres Atouts, un seul point par test.
    const ATOUTS: ApportDuGroupe = {
        id: 'atout', label: 'Atout', effet: 'bonus', parPoint: 1, epuisement: 'scenario', maxParJet: 1,
        stocks: [
            { champ: 'assets.statut.capital', label: 'Capital', horsPlafondSi: { composante: 'talent', champ: 'fortune' } },
            { champ: 'assets.action.armory', label: 'Armurerie' },
        ],
    };
    const etat = { [idDeReserveDuGroupe('assets.statut.capital')]: 3, [idDeReserveDuGroupe('assets.action.armory')]: 2 };
    const dispo = (talent: string, stock: string) =>
        apportsDisponibles([ATOUTS], { talent }, { atout: stock }, { atout: 3 }, {}, etat)[0];

    it('sur Fortune, tout le Capital qui reste peut servir', () => {
        expect(dispo('fortune', 'assets.statut.capital')).toMatchObject({ dispo: 3, points: 3 });
    });
    it('sur un autre Talent, le Capital reste à un point', () => {
        expect(dispo('rang', 'assets.statut.capital')).toMatchObject({ dispo: 1, points: 1 });
    });
    it('les autres Atouts restent à un point, même sur Fortune', () => {
        expect(dispo('fortune', 'assets.action.armory')).toMatchObject({ dispo: 1, points: 1 });
    });
});
