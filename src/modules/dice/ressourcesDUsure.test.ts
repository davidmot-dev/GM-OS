import { describe, it, expect } from 'vitest';
import { deCourant, ecrireLeDe, ressourcesDUsure, EPUISEE } from './ressourcesDUsure';

/**
 * **Le dé de chaque ressource, sur la fiche** — Cthulhu Hack, étape 4.
 * Le pilote de David ne déclare pas `desDUsure` : ses ressources se
 * reconnaissent à ce qu'il les suit en combat ET que leur champ porte un dé.
 */
const PILOTE_DE_DAVID = {
    combat: {
        statsToTrack: [
            { fieldId: 'hp', label: 'PV', isMainHP: true, isResource: false },
            { fieldId: 'mentalHealth', label: 'Santé Mentale', isMainHP: false, isResource: true },
            { fieldId: 'torche', label: 'Torche', isMainHP: false, isResource: true },
            { fieldId: 'bagou', label: 'Bagou', isMainHP: false, isResource: true },
            { fieldId: 'richesse', label: 'Richesse', isMainHP: false, isResource: true },
        ],
    },
};

describe('lire le dé courant d’un champ', () => {
    it('lit « d8 », « D10 », « 1d6 »', () => {
        expect(deCourant('d8')).toBe(8);
        expect(deCourant('D10')).toBe(10);
        expect(deCourant(' 1d6 ')).toBe(6);
    });

    it('lit l’épuisement, avec ou sans accent', () => {
        expect(deCourant('Épuisée')).toBe(null);
        expect(deCourant('epuise')).toBe(null);
    });

    it('n’invente rien d’un champ vide ou illisible', () => {
        expect(deCourant('')).toBeUndefined();
        expect(deCourant('beaucoup')).toBeUndefined();
        expect(deCourant('d7')).toBeUndefined();
        expect(deCourant(8)).toBeUndefined();
    });

    it('réécrit le dé, ou l’épuisement', () => {
        expect(ecrireLeDe(6)).toBe('d6');
        expect(ecrireLeDe(null)).toBe(EPUISEE);
        expect(deCourant(ecrireLeDe(null))).toBe(null);
    });
});

describe('les ressources à dé d’usure d’un personnage', () => {
    it('reconnaît celles du pilote de David à leur champ', () => {
        const fiche = { hp: 12, mentalHealth: 'd8', torche: 'd6', bagou: 'D10', richesse: '' };
        expect(ressourcesDUsure(PILOTE_DE_DAVID, fiche).map(r => r.fieldId))
            .toEqual(['mentalHealth', 'torche', 'bagou']);
    });

    it('garde une ressource épuisée : elle reste à regagner', () => {
        expect(ressourcesDUsure(PILOTE_DE_DAVID, { torche: 'Épuisée' }).map(r => r.fieldId)).toEqual(['torche']);
    });

    it('un Matériel au d20 garde son plafond', () => {
        expect(ressourcesDUsure(PILOTE_DE_DAVID, { torche: 'd20' })[0].plafond).toBe(20);
    });

    it('préfère la déclaration du pilote, quand il en a une', () => {
        const declare = { ...PILOTE_DE_DAVID, desDUsure: [{ fieldId: 'richesse', label: 'Richesse' }] };
        expect(ressourcesDUsure(declare, {})).toEqual([{ fieldId: 'richesse', label: 'Richesse', plafond: 12 }]);
    });

    it('sans pilote, rien', () => {
        expect(ressourcesDUsure(null, { torche: 'd8' })).toEqual([]);
    });
});
