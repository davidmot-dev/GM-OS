import { afterEach, describe, expect, it, vi } from 'vitest';
import { cloturerLeJournalDeLaSeance } from './clotureDeSeance';
import { CLE_PANIQUE_ALIEN } from '../dice/systemes/paniqueAlien';
const toast = vi.hoisted(() => vi.fn());
vi.mock('../../stores/useToastStore', () => ({ gmToast: toast }));
vi.mock('./useJournalStore', () => ({ useJournalStore: { getState: () => ({ isRecording: false }) } }));
afterEach(() => { vi.unstubAllGlobals(); toast.mockClear(); });
describe('A1 : rappeler les traumatismes à la clôture, sans lancer de dés', () => {
    it('rappelle le test même si le journal n’enregistrait pas et conserve la demande', () => {
        const personnage = { name: 'Ripley', campaignId: 'alien', sheetData: { [CLE_PANIQUE_ALIEN]: { traumaEnAttente: true } } };
        vi.stubGlobal('window', { useSessionOSStore: { getState: () => ({ players: [{ characters: [personnage] }] }) } });
        cloturerLeJournalDeLaSeance('alien');
        expect(toast).toHaveBeenCalledWith(expect.stringContaining('Ripley'), 'warning');
        expect(personnage.sheetData[CLE_PANIQUE_ALIEN].traumaEnAttente).toBe(true);
    });
    it('ne rappelle ni les autres campagnes ni les bilans déjà traités', () => {
        vi.stubGlobal('window', { useSessionOSStore: { getState: () => ({ players: [{ characters: [
            { name: 'Autre', campaignId: 'autre', sheetData: { [CLE_PANIQUE_ALIEN]: { traumaEnAttente: true } } },
            { name: 'Calme', campaignId: 'alien', sheetData: { [CLE_PANIQUE_ALIEN]: { traumaEnAttente: false } } },
        ] }] }) } });
        cloturerLeJournalDeLaSeance('alien');
        expect(toast).not.toHaveBeenCalled();
    });
});
