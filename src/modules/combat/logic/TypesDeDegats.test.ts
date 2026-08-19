import { describe, it, expect, beforeAll } from 'vitest';
import i18next from 'i18next';
import {
    typesDeDegats, nommerLeType, nommerLaLocalisation, TYPES_DE_DEGATS_PAR_DEFAUT,
} from './TypesDeDegats';
import type { GameDriver } from '../../../types/drivers';

/**
 * **Une seule liste de types de dégâts, et une seule convention.**
 *
 * Elle vivait en `const` privée dans `DamageCalculator.tsx` : le pupitre du
 * tracker était le seul écran à savoir qu'un coup a une nature. Le panneau de
 * santé n'en proposait aucune, si bien que `processResistances` sortait
 * aussitôt sur ce chemin — **les résistances des fiches y étaient ignorées**.
 *
 * La convention qui tient tout : *on stocke le jeton, on n'affiche que le mot.*
 * C'est sur le jeton que les étiquettes `res_`/`vul_`/`imm_` se comparent.
 */

beforeAll(async () => {
    await i18next.init({
        lng: 'fr',
        interpolation: { escapeValue: false },
        resources: {
            fr: {
                modules: {
                    combat: {
                        damage: {
                            types: { physical: 'Physique', fire: 'Feu' },
                            locations: { leftArm: 'Bras gauche', torso: 'Torse' },
                        },
                    },
                },
            },
        },
    });
});

const pilote = (damageTypes?: string[]) =>
    ({ id: 'x', combat: { damageTypes } } as unknown as GameDriver);

describe('typesDeDegats', () => {
    it('rend ce que le pilote declare', () => {
        expect(typesDeDegats(pilote(['balistique', 'acide']))).toEqual(['balistique', 'acide']);
    });

    it('se replie sur la liste par defaut sans pilote', () => {
        expect(typesDeDegats(null)).toBe(TYPES_DE_DEGATS_PAR_DEFAUT);
        expect(typesDeDegats(undefined)).toBe(TYPES_DE_DEGATS_PAR_DEFAUT);
    });

    it('se replie aussi quand le pilote ne declare rien', () => {
        expect(typesDeDegats(pilote(undefined))).toBe(TYPES_DE_DEGATS_PAR_DEFAUT);
    });

    /**
     * **`[]` est vrai en JavaScript**, et c'est tout le piège : le `||` du
     * pupitre laissait un pilote à liste vide avec zéro bouton et un type
     * initial `undefined`, qui serait parti tel quel dans `DamageImpact.type`.
     */
    it('une liste vide n\'est pas une liste', () => {
        expect(typesDeDegats(pilote([]))).toBe(TYPES_DE_DEGATS_PAR_DEFAUT);
    });
});

describe('nommer un jeton', () => {
    it('traduit le type quand la cle existe', () => {
        expect(nommerLeType('physical')).toBe('Physique');
        expect(nommerLeType('fire')).toBe('Feu');
    });

    it('traduit la localisation quand la cle existe', () => {
        expect(nommerLaLocalisation('leftArm')).toBe('Bras gauche');
    });

    /* Un pilote forgé déclare ce qu'il veut : mieux vaut le mot brut qu'un vide. */
    it('rend le jeton tel quel faute de traduction', () => {
        expect(nommerLeType('balistique')).toBe('balistique');
        expect(nommerLaLocalisation('aileron')).toBe('aileron');
    });
});
