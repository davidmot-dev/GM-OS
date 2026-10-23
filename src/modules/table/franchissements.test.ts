import { describe, it, expect } from 'vitest';
import { CLE_DES_FRANCHISSEMENTS, franchissementsEnAttente, noterLeFranchissement, rearmer } from './franchissements';
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

/**
 * **La Corruption de Symbaroum** (S4, 2026-10-22) : la Corruption *totale*
 * (temporaire + permanente), au Seuil de Corruption (Volonté ÷ 2, arrondi
 * au-dessus) puis à la Volonté.
 */
describe('un seuil lu sur la fiche, sur une somme de jauges', () => {
    const STIGMATE: Franchissement = {
        id: 'stigmate', champ: 'corruption_temporaire', ajouter: ['corruption_permanente'], label: 'Corruption totale',
        aPartirDe: { champ: 'volonte', fois: 0.5 }, rappel: 'Choisir un Stigmate', mouvements: [],
        jet: { faces: 4, champ: 'corruption_permanente', label: 'Corruption permanente' },
    };
    const ABOMINATION: Franchissement = {
        id: 'abomination', champ: 'corruption_temporaire', ajouter: ['corruption_permanente'], label: 'Corruption totale',
        aPartirDe: { champ: 'volonte' }, rappel: 'Abomination', mouvements: [],
    };
    const elena = (valeurs: Record<string, unknown>) => heros({ volonte: 11, ...valeurs });

    it('Volonté 11 : le seuil vaut 6 — 4 temporaires et 2 permanents le franchissent', () => {
        expect(franchissementsEnAttente([STIGMATE], [elena({ corruption_temporaire: 3, corruption_permanente: 2 })])).toEqual([]);
        const [a] = franchissementsEnAttente([STIGMATE], [elena({ corruption_temporaire: 4, corruption_permanente: 2 })]);
        expect(a.valeur).toBe(6);
        expect(a.lignes).toEqual(['Corruption permanente +1D4']);
    });

    it('« Noter » lance le dé au geste, et pas avant', () => {
        const [a] = franchissementsEnAttente([STIGMATE], [elena({ corruption_temporaire: 4, corruption_permanente: 2 })]);
        const { maj, lignes } = noterLeFranchissement(a, () => 3);
        expect(maj).toEqual({ corruption_permanente: 5, [CLE_DES_FRANCHISSEMENTS]: { stigmate: true } });
        expect(lignes).toEqual(['Corruption permanente 2 → 5 (1D4 : 3)']);
    });

    it('à la Volonté, l\'Abomination : un rappel, rien à écrire que la marque', () => {
        const [a] = franchissementsEnAttente([ABOMINATION], [elena({ corruption_temporaire: 5, corruption_permanente: 6 })]);
        expect(a.noter).toEqual({ [CLE_DES_FRANCHISSEMENTS]: { abomination: true } });
        expect(noterLeFranchissement(a, () => 4).lignes).toEqual([]);
    });

    it('une Volonté pas encore remplie ne déclenche rien', () => {
        expect(franchissementsEnAttente([STIGMATE, ABOMINATION], [heros({ corruption_temporaire: 3 })])).toEqual([]);
    });

    it('la fin de scène vide la temporaire : la totale redescend, le seuil se réarme', () => {
        const traite = { volonte: 11, corruption_temporaire: 0, corruption_permanente: 5, [CLE_DES_FRANCHISSEMENTS]: { stigmate: true } };
        expect(rearmer([STIGMATE], traite)).toEqual({ [CLE_DES_FRANCHISSEMENTS]: {} });
    });
});

/** **Plusieurs issues au choix** — la Névrose de Crimes au seuil (C4, 2026-10-23, p. 409 et 418). */
describe('un seuil à plusieurs issues', () => {
    const NEVROSE = {
        id: 'nevrose-seuil', champ: 'nevrose', label: 'Névrose', aPartirDe: { champ: 'seuil_nevrose' }, mouvements: [],
        variantes: [
            { id: 'moitie', label: 'Névrose à la moitié (p. 409)', mouvements: [{ champ: 'psychose', delta: 1 }, { champ: 'nevrose', delta: 'moitie' as const }] },
            { id: 'zero', label: 'Névrose à zéro (p. 418)', mouvements: [{ champ: 'psychose', delta: 1 }, { champ: 'nevrose', delta: 'vide' as const }] },
        ],
    };
    it('Rachel, seuil 7 atteint : la moitié donne 3 (l’exemple p. 411), zéro donne 0 ; +1 Psychose dans les deux cas', () => {
        const [a] = franchissementsEnAttente([NEVROSE], [{ joueurId: 'j', id: 'rachel', nom: 'Rachel', valeurs: { nevrose: 7, seuil_nevrose: 7, psychose: 2 } }]);
        expect(a.variantes!.map(v => [v.id, v.noter.nevrose, v.noter.psychose])).toEqual([['moitie', 3, 3], ['zero', 0, 3]]);
        expect(a.variantes![0].lignes).toEqual(['psychose 2 → 3 (+1)', 'nevrose 7 → 3 (moitié)']);
    });
});
