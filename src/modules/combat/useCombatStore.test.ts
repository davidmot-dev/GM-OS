
import { describe, it, expect, beforeEach } from 'vitest';
import { useCombatStore } from './useCombatStore';

describe('Smart Dispel Logic', () => {
    beforeEach(() => {
        useCombatStore.getState().reset();
    });

    it('should remove conflicting statuses when adding a new one', () => {
        const store = useCombatStore.getState();
        
        // Add a combatant
        store.addCombatant({
            name: 'Test Xeno',
            init: 10,
            hp: 10,
            hpMax: 10,
            isPlayer: false,
            faction: 'enemy',
            statuses: []
        });
        
        const combatantId = useCombatStore.getState().combatants[0].id;
        
        // Add "En feu"
        store.addStatus(combatantId, { name: 'En feu', duration: 3, icon: '🔥' });
        expect(useCombatStore.getState().combatants[0].statuses.some(s => s.name === 'En feu')).toBe(true);
        
        // Add "Mouillé" (should remove "En feu")
        store.addStatus(combatantId, { name: 'Mouillé', duration: 3, icon: '💧' });
        
        const updatedStatusNames = useCombatStore.getState().combatants[0].statuses.map(s => s.name);
        expect(updatedStatusNames).toContain('Mouillé');
        expect(updatedStatusNames).not.toContain('En feu');
    });

    it('should handle multiple conflicts', () => {
        const store = useCombatStore.getState();
        store.addCombatant({ name: 'Test', init: 10, hp: 5, hpMax: 5, isPlayer: false, faction: 'enemy', statuses: [] });
        const id = useCombatStore.getState().combatants[0].id;
        
        store.addStatus(id, { name: 'Mouillé', duration: 0, icon: '💧' });
        store.addStatus(id, { name: 'Debout', duration: 0, icon: '⬆️' });
        
        // Add "En feu" (removes Mouillé)
        store.addStatus(id, { name: 'En feu', duration: 0, icon: '🔥' });
        // Add "Inconscient" (removes Debout)
        store.addStatus(id, { name: 'Inconscient', duration: 0, icon: '💤' });
        
        const names = useCombatStore.getState().combatants[0].statuses.map(s => s.name);
        expect(names).toContain('En feu');
        expect(names).toContain('Inconscient');
        expect(names).not.toContain('Mouillé');
        expect(names).not.toContain('Debout');
    });
});
