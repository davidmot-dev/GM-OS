import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from './SessionManager';

// Mocks
// Des espions PARTAGÉS : `getState: () => ({ startJournal: vi.fn() })` en
// fabriquait un neuf à chaque appel, donc aucun test ne pouvait vérifier ce
// qu'on passe au journal.
const journal = vi.hoisted(() => ({
    stopJournal: vi.fn(),
    startJournal: vi.fn(),
    addEvent: vi.fn(),
    isRecording: false,
}));

vi.mock('../../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => journal },
}));

const cloture = vi.hoisted(() => vi.fn());
vi.mock('../../journal/clotureDeSeance', () => ({
    cloturerLeJournalDeLaSeance: cloture,
}));

vi.mock('../../../stores/useMediaStore', () => ({
    useMediaStore: {
        getState: () => ({
            removeCampaignReference: vi.fn(),
        }),
    },
}));

vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn(),
}));

describe('SessionManager', () => {
    let mockSet: any;
    let mockGet: any;

    beforeEach(() => {
        journal.startJournal.mockClear();
        journal.stopJournal.mockClear();
        journal.addEvent.mockClear();
        journal.isRecording = false;
        cloture.mockClear();
        mockSet = vi.fn();
        mockGet = vi.fn(() => ({
            campaigns: [{ id: 'c1', name: 'Campaign 1' }],
            sessions: [{ id: 's1', campaignId: 'c1', number: 1, publicSummary: 'Test', status: 'planned' }],
            entities: [{ id: 'e1', campaignId: 'c1' }],
            players: [],
            atlasMaps: [],
            wikiEntries: [],
            timelineEvents: [],
            clues: [],
            actes: [{ id: 'a1', campaignId: 'c1' }, { id: 'a2', campaignId: 'c2' }],
            scenes: [{ id: 'sc1', campaignId: 'c1' }, { id: 'sc2', campaignId: 'c2' }],
        }));
    });

    it('should set active campaign correctly', () => {
        SessionManager.setActiveCampaign(mockSet, mockGet, 'c1');
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            activeCampaignId: 'c1',
            currentView: 'cockpit'
        }));
    });

    it('should launch a session correctly', () => {
        SessionManager.launchSession(mockSet, mockGet, 's1');
        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            currentView: 'cockpit'
        }));
        
        // Check if session status was updated
        const callArgs = mockSet.mock.calls[0][0];
        expect(callArgs.sessions[0].status).toBe('active');
    });

    /**
     * **Règle de David du 2026-08-18 : changer de campagne n'arrête pas une
     * séance.** Ce chemin appelait `stopJournal()` dans ses deux branches —
     * consulter une autre campagne en pleine partie coupait l'enregistrement
     * pendant qu'on continuait de jouer.
     */
    describe('changer de campagne n\'arrete pas la seance en cours', () => {
        it('activer une campagne ne ferme pas le journal', () => {
            journal.isRecording = true;
            SessionManager.setActiveCampaign(mockSet, mockGet, 'c1');
            expect(journal.stopJournal).not.toHaveBeenCalled();
        });

        it('desactiver la campagne ne ferme pas le journal non plus', () => {
            journal.isRecording = true;
            SessionManager.setActiveCampaign(mockSet, mockGet, null);
            expect(journal.stopJournal).not.toHaveBeenCalled();
        });

        it('la seance en cours note le changement de campagne', () => {
            journal.isRecording = true;
            SessionManager.setActiveCampaign(mockSet, mockGet, 'c1');
            expect(journal.addEvent).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Campagne activée' }),
            );
        });

        /*
          Hors séance, `addEvent` laisse quand même passer les `SYSTEM` : sans
          garde, feuilleter ses campagnes ajoutait des lignes à un journal
          archivé des semaines plus tôt.
        */
        it('hors seance, feuilleter ses campagnes n\'ecrit nulle part', () => {
            journal.isRecording = false;
            SessionManager.setActiveCampaign(mockSet, mockGet, 'c1');
            expect(journal.addEvent).not.toHaveBeenCalled();
        });
    });

    /**
     * **Une seule séance à la fois — donc celle qui part clôt son journal.**
     * `launchSession` déclassait la séance sortante en `done` en réécrivant le
     * tableau en bloc, sans passer par `updateSession` qui est le seul endroit à
     * savoir clore un journal : le journal sortant restait ouvert pour toujours,
     * puis devenait orphelin quand `startJournal` prenait sa place.
     */
    describe('une seule seance a la fois', () => {
        const avecSeanceActive = (campaignId: string) => vi.fn(() => ({
            ...mockGet(),
            sessions: [
                { id: 's1', campaignId: 'c1', number: 1, publicSummary: 'Test', status: 'planned' },
                { id: 's0', campaignId, number: 0, status: 'active' },
            ],
        }));

        it('la seance sortante clot son journal avant que le suivant s\'ouvre', () => {
            SessionManager.launchSession(mockSet, avecSeanceActive('c2'), 's1');

            expect(cloture).toHaveBeenCalledWith('c2');
            expect(cloture.mock.invocationCallOrder[0])
                .toBeLessThan(journal.startJournal.mock.invocationCallOrder[0]);
        });

        it('sans seance sortante, il n\'y a rien a clore', () => {
            SessionManager.launchSession(mockSet, mockGet, 's1');
            expect(cloture).not.toHaveBeenCalled();
        });

        /* Relancer la séance déjà active est bien un journal sortant — celui de
           la même séance, que la recherche d'une « autre » active ne voit pas. */
        it('relancer la seance active clot son propre journal', () => {
            const dejaActive = vi.fn(() => ({
                ...mockGet(),
                sessions: [{ id: 's1', campaignId: 'c1', number: 1, status: 'active' }],
            }));

            SessionManager.launchSession(mockSet, dejaActive, 's1');
            expect(cloture).toHaveBeenCalledWith('c1');
        });
    });

    /**
     * **Le titre du journal se lit, donc il porte un nom.** On passait
     * `session.campaignId` : chaque séance s'archivait sous
     * « c-1187082150026-gtbgs — 18/08 21h59 », impossible à rattacher de tête à
     * sa campagne des mois plus tard.
     */
    it('le journal ouvre sur le NOM de la campagne, pas son identifiant', () => {
        SessionManager.launchSession(mockSet, mockGet, 's1');

        expect(journal.startJournal).toHaveBeenCalledWith(
            { id: 'c1', nom: 'Campaign 1' },
            'Session #1',
            expect.anything(),
        );
    });

    /** Une campagne disparue vaut mieux qu'un titre vide : l'identifiant reste en repli. */
    it('a defaut de campagne, le titre retombe sur l\'identifiant', () => {
        const base = mockGet();
        const sansCampagne = vi.fn(() => ({ ...base, campaigns: [] }));

        SessionManager.launchSession(mockSet, sansCampagne, 's1');

        expect(journal.startJournal).toHaveBeenCalledWith(
            { id: 'c1', nom: 'c1' },
            'Session #1',
            expect.anything(),
        );
    });

    it('should delete campaign and related data (cascade)', () => {
        SessionManager.deleteCampaign(mockSet, mockGet, 'c1');
        
        // We need to check the function passed to set
        const setUpdateFn = mockSet.mock.calls[0][0];
        const result = setUpdateFn(mockGet());
        
        expect(result.campaigns).toHaveLength(0);
        expect(result.entities).toHaveLength(0);
    });

    /**
     * **Le trou trouvé le 2026-08-15, en relisant après coup.** La trame est
     * arrivée le jour même et `deleteCampaign` n'a pas été mis à jour : actes et
     * scènes survivaient à leur campagne. Ils devenaient alors **invisibles**
     * — tous les écrans filtrent par campagne — et **irrécupérables**, puisque
     * plus aucune campagne ne les réclamait.
     *
     * Le test vérifie aussi que la campagne voisine est intacte : une cascade
     * trop large est le défaut symétrique, et bien pire.
     */
    it('la suppression emporte la trame de cette campagne, et d\'aucune autre', () => {
        SessionManager.deleteCampaign(mockSet, mockGet, 'c1');
        const result = mockSet.mock.calls[0][0](mockGet());

        expect(result.actes.map((a: { id: string }) => a.id)).toEqual(['a2']);
        expect(result.scenes.map((s: { id: string }) => s.id)).toEqual(['sc2']);
    });
});
