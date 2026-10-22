import { describe, it, expect } from 'vitest';
import { CLE_DES_FRANCHISSEMENTS, franchissementsEnAttente, rearmer } from './franchissements';
import type { Franchissement } from '../../types/drivers';
import type { HerosDeLaTable } from './gestesDesHeros';

/**
 * **La Séquelle de NOC** (2026-10-22) : à 8 sur une jauge de péril, un point
 * devient permanent. Proposée une fois par passage ; la fiche s'en souvient.
 */
const SEQUELLE: Franchissement = {
    id: 'sequelle-blessures', champ: 'blessures', label: 'Blessures', aPartirDe: 8,
    rappel: 'Blessure lourde : un point devient une séquelle',
    mouvements: [{ champ: 'sequelles_blessures', label: 'Séquelles (Blessures)', delta: 1, max: 10 }],
};
const heros = (valeurs: Record<string, unknown>): HerosDeLaTable => ({ joueurId: 'j', id: 'ilya', nom: 'Ilya Vorn', valeurs });

describe('un seuil qui laisse une trace', () => {
    it('à 8, la séquelle se propose, avec ce que « Noter » écrirait', () => {
        const [a] = franchissementsEnAttente([SEQUELLE], [heros({ blessures: 8, sequelles_blessures: 0 })]);
        expect(a.valeur).toBe(8);
        expect(a.lignes).toEqual(['Séquelles (Blessures) 0 → 1 (+1)']);
        expect(a.noter).toEqual({ sequelles_blessures: 1, [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true } });
        expect(a.ecarter).toEqual({ [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true } });
    });

    it('sous le seuil, rien ; un saut de 6 à 10 le franchit aussi', () => {
        expect(franchissementsEnAttente([SEQUELLE], [heros({ blessures: 7 })])).toEqual([]);
        expect(franchissementsEnAttente([SEQUELLE], [heros({ blessures: 10 })])).toHaveLength(1);
    });

    it('noté ou écarté, il ne revient pas — ni au rechargement, ni à la reconnexion', () => {
        const [a] = franchissementsEnAttente([SEQUELLE], [heros({ blessures: 8, sequelles_blessures: 0 })]);
        const apres = { blessures: 8, sequelles_blessures: 0, ...a.noter };
        expect(franchissementsEnAttente([SEQUELLE], [heros(apres)])).toEqual([]);
        expect(franchissementsEnAttente([SEQUELLE], [heros({ blessures: 9, ...a.ecarter })])).toEqual([]);
        expect(rearmer([SEQUELLE], apres), 'toujours au-dessus : rien à réarmer').toBeNull();
    });

    it('redescendue sous le seuil, la jauge le réarme : le passage suivant se propose', () => {
        const traite = { blessures: 7, sequelles_blessures: 1, [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true } };
        const maj = rearmer([SEQUELLE], traite);
        expect(maj).toEqual({ [CLE_DES_FRANCHISSEMENTS]: {} });
        const [a] = franchissementsEnAttente([SEQUELLE], [heros({ ...traite, ...maj, blessures: 8 })]);
        expect(a.lignes).toEqual(['Séquelles (Blessures) 1 → 2 (+1)']);
    });

    it('un seuil retiré du pilote est oublié par la fiche', () => {
        expect(rearmer([], { blessures: 9, [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true } }))
            .toEqual({ [CLE_DES_FRANCHISSEMENTS]: {} });
    });

    it('une marque illisible ne vaut rien', () => {
        expect(franchissementsEnAttente([SEQUELLE], [heros({ blessures: 8, [CLE_DES_FRANCHISSEMENTS]: 'oui' })])).toHaveLength(1);
    });
});
