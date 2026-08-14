import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOracleContext } from './useOracleContext';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMapStore } from '../../map/useMapStore';
import { useGemStore } from '../../../stores/useGemStore';

// Mocking stores
vi.mock('../../session/useSessionOSStore');
vi.mock('../../combat/useCombatStore');
vi.mock('../../map/useMapStore');
vi.mock('../../../stores/useGemStore');

describe('useOracleContext', () => {
    it('should aggregate campaign and player data into a snapshot', () => {
        const mockCampaignId = 'camp-123';
        
        // Setup Session Store Mock
        vi.mocked(useSessionOSStore).mockReturnValue({
            activeCampaignId: mockCampaignId,
            campaigns: [{ id: mockCampaignId, name: 'Test Campaign', synopsis: 'A grand adventure' }],
            players: [
                { id: 'p1', characters: [{ name: 'Valerius', classRace: 'Warrior', hp: 20, maxHp: 20, campaignId: mockCampaignId }] }
            ],
            entities: [
                { id: 'npc-1', name: 'Zalthoz', role: 'Villain', description: 'Very evil', campaignId: mockCampaignId, status: 'alive', gmSecretInfo: 'Afraid of cats' }
            ],
            clues: [
                { id: 'clue-1', title: 'The Secret Map', content: 'Follow the North Star', isRevealed: true, campaignId: mockCampaignId }
            ],
            getActiveDriver: vi.fn()
        } as any);

        // Setup Combat Store Mock
        vi.mocked(useCombatStore).mockReturnValue({
            combatants: [],
            round: 0
        } as any);

        // Setup Map Store Mock
        vi.mocked(useMapStore).mockReturnValue({
            mapUrl: 'map-url',
            mapName: 'The Dark Forest',
            timeOfDay: 'night',
            weatherType: 'rain',
            weatherIntensity: 0.8,
            tokens: [{ name: 'Valerius', isVisible: true }]
        } as any);

        // Setup Gem Store Mock
        vi.mocked(useGemStore).mockReturnValue({
            activeGemId: 'gem-1',
            gems: [{ id: 'gem-1', name: 'Oracle', baseInstructions: 'Be wise' }]
        } as any);

        const { result } = renderHook(() => useOracleContext());

        expect(result.current.snapshot).toContain('Test Campaign');
        expect(result.current.snapshot).toContain('Valerius');
        expect(result.current.snapshot).toContain('Zalthoz');
        expect(result.current.snapshot).toContain('SECRET MJ: Afraid of cats'); // GM Secret Check
        expect(result.current.snapshot).toContain('The Dark Forest');
        expect(result.current.snapshot).toContain('The Secret Map');
    });

    it('should include combat data when combat is active', () => {
        vi.mocked(useSessionOSStore).mockReturnValue({
            activeCampaignId: 'c1',
            campaigns: [{ id: 'c1', name: 'War' }],
            players: [],
            entities: [],
            clues: []
        } as any);

        vi.mocked(useCombatStore).mockReturnValue({
            combatants: [
                { name: 'Goblin', hp: 5, hpMax: 10, init: 15, statuses: [] }
            ],
            round: 2,
            currentTurnIdx: 0
        } as any);

        vi.mocked(useMapStore).mockReturnValue({ mapUrl: null, tokens: [] } as any);
        vi.mocked(useGemStore).mockReturnValue({ activeGemId: null, gems: [] } as any);

        const { result } = renderHook(() => useOracleContext());

        expect(result.current.snapshot).toContain('Round: 2');
        // Le format a changé le 2026-08-15 : « HP 5/10 » supposait que tout jeu
        // compte la santé en points. Sur Alien, la même ligne écrivait
        // « HP undefined/undefined » et l'Oracle raisonnait dessus.
        expect(result.current.snapshot).toContain('Goblin: 5/10 PV');
        expect(result.current.snapshot).toContain('initiative 15');
    });

    it('un combattant sans points de vie n\'en fait pas annoncer', () => {
        /**
         * **Le défaut exact, sur la charge d'Alien.** Ce jeu n'a ni points de
         * vie ni initiative chiffrée — il tire des cartes. L'ancienne ligne
         * envoyait « HP undefined/undefined, Initiatives: undefined » à chaque
         * réponse du Sage.
         *
         * *Une valeur fausse dans une invite est une affirmation, pas un
         * silence.* On n'écrit que ce qu'on sait.
         */
        vi.mocked(useSessionOSStore).mockReturnValue({
            activeCampaignId: 'c1',
            campaigns: [{ id: 'c1', name: 'Hadley' }],
            players: [],
            entities: [],
            clues: []
        } as any);

        vi.mocked(useCombatStore).mockReturnValue({
            combatants: [{ name: 'Xénomorphe', statuses: [] }],
            round: 1,
            currentTurnIdx: 0
        } as any);

        vi.mocked(useMapStore).mockReturnValue({ mapUrl: null, tokens: [] } as any);
        vi.mocked(useGemStore).mockReturnValue({ activeGemId: null, gems: [] } as any);

        const { result } = renderHook(() => useOracleContext());

        expect(result.current.snapshot).toContain('Xénomorphe');
        expect(result.current.snapshot).not.toContain('undefined');
        expect(result.current.snapshot).not.toContain('PV');
        expect(result.current.snapshot).not.toContain('initiative');
    });
});
