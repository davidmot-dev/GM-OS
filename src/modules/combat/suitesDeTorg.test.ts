import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../session/logic/idbStorage', () => ({ idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} }, onPersistedStateChanged: () => () => {} }));
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { useCombatStore } = await import('./useCombatStore');
const { appliquerTenaciteTorg, appliquerSouffranceTorg } = await import('./suitesDeTorg');
const { ajusterLeChocDuCamp } = await import('./ficheDesCombattants');
const pilote = { id: 'torg', jet: { torg: { blessures: 'blessures' } }, combat: { dommages: { mecanique: 'torg', choc: 'choc', resistance: 'resistance' } },
    cosms: [{ id: 'mixte', nom: 'Exercice mixte', lois: [{ nom: 'Ténacité', mecanique: 'tenacite' }, { nom: 'Souffrance', mecanique: 'souffrance' }] }] };
const cases = (n: number) => ({ type: 'boxes' as const, state: 'healthy' as const, badges: [], data: { boxes: Array.from({ length: 4 }, (_, i) => ({ label: '', filled: i < n })) } });
const combattant = (id: string, blessures: number, ko = true) => ({ id, name: id, init: 0, faction: 'enemy', isPlayer: false, statuses: [], healthSystem: cases(blessures),
    sheetData: { blessures, choc: 7 }, suiteTorg: { id: 'action-1', blessures: 1, ko } });
beforeEach(() => {
    (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore = useSessionOSStore;
    useSessionOSStore.setState({ getActiveDriver: () => pilote, players: [], entities: [], scenes: [], campaigns: [{ id: 'c', cosmsParDefaut: ['mixte'] }], activeCampaignId: 'c' } as never);
    useCombatStore.setState({ combatants: [combattant('cible', 2), combattant('attaquant', 0), combattant('autre', 1)] } as never);
});
const lire = (id = 'cible') => useCombatStore.getState().combatants.find(c => c.id === id)!;
describe('Lois du Monde : suites du reçu Torg', () => {
    it('Ténacité efface le Choc contre une seule Blessure et refuse le double clic', () => {
        expect(appliquerTenaciteTorg('cible')).toBe(true);
        expect(lire().sheetData).toMatchObject({ blessures: 3, choc: 0 });
        expect(appliquerTenaciteTorg('cible')).toBe(false);
        expect(lire().sheetData?.blessures).toBe(3);
    });
    it('égaler le maximum de Choc sans être KO ne permet pas de déclencher Ténacité', () => {
        useCombatStore.getState().updateCombatant('cible', { suiteTorg: { id: 'coup', blessures: 0, ko: false } });
        expect(appliquerTenaciteTorg('cible')).toBe(false);
    });
    it('la dernière Blessure laisse le tour complet accordé avant Défaite', () => {
        useCombatStore.setState({ combatants: [combattant('cible', 3)] } as never);
        expect(appliquerTenaciteTorg('cible')).toBe(true);
        expect(lire().suiteTorg?.dernierTour).toBe(true);
        expect(lire().healthSystem?.state).toBe('critical');
    });
    it('Souffrance rend un seul Choc pour une action qui a blessé deux cibles', () => {
        expect(appliquerSouffranceTorg('cible', 'attaquant')).toBe(true);
        expect(lire('attaquant').sheetData?.choc).toBe(6);
        expect(appliquerSouffranceTorg('autre', 'attaquant')).toBe(false);
        expect(lire('attaquant').sheetData?.choc).toBe(6);
    });
    it('Inspiration réveille même un KO dont le Choc a déjà été effacé', () => {
        useSessionOSStore.setState({ getActiveDriver: () => ({ ...pilote, torg: { etats: { ko: 'ko' } } }) } as never);
        useCombatStore.getState().updateCombatant('cible', { sheetData: { choc: 0, ko: true } });
        ajusterLeChocDuCamp('adversaires', -2, true);
        expect(lire().sheetData).toMatchObject({ choc: 0, ko: false });
    });
    it('le Choc de Fatigués produit un reçu KO utilisable par Ténacité', () => {
        useSessionOSStore.setState({ getActiveDriver: () => ({ ...pilote, torg: { etats: { ko: 'ko' } }, combat: { ...pilote.combat, statsToTrack: [{ fieldId: 'choc', label: 'Choc', max: 'esprit' }] } }) } as never);
        useCombatStore.getState().updateCombatant('cible', { sheetData: { blessures: 2, choc: 7, esprit: 8 }, suiteTorg: { id: 'ancien', blessures: 0, ko: false } });
        ajusterLeChocDuCamp('adversaires', 2);
        expect(lire().suiteTorg?.ko).toBe(true);
        expect(appliquerTenaciteTorg('cible')).toBe(true);
        expect(lire().sheetData).toMatchObject({ blessures: 3, choc: 0, ko: false });
    });
    it('un coup ordinaire sur deux autonomes traduit le total et partage le reçu d’action', () => {
        useSessionOSStore.setState({ getActiveDriver: () => ({ ...pilote, combat: { ...pilote.combat, statsToTrack: [{ fieldId: 'choc', max: 'esprit' }] } }) } as never);
        for (const id of ['cible', 'autre']) useCombatStore.getState().updateCombatant(id, { healthSystem: cases(0), sheetData: { resistance: 8, choc: 0, esprit: 7, blessures: 0 } });
        useCombatStore.getState().applyDamage(17, 'physical', ['cible', 'autre']);
        expect(lire().sheetData).toMatchObject({ blessures: 1, choc: 2 });
        expect(lire('autre').sheetData).toMatchObject({ blessures: 1, choc: 2 });
        expect(lire().suiteTorg?.id).toBe(lire('autre').suiteTorg?.id);
        expect(appliquerSouffranceTorg('cible', 'attaquant')).toBe(true);
        expect(appliquerSouffranceTorg('autre', 'attaquant')).toBe(false);
        useCombatStore.getState().applyDamage(-1, 'soin', ['cible']);
        expect(lire().sheetData).toMatchObject({ blessures: 0, choc: 2 });
    });
});
