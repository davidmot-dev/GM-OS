import { useCallback, useEffect, useRef } from 'react';

import { useSoundStore } from '../../sound/useSoundStore';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useFavoriteStore } from '../../favorite/useFavoriteStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import { useClockStore } from '../../../store/useClockStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useImageStore } from '../../image/useImageStore';

import { useDiceStore } from '../../../stores/useDiceStore';
import { useMapStore } from '../../map/useMapStore';
import { getDifferentialPayload } from '../../../utils/syncUtils';
import { resolveToSendableUrl } from '../../../utils/mediaResolver';
import { crossWindowSync } from '../../../services/CrossWindowEventService';

export const useNexusSynchronizer = (isMainPC: boolean) => {
    const lastSyncRef = useRef(0);
    const lastBroadcastRef = useRef<Record<string, unknown>>({});
    const lastMapFastSyncRef = useRef(0);
    const lastWhiteboardFastSyncRef = useRef(0);

    const syncFast = useCallback((segmentName: string) => {
        if (!isMainPC) return;
        // Avoid re-broadcasting updates that are already being handled by CrossWindowSync
        if (crossWindowSync.isSyncing()) return;

        // Throttle map fast sync to avoid flooding the network (e.g. 100ms = 10fps)
        if (segmentName === 'map') {
            const now = Date.now();
            if (now - lastMapFastSyncRef.current < 100) return;
            lastMapFastSyncRef.current = now;
        }

        // Throttle whiteboard fast sync during drawing to 50ms (20fps), but bypass on end (activePath: null)
        if (segmentName === 'whiteboard') {
            const s = useWhiteboardStore.getState();
            const now = Date.now();
            const isDrawingEnd = s.activePath === null;
            if (!isDrawingEnd && (now - lastWhiteboardFastSyncRef.current < 50)) return;
            lastWhiteboardFastSyncRef.current = now;
        }
        
        try {
            const payload: Record<string, unknown> = {};
            if (segmentName === 'dice') {
                const s = useDiceStore.getState();
                payload.dice = { lastRoll: s.lastRoll, isDiceProjected: s.isDiceProjected, projectionTrigger: s.projectionTrigger };
            } else if (segmentName === 'clock') {
                const s = useClockStore.getState();
                payload.clock = { 
                    timestamp: s.timestamp, mode: s.mode, isClockProjected: s.isClockProjected, 
                    theme: s.theme, tensions: s.tensions, timerRemaining: s.timerRemaining,
                    timerIsRunning: s.timerIsRunning, timerLabel: s.timerLabel, timerDuration: s.timerDuration
                };
            } else if (segmentName === 'combat') {
                const s = useCombatStore.getState();
                payload.combat = { combatants: s.combatants, currentTurnIdx: s.currentTurnIdx, round: s.round };
            } else if (segmentName === 'whiteboard') {
                const s = useWhiteboardStore.getState();
                payload.whiteboard = { 
                    paths: s.paths,
                    activePath: s.activePath, 
                    laserPointer: s.laserPointer, 
                    activeDrawerId: s.activeDrawerId, 
                    backgroundMode: s.backgroundMode,
                    pathsCount: s.paths.length, 
                    version: s.version
                };
            } else if (segmentName === 'map') {
                const s = useMapStore.getState();
                payload.map = {
                    projectionTarget: s.projectionTarget,
                    projectedMapUrl: s.projectedMapUrl,
                    projectedIsVideo: s.projectedIsVideo,
                    projectedTokens: s.projectedTokens,
                    projectedPings: s.projectedPings,
                    projectedFogDataUrl: s.projectedFogDataUrl,
                    projectedMapWidth: s.projectedMapWidth,
                    projectedMapHeight: s.projectedMapHeight,
                    projectedIsGridEnabled: s.projectedIsGridEnabled,
                    projectedGridSize: s.projectedGridSize,
                    projectedGridColor: s.projectedGridColor,
                    projectedGridOpacity: s.projectedGridOpacity,
                    projectedIsMapMuted: s.projectedIsMapMuted,
                    projectedMapVolume: s.projectedMapVolume
                };
            }

            if (Object.keys(payload).length > 0 && window.appBridge) {
                window.appBridge.send('remote:broadcast-sync', payload, 'remote');
                window.appBridge.send('remote:broadcast-sync', payload, 'gm');
                window.appBridge.send('remote:broadcast-sync', payload, 'player');
                window.appBridge.send('remote:broadcast-sync', payload, 'hub');
            }
        } catch (e) {
            console.error(`[NexusSync] Fast-Sync Error (${segmentName}):`, e);
        }
    }, [isMainPC]);

    const handleSync = useCallback(async (force: boolean = false) => {
        if (!isMainPC) return;
        
        // Skip sync if the system is performing an atomic operation (Nexus import)
        if (useSessionOSStore.getState().isSystemSyncing || crossWindowSync.isSyncing()) {
            console.log('[NexusSync] Sync skipped: system or cross-window sync in progress.');
            return;
        }

        const now = Date.now();
        if (!force && now - lastSyncRef.current < 500) return; // Increased from 100ms to 500ms
        lastSyncRef.current = now;

        try {
            const soundStore = useSoundStore.getState();
            const storyboardStore = useStoryboardStore.getState();
            const combatStore = useCombatStore.getState();
            const freshSessionOS = useSessionOSStore.getState();
            const favoriteStore = useFavoriteStore.getState();
            const musicStore = useMusicStore.getState();
            const imageStore = useImageStore.getState();

            const clockStore = useClockStore.getState();
            const whiteboardStore = useWhiteboardStore.getState();
            const diceStore = useDiceStore.getState();
            const mapStore = useMapStore.getState();

            const { sessions, campaigns, entities, players, activeCampaignId: currentCampaignId, clues, atlasMaps, customSheetTemplates, customGameDrivers } = freshSessionOS;

            // 1. SOUNDS/PADS
            const atmosId = soundStore.activeAtmosphereId;
            const atmosphere = soundStore.atmospheres.find(a => a.id === atmosId) || soundStore.atmospheres[0];
            const sounds = atmosphere ? Object.values(atmosphere.pads).filter(p => !!p.filePath).map(p => ({
                id: p.id, title: p.title || p.id, active: true 
            })) : [];

            // 2. UNIVERSAL PADS
            const musicPlaylist = musicStore.playlists.find(p => p.id === musicStore.activePlaylistId) || musicStore.playlists[0];
            const musicPads = (musicPlaylist?.pads.filter(p => !!p.url) || []).slice(0, 5).map(p => ({
                id: p.id, type: 'music' as const, label: p.label || 'Sans Nom', color: 'var(--accent)'
            }));

            const favoriteImages = imageStore.mediaList.filter(m => m.isFavorite).slice(0, 12);
            const resolvedImagePads = await Promise.all(favoriteImages.map(async (m) => ({
                id: m.id, type: 'image' as const, label: m.name, imageUrl: await resolveToSendableUrl(m.path), color: 'var(--emerald-500)'
            })));

            const universalPads = [...musicPads, ...resolvedImagePads];

            // 3. COMBAT & ENTITIES
            const resolvedCombatants = (await Promise.all(combatStore.combatants.map(async (c) => ({
                id: c.id, name: c.name, hp: c.hp, hpMax: c.hpMax, init: c.init, isPlayer: c.isPlayer,
                healthSystem: c.healthSystem, avatar: await resolveToSendableUrl(c.avatar || ''), statuses: c.statuses
            })))).filter(c => c.isPlayer || !c.statuses?.some(s => ['invisible', 'caché', 'hidden'].includes(s.name.toLowerCase())));

            // 4. SESSION & NOTES
            const activeSession = sessions.find(s => s.status === 'active' && String(s.campaignId) === String(currentCampaignId));
            const notes = {
                public: activeSession?.publicSummary || 'Aucun résumé public.',
                private: activeSession?.gmSecrets || 'Confidentiel.'
            };

            // ── RÉSOLUTION GLOBALE DES MÉDIAS (m-xxx → URL HTTP/base64) ────────
            // Champs réels utilisés par les composants Hub :
            //   Entity    → .avatar
            //   AtlasMap  → .fileUrl
            //   Clue      → .mediaUrl
            //   Player    → .avatarUrl  |  PlayerCharacter → .portraitUrl
            //   Favorite  → .imageUrl, .tokenUrl

            // 4a. Avatars des joueurs et portraits des personnages
            const resolvedPlayers = await Promise.all(players.map(async (player) => ({
                ...player,
                avatarUrl: player.avatarUrl ? await resolveToSendableUrl(player.avatarUrl) : undefined,
                characters: await Promise.all((player.characters || []).map(async (char) => ({
                    ...char,
                    portraitUrl: char.portraitUrl ? await resolveToSendableUrl(char.portraitUrl) : undefined,
                }))),
            })));

            // 4b. Avatars des entités (PNJ, créatures) — champ réel : .avatar
            const resolvedEntities = await Promise.all(entities.map(async (entity) => ({
                ...entity,
                avatar: entity.avatar ? await resolveToSendableUrl(entity.avatar) : '',
            })));

            // 4c. Images des lieux (AtlasMap) — champ réel : .fileUrl
            const resolvedAtlasMaps = await Promise.all(atlasMaps.map(async (map) => ({
                ...map,
                fileUrl: map.fileUrl ? await resolveToSendableUrl(map.fileUrl) : '',
            })));

            // 4d. Indices (Clue) — champ réel : .mediaUrl
            const resolvedClues = await Promise.all(clues.map(async (clue) => ({
                ...clue,
                mediaUrl: clue.mediaUrl ? await resolveToSendableUrl(clue.mediaUrl) : undefined,
            })));

            // 4e. Wallpaper de campagne
            const activeCampaign = campaigns.find(c => c.id === currentCampaignId);
            const rawWallpaper = activeCampaign?.wallpaperUrl || freshSessionOS.activeCampaignWallpaper;
            const resolvedWallpaper = rawWallpaper
                ? await resolveToSendableUrl(rawWallpaper)
                : null;

            if (resolvedWallpaper && rawWallpaper) {
                console.log(`[NexusSync] Wallpaper resolved: ${rawWallpaper.substring(0, 30)}... -> ${resolvedWallpaper.substring(0, 50)}...`);
            }

            // 4f. Favoris — champs réels : .imageUrl, .tokenUrl
            const resolvedFavorites = await Promise.all(favoriteStore.favorites.map(async (fav) => ({
                ...fav,
                imageUrl: (fav as { imageUrl?: string }).imageUrl
                    ? await resolveToSendableUrl((fav as { imageUrl?: string }).imageUrl!)
                    : undefined,
                tokenUrl: (fav as { tokenUrl?: string }).tokenUrl
                    ? await resolveToSendableUrl((fav as { tokenUrl?: string }).tokenUrl!)
                    : undefined,
            })));

            const fullState = {
                sounds, moments: storyboardStore.moments.filter(m => String(m.campaignId) === String(currentCampaignId)).map(m => ({ id: m.id, name: m.name })),
                masterVolume: soundStore.masterVolume,
                combat: { 
                    combatants: resolvedCombatants, 
                    currentTurnIdx: combatStore.currentTurnIdx, 
                    round: combatStore.round,
                    isCombatProjected: combatStore.isCombatProjected
                },
                notes,
                whiteboard: { paths: whiteboardStore.paths, activePath: whiteboardStore.activePath, laserPointer: whiteboardStore.laserPointer, backgroundMode: whiteboardStore.backgroundMode },
                clock: { timestamp: clockStore.timestamp, tensions: clockStore.tensions, timerRemaining: clockStore.timerRemaining, timerIsRunning: clockStore.timerIsRunning },
                universalPads,
                dice: { lastRoll: diceStore.lastRoll, isDiceProjected: diceStore.isDiceProjected, projectionTrigger: diceStore.projectionTrigger },
                map: { 
                    projectionTarget: mapStore.projectionTarget, 
                    projectedMapUrl: mapStore.projectedMapUrl, 
                    projectedIsVideo: mapStore.projectedIsVideo,
                    projectedTokens: mapStore.projectedTokens, 
                    projectedPings: mapStore.projectedPings,
                    projectedFogDataUrl: mapStore.projectedFogDataUrl,
                    projectedMapWidth: mapStore.projectedMapWidth,
                    projectedMapHeight: mapStore.projectedMapHeight,
                    projectedIsGridEnabled: mapStore.projectedIsGridEnabled,
                    projectedGridSize: mapStore.projectedGridSize,
                    projectedGridColor: mapStore.projectedGridColor,
                    projectedGridOpacity: mapStore.projectedGridOpacity,
                    projectedIsMapMuted: mapStore.projectedIsMapMuted,
                    projectedMapVolume: mapStore.projectedMapVolume
                },
                // ── Session Data ──────────────────────────────────────────────────
                session: {
                    sessions,
                    campaigns,
                    players: resolvedPlayers,
                    entities: resolvedEntities,
                    atlasMaps: resolvedAtlasMaps,
                    clues: resolvedClues,
                    customSheetTemplates,
                    customGameDrivers,
                    activeCampaignId: currentCampaignId,
                    activeCampaignName: freshSessionOS.activeCampaignName || campaigns.find(c => c.id === currentCampaignId)?.name || 'NONE',
                    activeCampaignWallpaper: resolvedWallpaper,
                    characterLocks: freshSessionOS.connectedCharacters,
                    favorites: resolvedFavorites,
                },
            };

            if (isMainPC) {
                console.log('[NexusSync] Broadcasting state update:', {
                    activeCampaignId: currentCampaignId,
                    activeCampaignName: fullState.session.activeCampaignName,
                    sessions: fullState.session.sessions.length,
                    activeSessionId: fullState.session.sessions.find(s => s.status === 'active')?.id
                });
            }

            const diffPayload = force ? fullState : getDifferentialPayload(fullState, lastBroadcastRef.current);
            
            if (Object.keys(diffPayload).length > 0 && window.appBridge) {
                // Roles: remote/gm see everything. player sees sanitized.
                window.appBridge.send('remote:broadcast-sync', diffPayload, 'remote');
                window.appBridge.send('remote:broadcast-sync', diffPayload, 'gm');

                const playerDiff = JSON.parse(JSON.stringify(diffPayload));
                
                // Sanitization for Player Role
                if (playerDiff.notes) playerDiff.notes.private = '•••••';
                
                if (playerDiff.session?.sessions) {
                    playerDiff.session.sessions = playerDiff.session.sessions.map((s: any) => {
                        const { feedbacks, ...rest } = s;
                        return rest;
                    });
                }

                if (playerDiff.session?.entities) {
                    playerDiff.session.entities = playerDiff.session.entities.map((e: any) => ({
                        ...e,
                        gmSecretInfo: '•••••',
                        roleplayingNotes: '•••••'
                    }));
                }

                if (playerDiff.combat?.combatants) {
                    playerDiff.combat.combatants = playerDiff.combat.combatants.map((c: any) => ({
                        ...c,
                        gmSecretInfo: '•••••',
                        roleplayingNotes: '•••••'
                    }));
                }

                window.appBridge.send('remote:broadcast-sync', playerDiff, 'player');
                window.appBridge.send('remote:broadcast-sync', playerDiff, 'hub'); // Ensuring Hubs get the player-sanitized data too

                lastBroadcastRef.current = fullState;
            }
        } catch (e) {
            console.error('[NexusSync] Full Sync Error:', e);
        }
    }, [isMainPC]);

    // Subscriptions logic
    useEffect(() => {
        if (!isMainPC) return;

        const unsubs = [
            useWhiteboardStore.subscribe(() => syncFast('whiteboard')),
            useClockStore.subscribe(() => syncFast('clock')),
            useMusicStore.subscribe(() => handleSync()),
            useSoundStore.subscribe(() => handleSync()),
            useImageStore.subscribe(() => handleSync()),
            useCombatStore.subscribe(() => handleSync()),
            useDiceStore.subscribe(() => syncFast('dice')),
            useMapStore.subscribe((s, prev) => (s.projectedMapUrl !== prev.projectedMapUrl) ? handleSync() : syncFast('map')),
            useSessionOSStore.subscribe(() => handleSync())
        ];

        handleSync(true); // Initial sync

        return () => unsubs.forEach(u => u());
    }, [isMainPC, handleSync, syncFast]);

    return { handleSync, syncFast };
};
