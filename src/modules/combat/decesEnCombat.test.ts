import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';

/**
 * **Le décès arrive au journal par le plateau, pas par un bouton.**
 *
 * Le chemin complet, celui que les tests de logique ne voient pas : un coup
 * porté dans le pupitre, et une ligne dans le fil sans que personne n'ait
 * cliqué sur « Exporter ». C'est le reproche fait à l'ancien code — l'émission
 * vivait dans `propagateStatusToSession`, que seul `CombatControls` appelle.
 */

const store = () => useCombatStore.getState();
const journal = () => useJournalStore.getState();
const deces = () => (journal().journals[0]?.events ?? []).filter(e => e.title?.startsWith('Décès :'));

beforeEach(() => {
    store().reset();
    useCombatStore.setState({ combatsGares: {}, dejaConsigne: false });
    journal().clearJournal();
    journal().addJournal('Séance de test');
    useJournalStore.setState({ isRecording: true });
});

describe('la mort en combat', () => {
    it('écrit le décès d\'un PJ à l\'instant où il tombe', () => {
        // Le défaut : gardé par `!c.isPlayer`, ceci n'écrivait rien.
        store().addCombatant({
            name: 'Ripley', init: 5, hp: 4, hpMax: 4, isPlayer: true, faction: 'player', statuses: [],
        });
        const ripley = store().combatants[0];

        store().applyDamage(4, 'physical', [ripley.id]);

        expect(deces()).toHaveLength(1);
        expect(deces()[0].content).toContain('Le personnage **Ripley**');
        // Décision de David du 2026-08-20 : ce qui arrive à un PJ porte son
        // propre type, au lieu d'être rangé sous « personnage non joueur ».
        expect(deces()[0].type).toBe('PJ');
    });

    it('écrit le décès d\'un PNJ sans qu\'on exporte quoi que ce soit', () => {
        store().addCombatant({
            name: 'Goule', init: 5, hp: 3, hpMax: 3, isPlayer: false, faction: 'enemy', statuses: [],
        });
        store().applyDamage(5, 'physical', [store().combatants[0].id]);

        expect(deces()).toHaveLength(1);
        expect(deces()[0].content).toContain('Le PNJ **Goule**');
        expect(deces()[0].type).toBe('NPC');
    });

    it('ne l\'écrit qu\'une fois, même si le combat continue autour du corps', () => {
        store().addCombatant({
            name: 'Goule', init: 5, hp: 3, hpMax: 3, isPlayer: false, faction: 'enemy', statuses: [],
        });
        store().addCombatant({
            name: 'Pirate', init: 4, hp: 8, hpMax: 8, isPlayer: false, faction: 'enemy', statuses: [],
        });
        const [goule, pirate] = store().combatants;

        store().applyDamage(5, 'physical', [goule.id]);
        store().applyDamage(2, 'physical', [pirate.id]);
        store().applyDamage(1, 'physical', [goule.id]);

        expect(deces()).toHaveLength(1);
    });

    it('rattache le décès à la scène du combat', () => {
        // Sans le `sceneId`, la revue de fin de séance ne saurait pas où ranger
        // la mort d'un personnage.
        useCombatStore.setState({ sceneId: 'scene-A' });
        store().addCombatant({
            name: 'Dallas', init: 5, hp: 2, hpMax: 2, isPlayer: true, faction: 'player', statuses: [],
        });
        store().applyDamage(2, 'physical', [store().combatants[0].id]);

        expect(deces()[0].sceneId).toBe('scene-A');
    });
});
