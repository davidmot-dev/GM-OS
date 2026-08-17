import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJournalStore } from './useJournalStore';

/**
 * Ce que ces tests protègent : **le résumé de séance ne se raconte plus
 * lui-même, et une panne ressemble à une panne**.
 *
 * Deux défauts signalés le 2026-08-08 (§ 4.2 du plan de trame narrative) et
 * restés ouverts neuf jours :
 *
 * 1. `summarizeSession` ne gérait que Gemini et RENDAIT « Résumé non disponible
 *    pour ce fournisseur d'IA. » — comme un succès. David est sur Ollama : il
 *    n'a jamais obtenu autre chose que cette phrase, enregistrée sous le titre
 *    « Résumé IA », et `syncToNotebook` l'aurait poussée dans son carnet.
 * 2. Le résumé était stocké comme un ÉVÉNEMENT du journal, et
 *    `summarizeSession` prend `journal.events` en entrée : **régénérer
 *    réinjectait le résumé précédent**, à chaque passe.
 */
const journalNeuf = () => {
    useJournalStore.setState({ journals: [], activeJournalId: null, isRecording: false });
    useJournalStore.getState().startJournal('Campagne', 'Séance 1');
    return useJournalStore.getState().activeJournalId!;
};

describe('le résumé est un artefact, pas un événement', () => {
    beforeEach(() => { vi.restoreAllMocks(); });

    it('se range sur le journal et n\'entre pas dans le fil', async () => {
        const id = journalNeuf();
        const avant = useJournalStore.getState().journals.find(j => j.id === id)!.events.length;

        vi.doMock('../ai/AIService', () => ({
            aiService: { summarizeSession: async () => 'Le groupe a fui par les docks.' },
        }));
        await useJournalStore.getState().generateAISummary(id);

        const journal = useJournalStore.getState().journals.find(j => j.id === id)!;
        expect(journal.resumeIA).toBe('Le groupe a fui par les docks.');
        expect(typeof journal.resumeGenereLe).toBe('number');
        expect(journal.events.length, 'aucun événement ajouté par un succès').toBe(avant);
    });

    it('régénérer ne réinjecte jamais le résumé précédent', async () => {
        // La contamination récursive venait de là : le résumé vivait dans
        // `events`, et c'est `events` qu'on renvoie au modèle.
        const id = journalNeuf();
        vi.doMock('../ai/AIService', () => ({
            aiService: { summarizeSession: async () => 'Premier résumé.' },
        }));
        await useJournalStore.getState().generateAISummary(id);
        await useJournalStore.getState().generateAISummary(id);

        const journal = useJournalStore.getState().journals.find(j => j.id === id)!;
        // i18next n'est pas initialise ici : le contenu des evenements de
        // demarrage peut etre indefini. On s'en protege — ce test porte sur le
        // resume, pas sur la traduction.
        const contamines = journal.events.filter(e => (e.content ?? '').includes('Premier résumé'));
        expect(contamines, 'le résumé ne doit apparaître dans aucun événement').toEqual([]);
    });

    it('une panne s\'écrit dans le fil, et ne prend pas la place du résumé', async () => {
        const id = journalNeuf();
        vi.doMock('../ai/AIService', () => ({
            aiService: {
                summarizeSession: async () => { throw new Error('Ollama injoignable'); },
            },
        }));
        await useJournalStore.getState().generateAISummary(id);

        const journal = useJournalStore.getState().journals.find(j => j.id === id)!;
        expect(journal.resumeIA, 'surtout pas une phrase d\'excuse').toBeUndefined();
        expect(journal.events.some(e => (e.content ?? '').includes('Ollama injoignable'))).toBe(true);
    });
});

describe('l\'envoi au carnet ne dépend plus d\'un titre traduit', () => {
    it('refuse quand aucun résumé n\'a été produit', async () => {
        // Avant, la recherche se faisait par `e.title === t('…ai_summary')` :
        // générer en français puis passer l'interface en anglais cassait le
        // lien, et l'envoi échouait alors que le résumé était là.
        const id = journalNeuf();
        await expect(useJournalStore.getState().syncToNotebook(id)).rejects.toThrow();
    });
});
