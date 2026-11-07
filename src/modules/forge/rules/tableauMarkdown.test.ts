import { describe, expect, it } from 'vitest';
import { estUneLigneDeSeparation } from './tableauMarkdown';

/*
 * La ligne de séparation d'un tableau — 07/11/2026, Cthulhu Hack : le carnet écrivait `|:- |`, un
 * seul tiret, et les quatre lecteurs du corpus n'y voyaient aucun tableau.
 */
describe('estUneLigneDeSeparation', () => {
    it('accepte un, deux ou trois tirets, avec ou sans deux-points et barres extérieures', () => {
        for (const ligne of ['|:- |:- |:- |', '|---|---|', '| :--- | :---: | ---: |', ':-|-:', '|-|']) {
            expect(estUneLigneDeSeparation(ligne)).toBe(true);
        }
    });

    it('refuse une ligne de données, même quand elle commence par un tiret', () => {
        for (const ligne of ['| -2 | Armure |', '| **Revolver** | d6 |', '| – | – |', '', undefined, '| |']) {
            expect(estUneLigneDeSeparation(ligne)).toBe(false);
        }
    });
});
