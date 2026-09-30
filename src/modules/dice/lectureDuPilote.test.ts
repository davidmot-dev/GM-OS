import { describe, it, expect, vi, afterEach } from 'vitest';
import { estUneSauvegarde, decrireLeJetDuPilote, lireLaNotation } from './lectureDuPilote';
import { DiceEngine } from './DiceEngine';

/**
 * **Le pilote de Cthulhu Hack de David, tel quel** — relevé dans la sauvegarde
 * du 2026-09-30. Il était juste ; c'est sa lecture qui ne l'était pas.
 */
const CTHULHU_HACK = {
    dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
    jet: {
        sens: 'sous-ou-egal',
        seuil: [{ id: 'sauvegarde', label: 'Sauvegarde', sectionId: 'sauvegardes' }],
        reserve: { base: 1, max: 1, faces: 20 },
        critique: 1,
        complication: 20,
    },
};

afterEach(() => vi.restoreAllMocks());

describe('lire le jet principal d’un pilote', () => {
    it('reconnaît la Sauvegarde de Cthulhu Hack, sans qu’elle soit nommée', () => {
        expect(estUneSauvegarde(decrireLeJetDuPilote(CTHULHU_HACK))).toBe(true);
    });

    it('et quand le pilote la nomme', () => {
        expect(estUneSauvegarde({ engine: 'sauvegarde' })).toBe(true);
    });

    it('pas Dune : plusieurs d20 sous le seuil, c’est une réserve 2d20', () => {
        expect(estUneSauvegarde(decrireLeJetDuPilote({
            dice: { defaultDice: '2d20', engine: '2d20' },
            jet: { sens: 'sous-ou-egal', reserve: { max: 5, faces: 20 } },
        }))).toBe(false);
    });

    it('pas un d20 AU-DESSUS d’une difficulté', () => {
        expect(estUneSauvegarde(decrireLeJetDuPilote({
            dice: { defaultDice: '1d20', engine: 'standard' },
            jet: { sens: 'superieur-ou-egal' },
        }))).toBe(false);
    });

    it('pas un pourcentage sous la compétence', () => {
        expect(estUneSauvegarde(decrireLeJetDuPilote({
            dice: { defaultDice: '1d100', engine: 'standard' },
            jet: { sens: 'sous-ou-egal' },
        }))).toBe(false);
    });

    it('un moteur explicite garde la main', () => {
        expect(estUneSauvegarde({ engine: 'pool', sens: 'sous-ou-egal', faces: 20, nombre: 1 })).toBe(false);
    });

    it('lit les notations', () => {
        expect(lireLaNotation('1d20')).toEqual({ nombre: 1, faces: 20 });
        expect(lireLaNotation('d20')).toEqual({ nombre: 1, faces: 20 });
        expect(lireLaNotation('3d6')).toEqual({ nombre: 3, faces: 6 });
        expect(lireLaNotation(undefined)).toEqual({});
    });
});

describe('le moteur lance la Sauvegarde que le pilote décrit', () => {
    /**
     * La télécommande et la fiche passent par `rollFromConfig` : le même
     * pilote doit y rendre une Sauvegarde, critiques compris — plus « 1 succès ».
     */
    it('avec la caractéristique de l’appelant, et le critique', () => {
        vi.spyOn(DiceEngine, 'roll').mockImplementation(() => 1);
        const r = DiceEngine.rollFromConfig(
            { ...CTHULHU_HACK.dice, sens: 'sous-ou-egal' } as never,
            { targetOverwrite: 11 },
        );
        expect(r.totalDisplay).toBe('1 / 11 — réussite critique');
        expect(r.tagSuccess).toBe(true);
    });
});
