import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOracleContext } from './useOracleContext';
import type { useSessionOSStore } from '../../session/useSessionOSStore';
import type { useCombatStore } from '../../combat/useCombatStore';
import type { useMapStore } from '../../map/useMapStore';
import type { useGemStore } from '../../../stores/useGemStore';

type EtatSession = ReturnType<typeof useSessionOSStore.getState>;
type EtatCombat = ReturnType<typeof useCombatStore.getState>;
type EtatCarte = ReturnType<typeof useMapStore.getState>;
type EtatCortex = ReturnType<typeof useGemStore.getState>;

/* Le hook lit ces projections, sans sélecteur ni action de magasin. Les mocks
   sont des fonctions de lecture, pas des magasins Zustand complets. */
type SessionPourOracle = Pick<EtatSession, 'activeCampaignId'> & {
    campaigns: Pick<EtatSession['campaigns'][number], 'id' | 'name' | 'synopsis'>[];
    players: {
        id: EtatSession['players'][number]['id'];
        characters: Pick<EtatSession['players'][number]['characters'][number],
            'name' | 'classRace' | 'campaignId' | 'description' | 'hp' | 'maxHp' | 'healthSystem'>[];
    }[];
    entities: Pick<EtatSession['entities'][number],
        'id' | 'name' | 'role' | 'description' | 'campaignId' | 'status' | 'gmSecretInfo'>[];
    clues: Pick<EtatSession['clues'][number], 'id' | 'title' | 'content' | 'isRevealed' | 'campaignId'>[];
    getActiveDriver?: EtatSession['getActiveDriver'];
};
type CombattantPourOracle = Pick<EtatCombat['combatants'][number],
    'name' | 'hp' | 'hpMax' | 'healthSystem' | 'statuses'>
    & Partial<Pick<EtatCombat['combatants'][number], 'init'>>;
type CombatPourOracle = Pick<EtatCombat, 'round'> & {
    combatants: CombattantPourOracle[];
} & Partial<Pick<EtatCombat, 'currentTurnIdx'>>;
type CartePourOracle = (Pick<EtatCarte,
    'mapUrl' | 'mapName' | 'timeOfDay' | 'weatherType' | 'weatherIntensity'> | { mapUrl: null }) & {
    tokens: Pick<EtatCarte['tokens'][number], 'name' | 'isVisible'>[];
};
type CortexPourOracle = {
    // Les cas existants simulent aussi un identifiant absent avec null.
    activeGemId: EtatCortex['activeGemId'] | null;
    gems: Pick<EtatCortex['gems'][number], 'id' | 'name' | 'baseInstructions'>[];
};

const magasins = vi.hoisted(() => ({
    session: vi.fn<() => SessionPourOracle>(),
    combat: vi.fn<() => CombatPourOracle>(),
    carte: vi.fn<() => CartePourOracle>(),
    cortex: vi.fn<() => CortexPourOracle>(),
}));
vi.mock('../../session/useSessionOSStore', () => ({ useSessionOSStore: magasins.session }));
vi.mock('../../combat/useCombatStore', () => ({ useCombatStore: magasins.combat }));
vi.mock('../../map/useMapStore', () => ({ useMapStore: magasins.carte }));
vi.mock('../../../stores/useGemStore', () => ({ useGemStore: magasins.cortex }));

describe('useOracleContext', () => {
    it('should aggregate campaign and player data into a snapshot', () => {
        const mockCampaignId = 'camp-123';
        
        // Setup Session Store Mock
        magasins.session.mockReturnValue({
            activeCampaignId: mockCampaignId,
            campaigns: [{ id: mockCampaignId, name: 'Test Campaign', synopsis: 'A grand adventure' }],
            players: [
                { id: 'p1', characters: [{ name: 'Valerius', classRace: 'Warrior', hp: 20, maxHp: 20, campaignId: mockCampaignId }] }
            ],
            entities: [
                { id: 'npc-1', name: 'Zalthoz', role: 'hostile', description: 'Very evil', campaignId: mockCampaignId, status: 'alive', gmSecretInfo: 'Afraid of cats' }
            ],
            clues: [
                { id: 'clue-1', title: 'The Secret Map', content: 'Follow the North Star', isRevealed: true, campaignId: mockCampaignId }
            ],
            getActiveDriver: vi.fn<EtatSession['getActiveDriver']>()
        });

        // Setup Combat Store Mock
        magasins.combat.mockReturnValue({
            combatants: [],
            round: 0
        });

        // Setup Map Store Mock
        magasins.carte.mockReturnValue({
            mapUrl: 'map-url',
            mapName: 'The Dark Forest',
            timeOfDay: 'night',
            weatherType: 'rain',
            weatherIntensity: 0.8,
            tokens: [{ name: 'Valerius', isVisible: true }]
        });

        // Setup Gem Store Mock
        magasins.cortex.mockReturnValue({
            activeGemId: 'gem-1',
            gems: [{ id: 'gem-1', name: 'Oracle', baseInstructions: 'Be wise' }]
        });

        const { result } = renderHook(() => useOracleContext());

        expect(result.current.snapshot).toContain('Test Campaign');
        expect(result.current.snapshot).toContain('Valerius');
        expect(result.current.snapshot).toContain('Zalthoz');
        expect(result.current.snapshot).toContain('SECRET MJ: Afraid of cats'); // GM Secret Check
        expect(result.current.snapshot).toContain('The Dark Forest');
        expect(result.current.snapshot).toContain('The Secret Map');
    });

    it('should include combat data when combat is active', () => {
        magasins.session.mockReturnValue({
            activeCampaignId: 'c1',
            campaigns: [{ id: 'c1', name: 'War' }],
            players: [],
            entities: [],
            clues: []
        });

        magasins.combat.mockReturnValue({
            combatants: [
                { name: 'Goblin', hp: 5, hpMax: 10, init: 15, statuses: [] }
            ],
            round: 2,
            currentTurnIdx: 0
        });

        magasins.carte.mockReturnValue({ mapUrl: null, tokens: [] });
        magasins.cortex.mockReturnValue({ activeGemId: null, gems: [] });

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
        magasins.session.mockReturnValue({
            activeCampaignId: 'c1',
            campaigns: [{ id: 'c1', name: 'Hadley' }],
            players: [],
            entities: [],
            clues: []
        });

        magasins.combat.mockReturnValue({
            combatants: [{ name: 'Xénomorphe', statuses: [] }],
            round: 1,
            currentTurnIdx: 0
        });

        magasins.carte.mockReturnValue({ mapUrl: null, tokens: [] });
        magasins.cortex.mockReturnValue({ activeGemId: null, gems: [] });

        const { result } = renderHook(() => useOracleContext());

        expect(result.current.snapshot).toContain('Xénomorphe');
        expect(result.current.snapshot).not.toContain('undefined');
        expect(result.current.snapshot).not.toContain('PV');
        expect(result.current.snapshot).not.toContain('initiative');
    });
});
