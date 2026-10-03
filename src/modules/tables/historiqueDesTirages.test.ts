import { describe, it, expect, beforeEach } from 'vitest';
import { useTableStore } from './useTableStore';
import type { TableData } from './types';

/**
 * **L'historique des tirages : réinjecter, effacer** — refonte, L6
 * (2026-10-03), les deux idées retenues par David le 2026-09-29.
 */
const TABLE: TableData = {
    name: 'Rencontres',
    dice: '1d6',
    entries: [
        { min: 1, max: 3, title: 'Calme', description: 'Rien ne bouge.' },
        { min: 4, max: 9, title: 'Alerte', description: 'Un bruit.' },
    ],
};

describe("l'historique des tirages", () => {
    beforeEach(() => {
        useTableStore.setState({ currentTableData: TABLE, currentResult: null, history: [], modifier: 0 });
    });

    it('réinjecter rend un tirage passé au résultat, sans le doubler dans l’historique', () => {
        const { roll } = useTableStore.getState();
        roll(2);
        roll(5);
        const [recent, ancien] = useTableStore.getState().history;
        expect(useTableStore.getState().currentResult).toBe(recent);

        useTableStore.getState().reinjecter(ancien);
        expect(useTableStore.getState().currentResult?.entry.title).toBe('Calme');
        expect(useTableStore.getState().history).toHaveLength(2);
    });

    it("effacer l'historique garde le résultat affiché", () => {
        useTableStore.getState().roll(4);
        useTableStore.getState().effacerLHistorique();
        expect(useTableStore.getState().history).toEqual([]);
        expect(useTableStore.getState().currentResult?.entry.title).toBe('Alerte');
    });
});
