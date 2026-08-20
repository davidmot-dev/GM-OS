import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useJournalStore } from './useJournalStore';
import {
    TYPES_D_EVENEMENT, estUnTypeDEvenement, natureParDefaut, type JournalEventType,
} from './types';

/**
 * **Ce que ces tests protègent : un type d'événement inventé ne passe plus en
 * silence.**
 *
 * Trouvé à la revue des 37 émetteurs, le 2026-08-20. Le générateur de narration
 * émettait `type: 'STORY' as any` — un type absent de `JournalEventType`. Le
 * `as any` éteignait le compilateur, et toutes les conséquences étaient
 * muettes : `natureParDefaut` ne le reconnaissant pas, l'événement retombait sur
 * `trace`, `generateAISummary` l'écartait, et `eventIcons` l'affichait sans
 * icône. **La vision de l'Oracle — la matière la plus narrative de
 * l'application, et le seul événement que le meneur ajoute exprès — n'a jamais
 * atteint un résumé.**
 */

const journal = () => useJournalStore.getState();

beforeEach(() => {
    journal().clearJournal();
    journal().startJournal({ id: 'c-1', nom: 'Hadley Hope' }, 'Séance 1');
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('la liste des types', () => {
    it('est la source du type, et non sa copie', () => {
        // Écrite deux fois — une union et un tableau —, elle aurait divergé.
        // Ce test ne vaut que parce que le type dérive du tableau : si l'un
        // grandit, l'autre a déjà grandi.
        const type: JournalEventType = TYPES_D_EVENEMENT[0];
        expect(estUnTypeDEvenement(type)).toBe(true);
        expect(TYPES_D_EVENEMENT).toContain('PJ');
    });

    it('reconnaît tous les types employés, et rien d\'autre', () => {
        for (const t of TYPES_D_EVENEMENT) expect(estUnTypeDEvenement(t)).toBe(true);
        expect(estUnTypeDEvenement('STORY')).toBe(false);
    });

    it('donne une nature à chacun', () => {
        for (const t of TYPES_D_EVENEMENT) {
            expect(['trace', 'chronique']).toContain(natureParDefaut(t));
        }
    });
});

describe('un événement d\'un type inconnu', () => {
    it('fait crier la console', () => {
        journal().addEvent({
            // Le cast exact qui vivait dans le générateur de narration.
            type: 'STORY' as JournalEventType,
            title: 'Vision de l\'Oracle',
            content: 'Le vent se lève.',
        });

        expect(console.error).toHaveBeenCalledOnce();
        const dit = vi.mocked(console.error).mock.calls[0][0] as string;
        expect(dit).toContain('STORY');
        // Et il dit la conséquence, pas seulement le symptôme.
        expect(dit).toContain('résumé');
    });

    it('est tout de même consigné', () => {
        // Le perdre punirait le meneur d'un défaut de code, et une donnée jetée
        // en silence est ce qu'on reproche au reste du module.
        const id = journal().activeJournalId!;
        const avant = journal().journals.find(j => j.id === id)!.events.length;

        journal().addEvent({
            type: 'STORY' as JournalEventType, title: 'Vision', content: 'x',
        });

        expect(journal().journals.find(j => j.id === id)!.events).toHaveLength(avant + 1);
    });

    it('ne crie pas sur un type légitime', () => {
        journal().addEvent({ type: 'ORACLE', title: 'Tirage', content: 'x' });
        expect(console.error).not.toHaveBeenCalled();
    });
});

describe('la vision de l\'Oracle', () => {
    it('atteint le résumé, parce qu\'elle déclare sa nature', () => {
        // `ORACLE` dit d'où elle vient, `chronique` dit ce qu'elle est : le type
        // est mécanique et la nature ne l'est pas, exactement le cas que le
        // § 4.3 prévoit qu'un émetteur déclare.
        const id = journal().activeJournalId!;
        journal().addEvent({
            type: 'ORACLE', nature: 'chronique',
            title: '📜 Vision de l\'Oracle', content: 'Le vent se lève.',
        });

        const vision = journal().journals.find(j => j.id === id)!.events[0];
        expect(vision.nature).toBe('chronique');
        expect(natureParDefaut('ORACLE'), 'sans la déclarer, elle serait une trace').toBe('trace');
    });
});
