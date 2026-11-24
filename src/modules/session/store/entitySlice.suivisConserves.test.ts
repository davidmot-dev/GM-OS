import { describe, it, expect } from 'vitest';
import { suivisConserves } from './entitySlice';

/** Les suivis cachés d'une fiche survivent à une écriture qui les ignore (24/11/2026, § 1 bis du 15/11). */
describe('suivisConserves', () => {
    const avant = { force: 3, _gmos_dune: { bafoues: [] }, _gmos_runequest: { zones: {} }, __rddSante231: { x: 1 },
        _gmos_panique_alien: { recus: 1 }, _gmos_cthulhu_hack: { declin: true }, __deltaGreen: { san: 1 }, note: 'libre' };
    it('reprend toute clé réservée absente de l’écriture — Dune et RuneQuest compris, jamais un champ ordinaire', () => {
        expect(suivisConserves(avant, { force: 4 })).toEqual({ _gmos_dune: { bafoues: [] }, _gmos_runequest: { zones: {} }, __rddSante231: { x: 1 },
            _gmos_panique_alien: { recus: 1 }, _gmos_cthulhu_hack: { declin: true }, __deltaGreen: { san: 1 } });
    });
    it('laisse gagner une clé que l’écriture nomme, même pour l’effacer', () => {
        const garde = suivisConserves(avant, { _gmos_dune: { bafoues: ['foi'] }, _gmos_runequest: undefined });
        expect(garde).not.toHaveProperty('_gmos_dune');
        expect(garde).not.toHaveProperty('_gmos_runequest');
    });
    it('rien à garder sans écriture de fiche', () => {
        expect(suivisConserves(avant, undefined)).toEqual({});
        expect(suivisConserves(undefined, { force: 1 })).toEqual({});
    });
});
