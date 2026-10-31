import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { DiceEngine } from '../dice/DiceEngine';
import type { GameDriver } from '../../types/drivers';

/**
 * **L'initiative de COC** (2026-10-31, livre de règles p. 71, 85-86) : 10 + INT + PER, sans
 * dé ; l'état de santé retire son malus — Blessé, −5.
 */
const COC = {
    id: 'coc', name: 'COC', templateId: 'tpl',
    combat: {
        initiativeFormula: '10 + intelligence + perception', initiativeSort: 'desc', statsToTrack: [],
        encaissement: { mecanique: 'coc', sante: 'echelle_de_sante' },
    },
} as unknown as GameDriver;
// L'exemple du livre : Amelia (Init. 12) contre un gangster (Init. 14) ; ici le gangster est blessé.
const FICHES: Record<string, Record<string, number>> = {
    Amelia: { intelligence: 0, perception: 2, echelle_de_sante: 0 },
    Gangster: { intelligence: 2, perception: 2, echelle_de_sante: 16 },
};
const store = () => useCombatStore.getState();
const session = useSessionOSStore.getState();

beforeEach(() => {
    (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore = useSessionOSStore;
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [COC],
        campaigns: [{ id: 'c', name: 'Big Apple', system: 'coc', activeLocationIds: [] }],
    } as never);
    store().reset();
    useCombatStore.setState({ combatsGares: {}, dejaConsigne: false, ouvertureConsignee: false });
    useJournalStore.getState().clearJournal();
    useJournalStore.getState().addJournal('Séance de test');
    useJournalStore.setState({ isRecording: true });
    for (const name of ['Amelia', 'Gangster']) {
        store().addCombatant({ name, init: 0, hp: 10, hpMax: 10, isPlayer: false, faction: 'enemy', statuses: [] });
    }
});
afterEach(() => {
    vi.restoreAllMocks();
    useSessionOSStore.setState(session, true);
});

describe('l’initiative de COC', () => {
    it('sans dé, et le gangster blessé perd 5 : Amelia 12 passe devant lui, 9', () => {
        const roll = vi.spyOn(DiceEngine, 'roll');
        store().rollAutoInitiative({
            formula: '10 + intelligence + perception', sortOrder: 'desc',
            resolver: (stat, c) => FICHES[c.name][stat] ?? 0,
        });
        expect(roll).not.toHaveBeenCalled();
        expect(store().combatants.map(c => [c.name, c.init])).toEqual([['Amelia', 12], ['Gangster', 9]]);
        const entree = useJournalStore.getState().journals[0].events.find(e => e.title === 'Combat : Initiative');
        expect(entree?.content).toContain('État de santé : Gangster −5.');
    });
});
