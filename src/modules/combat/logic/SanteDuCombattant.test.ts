import { describe, it, expect } from 'vitest';
import {
    aUneJaugeDeVie,
    fractionDeVie,
    estHorsDeCombat,
    pointsDeVieApres,
} from './SanteDuCombattant';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';
import type { Combatant } from '../types';

/**
 * **Ce que ces tests protègent : l'absence n'est pas un zéro.**
 *
 * `hp` est devenu facultatif parce que tous les jeux ne comptent pas la santé
 * en points. Le danger de cette liberté est unique et il est partout : traiter
 * un `undefined` comme un `0` afficherait un mourant pour chaque combattant
 * d'un jeu comme Dune — en gris, à l'agonie, sans que rien ne soit faux au sens
 * du type.
 */

const combattant = (over: Partial<Combatant> = {}): Combatant => ({
    id: 'c1',
    name: 'Cible',
    init: 0,
    isPlayer: false,
    faction: 'enemy',
    statuses: [],
    ...over,
});

describe('sans jauge, il n\'y a pas de jauge — pas une jauge à zéro', () => {
    it('un combattant sans PV n\'a pas de jauge', () => {
        expect(aUneJaugeDeVie(combattant())).toBe(false);
        expect(fractionDeVie(combattant())).toBeNull();
    });

    it('il n\'est pas hors de combat pour autant', () => {
        // Le défaut redouté, en une assertion.
        expect(estHorsDeCombat(combattant())).toBe(false);
    });

    it('on ne lui invente pas de points de vie', () => {
        expect(pointsDeVieApres(combattant(), -5)).toBeNull();
    });

    it('un maximum à zéro ne fait pas une jauge', () => {
        // `hpMax: 0` donnerait une division par zéro, donc un NaN, donc une
        // barre de largeur « NaN% » — silencieuse elle aussi.
        expect(aUneJaugeDeVie(combattant({ hp: 0, hpMax: 0 }))).toBe(false);
        expect(fractionDeVie(combattant({ hp: 0, hpMax: 0 }))).toBeNull();
    });
});

describe('avec une jauge, rien ne change pour les systèmes qui en ont', () => {
    it('la fraction est bornée entre 0 et 1', () => {
        expect(fractionDeVie(combattant({ hp: 5, hpMax: 10 }))).toBe(0.5);
        expect(fractionDeVie(combattant({ hp: -3, hpMax: 10 }))).toBe(0);
        expect(fractionDeVie(combattant({ hp: 30, hpMax: 10 }))).toBe(1);
    });

    it('à zéro point de vie, le combattant est hors de combat', () => {
        expect(estHorsDeCombat(combattant({ hp: 0, hpMax: 10 }))).toBe(true);
        expect(estHorsDeCombat(combattant({ hp: 1, hpMax: 10 }))).toBe(false);
    });

    it('les ajustements restent dans les bornes', () => {
        expect(pointsDeVieApres(combattant({ hp: 5, hpMax: 10 }), -8)).toBe(0);
        expect(pointsDeVieApres(combattant({ hp: 5, hpMax: 10 }), 12)).toBe(10);
    });
});

describe('le système de santé fait autorité sur les points de vie', () => {
    it('un système à horloge pleine met le combattant hors de combat', () => {
        const horloge = HealthInterpreter.calculateNextState(
            HealthInterpreter.createDefault('clocks'),
            { value: 6 },
        );
        expect(horloge.state).toBe('dead');
        expect(estHorsDeCombat(combattant({ healthSystem: horloge }))).toBe(true);
    });

    it('et il l\'emporte sur des PV qui diraient l\'inverse', () => {
        /**
         * Le cas qui arrive vraiment : `hp` traîne d'un ancien pilote pendant
         * que l'horloge, elle, est tenue à jour par `HealthInterpreter`. C'est
         * l'horloge qui a raison — sinon on aurait deux vérités, et la plus
         * vieille gagnerait.
         */
        const horloge = HealthInterpreter.calculateNextState(
            HealthInterpreter.createDefault('clocks'),
            { value: 6 },
        );
        expect(estHorsDeCombat(combattant({ hp: 10, hpMax: 10, healthSystem: horloge }))).toBe(true);
    });

    it('un système intact garde le combattant debout, PV à zéro ou non', () => {
        const intact = HealthInterpreter.createDefault('clocks');
        expect(estHorsDeCombat(combattant({ hp: 0, hpMax: 10, healthSystem: intact }))).toBe(false);
    });
});
