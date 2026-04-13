import { gmToast } from '../../../stores/useToastStore';
import type { SessionModuleSnapshot } from '../store/types';

/**
 * SnapshotService handles saving and restoring the entire GM-OS state.
 */
export class SnapshotService {
    /**
     * Captures the current state of all active modules.
     */
    static async captureSnapshot(): Promise<SessionModuleSnapshot> {
        // Gathering states via their respective hooks (direct imports are better than window access)
        // Note: Using lazy imports or dynamic getState to avoid circular dependencies if any
        
        try {
            const { useMusicStore } = await import('../../music/useMusicStore');
            const { useSoundStore } = await import('../../sound/useSoundStore');
            const { useAmbientStore } = await import('../../ambient/useAmbientStore');
            const { useLightStore } = await import('../../light/useLightStore');
            const { useImageStore } = await import('../../image/useImageStore');
            const { useWebStore } = await import('../../web/useWebStore');
            const { useCombatStore } = await import('../../combat/useCombatStore');

            const musicState = useMusicStore.getState();
            const soundState = useSoundStore.getState();
            const ambientState = useAmbientStore.getState();
            const lightState = useLightStore.getState();
            const imageState = useImageStore.getState();
            const webState = useWebStore.getState();
            const combatState = useCombatStore.getState();

            return {
                timestamp: Date.now(),
                music: { 
                    activePlaylistId: musicState.activePlaylistId, 
                    playlists: musicState.playlists, 
                    deckA: musicState.deckA, 
                    deckB: musicState.deckB, 
                    crossfader: musicState.crossfader, 
                    masterVolume: musicState.masterVolume 
                },
                sound: { 
                    activeAtmosphereId: soundState.activeAtmosphereId, 
                    masterVolume: soundState.masterVolume, 
                    activePadIds: [], 
                    atmospheres: soundState.atmospheres 
                },
                ambient: { 
                    activeTracks: ambientState.tracks.map(t => ({ id: t.id, url: t.url, volume: t.volume, isPlaying: t.isPlaying })), 
                    masterVolume: ambientState.masterVolume, 
                    tracks: ambientState.tracks 
                },
                light: { 
                    activeSceneId: lightState.activeSceneId as string, 
                    globalBrightness: lightState.globalBrightness as number, 
                    scenes: lightState.scenes 
                },
                image: { 
                    projections: imageState.projections, 
                    mediaList: imageState.mediaList, 
                    folders: imageState.folders 
                },
                web: { 
                    links: webState.links.map(l => l.url), 
                    fullLinks: webState.links 
                },
                combat: { 
                    combatants: combatState.combatants, 
                    currentTurnIdx: combatState.currentTurnIdx, 
                    round: combatState.round 
                },
            };
        } catch (e) {
            console.error('[SnapshotService] Capture failed:', e);
            throw e;
        }
    }

    /**
     * Applies a snapshot to all modules.
     */
    static async applySnapshot(snapshot: SessionModuleSnapshot) {
        try {
            const { useMusicStore } = await import('../../music/useMusicStore');
            const { useSoundStore } = await import('../../sound/useSoundStore');
            const { useAmbientStore } = await import('../../ambient/useAmbientStore');
            const { useLightStore } = await import('../../light/useLightStore');
            const { useImageStore } = await import('../../image/useImageStore');
            const { useWebStore } = await import('../../web/useWebStore');
            const { useCombatStore } = await import('../../combat/useCombatStore');
            const { hueEngine } = await import('../../light/HueEngine');

            if (snapshot.music) useMusicStore.getState().applySnapshot?.(snapshot.music);
            if (snapshot.sound) useSoundStore.getState().applySnapshot?.(snapshot.sound);
            if (snapshot.ambient) useAmbientStore.getState().applySnapshot?.(snapshot.ambient);
            if (snapshot.light) {
                useLightStore.getState().applySnapshot?.(snapshot.light);
                if (snapshot.light.activeSceneId) hueEngine.applyScene(snapshot.light.activeSceneId, true);
            }
            if (snapshot.image) useImageStore.getState().applySnapshot?.(snapshot.image);
            if (snapshot.web) useWebStore.getState().applySnapshot?.(snapshot.web);
            if (snapshot.combat) useCombatStore.getState().applySnapshot?.(snapshot.combat);

            gmToast('Atmosphère de session restaurée.', 'success');
        } catch (e) {
            console.error('[SnapshotService] Restoration failed:', e);
            gmToast('Erreur lors de la restauration.', 'error');
        }
    }
}
