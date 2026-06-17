import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCombatStore } from './useCombatStore';

describe('Combat-OS to Session-OS Alignment', () => {
    const mockUpdateEntityHP = vi.fn();
    const mockUpdateEntity = vi.fn();

    beforeEach(() => {
        useCombatStore.getState().reset();
        vi.clearAllMocks();

        // Mocker window.useSessionOSStore
        (window as any).useSessionOSStore = {
            getState: () => ({
                players: [],
                entities: [],
                updateEntityHP: mockUpdateEntityHP,
                updateEntity: mockUpdateEntity
            })
        };
    });

    it('should synchronize HP to Session-OS when applying damage', () => {
        const store = useCombatStore.getState();
        
        // Ajouter un PNJ avec un lien source
        store.addCombatant({
            name: 'Orc Warrior',
            init: 0,
            hp: 50,
            hpMax: 50,
            isPlayer: false,
            faction: 'enemy',
            sourceEntityId: 'npc-1',
            statuses: []
        });

        const combatantId = useCombatStore.getState().combatants[0].id;

        // Appliquer 10 dégâts
        useCombatStore.getState().applyDamage(10, 'slashing', [combatantId]);

        // Vérifier que SessionStore a été appelé avec les nouveaux PV (40)
        expect(mockUpdateEntityHP).toHaveBeenCalledWith('npc-1', 40);
    });

    it('should synchronize Narrative Notes and Secrets to Session-OS', () => {
        useCombatStore.getState().addCombatant({
            name: 'Mysteries PNJ',
            init: 0,
            hp: 20,
            hpMax: 20,
            isPlayer: false,
            faction: 'neutral',
            sourceEntityId: 'npc-2',
            roleplayingNotes: 'Initial notes',
            gmSecretInfo: 'Initial secrets',
            statuses: []
        });

        const combatantId = useCombatStore.getState().combatants[0].id;

        // Modifier les notes en combat
        useCombatStore.getState().updateCombatant(combatantId, {
            roleplayingNotes: 'New combat notes',
            gmSecretInfo: 'Discovered secret'
        });

        // Vérifier que SessionStore a été notifié
        expect(mockUpdateEntity).toHaveBeenCalledWith('npc-2', expect.objectContaining({
            roleplayingNotes: 'New combat notes',
            gmSecretInfo: 'Discovered secret'
        }));
    });

    it('should sync "dead" status to Session-OS when combatant dies via status', () => {
        useCombatStore.getState().addCombatant({
            name: 'Doomed PNJ',
            init: 0,
            hp: 10,
            hpMax: 10,
            isPlayer: false,
            faction: 'neutral',
            sourceEntityId: 'npc-3',
            statuses: []
        });

        const id = useCombatStore.getState().combatants[0].id;

        // Ajouter le statut "Mort"
        useCombatStore.getState().addStatus(id, { name: 'Mort', duration: 0, icon: '💀' });

        // Vérifier la propagation
        expect(mockUpdateEntity).toHaveBeenCalledWith('npc-3', expect.objectContaining({
            status: 'dead'
        }));
    });
});
