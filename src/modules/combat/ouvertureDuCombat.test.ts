import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';

/**
 * **L'autre moitié de l'étape 8 du plan du 2026-08-08.**
 *
 * Le store n'émettait que l'initiative et le récit de fin : un combat n'avait
 * dans le fil qu'une borne sur deux, et la curation scène par scène ne pouvait
 * donc pas dire ce qui appartient au combat et ce qui l'entoure.
 *
 * Deux gestes ouvrent réellement un combat — tirer l'initiative, ou porter le
 * premier coup —, le meneur fait l'un ou l'autre, et **jamais les deux ne
 * doivent l'ouvrir deux fois**.
 */

const store = () => useCombatStore.getState();
const journal = () => useJournalStore.getState();
const ouvertures = () =>
    (journal().journals[0]?.events ?? []).filter(e => e.title?.startsWith('Combat engagé'));

const unCombattant = (name: string) => ({
    name, init: 10, hp: 10, hpMax: 10, isPlayer: false, faction: 'enemy' as const, statuses: [],
});

beforeEach(() => {
    store().reset();
    useCombatStore.setState({
        combatsGares: {}, dejaConsigne: false, ouvertureConsignee: false,
    });
    journal().clearJournal();
    journal().addJournal('Séance de test');
    useJournalStore.setState({ isRecording: true });
});

describe('l\'ouverture du combat', () => {
    it('s\'écrit au tirage d\'initiative, et nomme les combattants', () => {
        store().addCombatant(unCombattant('Goule'));
        store().addCombatant(unCombattant('Pirate'));

        store().rollAutoInitiative({ diceMax: 20 });

        expect(ouvertures()).toHaveLength(1);
        expect(ouvertures()[0].content).toContain('**Goule**');
        expect(ouvertures()[0].content).toContain('**Pirate**');
        expect(ouvertures()[0].metadata?.totalCombatants).toBe(2);
    });

    it('s\'écrit au premier coup quand personne n\'a tiré l\'initiative', () => {
        store().addCombatant(unCombattant('Goule'));

        store().applyDamage(2, 'physical', [store().combatants[0].id]);

        expect(ouvertures()).toHaveLength(1);
    });

    it('ne s\'écrit qu\'une fois, quel que soit l\'ordre des deux gestes', () => {
        store().addCombatant(unCombattant('Goule'));

        store().rollAutoInitiative({ diceMax: 20 });
        store().applyDamage(2, 'physical', [store().combatants[0].id]);
        store().applyDamage(1, 'physical', [store().combatants[0].id]);

        expect(ouvertures()).toHaveLength(1);
    });

    it("précède l'impact dans le fil", () => {
        // L'ordre de lecture est l'ordre des faits : on n'encaisse pas un coup
        // avant que le combat ne s'engage.
        //
        // Le journal empile le plus récent en tête (`[newEvent, ...j.events]`),
        // donc « le premier fait » est le dernier de la liste.
        store().addCombatant(unCombattant('Goule'));
        store().applyDamage(2, 'physical', [store().combatants[0].id]);

        const evenements = journal().journals[0]?.events ?? [];
        expect(evenements.length).toBeGreaterThan(1);
        expect(evenements[evenements.length - 1].title).toContain('Combat engagé');
    });

    it('reste mécanique : de nature trace, comme l\'initiative', () => {
        // Décision reprise du 2026-08-19, § 4. Le récit de fin est le seul
        // événement de combat que le résumé reçoive.
        store().addCombatant(unCombattant('Goule'));
        store().rollAutoInitiative({ diceMax: 20 });

        expect(ouvertures()[0].nature ?? 'trace').toBe('trace');
    });

    it('rouvre pour le combat de la scène suivante, sans rouvrir celui qu\'on retrouve', () => {
        // Le drapeau voyage avec le plateau garé : un drapeau global ouvrirait
        // deux fois le même combat, ou jamais le second.
        store().rattacherLeCombat('scene-A');
        store().addCombatant(unCombattant('Goule'));
        store().rollAutoInitiative({ diceMax: 20 });

        store().basculerVersLaScene('scene-B');
        store().addCombatant(unCombattant('Pirate'));
        store().rollAutoInitiative({ diceMax: 20 });
        expect(ouvertures(), 'la scène B ouvre son propre combat').toHaveLength(2);

        store().basculerVersLaScene('scene-A');
        store().rollAutoInitiative({ diceMax: 20 });
        expect(ouvertures(), 'retrouver le combat de A ne le rouvre pas').toHaveLength(2);
    });

    it('un plateau vidé rouvre au combat suivant', () => {
        store().addCombatant(unCombattant('Goule'));
        store().rollAutoInitiative({ diceMax: 20 });
        store().clearCombatants();

        store().addCombatant(unCombattant('Xénomorphe'));
        store().rollAutoInitiative({ diceMax: 20 });

        expect(ouvertures()).toHaveLength(2);
    });

    it('n\'ouvre rien sur un plateau vide', () => {
        store().rollAutoInitiative({ diceMax: 20 });
        expect(ouvertures()).toHaveLength(0);
    });
});
