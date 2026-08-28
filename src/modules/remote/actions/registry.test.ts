import { describe, it, expect } from 'vitest';
import { actionRegistry, KNOWN_ACTION_TYPES, isKnownActionType } from './index';
import { HIGH_FREQUENCY_ACTIONS } from './types';

/**
 * Ce fichier fige la liste de ce que l'application accepte d'exécuter sur ordre
 * du réseau. Toute entrée ajoutée ici doit être un choix conscient : ces actions
 * sont déclenchables par les tablettes et la télécommande.
 */
const EXPECTED_TYPES = [
    // Dés
    'dice:roll', 'remote:dice:roll',
    'dice:clear', 'remote:dice:clear', 'remote:dice:clear-dice',
    // Synchronisation
    'remote:request-sync',
    // Son
    'sound:trigger', 'remote:sound:trigger',
    'sound:volume', 'remote:sound:volume',
    'sound:stop-all', 'remote:sound:stop-all',
    // Combat
    'combat:update-hp', 'remote:combat:hp',
    'combat:next-turn', 'remote:combat:next',
    // Session
    'session:update-character-narrative', 'remote:session:update-character-narrative',
    'session:update-character-sheet-data', 'remote:session:update-character-sheet-data',
    'session:submit-feedback', 'remote:session:submit-feedback',
    'session:send-message', 'session:receive-message',
    'session:request-item-transfer', 'remote:session:request-item-transfer',
    'session:approve-item-transfer', 'remote:session:approve-item-transfer',
    'session:reject-item-transfer', 'remote:session:reject-item-transfer',
    'session:remove-inventory-item', 'remote:session:remove-inventory-item',
    // Tableau blanc
    'whiteboard:set-laser-pointer', 'whiteboard:set-active-path',
    'whiteboard:draw', 'whiteboard:add-path',
    'whiteboard:set-tool', 'whiteboard:set-color', 'whiteboard:set-width',
    'whiteboard:clear', 'whiteboard:undo', 'whiteboard:redo',
    // Scène
    'map:ping', 'remote:map:ping',
    'storyboard:trigger', 'remote:story:trigger',
    'remote:pad:trigger', 'universal:trigger',
    // Réserves de table — la seule action de cette liste qu'un joueur non
    // appairé peut émettre en plus des siennes propres, parce que la réserve
    // commune se manipule par décision collective et non par le meneur. Le
    // handler vérifie que le pilote la déclare manipulable.
    'table:ajuster', 'remote:table:ajuster',
];

describe('actionRegistry', () => {
    it('expose exactement les types attendus', () => {
        expect([...KNOWN_ACTION_TYPES].sort()).toEqual([...EXPECTED_TYPES].sort());
    });

    it('associe une fonction à chaque type', () => {
        for (const type of KNOWN_ACTION_TYPES) {
            expect(typeof actionRegistry[type]).toBe('function');
        }
    });

    it('ne perd aucun type par collision entre domaines', () => {
        // Un domaine qui redéfinirait la clé d'un autre l'écraserait en silence
        // au moment du regroupement par spread.
        expect(KNOWN_ACTION_TYPES.length).toBe(EXPECTED_TYPES.length);
        expect(new Set(EXPECTED_TYPES).size).toBe(EXPECTED_TYPES.length);
    });

    it('reconnaît ses propres types et rejette le reste', () => {
        expect(isKnownActionType('dice:roll')).toBe(true);
        expect(isKnownActionType('dice:inconnu')).toBe(false);
    });

    it('classe comme haute fréquence des types bien présents au registre', () => {
        for (const type of HIGH_FREQUENCY_ACTIONS) {
            expect(isKnownActionType(type)).toBe(true);
        }
    });
});
