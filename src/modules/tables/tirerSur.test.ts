import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTableStore } from './useTableStore';
import { useJournalStore } from '../journal/useJournalStore';
import type { TableData, TableResult } from './types';

/**
 * **Tirer sur une table depuis la télécommande** (Fire HD 8, registre § 256, T5). Le tirage se
 * fait au poste du MJ et entre dans l'historique de Table-OS ; il n'est ni affiché au PC ni
 * journalisé tant que David ne l'a pas montré.
 */
const BLESSURES: TableData = {
    name: 'Blessures Critiques',
    dice: '1d6',
    entries: [
        { min: 1, max: 3, title: 'Égratignure', description: 'Rien de grave.' },
        { min: 4, max: 99, title: 'Sang dans les yeux', description: 'Le sang coule sur votre visage.' },
    ],
};

type Fenetre = { appBridge?: unknown };
const AFFICHE: TableResult = {
    rawRoll: 2, modifier: 0, finalValue: 2, timestamp: 1,
    entry: { min: 1, max: 3, title: 'Égratignure', description: '' }, tableName: 'Autre table',
};

describe('tirerSur', () => {
    let charger: ReturnType<typeof vi.fn>;
    let journaliser: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        charger = vi.fn(async (univers: string, table: string) =>
            univers === 'Alien' && table === 'blessures_critiques' ? BLESSURES : null);
        (window as unknown as Fenetre).appBridge = { tables: { loadTable: charger } };
        useTableStore.setState({ history: [], currentResult: AFFICHE, currentTableData: null, modifier: 0 });
        journaliser = vi.fn();
        useJournalStore.setState({ addEvent: journaliser } as never);
    });

    afterEach(() => {
        delete (window as unknown as Fenetre).appBridge;
        vi.restoreAllMocks();
    });

    it("tire, applique le modificateur et écrit l'historique", async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0); // 1 au d6
        const resultat = await useTableStore.getState().tirerSur('Alien', 'blessures_critiques', 3);

        expect(charger).toHaveBeenCalledWith('Alien', 'blessures_critiques');
        expect(resultat).toMatchObject({ rawRoll: 1, modifier: 3, finalValue: 4, tableName: 'Blessures Critiques' });
        expect(resultat?.entry.title).toBe('Sang dans les yeux');
        expect(useTableStore.getState().history).toEqual([resultat]);
    });

    it('ne touche ni au résultat affiché au PC ni au journal', async () => {
        await useTableStore.getState().tirerSur('Alien', 'blessures_critiques', 0);
        expect(useTableStore.getState().currentResult).toBe(AFFICHE);
        expect(journaliser).not.toHaveBeenCalled();
    });

    it('rend null sans pont ou sans table, et n’écrit rien', async () => {
        expect(await useTableStore.getState().tirerSur('Alien', 'inconnue', 0)).toBeNull();
        delete (window as unknown as Fenetre).appBridge;
        expect(await useTableStore.getState().tirerSur('Alien', 'blessures_critiques', 0)).toBeNull();
        expect(useTableStore.getState().history).toEqual([]);
    });

    it('journaliserUnTirage écrit le tirage montré, comme le partage du PC', async () => {
        const resultat = await useTableStore.getState().tirerSur('Alien', 'blessures_critiques', 0);
        useTableStore.getState().journaliserUnTirage(resultat!);
        expect(journaliser).toHaveBeenCalledTimes(1);
        expect(journaliser.mock.calls[0][0]).toMatchObject({ type: 'ORACLE' });
        expect(useTableStore.getState().history).toHaveLength(1);
    });
});
