import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';

/**
 * **Les cartes d'initiative de Blade Runner** — B8, 2026-10-24 (livre de base,
 * « Surprise », « Échange d'initiative », p. 65 ; « Embuscade », p. 67).
 */
const store = () => useCombatStore.getState();
const unCombattant = (name: string) => ({
    name, init: 0, hp: 10, hpMax: 10, isPlayer: false, faction: 'enemy' as const, statuses: [],
});
const ids = () => Object.fromEntries(store().combatants.map(c => [c.name, c.id]));

beforeEach(() => {
    store().reset();
    useCombatStore.setState({ combatsGares: {}, dejaConsigne: false, ouvertureConsignee: false });
    useJournalStore.getState().clearJournal();
    useJournalStore.getState().addJournal('Séance de test');
    for (const nom of ['Jane', 'Resch', 'Jarry']) store().addCombatant(unCombattant(nom));
});

describe('la surprise', () => {
    it('celui qui surprend reçoit la carte 1, les autres tirent dans le reste du paquet', () => {
        for (let essai = 0; essai < 20; essai++) {
            store().rollAutoInitiative({ cards: 10, sortOrder: 'asc', carteUn: ids().Jarry });
            const cartes = Object.fromEntries(store().combatants.map(c => [c.name, c.init]));
            expect(cartes.Jarry).toBe(1);
            expect(cartes.Jane).not.toBe(1);
            expect(cartes.Resch).not.toBe(1);
            expect(store().combatants[0].name).toBe('Jarry');
        }
    });
});

describe('l’échange d’initiative', () => {
    beforeEach(() => {
        // Jarry 5, Jane 8, Resch 9 — comme l'exemple de la p. 66, plus un troisième.
        useCombatStore.setState({
            combatants: store().combatants.map(c => ({ ...c, init: { Jarry: 5, Jane: 8, Resch: 9 }[c.name]! }))
                .sort((a, b) => a.init - b.init),
            currentTurnIdx: 0, round: 1,
        });
    });

    it('le combattant actif donne sa carte : l’autre la prend et agit aussitôt', () => {
        expect(store().echangerLInitiative(ids().Jarry, ids().Jane)).toBeNull();
        const s = store();
        expect(s.combatants[s.currentTurnIdx].name).toBe('Jane');
        expect(Object.fromEntries(s.combatants.map(c => [c.name, c.init]))).toEqual({ Jane: 5, Jarry: 8, Resch: 9 });
    });

    it('celui qui vient de recevoir une carte ne peut pas l’échanger avant le round suivant', () => {
        store().echangerLInitiative(ids().Jarry, ids().Jane);
        expect(store().echangerLInitiative(ids().Jane, ids().Resch)).toMatch(/pas avant le round suivant/);
        useCombatStore.setState({ round: 2 });
        expect(store().echangerLInitiative(ids().Jane, ids().Resch)).toBeNull();
    });

    it('on n’échange ni avec qui a déjà joué, ni hors de son tour', () => {
        useCombatStore.setState({ currentTurnIdx: 1 });
        expect(store().echangerLInitiative(ids().Jane, ids().Jarry)).toMatch(/a déjà joué/);
        expect(store().echangerLInitiative(ids().Resch, ids().Jane)).toMatch(/Seul le combattant dont c'est le tour/);
    });
});
