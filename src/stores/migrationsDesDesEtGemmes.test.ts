import { describe, expect, it, vi } from 'vitest';

vi.mock('../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { useDiceStore } = await import('./useDiceStore');
const { useGemStore } = await import('./useGemStore');
const migrerLesDes = useDiceStore.persist.getOptions().migrate;
const migrerLesGemmes = useGemStore.persist.getOptions().migrate;
if (!migrerLesDes || !migrerLesGemmes) throw new Error('Migration persistante absente');

describe('la migration persistante des dés', () => {
    it('traduit les trois anciens libellés sans perdre les formules, les réglages ou les raccourcis personnalisés', async () => {
        const personnalise = { id: 'personnel', label: 'Ma parade', formula: '2d6+3', note: 'conservée' };
        const source = { quickRolls: [
            { id: 'attaque', label: 'Attaque Épée Longue', formula: '1d20+7', couleurAncienne: 'bleu' },
            { id: 'degats', label: 'Dégâts', formula: '1d8+4' },
            { id: 'd66', label: 'Lancer D66', formula: '1d66' },
            personnalise,
        ], enable3D: false, styleDesDes: 'verre', ancienReglage: { valeur: 9 } };
        const temoin = structuredClone(source);

        // Les options de ce middleware exposent un résultat unknown ; reprendre
        // le contrat réel du magasin pour vérifier l'identité du raccourci.
        const resultat = await migrerLesDes(source, 0) as Partial<ReturnType<typeof useDiceStore.getState>>;

        expect(resultat).toEqual({ ...temoin, quickRolls: [
            { ...temoin.quickRolls[0], label: 'dice.quick_rolls.defaults.attack' },
            { ...temoin.quickRolls[1], label: 'dice.quick_rolls.defaults.damage' },
            { ...temoin.quickRolls[2], label: 'dice.quick_rolls.defaults.d66' },
            personnalise,
        ] });
        expect(resultat.quickRolls?.[3]).toBe(personnalise);
        expect(source).toEqual(temoin);
        expect(resultat).not.toBe(source);
    });

    it.each([1, 2, null, undefined])('ne traduit pas une version différente de zéro (%s)', async (version) => {
        const source = { quickRolls: [{ id: 'ancien', label: 'Dégâts', formula: '1d8' }] };
        expect(await migrerLesDes(source, version as number)).toBe(source);
        expect(source.quickRolls[0].label).toBe('Dégâts');
    });

    it('ne fabrique pas de raccourcis lorsque le champ est absent', async () => {
        const source = { enable3D: false };
        const resultat = await migrerLesDes(source, 0);
        expect(resultat).toBe(source);
        expect(resultat).not.toHaveProperty('quickRolls');
    });

    it('conserve une liste réellement vide et ses autres champs', async () => {
        const source = { quickRolls: [], ancienReglage: 'conservé' };
        expect(await migrerLesDes(source, 0)).toEqual(source);
    });

    it.each([null, undefined])('un état absent en version zéro garde le refus existant (%s)', (source) => {
        expect(() => migrerLesDes(source, 0)).toThrow(TypeError);
    });

    it.each([null, undefined])('un état absent d’une version récente reste intact (%s)', async (source) => {
        expect(await migrerLesDes(source, 1)).toBe(source);
    });
});

describe('la migration persistante des gemmes', () => {
    it('remplace la collection de version zéro par les modèles fournis, sans toucher au choix actif ni aux champs annexes', async () => {
        const source = { gems: [{ id: 'ancien', name: 'Ancien cortex personnalisé' }],
            activeGemId: 'scribe', ancienReglage: { note: 'conservée' } };
        const temoin = structuredClone(source);
        const modeles = useGemStore.getInitialState().gems;

        const resultat = await migrerLesGemmes(source, 0);

        expect(resultat).toEqual({ ...temoin, gems: modeles });
        expect(resultat.gems).toHaveLength(8);
        expect(resultat.gems?.find(g => g.id === 'sage')?.name).toBe('settings:ai.gems.templates.sage.name');
        expect(source).toEqual(temoin);
        expect(resultat).not.toBe(source);
    });

    it.each([1, 2, null, undefined])('garde les gemmes personnalisées d’une autre version (%s)', async (version) => {
        const source = { gems: [{ id: 'personnel', name: 'Mon cortex', penchant: 'campagne' }], activeGemId: 'personnel' };
        expect(await migrerLesGemmes(source, version as number)).toBe(source);
        expect(source.gems[0].name).toBe('Mon cortex');
    });

    it.each([null, undefined, {}])('une version zéro sans collection reçoit les modèles (%j)', async (source) => {
        expect(await migrerLesGemmes(source, 0)).toEqual({ gems: useGemStore.getInitialState().gems });
    });

    it.each([null, undefined])('un état absent d’une version récente reste intact (%s)', async (source) => {
        expect(await migrerLesGemmes(source, 1)).toBe(source);
    });
});
