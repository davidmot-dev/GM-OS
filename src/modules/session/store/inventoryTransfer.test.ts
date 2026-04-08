import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './index';

describe('Inventory & P2P Transfer Logic', () => {
    beforeEach(() => {
        // Reset store state before each test if possible, 
        // or ensure we use clean IDs.
        useSessionOSStore.setState({
            players: [
                {
                    id: 'p1',
                    realName: 'Player 1',
                    isOnline: true,
                    characters: [
                        {
                            id: 'pc1',
                            name: 'Hero A',
                            inventoryItems: [],
                            hp: 10,
                            maxHp: 10,
                            campaignId: 'c1',
                            templateId: 'generic',
                            sheetData: {}
                        }
                    ]
                },
                {
                    id: 'p2',
                    realName: 'Player 2',
                    isOnline: true,
                    characters: [
                        {
                            id: 'pc2',
                            name: 'Hero B',
                            inventoryItems: [],
                            hp: 10,
                            maxHp: 10,
                            campaignId: 'c1',
                            templateId: 'generic',
                            sheetData: {}
                        }
                    ]
                }
            ],
            transferRequests: []
        });
    });

    it('should add and remove structured inventory items', () => {
        const store = useSessionOSStore.getState();
        const item = { name: 'Magic Sword', type: 'weapon', rarity: 'rare', weight: 5, quantity: 1, description: 'Glowing', properties: {} };

        store.addInventoryItem('p1', 'pc1', item);
        
        const charA = useSessionOSStore.getState().players[0].characters[0];
        expect(charA.inventoryItems).toHaveLength(1);
        expect(charA.inventoryItems![0].name).toBe('Magic Sword');

        const itemId = charA.inventoryItems![0].id;
        store.removeInventoryItem('p1', 'pc1', itemId);
        
        const charAAfter = useSessionOSStore.getState().players[0].characters[0];
        expect(charAAfter.inventoryItems).toHaveLength(0);
    });

    it('should complete a P2P transfer after MJ approval', () => {
        const store = useSessionOSStore.getState();
        const item = { id: 'it-123', name: 'Health Potion', type: 'consumable', rarity: 'common', weight: 1, quantity: 1, description: 'Red', properties: {} };

        // Setup: Player 1 has a potion
        store.addInventoryItem('p1', 'pc1', item);
        const itemInInv = useSessionOSStore.getState().players[0].characters[0].inventoryItems![0];

        // 1. Request transfer
        store.requestItemTransfer('pc1', 'pc2', itemInInv);
        
        let state = useSessionOSStore.getState();
        expect(state.transferRequests).toHaveLength(1);
        expect(state.transferRequests[0].status).toBe('pending');
        
        const requestId = state.transferRequests[0].id;

        // 2. Approve transfer
        store.approveItemTransfer(requestId);

        state = useSessionOSStore.getState();
        const charA = state.players[0].characters[0];
        const charB = state.players[1].characters[0];

        // 3. Verify movement
        expect(charA.inventoryItems).toHaveLength(0);
        expect(charB.inventoryItems).toHaveLength(1);
        expect(charB.inventoryItems![0].name).toBe('Health Potion');
        expect(state.transferRequests[0].status).toBe('approved');
    });

    it('should not transfer item if MJ rejects', () => {
        const store = useSessionOSStore.getState();
        const item = { id: 'it-123', name: 'Cursed Ring', type: 'other', rarity: 'epic', weight: 0.1, quantity: 1, description: 'Dark', properties: {} };

        store.addInventoryItem('p1', 'pc1', item);
        const itemInInv = useSessionOSStore.getState().players[0].characters[0].inventoryItems![0];

        store.requestItemTransfer('pc1', 'pc2', itemInInv);
        const requestId = useSessionOSStore.getState().transferRequests[0].id;

        // Reject
        store.rejectItemTransfer(requestId);

        const state = useSessionOSStore.getState();
        expect(state.players[0].characters[0].inventoryItems).toHaveLength(1);
        expect(state.players[1].characters[0].inventoryItems).toHaveLength(0);
        expect(state.transferRequests[0].status).toBe('rejected');
    });
});
