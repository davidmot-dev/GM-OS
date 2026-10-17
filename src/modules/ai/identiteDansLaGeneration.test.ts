import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * **L'identité visuelle atteint vraiment le générateur** — 2026-10-17. On
 * capture l'invite que reçoit Cloudflare : c'est elle, et pas une copie de la
 * règle, qui dit si l'identité est appliquée.
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
const recues = vi.hoisted(() => [] as string[]);
const options = vi.hoisted(() => [] as unknown[]);
vi.mock('./cloudflareImage', async importOriginal => ({
    ...(await importOriginal<typeof import('./cloudflareImage')>()),
    genererViaCloudflare: async (prompt: string, _config: unknown, o: unknown) => { recues.push(prompt); options.push(o); return btoa('x'.repeat(2000)); },
}));
vi.mock('./rangementDeLImage', async importOriginal => ({
    ...(await importOriginal<typeof import('./rangementDeLImage')>()),
    rangerLImageFabriquee: async () => 'media-1',
}));

const { aiService } = await import('./AIService');
const { useAIStore } = await import('../../stores/useAIStore');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { useIdentiteSuspendue } = await import('./identiteDeLaPartie');

beforeEach(() => {
    recues.length = 0;
    options.length = 0;
    useAIStore.setState({ activeProvider: 'gemini', image: { ...useAIStore.getState().image, accountId: 'compte' }, aUneCle: () => true } as never);
    useSessionOSStore.setState({
        sessions: [], activeCampaignId: 'c',
        campaigns: [{ id: 'c', name: 'Anges de Feu', system: 'br' }],
        customGameDrivers: [{ id: 'br', name: 'Blade Runner', identiteVisuelle: { style: '1980s neo-noir, rain-soaked neon', aEviter: 'cartoon style' } }],
    } as never);
});
afterEach(() => useIdentiteSuspendue.setState({ suspendue: false }));

describe('la génération d’image', () => {
    it('envoie l’identité du jeu avec le sujet', async () => {
        await expect(aiService.generateImage('A professional RPG character portrait of Rachael.')).resolves.toBe('media-1');
        expect(recues).toEqual(['A professional RPG character portrait of Rachael. Visual identity: 1980s neo-noir, rain-soaked neon. Never include: cartoon style.']);
    });

    it('les images d’exemple et le format partent avec l’invite', async () => {
        useSessionOSStore.setState({
            customGameDrivers: [{ id: 'br', name: 'Blade Runner', identiteVisuelle: { style: 'neo-noir', references: ['data:image/jpeg;base64,QUFB'] } }],
        } as never);
        await aiService.generateImage('A city.', '16:9');
        expect(options).toEqual([{ references: ['data:image/jpeg;base64,QUFB'], format: '16:9' }]);
    });

    it('suspendue, le sujet part seul', async () => {
        useIdentiteSuspendue.getState().suspendre(true);
        await aiService.generateImage('A portrait.');
        expect(recues).toEqual(['A portrait.']);
    });
});
