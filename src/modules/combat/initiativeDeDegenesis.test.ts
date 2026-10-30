import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { DiceEngine } from '../dice/DiceEngine';
import type { GameDriver } from '../../types/drivers';

/**
 * **L'initiative de Degenesis** (2026-10-30, livre Katharsys p. 100-101) : un jet de
 * PSY+Réactivité dont le score est le nombre de succès, moins un dé par Traumatisme ;
 * une action de plus par paire de déclencheurs.
 */
const DEGENESIS = {
    id: 'degenesis', name: 'Degenesis', templateId: 'tpl',
    combat: {
        initiativeFormula: 'psyche + reactivite', initiativeSort: 'desc', initiativeEnReserve: { mecanique: 'degenesis' },
        statsToTrack: [], pistesDeSante: { mecanique: 'degenesis', blessures: 'blessures_superficielles', traumatismes: 'traumatismes' },
    },
} as unknown as GameDriver;
const FICHES: Record<string, Record<string, number>> = {
    Vedran: { psyche: 3, reactivite: 3, traumatismes: 0 },
    Kum: { psyche: 2, reactivite: 3, traumatismes: 1 },
};
const store = () => useCombatStore.getState();
const session = useSessionOSStore.getState();

beforeEach(() => {
    (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore = useSessionOSStore;
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [DEGENESIS],
        campaigns: [{ id: 'c', name: 'Balkhans', system: 'degenesis', activeLocationIds: [] }],
    } as never);
    store().reset();
    useCombatStore.setState({ combatsGares: {}, dejaConsigne: false, ouvertureConsignee: false });
    useJournalStore.getState().clearJournal();
    useJournalStore.getState().addJournal('Séance de test');
    useJournalStore.setState({ isRecording: true });
    for (const name of ['Vedran', 'Kum']) {
        store().addCombatant({ name, init: 0, hp: 10, hpMax: 10, isPlayer: false, faction: 'enemy', statuses: [] });
    }
});
afterEach(() => {
    vi.restoreAllMocks();
    useSessionOSStore.setState(session, true);
});

describe('l’initiative en réserve', () => {
    it('le score est le nombre de succès ; Kum lance un dé de moins pour sa côte cassée', () => {
        // Six dés pour Vedran (6, 6, 6, 6, 2, 1), quatre pour Kum (5, 4, 3, 6).
        const des = [6, 6, 6, 6, 2, 1, 5, 4, 3, 6];
        const roll = vi.spyOn(DiceEngine, 'roll').mockImplementation(() => des.shift() ?? 1);
        store().rollAutoInitiative({
            formula: 'psyche + reactivite', sortOrder: 'desc',
            resolver: (stat, c) => FICHES[c.name][stat] ?? 0,
        });
        expect(roll).toHaveBeenCalledTimes(10);
        expect(store().combatants.map(c => [c.name, c.init])).toEqual([['Vedran', 4], ['Kum', 3]]);
        const entree = useJournalStore.getState().journals[0].events.find(e => e.title === 'Combat : Initiative');
        expect(entree?.content).toContain('Vedran 4 (3 actions), Kum 3');
    });
});
