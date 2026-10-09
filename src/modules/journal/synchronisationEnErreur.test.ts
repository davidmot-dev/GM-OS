import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useJournalStore } from './useJournalStore';

vi.mock('../session/useSessionOSStore', () => ({
    useSessionOSStore: { getState: () => ({
        activeCampaignId: 'camp-test', campaigns: [{ id: 'camp-test', notebookUrl: 'https://exemple.test/notebook/carnet-test' }],
    }) },
}));

const pontInitial = window.appBridge;
const appeler = vi.fn();
let idJournal: string;
beforeEach(() => {
    appeler.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('appBridge', { ...pontInitial, mcp: { callTool: appeler } });
    useJournalStore.setState({ journals: [], activeJournalId: null, isRecording: false });
    useJournalStore.getState().startJournal({ id: 'camp-test', nom: 'Campagne artificielle' }, 'Séance artificielle');
    idJournal = useJournalStore.getState().activeJournalId!;
    useJournalStore.setState(state => ({ journals: state.journals.map(j => ({ ...j, resumeIA: 'Un récit artificiel.' })) }));
});
afterEach(() => vi.stubGlobal('appBridge', pontInitial));

describe('le magasin transmet l’exception de synchronisation intacte', () => {
    it.each([new Error('échec du pont'), { message: 'exception structurée', code: 42 }, null])(
        'préserve l’identité et le journal pour %j', async exception => {
            appeler.mockRejectedValueOnce(exception).mockResolvedValueOnce({});
            const avant = useJournalStore.getState().journals;
            await expect(useJournalStore.getState().syncToNotebook(idJournal)).rejects.toBe(exception);
            expect(useJournalStore.getState().journals).toBe(avant);
            await expect(useJournalStore.getState().syncToNotebook(idJournal)).resolves.toBeUndefined();
            expect(appeler).toHaveBeenLastCalledWith('notebooklm-mcp-server', 'source_add', expect.objectContaining({
                notebook_id: 'carnet-test', source_type: 'text',
            }));
        },
    );
});
