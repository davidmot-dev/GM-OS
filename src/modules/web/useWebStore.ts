import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WebLink, WebBridge } from './types';

interface WebState {
    links: WebLink[];
    addLink: (link: Omit<WebLink, 'id'>) => void;
    removeLink: (id: string) => void;
    updateLink: (id: string, updates: Partial<WebLink>) => void;
    setLinks: (links: WebLink[]) => void;
    openLink: (url: string) => void;
    exportLinks: () => Promise<void>;
    importLinks: () => Promise<void>;
    clearAll: () => void;
    applySnapshot: (snapshot: { links?: string[]; fullLinks?: WebLink[] }) => void;
    reset: () => void;
}

const appBridge = (window as unknown as { appBridge: { web: WebBridge } }).appBridge;

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
                if (appBridge?.web?.openExternal) {
                    appBridge.web.openExternal(url);
                } else {
                    window.open(url, '_blank');
                }
            },

            exportLinks: async () => {
                if (appBridge?.web?.saveList) {
                    await appBridge.web.saveList(get().links);
                }
            },

            importLinks: async () => {
                if (appBridge?.web?.loadList) {
                    const data = await appBridge.web.loadList();
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
