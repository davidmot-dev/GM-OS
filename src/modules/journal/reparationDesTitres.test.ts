import { describe, it, expect, beforeEach } from 'vitest';
import { useJournalStore } from './useJournalStore';

/**
 * La réparation vue depuis le store, pas seulement depuis sa fonction pure.
 *
 * Ce que ces tests protègent : elle tourne **à chaque ouverture de l'écran**, et
 * une réparation qui écrit alors qu'elle n'a rien réparé coûte un rendu et une
 * écriture dans le stockage persisté à chaque fois.
 */
describe('reparerLesTitresDeCampagne', () => {
    beforeEach(() => {
        useJournalStore.getState().clearJournal();
    });

    it('reecrit un titre archive avec le nom de sa campagne', () => {
        useJournalStore.getState().addJournal('c-1187082150026-gtbgs - 18/08 21:59 (Session #1)');

        useJournalStore.getState().reparerLesTitresDeCampagne([
            { id: 'c-1187082150026-gtbgs', name: 'Hadley Hope' },
        ]);

        expect(useJournalStore.getState().journals[0].title)
            .toBe('Hadley Hope - 18/08 21:59 (Session #1)');
    });

    it('ne touche pas a l\'etat quand il n\'y a rien a reparer', () => {
        useJournalStore.getState().addJournal('Hadley Hope - 18/08 21:59');
        const avant = useJournalStore.getState().journals;

        useJournalStore.getState().reparerLesTitresDeCampagne([
            { id: 'c-1187082150026-gtbgs', name: 'Hadley Hope' },
        ]);

        expect(useJournalStore.getState().journals).toBe(avant);
    });

    /* L'écran la rappelle à chaque montage : deux passes doivent valoir une. */
    it('est idempotente', () => {
        useJournalStore.getState().addJournal('c-2 - 16/08 20:00 (Session #3)');
        const campagnes = [{ id: 'c-2', name: 'Le secret de Milo' }];

        useJournalStore.getState().reparerLesTitresDeCampagne(campagnes);
        const apresUnePasse = useJournalStore.getState().journals;
        useJournalStore.getState().reparerLesTitresDeCampagne(campagnes);

        expect(useJournalStore.getState().journals).toBe(apresUnePasse);
        expect(apresUnePasse[0].title).toBe('Le secret de Milo - 16/08 20:00 (Session #3)');
    });

    it('laisse le journal d\'une campagne supprimee tel quel', () => {
        useJournalStore.getState().addJournal('c-disparue - 18/08 21:59');

        useJournalStore.getState().reparerLesTitresDeCampagne([{ id: 'c-2', name: 'Milo' }]);

        expect(useJournalStore.getState().journals[0].title).toBe('c-disparue - 18/08 21:59');
    });
});
