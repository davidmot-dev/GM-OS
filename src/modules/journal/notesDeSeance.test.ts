import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStore, type StoreApi } from 'zustand';
import { useJournalStore } from './useJournalStore';
import { cloturerLeJournalDeLaSeance } from './clotureDeSeance';
import { natureParDefaut } from './types';
import { createSessionSlice, type SessionSlice } from '../session/store/sessionSlice';
import type { GameSession } from '../session/store/types';

/**
 * **Les notes prises pendant la séance doivent atteindre le résumé.**
 *
 * Défaut signalé par David le 2026-08-18. `stopJournal` sait depuis toujours
 * quoi faire de `snapshot.notes` — il en fait un événement `NOTE`, donc de
 * nature `chronique`, donc la seule matière écrite de la main du meneur que
 * `generateAISummary` laisse passer. Mais **aucun appelant ne remplissait ce
 * champ** : `sessionNotes` restait sur la séance, lue par deux écrans et par
 * personne d'autre.
 */
describe('les notes de séance entrent dans le journal', () => {
    const journal = () => useJournalStore.getState();

    const poserLeMagasin = (sessionNotes?: string) => {
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
            getState: () => ({
                sessions: [{ id: 's1', campaignId: 'c1', status: 'active', sessionNotes }],
                players: [], entities: [], clues: [], actes: [], scenes: [],
            }),
        };
    };

    beforeEach(() => {
        journal().clearJournal();
        journal().startJournal({ id: 'c1', nom: 'Hadley Hope' }, 'Séance 1');
    });

    afterEach(() => {
        delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
    });

    it('la note du meneur devient un evenement de chronique', () => {
        poserLeMagasin('Milo avoue avoir menti sur le carnet.');

        cloturerLeJournalDeLaSeance('c1');

        const note = journal().journals[0].events
            .find(e => e.content.includes('Milo avoue avoir menti'));

        expect(note, 'la note doit atteindre le journal').toBeDefined();
        expect(note!.nature ?? natureParDefaut(note!.type)).toBe('chronique');
    });

    it('la note est conservee sur l\'etat de fin', () => {
        poserLeMagasin('Milo avoue avoir menti sur le carnet.');

        cloturerLeJournalDeLaSeance('c1');

        expect(journal().journals[0].etatDeFin?.notes)
            .toBe('Milo avoue avoir menti sur le carnet.');
    });

    /* Un titre suivi du vide se lit comme une perte de données. */
    it('une seance sans notes n\'ecrit pas de section vide', () => {
        poserLeMagasin('   ');

        cloturerLeJournalDeLaSeance('c1');

        expect(journal().journals[0].etatDeFin?.notes).toBeUndefined();
    });

    it('une seance qui n\'a jamais eu de notes se clot normalement', () => {
        poserLeMagasin(undefined);

        cloturerLeJournalDeLaSeance('c1');

        expect(journal().journals[0].etatDeFin).toBeDefined();
        expect(journal().journals[0].etatDeFin?.notes).toBeUndefined();
    });
});

/**
 * **Le chemin réel, celui du bouton « Terminer la séance ».**
 *
 * Les tests au-dessus appellent la clôture directement, sur un magasin où la
 * séance est `active` en dur. Ils passaient au vert pendant que la vraie séance
 * du 2026-08-19 perdait ses notes : `updateSession` commet `status: 'done'`
 * puis planifie la clôture en `queueMicrotask`, si bien qu'elle s'exécutait sur
 * une séance déjà `done` et n'en trouvait aucune.
 *
 * *Un test qui construit lui-même l'état que le code va lire ne teste pas le
 * chemin qui produit cet état.* Celui-ci part donc du slice.
 */
describe('terminer une seance emporte ses notes jusqu\'au journal', () => {
    const journal = () => useJournalStore.getState();

    const seance = (): GameSession => ({
        id: 's1', campaignId: 'c1', number: 2, date: '2026-08-19',
        status: 'active', publicSummary: '', gmSecrets: '',
        checklist: [{ id: 'k1', text: 'Fouiller le hangar', isCompleted: false }],
        sessionEntityIds: [],
        sessionNotes: 'Ripley se méfie de Burke.',
    });

    let store: StoreApi<SessionSlice>;

    beforeEach(() => {
        journal().clearJournal();
        journal().startJournal({ id: 'c1', nom: 'Hadley Hope' }, 'Session #2');

        store = createStore<SessionSlice>()((...a) => createSessionSlice(...a));
        store.setState({ sessions: [seance()] });
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = store;
    });

    afterEach(() => {
        delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
    });

    /* La microtâche de `updateSession` doit avoir tourné avant qu'on regarde. */
    const laisserLaMicrotacheTourner = () => Promise.resolve();

    it('la note ecrite pendant la partie atteint le journal', async () => {
        store.getState().updateSession('s1', { status: 'done' });
        await laisserLaMicrotacheTourner();

        const note = journal().journals[0].events
            .find(e => e.content?.includes('Ripley se méfie de Burke'));

        expect(note, 'la note doit atteindre le journal').toBeDefined();
        expect(note!.nature ?? natureParDefaut(note!.type)).toBe('chronique');
    });

    it('la checklist en suspens survit au declassement de la seance', async () => {
        store.getState().updateSession('s1', { status: 'done' });
        await laisserLaMicrotacheTourner();

        expect(journal().journals[0].etatDeFin?.pendingChecklist)
            .toEqual(['Fouiller le hangar']);
    });
});
