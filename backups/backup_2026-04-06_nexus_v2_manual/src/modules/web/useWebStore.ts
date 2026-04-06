import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WebLink, WebBridge } from './types';

/**
 * Interface d'état globale pour le Web-OS (Marque-pages).
 */
export interface WebState {
    /** Liste des liens configurés */
    links: WebLink[];
    /** Ajoute un nouveau lien avec un ID généré */
    addLink: (link: Omit<WebLink, 'id'>) => void;
    /** Supprime un lien par son ID */
    removeLink: (id: string) => void;
    /** Met à jour les propriétés d'un lien existant */
    updateLink: (id: string, updates: Partial<WebLink>) => void;
    /** Remplace la liste complète des liens */
    setLinks: (links: WebLink[]) => void;
    /** Ouvre le lien via le moteur approprié (Bridge ou Browser) */
    openLink: (url: string) => void;
    /** Exclut les liens vers un fichier via le Bridge */
    exportLinks: () => Promise<void>;
    /** Importe des liens depuis un fichier externe */
    importLinks: () => Promise<void>;
    /** Vide tous les marque-pages après confirmation */
    clearAll: () => void;
    /** Applique un snapshot de session (format URLs simples ou objets complets) */
    applySnapshot: (snapshot: { links?: string[]; fullLinks?: WebLink[] }) => void;
    /** Réinitialise aux liens de base */
    reset: () => void;
}

const getBridge = () => (window as unknown as { appBridge?: { web: WebBridge } }).appBridge?.web;

export const useWebStore = create<WebState>()(
    persist(
        (set, get) => ({
            links: [
                { id: '1', name: 'SRD Rules', url: 'https://5thsrd.org/', color: 'orange' },
                { id: '2', name: 'NPC Generator', url: 'https://www.fantasynamegenerators.com/', color: 'cyan' },
            ],

            addLink: (linkData) => {
                const newLink: WebLink = {
                    ...linkData,
                    id: crypto.randomUUID(),
                };
                set((state) => ({ links: [...state.links, newLink] }));
            },

            removeLink: (id) => {
                set((state) => ({ links: state.links.filter((l) => l.id !== id) }));
            },

            updateLink: (id, updates) => {
                set((state) => ({
                    links: state.links.map((l) => (l.id === id ? { ...l, ...updates } : l)),
                }));
            },

            setLinks: (links) => set({ links }),

            openLink: (url) => {
                const bridge = getBridge();
                if (bridge?.openExternal) {
                    bridge.openExternal(url);
                } else {
                    window.open(url, '_blank');
                }
            },

            exportLinks: async () => {
                const bridge = getBridge();
                if (bridge?.saveList) {
                    await bridge.saveList(get().links);
                }
            },

            importLinks: async () => {
                const bridge = getBridge();
                if (bridge?.loadList) {
                    const data = await bridge.loadList();
                    if (data) {
                        set({ links: data });
                    }
                }
            },

            clearAll: () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer tous les marque-pages ?')) {
                    set({ links: [] });
                }
            },

            applySnapshot: (snapshot) => {
                if (!snapshot) return;

                // 1. Prefer full links if available (new format)
                if (snapshot.fullLinks) {
                    set({ links: snapshot.fullLinks });
                } 
                // 2. Fallback to old URL-only format
                else if (snapshot.links) {
                    // Match existing links or create new ones for provided URLs
                    const currentLinks = get().links;
                    const newLinks = snapshot.links.map(url => {
                        const existing = currentLinks.find(l => l.url === url);
                        if (existing) return existing;
                        return {
                            id: crypto.randomUUID(),
                            name: url.split('/').pop() || 'New Link',
                            url,
                            color: 'gray'
                        } as WebLink;
                    });
                    set({ links: newLinks });
                }
            },

            reset: () => {
                set({
                    links: [
                        { id: '1', name: 'SRD Rules', url: 'https://5thsrd.org/', color: 'orange' },
                        { id: '2', name: 'NPC Generator', url: 'https://www.fantasynamegenerators.com/', color: 'cyan' },
                    ]
                });
            }
        }),
        {
            name: 'gmos-web-storage',
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useWebStore: typeof useWebStore }).useWebStore = useWebStore;
}
