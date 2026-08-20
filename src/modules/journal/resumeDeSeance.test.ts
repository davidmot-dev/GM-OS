import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJournalStore } from './useJournalStore';
import { natureParDefaut } from './types';

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
    useJournalStore.getState().startJournal({ nom: 'Campagne' }, 'Séance 1');
    return useJournalStore.getState().activeJournalId!;
};

/**
 * Un journal qui porte du RÉCIT.
 *
 * `startJournal` n'émet que des événements `SYSTEM`, donc des traces : depuis
 * que le résumé ne reçoit que la chronique, un tel journal n'a rien à raconter
 * et le modèle n'est même pas appelé. C'est le comportement voulu — les tests du
 * résumé doivent donc fournir de la matière.
 */
const journalAvecRecit = () => {
    const id = journalNeuf();
    useJournalStore.getState().addEvent({
        type: 'NOTE', title: 'La cave', content: 'Ils ont trouvé le carnet.',
    });
    return id;
};

describe('le résumé est un artefact, pas un événement', () => {
    beforeEach(() => { vi.restoreAllMocks(); });

    it('se range sur le journal et n\'entre pas dans le fil', async () => {
        const id = journalAvecRecit();
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
        const id = journalAvecRecit();
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
        const id = journalAvecRecit();
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

describe('l\'axe trace / chronique', () => {
    /**
     * § 4.3 du plan du 2026-08-08. Le journal sert deux usages : pendant la
     * partie c'est un fil qu'on regarde, et « initiative tirée » confirme que
     * l'action est passée ; après, c'est la matière de la chronique et la même
     * ligne est du bruit. **Donc ne pas supprimer : distinguer.**
     */
    it('déduit la nature du type, et n\'oblige pas trente émetteurs à la dire', () => {
        expect(natureParDefaut('AUDIO')).toBe('trace');
        expect(natureParDefaut('SYSTEM')).toBe('trace');
        // Le cas courant du combat est le tirage d'initiative ; ses exceptions
        // narratives se déclarent une par une.
        expect(natureParDefaut('COMBAT')).toBe('trace');
        expect(natureParDefaut('NPC')).toBe('chronique');
        expect(natureParDefaut('LOCATION')).toBe('chronique');
        // Un décès de PJ doit atteindre le résumé : c'est l'événement qu'une
        // table raconte le plus longtemps.
        expect(natureParDefaut('PJ')).toBe('chronique');
        expect(natureParDefaut('NOTE')).toBe('chronique');
    });

    it('l\'émetteur qui la déclare l\'emporte sur le défaut', () => {
        const id = journalNeuf();
        useJournalStore.getState().addEvent({
            type: 'COMBAT', nature: 'chronique',
            title: 'Combat : la cave', content: 'Deux morts, la porte cède.',
        });
        const evenement = useJournalStore.getState().journals
            .find(j => j.id === id)!.events.find(e => e.title === 'Combat : la cave')!;
        expect(evenement.nature).toBe('chronique');
    });

    it('un événement enregistré porte toujours une nature', () => {
        const id = journalNeuf();
        useJournalStore.getState().addEvent({ type: 'COMBAT', title: 'Initiative', content: '6 combattants.' });
        const evenements = useJournalStore.getState().journals.find(j => j.id === id)!.events;
        expect(evenements.every(e => e.nature === 'trace' || e.nature === 'chronique')).toBe(true);
    });

    it('une séance sans récit ne paie pas d\'appel au modèle', async () => {
        const id = journalNeuf();
        useJournalStore.getState().addEvent({ type: 'COMBAT', title: 'Initiative', content: '6 combattants.' });

        let appele = false;
        vi.doMock('../ai/AIService', () => ({
            aiService: { summarizeSession: async () => { appele = true; return 'x'; } },
        }));
        await useJournalStore.getState().generateAISummary(id);

        expect(appele, 'rien à raconter n\'est pas une panne, mais ne se demande pas au modèle').toBe(false);
        expect(useJournalStore.getState().journals.find(j => j.id === id)!.resumeIA).toBeUndefined();
    });
});

/**
 * **Le modèle doit savoir à quel jeu il joue.**
 *
 * L'invite ne portait que le fil et la note finale. Faute de cadre, le résumé de
 * la séance du 2026-08-19 — Alien, à Hadley Hope — s'intitulait « Chroniques des
 * Terres Oubliées » et racontait de l'heroic-fantasy. *Un modèle à qui l'on ne
 * donne pas le cadre n'en fait pas l'économie : il en invente un.*
 */
describe('le résumé reçoit le cadre de la partie', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
            getState: () => ({
                campaigns: [{
                    id: 'c-1', name: 'Hadley Hope', system: 'alien',
                    synopsis: 'Une colonie coupée du monde.',
                }],
            }),
        };
    });

    const journalDeHadley = () => {
        useJournalStore.setState({ journals: [], activeJournalId: null, isRecording: false });
        useJournalStore.getState().startJournal({ id: 'c-1', nom: 'Hadley Hope' }, 'Session #2');
        const id = useJournalStore.getState().activeJournalId!;
        useJournalStore.getState().addEvent({
            type: 'NOTE', title: 'La cave', content: 'Ils ont trouvé le carnet.',
        });
        return id;
    };

    it('transmet le jeu, la campagne et le pitch au service', async () => {
        const id = journalDeHadley();

        let contexte: unknown;
        vi.doMock('../ai/AIService', () => ({
            aiService: {
                summarizeSession: async (_e: unknown, _n: unknown, c: unknown) => { contexte = c; return 'ok'; },
            },
        }));
        await useJournalStore.getState().generateAISummary(id);

        expect(contexte).toMatchObject({
            campagne: 'Hadley Hope',
            systeme: 'alien',
            synopsis: 'Une colonie coupée du monde.',
        });
    });

    /* Les personnages de CE soir-là, lus sur l'état de fin conservé. */
    it('nomme les personnages presents en fin de seance', async () => {
        const id = journalDeHadley();
        useJournalStore.setState(s => ({
            journals: s.journals.map(j => j.id === id
                ? { ...j, etatDeFin: { presentPCs: [{ name: 'JC Alien', state: 'présent' }] } }
                : j),
        }));

        let contexte: { personnages?: string[] } | undefined;
        vi.doMock('../ai/AIService', () => ({
            aiService: {
                summarizeSession: async (_e: unknown, _n: unknown, c: { personnages?: string[] }) => {
                    contexte = c; return 'ok';
                },
            },
        }));
        await useJournalStore.getState().generateAISummary(id);

        expect(contexte?.personnages).toEqual(['JC Alien']);
    });
});
