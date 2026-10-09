import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProgressionDuFluxIA } from '../ai/types';
import type { ConseilGenere } from './types';
import { useTacticalAIStore } from './useTacticalAIStore';

const moteur = vi.hoisted(() => ({
    flux: vi.fn<(invite: string, token: (t: string) => void, status: (s: ProgressionDuFluxIA) => void) => Promise<void>>(),
    json: vi.fn(), systeme: vi.fn(),
}));
const combat = { combatants: [{ id: 'acteur', name: 'Alice' }], currentTurnIdx: 0 };
vi.mock('../combat/useCombatStore', () => ({ useCombatStore: { getState: () => combat } }));
vi.mock('../map/useMapStore', () => ({ useMapStore: { getState: () => ({ tokens: [], dangerZones: [], gridSize: 50, isGridEnabled: false }) } }));
vi.mock('../session/useSessionOSStore', () => ({ useSessionOSStore: { getState: () => ({ getActiveDriver: () => undefined }) } }));
vi.mock('../ai/AIService', () => ({ aiService: { generateTextStream: moteur.flux, generateJSON: moteur.json, prepareSystemPrompt: moteur.systeme } }));
vi.mock('./logic/TacticalNarrativeService', () => ({ TacticalNarrativeService: { getSituationalReport: () => 'Rapport artificiel' } }));
const conseils: ConseilGenere[] = [{ id: 'conseil', type: 'move', message: 'Contourner le mur.', priority: 2 }];

describe('le Cortex distingue ses échanges réels sans modifier les invites', () => {
    beforeEach(() => {
        vi.clearAllMocks(); moteur.systeme.mockResolvedValue('Système artificiel'); moteur.json.mockResolvedValue(conseils);
        moteur.flux.mockResolvedValue(undefined);
        useTacticalAIStore.setState({ status: 'idle', logs: [], activeAdvices: [], strategicNarration: '' });
    });

    it('garde les messages de progression, les tokens et les conseils générés sans sourceId', async () => {
        moteur.flux.mockImplementation(async (_invite, token, status) => {
            for (const progression of ['Analyses tactiques & grimoires...', 'Réception de la vision...', ''] as const) {
                status(progression); expect(useTacticalAIStore.getState().status).toBe(progression);
            }
            token('Premier '); token('fragment.');
        });
        await useTacticalAIStore.getState().requestTacticalAnalysis();
        const etat = useTacticalAIStore.getState();
        expect(etat.status).toBe('idle'); expect(etat.strategicNarration).toBe('Premier fragment.');
        expect(etat.activeAdvices).toBe(conseils); expect(etat.logs[0]).toMatchObject({ type: 'tactical' });
        expect(moteur.systeme.mock.calls[0][1]).toContain('attack|move|spell|defense');
        expect(moteur.json).toHaveBeenCalledWith(expect.any(String), 'Système artificiel', undefined, { sansPersona: true });
    });

    it('reste en cours jusqu’à la fin des deux phases', async () => {
        let terminer!: () => void;
        moteur.flux.mockImplementation(() => new Promise<void>(resolve => { terminer = resolve; }));
        const attente = useTacticalAIStore.getState().requestTacticalAnalysis('acteur');
        await vi.waitFor(() => expect(moteur.json).toHaveBeenCalledTimes(1));
        expect(useTacticalAIStore.getState().status).toBe('analyzing');
        expect(useTacticalAIStore.getState().activeAdvices).toEqual([]);
        terminer(); await attente; expect(useTacticalAIStore.getState().activeAdvices).toBe(conseils);
    });

    it('un acteur absent ne sollicite aucune IA', async () => {
        await useTacticalAIStore.getState().requestTacticalAnalysis('absent');
        expect(moteur.flux).not.toHaveBeenCalled(); expect(moteur.json).not.toHaveBeenCalled();
        expect(useTacticalAIStore.getState().status).toBe('idle');
    });

    it('une phase en échec rend l’état erreur et un journal sans conseils partiels', async () => {
        moteur.json.mockRejectedValue(new Error('Indisponible'));
        await useTacticalAIStore.getState().requestTacticalAnalysis();
        expect(useTacticalAIStore.getState()).toMatchObject({ status: 'error', activeAdvices: [] });
        expect(useTacticalAIStore.getState().logs[0]).toMatchObject({ type: 'error' });
    });
});
