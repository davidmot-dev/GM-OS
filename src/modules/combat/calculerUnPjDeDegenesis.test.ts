import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **« Calculer » sur un PJ de Degenesis répartit le coup sur ses deux pistes** (24/11/2026, § 1 bis du
 * 06/11, David : « fait 4 »). Constaté dans le clip du 06/11 : PV 19 → 5, mais Blessures superficielles
 * et Traumatismes restés à 0. Depuis T21 (§ 263, 19/11), un combattant lié à une fiche passe par
 * `handleApplyImpact`, qui lit la règle du jeu (`pistesDeSanteSelonLeJeu`). Cet essai le prouve, de
 * « Calculer » jusqu'à la fiche ; il manquait.
 */

vi.mock('./../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('./../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { useCombatStore } = await import('./useCombatStore');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { pistesDeSanteSelonLeJeu } = await import('./logic/pistesDeDegenesis');

const PISTES = { mecanique: 'degenesis' as const, blessures: 'blessures_superficielles', traumatismes: 'traumatismes', ego: 'ego_jauge' };
const STATS = [
    { fieldId: 'sante', label: 'Santé', isMainHP: true, max: '(physique + resistance) * 2 + physique + psyche' },
    { fieldId: 'blessures_superficielles', label: 'Blessures superficielles', max: '(physique + resistance) * 2' },
    { fieldId: 'traumatismes', label: 'Traumatismes', max: 'physique + psyche' },
    { fieldId: 'ego_jauge', label: 'Égo', max: 'ego_max' },
];
const PILOTE = {
    id: 'degenesis-test', name: 'Degenesis', dice: { defaultDice: '1d6', logic: 'count-success', engine: 'standard' },
    combat: { defaultHealthType: 'hp', statsToTrack: STATS, pistesDeSante: PISTES },
};
// Falberg (fictif) : PHY 4 + Résistance 3 → 14 Blessures superficielles ; PHY 4 + PSY 1 → 5 Traumatismes ; santé 19.
const FALBERG = { physique: 4, resistance: 3, psyche: 1, sante: 19, blessures_superficielles: 0, traumatismes: 0, ego_jauge: 6, ego_max: 6 };
const fiche = () => useSessionOSStore.getState().players[0].characters[0].sheetData!;

beforeEach(() => {
    useCombatStore.getState().reset();
    useSessionOSStore.setState({
        activeCampaignId: 'c1', campaigns: [{ id: 'c1', name: 'Borca', system: 'degenesis-test' }], customGameDrivers: [PILOTE], entities: [],
        players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: true, characters: [
            { id: 'falberg', name: 'Falberg', campaignId: 'c1', templateId: 't', portraitUrl: '', hp: 19, maxHp: 19, sheetData: { ...FALBERG } },
        ] }],
    } as never);
    (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = useSessionOSStore;
    useCombatStore.getState().addCombatant({ name: 'Falberg', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'falberg', statuses: [], hp: 19, hpMax: 19 } as never);
});

describe('« Calculer » sur un PJ de Degenesis', () => {
    it('un coup physique de 14 coche les Blessures superficielles puis les Traumatismes, comme la règle du jeu', () => {
        const attendu = pistesDeSanteSelonLeJeu(PISTES, FALBERG, { value: 14, type: 'physique' }, STATS)!;
        const id = useCombatStore.getState().combatants[0].id;
        useCombatStore.getState().applyDamage(14, 'physique', [id]);
        expect(fiche()).toMatchObject(attendu.fiche);
        expect(Number(fiche().blessures_superficielles) + Number(fiche().traumatismes)).toBeGreaterThan(0);
        // Les PV suivent le coup que les pistes retiennent, une seule fois.
        expect(useSessionOSStore.getState().players[0].characters[0].hp).toBe(19 - attendu.impact.value);
    });

    it('une attaque mentale va à l’Égo, la santé ne bouge pas', () => {
        const id = useCombatStore.getState().combatants[0].id;
        useCombatStore.getState().applyDamage(3, 'mental', [id]);
        expect(fiche()).toMatchObject({ ego_jauge: 3, blessures_superficielles: 0, traumatismes: 0 });
        expect(useSessionOSStore.getState().players[0].characters[0].hp).toBe(19);
    });
});
