import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * **L'état en direct se lit après les résolutions de médias, jamais avant.**
 *
 * *Trouvé par David le 2026-09-25 : un moment de storyboard projetait sa carte
 * sur le Player Hub, « la carte apparaît une seconde puis disparaît pour
 * laisser place au fond d'écran ».* Une synchronisation partie au début du
 * moment photographiait la carte, attendait la résolution des médias, puis
 * envoyait la photo — **la carte d'avant la projection**.
 */

/** La carte du meneur, qu'on fait changer pendant la résolution. */
const carte = vi.hoisted(() => ({ etat: { projectionTarget: null as string | null, projectedMapUrl: null as string | null } }));

/** Une résolution de média qui prend son temps, comme les vraies. */
vi.mock('../../../utils/mediaResolver', () => ({
    resolveToSendableUrl: async (u: unknown) => {
        await new Promise(r => setTimeout(r, 30));
        return u;
    },
}));

vi.mock('../../../services/CrossWindowEventService', () => ({
    crossWindowSync: { isSyncing: () => false },
}));

const storeVide = vi.hoisted(() => (extra: Record<string, unknown> = {}) => ({
    getState: () => ({
        sessions: [], campaigns: [], entities: [], players: [], clues: [], atlasMaps: [],
        customSheetTemplates: [], customGameDrivers: [], activeCampaignId: null,
        combatants: [], moments: [], atmospheres: [], notes: {}, pads: [], favorites: [],
        paths: [], tensions: [], isSystemSyncing: false, masterVolume: 1, outputDeviceId: 'default',
        playlists: [], presets: [], mediaList: [], diaporamas: [], tracks: [],
        ...extra,
    }),
    subscribe: () => () => { /* pas d'abonnement en test */ },
}));

vi.mock('../../sound/useSoundStore', () => ({ useSoundStore: storeVide({ activeAtmosphereId: null }) }));
vi.mock('../../storyboard/useStoryboardStore', () => ({ useStoryboardStore: storeVide() }));
vi.mock('../../combat/useCombatStore', () => ({ useCombatStore: storeVide() }));
/* Une entité à portrait : c'est elle qui oblige à attendre une résolution. */
vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: storeVide({
        entities: [{ id: 'e-1', name: 'Rachael', avatar: 'rachael.png' }],
        getActiveDriver: () => null,
    }),
}));
vi.mock('../../favorite/useFavoriteStore', () => ({ useFavoriteStore: storeVide() }));
vi.mock('../../whiteboard/useWhiteboardStore', () => ({ useWhiteboardStore: storeVide() }));
vi.mock('../../../store/useClockStore', () => ({
    useClockStore: storeVide(),
    jaugesVuesParLesJoueurs: (t: unknown) => t,
}));
vi.mock('../../music/useMusicStore', () => ({ useMusicStore: storeVide() }));
vi.mock('../../image/useImageStore', () => ({ useImageStore: storeVide() }));
vi.mock('../../ambient/useAmbientStore', () => ({ useAmbientStore: storeVide() }));
vi.mock('../../../stores/useDiceStore', () => ({ useDiceStore: storeVide() }));
vi.mock('../../map/useMapStore', () => ({
    useMapStore: {
        getState: () => ({ ...carte.etat }),
        subscribe: () => () => { /* pas d'abonnement en test */ },
    },
}));

const { useNexusSynchronizer } = await import('./useNexusSynchronizer');

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

describe('useNexusSynchronizer — ce qui part est l’état du départ', () => {
    /** **Le test qui garde le signalement de David.** */
    it('la carte projetée PENDANT la résolution des médias part telle qu’elle est à l’envoi', async () => {
        const envoisAuHub: Array<{ map?: { projectionTarget?: string | null } }> = [];
        (window as unknown as { appBridge: unknown }).appBridge = {
            remote: {
                sendSync: (payload: { map?: { projectionTarget?: string | null } }, cible: string) => {
                    if (cible === 'hub') envoisAuHub.push(payload);
                },
            },
        };
        carte.etat = { projectionTarget: null, projectedMapUrl: null };

        /* Le montage lance une synchronisation : c'est elle qui est en vol. */
        renderHook(() => useNexusSynchronizer(true));

        /* Le moment projette sa carte pendant qu'elle attend ses médias. */
        await new Promise(r => setTimeout(r, 5));
        carte.etat = { projectionTarget: 'hub', projectedMapUrl: 'carte-egouts' };

        await new Promise(r => setTimeout(r, 150));

        const cartes = envoisAuHub.map(p => p.map).filter(Boolean);
        expect(cartes.length).toBeGreaterThan(0);
        expect(cartes.at(-1)?.projectionTarget).toBe('hub');
    });
});
