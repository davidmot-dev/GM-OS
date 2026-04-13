import { useCallback, useEffect, useRef } from 'react';
import { useSessionStore } from '../../../store/useSessionStore';
import { useSoundStore } from '../../sound/useSoundStore';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useFavoriteStore } from '../../favorite/useFavoriteStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import { useClockStore } from '../../../store/useClockStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useImageStore } from '../../image/useImageStore';
import { useAmbientStore } from '../../ambient/useAmbientStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { useMapStore } from '../../map/useMapStore';
import { getDifferentialPayload } from '../../../utils/syncUtils';
import { resolveToSendableUrl } from '../../../utils/mediaResolver';

export const useNexusSynchronizer = (isMainPC: boolean) => {
    const lastSyncRef = useRef(0);
    const lastBroadcastRef = useRef<Record<string, unknown>>({});

    const syncFast = useCallback((segmentName: string) => {
        if (!isMainPC) return;
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
                    activePath: s.activePath, laserPointer: s.laserPointer, 
                    activeDrawerId: s.activeDrawerId, pathsCount: s.paths.length, version: s.version
                };
            } else if (segmentName === 'map') {
                const s = useMapStore.getState();
                payload.map = {
                    projectionTarget: s.projectionTarget, projectedMapUrl: s.projectedMapUrl,
                    projectedTokens: s.projectedTokens, projectedPings: s.projectedPings,
                    projectedFogDataUrl: s.projectedFogDataUrl
                };
            }

            if (Object.keys(payload).length > 0) {
                window.appBridge.send('remote:broadcast-sync', payload, 'remote');
                window.appBridge.send('remote:broadcast-sync', payload, 'gm');
                window.appBridge.send('remote:broadcast-sync', payload, 'player');
            }
        } catch (e) {
            console.error(`[NexusSync] Fast-Sync Error (${segmentName}):`, e);
        }
    }, [isMainPC]);

    const handleSync = useCallback(async (force: boolean = false) => {
        if (!isMainPC) return;
        const now = Date.now();
        if (!force && now - lastSyncRef.current < 100) return;
        lastSyncRef.current = now;

        try {
            const soundStore = useSoundStore.getState();
            const storyboardStore = useStoryboardStore.getState();
            const combatStore = useCombatStore.getState();
            const freshSessionOS = useSessionOSStore.getState();
            const favoriteStore = useFavoriteStore.getState();
            const musicStore = useMusicStore.getState();
            const imageStore = useImageStore.getState();
            const ambientStore = useAmbientStore.getState();
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
            // Toutes les images liées à des entités, lieux, joueurs et favoris
            // doivent être résolues côté PC avant d'être envoyées à la tablette.

            // 4a. Portraits des personnages joueurs
            const resolvedPlayers = await Promise.all(players.map(async (player) => ({
                ...player,
                avatarUrl: player.avatarUrl ? await resolveToSendableUrl(player.avatarUrl) : undefined,
                characters: await Promise.all((player.characters || []).map(async (char) => ({
                    ...char,
                    portraitUrl: char.portraitUrl ? await resolveToSendableUrl(char.portraitUrl) : undefined,
                }))),
            })));

            // 4b. Portraits des entités (PNJ, créatures, lieux)
            const resolvedEntities = await Promise.all(entities.map(async (entity) => ({
                ...entity,
                portraitUrl: (entity as { portraitUrl?: string }).portraitUrl
                    ? await resolveToSendableUrl((entity as { portraitUrl?: string }).portraitUrl!)
                    : undefined,
                imageUrl: (entity as { imageUrl?: string }).imageUrl
                    ? await resolveToSendableUrl((entity as { imageUrl?: string }).imageUrl!)
                    : undefined,
            })));

            // 4c. Images des lieux (atlasMaps)
            const resolvedAtlasMaps = await Promise.all(atlasMaps.map(async (map) => ({
                ...map,
                imageUrl: (map as { imageUrl?: string }).imageUrl
                    ? await resolveToSendableUrl((map as { imageUrl?: string }).imageUrl!)
                    : undefined,
            })));

            // 4d. Wallpaper de campagne
            const resolvedWallpaper = freshSessionOS.activeCampaignWallpaper
                ? await resolveToSendableUrl(freshSessionOS.activeCampaignWallpaper)
                : null;

            // 4e. Favoris (images de cartes)
            const resolvedFavorites = await Promise.all(favoriteStore.favorites.map(async (fav) => ({
                ...fav,
                imageUrl: (fav as { imageUrl?: string }).imageUrl
                    ? await resolveToSendableUrl((fav as { imageUrl?: string }).imageUrl!)
                    : undefined,
                coverUrl: (fav as { coverUrl?: string }).coverUrl
                    ? await resolveToSendableUrl((fav as { coverUrl?: string }).coverUrl!)
                    : undefined,
            })));

            const fullState = {
                sounds, moments: storyboardStore.moments.filter(m => String(m.campaignId) === String(currentCampaignId)).map(m => ({ id: m.id, name: m.name })),
                masterVolume: soundStore.masterVolume,
                combat: { combatants: resolvedCombatants, currentTurnIdx: combatStore.currentTurnIdx, round: combatStore.round },
                notes,
                whiteboard: { paths: whiteboardStore.paths, activePath: whiteboardStore.activePath, laserPointer: whiteboardStore.laserPointer, backgroundMode: whiteboardStore.backgroundMode },
                clock: { timestamp: clockStore.timestamp, tensions: clockStore.tensions, timerRemaining: clockStore.timerRemaining, timerIsRunning: clockStore.timerIsRunning },
                universalPads,
                dice: { lastRoll: diceStore.lastRoll, isDiceProjected: diceStore.isDiceProjected },
                map: { projectionTarget: mapStore.projectionTarget, projectedMapUrl: mapStore.projectedMapUrl, projectedTokens: mapStore.projectedTokens, projectedPings: mapStore.projectedPings },
                // ── Session Data ──────────────────────────────────────────────────
                session: {
                    sessions,
                    campaigns,
                    players: resolvedPlayers,
                    entities: resolvedEntities,
                    atlasMaps: resolvedAtlasMaps,
                    clues,
                    customSheetTemplates,
                    customGameDrivers,
                    activeCampaignId: currentCampaignId,
                    activeCampaignName: freshSessionOS.activeCampaignName,
                    activeCampaignWallpaper: resolvedWallpaper,
                    characterLocks: freshSessionOS.connectedCharacters,
                    favorites: resolvedFavorites,
                },
            };

            const diffPayload = force ? fullState : getDifferentialPayload(fullState, lastBroadcastRef.current);
            
            if (Object.keys(diffPayload).length > 0) {
                // Roles: remote/gm see everything. player sees sanitized.
                window.appBridge.send('remote:broadcast-sync', diffPayload, 'remote');
                window.appBridge.send('remote:broadcast-sync', diffPayload, 'gm');

                const playerDiff = JSON.parse(JSON.stringify(diffPayload));
                if (playerDiff.notes) playerDiff.notes.private = '•••••';
                window.appBridge.send('remote:broadcast-sync', playerDiff, 'player');

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
            useWhiteboardStore.subscribe((s, prev) => s.paths.length !== prev.paths.length ? handleSync() : syncFast('whiteboard')),
            useClockStore.subscribe(() => syncFast('clock')),
            useMusicStore.subscribe(() => handleSync()),
            useSoundStore.subscribe(() => handleSync()),
            useImageStore.subscribe(() => handleSync()),
            useCombatStore.subscribe((s, prev) => (s.combatants !== prev.combatants) ? handleSync() : syncFast('combat')),
            useDiceStore.subscribe(() => syncFast('dice')),
            useMapStore.subscribe((s, prev) => (s.projectedMapUrl !== prev.projectedMapUrl) ? handleSync() : syncFast('map')),
            useSessionOSStore.subscribe(() => handleSync())
        ];

        handleSync(true); // Initial sync

        return () => unsubs.forEach(u => u());
    }, [isMainPC, handleSync, syncFast]);

    return { handleSync, syncFast };
};
