import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

    /**
     * Le coffre est-il indexé par l'Oracle, **en plus** de `docs/` ?
     *
     * **Faux par défaut, et c'est la leçon du 2026-08-22.** Ce jour-là le coffre
     * remplaçait la racine documentaire de l'Oracle, et le désastre a été
     * silencieux **parce que `vaultPath` était renseigné en dur** : personne
     * n'avait rien demandé, et pourtant tout `docs/` sortait de l'index.
     *
     * Le chemin ci-dessus garde donc sa valeur par défaut — il sert au panneau
     * Nexus Wiki et aux exports — mais il ne franchit jamais la porte de
     * l'Oracle tant que ce drapeau n'a pas été posé **à la main**.
     */
    indexerDansLOracle: boolean;
    /** Le verdict du dernier branchement, pour que l'écran dise ce qui s'est passé. */
    coffreDeLOracle: { fichiers: number; raison?: string } | null;

    // Actions
    setVaultPath: (path: string) => void;
    browseVaultPath: () => Promise<void>;
    fetchNotes: () => Promise<void>;
    selectNote: (path: string) => Promise<void>;
    syncActiveNoteToOracle: (notebookId: string) => Promise<boolean>;
    /** Allume ou éteint la deuxième racine de l'Oracle. */
    brancherLeCoffreDeLOracle: (actif: boolean) => Promise<void>;
    /** Rebranche le coffre au démarrage — le moteur repart vierge à chaque lancement. */
    appliquerLeCoffreAuDemarrage: () => Promise<void>;
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
            indexerDansLOracle: false,
            coffreDeLOracle: null,

            setVaultPath: (path) => set({ vaultPath: path }),

            browseVaultPath: async () => {
                try {
                    if (!window.appBridge?.obsidian?.selectVault) {
                        throw new Error("Sélecteur de dossier non disponible");
                    }
                    const selectedPath = await window.appBridge.obsidian.selectVault();
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
                    if (!window.appBridge?.obsidian?.listNotes) {
                        throw new Error("Obsidian Bridge non disponible");
                    }
                    const notes = await window.appBridge.obsidian.listNotes(vaultPath);
                    set({ notes, isLoading: false });
                } catch (err) {
                    set({ error: (err as Error).message, isLoading: false });
                }
            },

            selectNote: async (relativePath) => {
                const { vaultPath } = get();
                set({ isLoading: true, error: null, activeNotePath: relativePath });
                try {
                    if (!window.appBridge?.obsidian?.readNote) {
                        throw new Error("Obsidian Bridge non disponible");
                    }
                    const content = await window.appBridge.obsidian.readNote(relativePath, vaultPath);
                    set({ activeNoteContent: content, isLoading: false });
                } catch (err) {
                    set({ error: (err as Error).message, isLoading: false });
                }
            },

            syncActiveNoteToOracle: async (notebookId) => {
                const { activeNoteContent, activeNotePath } = get();
                if (!activeNoteContent || !activeNotePath) return false;

                try {
                    if (!window.appBridge?.mcp?.callTool) {
                        throw new Error("Bridge MCP non disponible");
                    }

                    const noteTitle = activeNotePath.split('\\').pop()?.replace('.md', '') || 'Note Obsidian';
                    
                    // `source_add` remplace `notebook_add_text` depuis la bascule
                    // vers le client Gemini Notebook, et demande le type de source.
                    await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'source_add', {
                        notebook_id: notebookId,
                        source_type: 'text',
                        text: activeNoteContent,
                        title: `[Obsidian] ${noteTitle}`
                    });

                    return true;
                } catch (err) {
                    console.error("[Obsidian Store] Sync failed", err);
                    set({ error: "Échec de la synchronisation vers l'Oracle" });
                    return false;
                }
            },

            brancherLeCoffreDeLOracle: async (actif) => {
                const brancher = window.appBridge?.ai?.coffreBrancher;
                if (!brancher) {
                    set({ coffreDeLOracle: { fichiers: 0, raison: "Disponible seulement dans l'application de bureau." } });
                    return;
                }

                const { vaultPath } = get();
                const verdict = await brancher(actif ? vaultPath : null);

                if (!verdict.accepte) {
                    // **On n'allume pas le drapeau sur un refus.** Sinon le
                    // prochain démarrage rejouerait le même refus, et l'écran
                    // afficherait « actif » pour un coffre que l'Oracle ne lit
                    // pas — l'exact mensonge d'août.
                    set({ indexerDansLOracle: false, coffreDeLOracle: { fichiers: 0, raison: verdict.raison } });
                    return;
                }

                const etat = await window.appBridge?.ai?.coffreEtat?.();
                set({ indexerDansLOracle: actif, coffreDeLOracle: { fichiers: etat?.fichiers ?? 0 } });
            },

            /**
             * L'index du moteur vit en mémoire : il repart vide à chaque
             * lancement. Sans ce rappel, le coffre serait branché *une fois*, et
             * muet tous les jours suivants — **avec l'écran qui continue de dire
             * « actif »**, parce que la préférence, elle, est persistée.
             */
            appliquerLeCoffreAuDemarrage: async () => {
                if (!get().indexerDansLOracle) return;
                await get().brancherLeCoffreDeLOracle(true);
            },
        }),
        {
            name: 'obsidian-storage',
            partialize: (state) => ({
                vaultPath: state.vaultPath,
                indexerDansLOracle: state.indexerDansLOracle,
            }),
        }
    )
);
