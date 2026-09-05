import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Le coffre Obsidian ne répond qu'aux tablettes de meneur.**
 *
 * Demandé par David le 2026-09-05. Deux règles s'y jouent, et la seconde est la
 * plus importante :
 *
 * 1. Le coffre **ne voyage pas dans la diffusion périodique** — plus de deux
 *    mille notes, deux diffusions par seconde. On demande, on répond.
 * 2. La réponse part **au rôle `'remote'` et à lui seul**. Le coffre est le
 *    carnet privé du meneur : le diffuser à tous le déposerait sur l'appareil de
 *    chaque joueur. *C'est la règle de `mainsPourLaTable` — un secret caviardé à
 *    l'affichage a déjà voyagé.*
 */

const fetchNotes = vi.fn(async () => {});
const selectNote = vi.fn(async () => {});
const etat = { notes: [{ name: 'Milo.md', path: 'PNJ/Milo.md', type: 'file' }], activeNoteContent: 'Le maire ment.' };

vi.mock('../../session/useObsidianStore', () => ({
    useObsidianStore: { getState: () => ({ ...etat, fetchNotes, selectNote }) },
}));

const { obsidianActions } = await import('./obsidianActions');

const diffuse = vi.fn();
const CONTEXTE = { activeCampaignId: 'c-1', sync: vi.fn() };

beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { appBridge: unknown }).appBridge = { remote: { broadcastUIAction: diffuse } };
});

describe('lister le coffre', () => {
    it('rafraîchit avant de répondre — servir un arbre périmé se découvre en cherchant une note qu’on vient d’écrire', async () => {
        await obsidianActions['remote:obsidian:lister']!(null, CONTEXTE);

        expect(fetchNotes).toHaveBeenCalledTimes(1);
        expect(diffuse).toHaveBeenCalledWith(
            { type: 'obsidian:arbre', payload: { notes: etat.notes } },
            'remote',
        );
    });

    it('RÉPOND AU SEUL RÔLE « remote » — le coffre est privé', async () => {
        await obsidianActions['remote:obsidian:lister']!(null, CONTEXTE);
        expect(diffuse.mock.calls[0][1]).toBe('remote');
    });

    it('répond quand même si le rafraîchissement échoue', async () => {
        fetchNotes.mockRejectedValueOnce(new Error('coffre injoignable'));

        await obsidianActions['remote:obsidian:lister']!(null, CONTEXTE);

        expect(diffuse).toHaveBeenCalledTimes(1);
    });
});

describe('lire une note', () => {
    it('renvoie le contenu, au seul rôle remote', async () => {
        await obsidianActions['remote:obsidian:lire']!({ chemin: 'PNJ/Milo.md' }, CONTEXTE);

        expect(selectNote).toHaveBeenCalledWith('PNJ/Milo.md');
        expect(diffuse).toHaveBeenCalledWith(
            { type: 'obsidian:note', payload: { chemin: 'PNJ/Milo.md', contenu: 'Le maire ment.' } },
            'remote',
        );
    });

    it('ne demande rien sans chemin', async () => {
        await obsidianActions['remote:obsidian:lire']!({}, CONTEXTE);
        expect(selectNote).not.toHaveBeenCalled();
        expect(diffuse).not.toHaveBeenCalled();
    });

    it('dit l’échec plutôt que de se taire', async () => {
        selectNote.mockRejectedValueOnce(new Error('illisible'));

        await obsidianActions['remote:obsidian:lire']!({ chemin: 'X.md' }, CONTEXTE);

        expect(diffuse).toHaveBeenCalledWith(
            { type: 'obsidian:note', payload: { chemin: 'X.md', contenu: null, erreur: 'Note illisible.' } },
            'remote',
        );
    });

    it('ne lève pas quand le pont est absent', async () => {
        (window as unknown as { appBridge: unknown }).appBridge = undefined;
        await expect(obsidianActions['remote:obsidian:lire']!({ chemin: 'X.md' }, CONTEXTE)).resolves.toBeUndefined();
    });
});
