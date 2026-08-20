import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useJournalStore } from './useJournalStore';

/**
 * **Ce que ces tests protègent : une séance close est un compte rendu, pas un
 * cahier.**
 *
 * `isRecording` ne suffisait pas — les `NOTE` et les `SYSTEM` le contournent
 * délibérément, pour que le meneur puisse écrire hors enregistrement. Mais rien
 * ne regardait le journal VISÉ, et `activeJournalId` désigne aussi bien celui
 * qu'on enregistre que celui qu'on a sélectionné pour le relire : ouvrir une
 * séance archivée suffisait à ce que le prochain événement automatique s'y
 * ajoute, après son `endTimestamp` et après que son état de fin a été calculé.
 */

const journal = () => useJournalStore.getState();
const evenements = (id: string) => journal().journals.find(j => j.id === id)?.events ?? [];

beforeEach(() => {
    journal().clearJournal();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

/** Une séance jouée puis terminée, comme après « Terminer la séance ». */
const uneSeanceClose = () => {
    journal().startJournal({ id: 'c-1', nom: 'Hadley Hope' }, 'Séance 1');
    const id = journal().activeJournalId!;
    journal().stopJournal();
    return id;
};

describe('un journal clos', () => {
    it('refuse un événement automatique', () => {
        const id = uneSeanceClose();
        const avant = evenements(id).length;

        journal().addEvent({ type: 'SYSTEM', title: 'Ambiance lancée', content: 'x' });

        expect(evenements(id)).toHaveLength(avant);
    });

    it('refuse aussi une note, qui contourne pourtant l\'enregistrement', () => {
        // C'est le chemin exact du défaut : `NOTE` et `SYSTEM` traversent la
        // garde `isRecording`, et c'était la seule qu'il y avait.
        const id = uneSeanceClose();
        const avant = evenements(id).length;

        journal().addEvent({ type: 'NOTE', title: 'Indice révélé', content: 'x' });

        expect(evenements(id)).toHaveLength(avant);
    });

    it('ne se tait pas en silence', () => {
        // Un événement perdu sans un mot est ce qu'on reproche au reste du
        // module : la console doit dire ce qui a été refusé, et par quelle
        // séance.
        uneSeanceClose();
        journal().addEvent({ type: 'SYSTEM', title: 'Ambiance lancée', content: 'x' });

        expect(console.warn).toHaveBeenCalledOnce();
        expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('Ambiance lancée');
    });

    it('n\'empêche pas la séance en cours de recevoir quoi que ce soit', () => {
        // La garde ne doit pas se payer sur le cas courant.
        journal().startJournal({ id: 'c-1', nom: 'Hadley Hope' }, 'Séance 1');
        const id = journal().activeJournalId!;
        const avant = evenements(id).length;

        journal().addEvent({ type: 'COMBAT', title: 'Combat : Initiative', content: 'x' });
        journal().addEvent({ type: 'NOTE', title: 'Une note', content: 'x' });

        expect(evenements(id)).toHaveLength(avant + 2);
    });

    it('laisse la clôture écrire ses propres événements', () => {
        // `stopJournal` ajoute l'état de fin AVANT de poser `endTimestamp` :
        // la garde ne doit pas fermer la porte sur le geste qui la ferme.
        journal().startJournal({ id: 'c-1', nom: 'Hadley Hope' }, 'Séance 1');
        const id = journal().activeJournalId!;
        journal().stopJournal();

        const clos = journal().journals.find(j => j.id === id)!;
        expect(clos.endTimestamp).toBeDefined();
        expect(clos.events.length).toBeGreaterThan(0);
    });
});
