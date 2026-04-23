import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppBridge } from '../../bridge/AppBridge';

export interface NoteEntry {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: NoteEntry[];
}

interface ObsidianState {
    vaultPath: string;
    notes: NoteEntry[];
    activeNotePath: string | null;
    activeNoteContent: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setVaultPath: (path: string) => void;
    browseVaultPath: () => Promise<void>;
    fetchNotes: () => Promise<void>;
    selectNote: (path: string) => Promise<void>;
    syncActiveNoteToOracle: (notebookId: string) => Promise<boolean>;
}

export const useObsidianStore = create<ObsidianState>()(
    persist(
        (set, get) => ({
            vaultPath: 'C:\\Users\\david\\OneDrive\\Obsidian Vault',
            notes: [],
            activeNotePath: null,
            activeNoteContent: null,
            isLoading: false,
            error: null,

            setVaultPath: (path) => set({ vaultPath: path }),

            browseVaultPath: async () => {
                try {
                    if (!AppBridge.obsidian.hasSupport) {
                        throw new Error("Sélecteur de dossier non disponible");
                    }
                    const selectedPath = await AppBridge.obsidian.selectVault();
                    if (selectedPath) {
                        set({ vaultPath: selectedPath });
                        // Optionnel: rafraîchir les notes immédiatement
                        await get().fetchNotes();
                    }
                } catch (err) {
                    set({ error: (err as Error).message });
                }
            },

            fetchNotes: async () => {
                const { vaultPath } = get();
                set({ isLoading: true, error: null });
                try {
                    if (!AppBridge.obsidian.hasSupport) {
                        throw new Error("Obsidian Bridge non disponible");
                    }
                    const notes = await AppBridge.obsidian.listNotes(vaultPath);
                    set({ notes, isLoading: false });
                } catch (err) {
                    set({ error: (err as Error).message, isLoading: false });
                }
            },

            selectNote: async (relativePath) => {
                const { vaultPath } = get();
                set({ isLoading: true, error: null, activeNotePath: relativePath });
                try {
                    if (!AppBridge.obsidian.hasSupport) {
                        throw new Error("Obsidian Bridge non disponible");
                    }
                    const content = await AppBridge.obsidian.readNote(relativePath, vaultPath);
                    set({ activeNoteContent: content, isLoading: false });
                } catch (err) {
                    set({ error: (err as Error).message, isLoading: false });
                }
            },

            syncActiveNoteToOracle: async (notebookId) => {
                const { activeNoteContent, activeNotePath } = get();
                if (!activeNoteContent || !activeNotePath) return false;

                try {
                    if (!AppBridge.mcp.hasSupport) {
                        throw new Error("Bridge MCP non disponible");
                    }

                    const noteTitle = activeNotePath.split('\\').pop()?.replace('.md', '') || 'Note Obsidian';
                    
                    // Call the notebook_add_text tool to inject the note content
                    await AppBridge.mcp.callTool('notebooklm-mcp-server', 'notebook_add_text', {
                        notebook_id: notebookId,
                        text: activeNoteContent,
                        title: `[Obsidian] ${noteTitle}`
                    });

                    return true;
                } catch (err) {
                    console.error("[Obsidian Store] Sync failed", err);
                    set({ error: "Échec de la synchronisation vers l'Oracle" });
                    return false;
                }
            }
        }),
        {
            name: 'obsidian-storage',
            partialize: (state) => ({ vaultPath: state.vaultPath }),
        }
    )
);
