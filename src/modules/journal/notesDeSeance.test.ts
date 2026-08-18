import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useJournalStore } from './useJournalStore';
import { cloturerLeJournalDeLaSeance } from './clotureDeSeance';
import { natureParDefaut } from './types';

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
        journal().startJournal('Hadley Hope', 'Séance 1');
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
