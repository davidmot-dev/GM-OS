import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TableBridge, TableData, TableResult } from './types';
import { TableEngine } from './TableEngine';
import { useJournalStore } from '../journal/useJournalStore';
import i18next from 'i18next';

interface TableState {
    universes: string[];
    tables: string[];
    selectedUniverse: string;
    selectedTable: string;
    currentTableData: TableData | null;
    currentResult: TableResult | null;
    history: TableResult[];
    isLoading: boolean;
    modifier: number;

    // Actions
    fetchUniverses: () => Promise<void>;
    selectUniverse: (universe: string) => Promise<void>;
    selectTable: (tableName: string) => Promise<void>;
    setModifier: (mod: number) => void;
    roll: (manualRoll?: number) => void;
    clearCurrentResult: () => void;
    sendToSession: (recipientName?: string) => void;
}

const getBridge = () => (window as Window & typeof globalThis & { appBridge?: { tables: TableBridge } }).appBridge?.tables;

export const useTableStore = create<TableState>()(
    persist(
        (set, get) => ({
            universes: [],
            tables: [],
            selectedUniverse: '',
            selectedTable: '',
            currentTableData: null,
            currentResult: null,
            history: [],
            isLoading: false,
            modifier: 0,

            fetchUniverses: async () => {
                const bridge = getBridge();
                if (!bridge) return;
                try {
                    const universes = await bridge.listUniverses();
                    set({ universes });
                } catch (err) {
                    console.error("Failed to fetch universes:", err);
                }
            },

            selectUniverse: async (universe) => {
                set({ selectedUniverse: universe, tables: [], selectedTable: '', currentTableData: null });
                const bridge = getBridge();
                if (!bridge) return;
                try {
                    const tables = await bridge.listTables(universe);
                    set({ tables });
                } catch (err) {
                    console.error("Failed to fetch tables:", err);
                }
            },

            selectTable: async (tableName) => {
                set({ selectedTable: tableName, isLoading: true });
                const bridge = getBridge();
                if (!bridge) return;
                try {
                    const data = await bridge.loadTable(get().selectedUniverse, tableName);
                    set({ currentTableData: data, isLoading: false });
                } catch (err) {
                    console.error("Failed to load table:", err);
                    set({ isLoading: false });
                }
            },

            setModifier: (modifier) => set({ modifier }),

            roll: (manualRoll) => {
                const { currentTableData, modifier, selectedTable } = get();
                if (!currentTableData) return;

                const rawRoll = manualRoll ?? TableEngine.rollDice(currentTableData.dice);
                const finalValue = rawRoll + modifier;

                try {
                    const entry = TableEngine.resolveEntry(currentTableData, finalValue);
                    const result: TableResult = {
                        rawRoll,
                        modifier,
                        finalValue,
                        entry,
                        timestamp: Date.now(),
                        tableName: currentTableData.name || selectedTable
                    };

                    set((state) => ({
                        currentResult: result,
                        history: [result, ...state.history].slice(0, 50)
                    }));
                } catch (err) {
                    console.error("Resolution failed:", err);
                }
            },

            clearCurrentResult: () => set({ currentResult: null }),

            sendToSession: (recipientName?: string) => {
                const { currentResult } = get();
                if (!currentResult) return;

                // Log the actual roll result to Journal only when shared
                useJournalStore.getState().addEvent({
                    type: 'ORACLE',
                    title: i18next.t('modules:random_tables.journal.share_title', { table: currentResult.tableName }),
                    content: i18next.t('modules:random_tables.journal.share_content', { 
                        raw: currentResult.rawRoll, 
                        mod: currentResult.modifier, 
                        final: currentResult.finalValue,
                        title: currentResult.entry.title,
                        desc: currentResult.entry.description || '',
                        recipient: recipientName ? i18next.t('modules:random_tables.journal.given_to', { name: recipientName }) : ''
                    })
                });

                // UI feedback
                console.log("SENDING TO SESSION:", currentResult.entry.title);
            }
        }),
        {
            name: 'gmos-table-storage',
            partialize: (state) => ({
                history: state.history,
                selectedUniverse: state.selectedUniverse,
                selectedTable: state.selectedTable
            })
        }
    )
);
