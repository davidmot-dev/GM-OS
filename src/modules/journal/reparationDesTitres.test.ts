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

    /*
      Le titre correspondait à la campagne du fixture : depuis que la même passe
      rattache aussi le journal à sa campagne, il y avait quelque chose à faire.
      L'invariant protégé reste le même — aucune écriture quand rien ne change —
      et il se teste avec un journal qui ne correspond à personne.
    */
    it('ne touche pas a l\'etat quand il n\'y a rien a faire', () => {
        useJournalStore.getState().addJournal('Hadley Hope - 18/08 21:59');
        const avant = useJournalStore.getState().journals;

        useJournalStore.getState().reparerLesTitresDeCampagne([
            { id: 'c-2', name: 'Le secret de Milo' },
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

/**
 * **Les journaux archivés retrouvent leur campagne.**
 *
 * Depuis le 2026-08-19 un journal neuf porte `campaignId`. Les anciens n'ont que
 * leur titre — et sans campagne, le résumé par IA ne peut pas savoir à quel jeu
 * il joue : c'est ce qui a valu à la séance du 19/08 d'être intitulée
 * « Chroniques des Terres Oubliées » alors qu'elle se jouait sur Alien.
 */
describe('rattachement des journaux a leur campagne', () => {
    const journaux = () => useJournalStore.getState().journals;

    beforeEach(() => {
        useJournalStore.getState().clearJournal();
    });

    const hadley = { id: 'c-1187082150026-gtbgs', name: 'Hadley Hope' };

    it('rattache un titre ecrit avec l\'identifiant', () => {
        useJournalStore.getState().addJournal('c-1187082150026-gtbgs - 18/08 21:59 (Session #1)');

        useJournalStore.getState().reparerLesTitresDeCampagne([hadley]);

        expect(journaux()[0].campaignId).toBe(hadley.id);
        expect(journaux()[0].title, 'et le titre est repare dans la meme passe')
            .toBe('Hadley Hope - 18/08 21:59 (Session #1)');
    });

    it('rattache aussi un titre deja ecrit avec le nom', () => {
        useJournalStore.getState().addJournal('Hadley Hope - 19/08 18:37 (Session #2)');

        useJournalStore.getState().reparerLesTitresDeCampagne([hadley]);

        expect(journaux()[0].campaignId).toBe(hadley.id);
    });

    /**
     * *On ne devine rien.* Un journal rattaché à la mauvaise campagne enverrait
     * le mauvais système de jeu au modèle — pire qu'un journal sans campagne.
     */
    it('ne tranche pas entre deux campagnes homonymes', () => {
        useJournalStore.getState().addJournal('Hadley Hope - 19/08 18:37');

        useJournalStore.getState().reparerLesTitresDeCampagne([
            { id: 'c-a', name: 'Hadley Hope' },
            { id: 'c-b', name: 'Hadley Hope' },
        ]);

        expect(journaux()[0].campaignId).toBeUndefined();
    });

    /* Une campagne dont le nom n'est qu'un préfixe ne s'accroche pas : le
       séparateur fait le travail. */
    it('un nom qui n\'est qu\'un prefixe ne rattache pas', () => {
        useJournalStore.getState().addJournal('Hadley Hope - 19/08 18:37');

        useJournalStore.getState().reparerLesTitresDeCampagne([{ id: 'c-a', name: 'Hadley' }]);

        expect(journaux()[0].campaignId).toBeUndefined();
    });

    /* La donnée sûre l'emporte sur la donnée devinée. */
    it('ne rejuge pas un journal deja rattache', () => {
        useJournalStore.getState().addJournal('Hadley Hope - 19/08 18:37');
        useJournalStore.setState(s => ({
            journals: s.journals.map(j => ({ ...j, campaignId: 'c-pose-a-l-ouverture' })),
        }));

        useJournalStore.getState().reparerLesTitresDeCampagne([hadley]);

        expect(journaux()[0].campaignId).toBe('c-pose-a-l-ouverture');
    });

    it('un journal neuf porte sa campagne des l\'ouverture', () => {
        useJournalStore.getState().startJournal({ id: 'c-9', nom: 'Hadley Hope' }, 'Session #3');

        expect(journaux()[0].campaignId).toBe('c-9');
        expect(journaux()[0].title).toContain('Hadley Hope - ');
    });

    /* Un journal ouvert à la main n'appartient à aucune campagne. */
    it('sans identifiant, aucun rattachement n\'est invente', () => {
        useJournalStore.getState().startJournal({ nom: 'Bac à sable' });

        expect(journaux()[0].campaignId).toBeUndefined();
    });
});
