import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const abonnement = vi.hoisted(() => vi.fn<(cle: string, rappel: () => void) => () => void>(() => () => {}));
vi.mock('./idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: abonnement,
}));
vi.mock('../../../utils/windowRole', () => ({ isMainWindow: () => true }));
const { syncStorageAcrossWindows, SESSION_STORE_KEY } = await import('./PersistenceService');

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('la relecture entre fenêtres respecte la synchronisation atomique', () => {
    it.each([true, false, undefined])('état de synchronisation %s', synchronisation => {
        // Le magasin global simulé suffit : aucune ouverture de campagne ou
        // écriture de stockage ; la vraie garde de PersistenceService est appelée.
        vi.stubGlobal('window', synchronisation === undefined ? {} : {
            useSessionOSStore: { getState: () => ({ isSystemSyncing: synchronisation }) },
        });
        const relire = vi.fn(async () => {});
        syncStorageAcrossWindows(relire);
        expect(abonnement).toHaveBeenCalledWith(SESSION_STORE_KEY, expect.any(Function));
        abonnement.mock.calls[0][1]();
        expect(relire).toHaveBeenCalledTimes(synchronisation === true ? 0 : 1);
    });
});
