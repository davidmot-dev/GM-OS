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
    /**
     * **Réinjecter** un tirage de l'historique — retenu par David le
     * 2026-09-29 (refonte, tables aléatoires) : il redevient le résultat
     * affiché, avec ses gestes (verser, journaliser). Il ne s'ajoute pas une
     * seconde fois à l'historique : on relit un tirage, on n'en refait pas un.
     */
    reinjecter: (resultat: TableResult) => void;
    effacerLHistorique: () => void;
    sendToSession: (recipientName?: string) => void;
    /**
     * **Tirer sur une table sans l'ouvrir** — demandé par la télécommande (Fire HD 8, registre
     * § 256, T5). Charge la table par le pont, tire, et **écrit l'historique** comme un tirage du
     * tableau de bord. Ne touche pas au résultat affiché au PC (`currentResult`) : David peut
     * avoir une autre table ouverte. Ne journalise rien — le résultat est au meneur seul tant
     * qu'il ne l'a pas montré. `null` si le pont, la table ou la résolution manque.
     */
    tirerSur: (univers: string, table: string, modificateur: number) => Promise<TableResult | null>;
    /** Écrit un tirage au journal — le seul écrivain des tirages au journal, PC et télécommande. */
    journaliserUnTirage: (resultat: TableResult, recipientName?: string) => void;
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

            reinjecter: (resultat) => set({ currentResult: resultat }),

            effacerLHistorique: () => set({ history: [] }),

            tirerSur: async (univers, table, modificateur) => {
                const bridge = getBridge();
                if (!bridge) return null;
                try {
                    const data = await bridge.loadTable(univers, table);
                    if (!data) return null;
                    const rawRoll = TableEngine.rollDice(data.dice);
                    const finalValue = rawRoll + modificateur;
                    const result: TableResult = {
                        rawRoll,
                        modifier: modificateur,
                        finalValue,
                        entry: TableEngine.resolveEntry(data, finalValue),
                        timestamp: Date.now(),
                        tableName: data.name || table,
                    };
                    set((state) => ({ history: [result, ...state.history].slice(0, 50) }));
                    return result;
                } catch (err) {
                    console.error(`[Table-OS] tirage impossible sur ${univers}/${table}:`, err);
                    return null;
                }
            },

            sendToSession: (recipientName?: string) => {
                const { currentResult } = get();
                if (!currentResult) return;
                get().journaliserUnTirage(currentResult, recipientName);
                // UI feedback
                console.log("SENDING TO SESSION:", currentResult.entry.title);
            },

            journaliserUnTirage: (currentResult, recipientName) => {
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
