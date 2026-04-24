import { useMapStore } from '../useMapStore';

/**
 * MapService - Synchronisation carte MJ → Hub/Moniteurs.
 *
 * 🏗️ ARCHITECTURE v2 — BroadcastChannel + IndexedDB
 * ─────────────────────────────────────────────────────────────
 * PROBLÈME PRÉCÉDENT : window.appBridge.ipc.send (Tauri emit) ne garantit
 * PAS la diffusion cross-WebviewWindow (comportement non documenté en v2).
 *
 * SOLUTION : BroadcastChannel
 *   • API native Chromium / WebView2 (Windows)
 *   • Fonctionne garantiment entre fenêtres de MÊME origine (http://localhost:5173)
 *   • Aucun IPC Tauri, aucun WebSocket, aucune dépendance externe
 *   • Payload léger : on envoie l'ID m-xxx, le Hub résout depuis l'IndexedDB partagée
 *
 * CANAL : 'gmos-map-sync' (distinct du canal session AppBridge)
 */

const MAP_SYNC_CHANNEL = 'gmos-map-sync';

export class MapService {
    private static lastSyncTime = 0;
    private static lastHeavySyncTime = 0;

    private static readonly LIGHT_THROTTLE_MS = 150;
    private static readonly HEAVY_THROTTLE_MS = 750;

    private static lastSentMapId: string | null = null;

    // ─────────────────────────────────────────────────────────
    //  Guard : seule la fenêtre MJ émet
    // ─────────────────────────────────────────────────────────
    private static isMJWindow(): boolean {
        const search = window.location.search;
        const path = window.location.pathname;
        return !search.includes('window=projector')
            && !search.includes('window=hub')
            && !search.includes('window=tablet')
            && !path.includes('/player-hub')
            && !path.includes('/tablet-hub');
    }

    // ─────────────────────────────────────────────────────────
    //  Envoi via BroadcastChannel (ferme immédiatement après)
    // ─────────────────────────────────────────────────────────
    private static broadcast(message: Record<string, unknown>): void {
        try {
            const bc = new BroadcastChannel(MAP_SYNC_CHANNEL);
            bc.postMessage(message);
            // Fermeture immédiate — on ne garde pas de canal ouvert en permanence
            // pour éviter les fuites mémoire sur les syncs fréquents
            bc.close();
        } catch (e) {
            console.error('[MapService] BroadcastChannel error:', e);
        }
    }

    /**
     * Synchronise l'état de la carte avec les joueurs.
     * Envoie l'ID brut (m-xxx) — le Hub résout depuis IndexedDB localement.
     */
    static syncMapToPlayers(forceHeavy = false): void {
        if (!MapService.isMJWindow()) return;

        const now = Date.now();
        if (!forceHeavy && (now - this.lastSyncTime < this.LIGHT_THROTTLE_MS)) return;
        if (forceHeavy && (now - this.lastHeavySyncTime < this.HEAVY_THROTTLE_MS)) {
            forceHeavy = false;
        }

        this.lastSyncTime = now;
        if (forceHeavy) this.lastHeavySyncTime = now;

        const store = useMapStore.getState();
        const target = store.projectionTarget;
        if (!target) return;

        const mapIdChanged = store.mapUrl !== this.lastSentMapId;
        if (mapIdChanged) this.lastSentMapId = store.mapUrl;

        const message: Record<string, unknown> = {
            type: 'map:sync',
            target,
            // Envoyer l'ID uniquement si la carte a changé (économise la bande passante IPC)
            mapId: mapIdChanged ? (store.mapUrl ?? null) : undefined,
            isVideo: store.isVideo,
            // Fog seulement sur heavy sync (DataURL canvas, potentiellement lourde)
            fogDataUrl: forceHeavy ? (store.fogDataUrl ?? null) : undefined,
            tokens: store.tokens,
            weatherType: store.weatherType,
            weatherIntensity: store.weatherIntensity,
            timeOfDay: store.timeOfDay,
            isGridEnabled: store.isGridEnabled,
            gridSize: store.gridSize,
            gridColor: store.gridColor,
            gridOpacity: store.gridOpacity,
            mapWidth: store.mapWidth,
            mapHeight: store.mapHeight,
            dangerZones: store.dangerZones,
            magicEffects: store.magicEffects,
            isMapMuted: store.isMapMuted,
            mapVolume: store.mapVolume,
        };

        MapService.broadcast(message);
    }

    /**
     * Efface la projection. Envoyer AVANT de réinitialiser le store.
     */
    static clearProjection(target: 'hub' | 'monitor' | null): void {
        if (!MapService.isMJWindow()) return;

        this.lastSentMapId = null;

        MapService.broadcast({
            type: 'map:clear',
            target: target ?? 'all',
        });

        console.log(`[MapService] Projection cleared for ${target ?? 'all'}`);
    }

    /**
     * Force un sync complet — réponse au signal hub:ready.
     * Envoie toutes les données incluant le fog.
     */
    static forceFullSync(): void {
        if (!MapService.isMJWindow()) return;

        // Réinitialiser les throttles et le cache d'ID pour forcer l'envoi complet
        this.lastSyncTime = 0;
        this.lastHeavySyncTime = 0;
        this.lastSentMapId = null;

        const store = useMapStore.getState();
        const target = store.projectionTarget;

        if (!target) {
            console.log('[MapService] forceFullSync: no active projection — sending clear');
            MapService.broadcast({ type: 'map:clear', target: 'hub' });
            return;
        }

        this.lastSentMapId = store.mapUrl;
        this.lastSyncTime = Date.now();
        this.lastHeavySyncTime = Date.now();

        const message: Record<string, unknown> = {
            type: 'map:sync',
            target,
            mapId: store.mapUrl ?? null,       // ID brut m-xxx — Hub résout depuis IndexedDB
            isVideo: store.isVideo,
            fogDataUrl: store.fogDataUrl ?? null,
            tokens: store.tokens,
            weatherType: store.weatherType,
            weatherIntensity: store.weatherIntensity,
            timeOfDay: store.timeOfDay,
            isGridEnabled: store.isGridEnabled,
            gridSize: store.gridSize,
            gridColor: store.gridColor,
            gridOpacity: store.gridOpacity,
            mapWidth: store.mapWidth,
            mapHeight: store.mapHeight,
            dangerZones: store.dangerZones,
            magicEffects: store.magicEffects,
            isMapMuted: store.isMapMuted,
            mapVolume: store.mapVolume,
        };

        console.log('[MapService] forceFullSync → BroadcastChannel:', {
            target,
            mapId: store.mapUrl,
            hasTokens: (store.tokens?.length ?? 0),
            hasFog: !!store.fogDataUrl,
        });

        MapService.broadcast(message);
    }
}
