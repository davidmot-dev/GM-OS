import { describe, it, expect } from 'vitest';
import { pousseeVersLaFiche, gmosEstPlusRecent } from './pousseeVersLaFiche';
import type { CorrespondanceDeFiche } from './correspondanceDeFiche';
// Importée, pas lue : `node:fs` n'existe pas dans les tests du renderer.
import TABLE_BRUTE from '../../../docs/systems/cthulhu hack/fiche/correspondance.json';

/** La vraie table de Cthulhu Hack — celle du cas trouvé par David le 2026-10-03. */
const TABLE = TABLE_BRUTE as unknown as CorrespondanceDeFiche;

const DAN = { sheetData: { force: '14', dexterite: '15', torche: 'd12', bagou: 'd6' } };
const FICHE = { 'attributes.strength': 13, 'attributes.dexterity': 15, 'resources.torch': 6, 'resources.persuasion': '6', 'equipment.wealth': 'd6' };

describe('ce que GM-OS écrit sur la fiche (option A, 2026-10-03)', () => {
    it('à l’ouverture : ce qui diffère et n’est pas vide — la Force 14, la Torche d12', () => {
        const { lot, divergences } = pousseeVersLaFiche(DAN, null, FICHE, TABLE);
        expect(lot).toEqual({ 'attributes.strength': '14', 'resources.torch': '12' });
        expect(divergences.map(d => d.cle).sort()).toEqual(['attributes.strength', 'resources.torch']);
    });

    it('« 6 » et 6 sont la même valeur : un dé rangé en nombre ne se repousse pas', () => {
        const { lot } = pousseeVersLaFiche({ sheetData: { bagou: 'd6' } }, null, { 'resources.persuasion': 6 }, TABLE);
        expect(lot).toEqual({});
    });

    it('à l’ouverture, le vide de GM-OS n’efface pas ce que la fiche porte', () => {
        const { lot } = pousseeVersLaFiche({ sheetData: {} }, null, FICHE, TABLE);
        expect(lot).not.toHaveProperty('equipment.wealth');
        expect(lot).toEqual({});
    });

    it('fiche ouverte : seulement ce que GM-OS vient de changer — effacement compris', () => {
        const avant = { sheetData: { ...DAN.sheetData, richesse: 'd6' } };
        const apres = { sheetData: { ...avant.sheetData, force: '15', richesse: '' } };
        const fiche = { ...FICHE, 'attributes.strength': 14, 'resources.torch': '12' };
        const { lot } = pousseeVersLaFiche(apres, avant, fiche, TABLE);
        // La Force et la Richesse effacée partent ; la Dextérité, intouchée, ne part pas.
        expect(lot).toEqual({ 'attributes.strength': '15', 'equipment.wealth': '' });
    });
});

describe('qui a écrit en dernier', () => {
    it('GM-OS seulement s’il a une date, et plus récente que la fiche', () => {
        expect(gmosEstPlusRecent(undefined, 5)).toBe(false);
        expect(gmosEstPlusRecent(10, 5)).toBe(true);
        expect(gmosEstPlusRecent(5, 10)).toBe(false);
        expect(gmosEstPlusRecent(10, null)).toBe(true);
    });
});
