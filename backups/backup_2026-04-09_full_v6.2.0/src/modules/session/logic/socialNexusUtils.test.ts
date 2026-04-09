// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { prepareSocialGraphData, getUniqueFactions } from './socialNexusUtils';
import { type Entity, type PlayerCharacter } from '../useSessionOSStore';

describe('socialNexusUtils', () => {
    const mockEntities: Entity[] = [
        {
            id: 'npc1',
            name: 'John Doe',
            campaignId: 'c1',
            type: 'npc',
            faction: 'The Guild',
            relations: [
                { targetId: 'npc2', targetType: 'npc', type: 'ally', description: 'Friend' }
            ]
        } as Entity,
        {
            id: 'npc2',
            name: 'Jane Smith',
            campaignId: 'c1',
            type: 'npc',
            faction: 'The Guild',
            relations: []
        } as Entity
    ];

    const mockPlayers = [
        {
            id: 'p1',
            characters: [
                {
                    id: 'pc1',
                    name: 'Hero',
                    campaignId: 'c1',
                    faction: 'Independent',
                    relations: [
                        { targetId: 'npc1', targetType: 'npc', type: 'hostile', description: 'Enemy' }
                    ]
                } as PlayerCharacter
            ]
        }
    ];

    describe('prepareSocialGraphData', () => {
        it('should correctly filter by campaignId', () => {
            const data = prepareSocialGraphData(mockEntities, mockPlayers, 'c1', { type: 'all', faction: 'all', search: '' });
            expect(data.nodes).toHaveLength(3);
            expect(data.links).toHaveLength(2);
        });

        it('should return empty data if campaignId is null', () => {
            const data = prepareSocialGraphData(mockEntities, mockPlayers, null, { type: 'all', faction: 'all', search: '' });
            expect(data.nodes).toHaveLength(0);
        });

        it('should filter by relation type', () => {
            const data = prepareSocialGraphData(mockEntities, mockPlayers, 'c1', { type: 'hostile', faction: 'all', search: '' });
            expect(data.links).toHaveLength(1);
            expect(data.links[0].type).toBe('hostile');
        });

        it('should filter by faction', () => {
            const data = prepareSocialGraphData(mockEntities, mockPlayers, 'c1', { type: 'all', faction: 'The Guild', search: '' });
            expect(data.nodes).toHaveLength(2);
            expect(data.nodes.every(n => n.faction === 'The Guild')).toBe(true);
        });

        it('should filter by search query (name or faction)', () => {
            const data = prepareSocialGraphData(mockEntities, mockPlayers, 'c1', { type: 'all', faction: 'all', search: 'Hero' });
            expect(data.nodes).toHaveLength(1);
            expect(data.nodes[0].name).toBe('Hero');
            
            const data2 = prepareSocialGraphData(mockEntities, mockPlayers, 'c1', { type: 'all', faction: 'all', search: 'Guild' });
            expect(data2.nodes).toHaveLength(2);
        });
    });

    describe('getUniqueFactions', () => {
        it('should return sorted unique factions', () => {
            const factions = getUniqueFactions(mockEntities, mockPlayers, 'c1');
            expect(factions).toEqual(['Independent', 'The Guild']);
        });

        it('should return empty array if no campaignId', () => {
            const factions = getUniqueFactions(mockEntities, mockPlayers, null);
            expect(factions).toHaveLength(0);
        });
    });
});
