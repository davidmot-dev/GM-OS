import { describe, it, expect } from 'vitest';
import { migrerLesReglages, VERSION_DES_REGLAGES, useSessionStore } from './useSessionStore';

/**
 * **T2.5 — David adopte les personnalités, allumées par défaut, chez lui compris**
 * (2026-09-29). La migration ne se joue qu'une fois : l'éteindre ensuite tient.
 */
describe('les personnalités, allumées par défaut', () => {
    it('un profil neuf les a allumées', () => {
        expect(useSessionStore.getInitialState().personnalites).toBe(true);
    });

    it('un profil enregistré éteint (version 0) est allumé une fois', () => {
        const avant = { theme: 'medieval', themeColor: '#d4af37', personnalites: false };
        expect(migrerLesReglages(avant, 0)).toEqual({ ...avant, personnalites: true });
    });

    it('un profil déjà migré garde ce que le meneur a choisi depuis', () => {
        const eteint = { theme: 'medieval', personnalites: false };
        expect(migrerLesReglages(eteint, VERSION_DES_REGLAGES)).toEqual(eteint);
    });

    it('le reste des réglages traverse la migration intact', () => {
        const avant = { theme: 'claire', themeColor: '#0f766e', displayCount: 3, language: 'fr' };
        expect(migrerLesReglages(avant, 0)).toMatchObject(avant);
    });
});
