import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { useSessionStore } from './store/useSessionStore';
import Shell from './components/Shell';
import { useModalStore } from './stores/useModalStore';
import SplashScreenSelector from './components/splash/SplashScreenSelector';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingOverlay from './components/common/LoadingOverlay';

// --- STORES (Safe for Web) ---
import { useSoundStore } from './modules/sound/useSoundStore';
import { useStoryboardStore } from './modules/storyboard/useStoryboardStore';
import { useMapStore } from './modules/map/useMapStore';
import { useCombatStore } from './modules/combat/useCombatStore';
import { useSessionOSStore } from './modules/session/useSessionOSStore';
import { useFavoriteStore } from './modules/favorite/useFavoriteStore';
import { useWhiteboardStore, type Point, type DrawingPath, type WhiteboardTool } from './modules/whiteboard/useWhiteboardStore';
import { useClockStore } from './store/useClockStore';
import { useMusicStore } from './modules/music/useMusicStore';
import { useImageStore } from './modules/image/useImageStore';
import { useAmbientStore } from './modules/ambient/useAmbientStore';
import { useDiceStore } from './stores/useDiceStore';
import { DiceEngine } from './modules/dice/DiceEngine';
import { useMediaStore } from './stores/useMediaStore';
import { getDifferentialPayload } from './utils/syncUtils';
import { spatialTriggerService } from './modules/map/SpatialTriggerService';
import { useDisplayDetection } from './hooks/useDisplayDetection';
import { resolveToSendableUrl } from './utils/mediaResolver';

interface RemoteAction {
  type: string;
  payload?: any;
}

// --- LAZY COMPONENTS (Critical for Remote Stability) ---
const RemoteControl = lazy(() => import('./modules/remote/RemoteControl'));
const SessionDashboard = lazy(() => import('./modules/session/SessionDashboard'));
const DiceBoard = lazy(() => import('./modules/dice/DiceBoard'));
const MusicDashboard = lazy(() => import('./modules/music/MusicDashboard'));
const CombatDashboard = lazy(() => import('./modules/combat/CombatDashboard'));
const NPCDashboard = lazy(() => import('./modules/npc/NPCDashboard'));
const MapDashboard = lazy(() => import('./modules/map/MapDashboard'));
const ClockDashboard = lazy(() => import('./modules/clock/ClockDashboard'));
const AmbientDashboard = lazy(() => import('./modules/ambient/AmbientDashboard'));
const TableDashboard = lazy(() => import('./modules/tables/TableDashboard'));
const WebDashboard = lazy(() => import('./modules/web/WebDashboard'));
const ImageDashboard = lazy(() => import('./modules/image/ImageDashboard'));
const SoundDashboard = lazy(() => import('./modules/sound/SoundDashboard'));
const LightDashboard = lazy(() => import('./modules/light/LightDashboard'));
const WhiteboardDashboard = lazy(() => import('./modules/whiteboard/WhiteboardDashboard'));
const DebugDashboard = lazy(() => import('./modules/debug/DebugDashboard'));
const VoiceDashboard = lazy(() => import('./modules/voice/VoiceDashboard'));
const ProjectorView = lazy(() => import('./modules/image/components/ProjectorView'));
const PlayerHub = lazy(() => import('./components/PlayerHub'));
const TabletHub = lazy(() => import('./components/TabletHub'));
const ObsidianPanel = lazy(() => import('./modules/session/components/ObsidianPanel'));
const JournalDashboard = lazy(() => import('./modules/journal/JournalDashboard'));
const FavoriteDashboard = lazy(() => import('./modules/favorite/components/FavoriteDashboard').then(m => ({ default: m.FavoriteDashboard })));

// --- SHARED COMPONENTS ---
const ModalProvider = lazy(() => import('./components/ModalProvider'));
const ToastProvider = lazy(() => import('./components/ToastProvider'));
const AudioRouter = lazy(() => import('./modules/music/components/AudioRouter'));
const MediaBrowser = lazy(() => import('./components/MediaBrowser').then(m => ({ default: m.MediaBrowser })));
const GlobalKeybinds = lazy(() => import('./components/GlobalKeybinds').then(m => ({ default: m.GlobalKeybinds })));
const SpotlightSearch = lazy(() => import('./components/SpotlightSearch').then(m => ({ default: m.SpotlightSearch })));
const MessageAlertOverlay = lazy(() => import('./modules/session/components/MessageAlertOverlay').then(m => ({ default: m.MessageAlertOverlay })));

const PlaceholderModule = ({ name }: { name: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-700" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight">Module {name}</h2>
  </div>
);

interface UniversalPad {
  id: string;
  type: 'music' | 'sound' | 'image' | 'ambient';
  label: string;
  color: string;
  imageUrl?: string;
  sublabel?: string;
}

function App() {
  const lastSyncRef = React.useRef(0);
  const lastBroadcastRef = React.useRef<Record<string, unknown>>({});
  const lastBroadcastedRollId = React.useRef<string | null>(null);
  const { activeModule, theme } = useSessionStore();
  const lastRoll = useDiceStore(state => state.lastRoll);
  const sessionOSStore = useSessionOSStore();
  const { activeCampaignId } = sessionOSStore;
  const { isMediaHubOpen, closeMediaHub } = useModalStore();
  const [showSplash, setShowSplash] = useState(true);

  const searchParams = new URLSearchParams(window.location.search);
  const isProjector = searchParams.get('window') === 'projector';
  const isHub = searchParams.get('window') === 'hub';
  const isTablet = searchParams.get('window') === 'tablet';
  const isRemote = searchParams.get('window') === 'remote';

  // Workspace Sync v2: Intelligent display detection (Main GM window only)
  const isMainPC = !isProjector && !isHub && !isTablet && !isRemote;
  useDisplayDetection(isMainPC);
  
  // Automated GitHub Backup (DISABLED)
  // useBackupSync();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Diffusion automatique des résultats de dés vers les Remote MJ (Centralisée)
  useEffect(() => {
    if (lastRoll && window.appBridge?.remote?.broadcastUIAction && lastRoll.id !== lastBroadcastedRollId.current) {
      console.log('[App] Auto-broadcasting dice result to remotes:', lastRoll.id);
      lastBroadcastedRollId.current = lastRoll.id;
      window.appBridge.remote.broadcastUIAction({
        type: 'dice:result',
        payload: lastRoll
      });
    }
  }, [lastRoll]);

  /* 
  // Automatic Media Cleanup on startup (Main PC only)
  useEffect(() => {
    if (!isMainPC) return;
    
    const timer = setTimeout(() => {
      console.log("[App] Running automatic media cleanup...");
      mediaCleanupService.performCleanup().then(res => {
        if (res.deletedCount > 0) {
          console.log(`[App] Media cleanup finished: ${res.deletedCount} items removed, ${(res.savedBytes / 1024 / 1024).toFixed(2)} MB saved.`);
        }
      }).catch(err => console.error("[App] Media cleanup failed:", err));
    }, 5000); // 5s delay to let everything settle
    return () => clearTimeout(timer);
  }, [isMainPC]);
  */

  // --- MESSAGING BRIDGE (GM SIDE) ---
  // If the GM-OS Main window triggers a message (via remoteSendMessage), 
  // we catch the CustomEvent and broadcast it to all connected hubs/tablets.
  useEffect(() => {
    if (!isMainPC) return;

    const handleSendMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (window.appBridge?.remote?.broadcastUIAction) {
        console.log('[App] Broadcasting GM message to Bridge:', customEvent.detail.id);
        window.appBridge.remote.broadcastUIAction({
          type: 'session:receive-message',
          payload: customEvent.detail
        });
      }
    };

    window.addEventListener('session:send-message', handleSendMessage);
    return () => window.removeEventListener('session:send-message', handleSendMessage);
  }, [isMainPC]);

  const syncFast = useCallback((segmentName: string) => {
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
            activePath: s.activePath, 
            laserPointer: s.laserPointer, 
            activeDrawerId: s.activeDrawerId,
            pathsCount: s.paths.length,
            version: s.version
        };
      } else if (segmentName === 'map') {
        const s = useMapStore.getState();
        payload.map = {
          projectionTarget: s.projectionTarget,
          projectedMapUrl: s.projectedMapUrl,
          projectedTokens: s.projectedTokens,
          projectedPings: s.projectedPings,
          projectedFogDataUrl: s.projectedFogDataUrl
        };
      }

      if (Object.keys(payload).length > 0) {
        console.log(`[SyncFast] Sending high-priority segment: ${segmentName}`);
        window.appBridge.send('remote:broadcast-sync', payload);
      }
    } catch (e) {
      console.error(`[SyncFast] Error syncing ${segmentName}:`, e);
    }
  }, []);

  const handleSync = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    if (!force && now - lastSyncRef.current < 100) return;
    lastSyncRef.current = now;
    try {
      const soundStore = useSoundStore.getState();
      const storyboardStore = useStoryboardStore.getState();
      const combatStore = useCombatStore.getState();
      const freshSessionOS = useSessionOSStore.getState();
      const favoriteStore = useFavoriteStore.getState();
      const { sessions, campaigns, entities, players, activeCampaignId: currentCampaignId, clues, atlasMaps, customSheetTemplates, customGameDrivers } = freshSessionOS;
      
      const atmosId = soundStore.activeAtmosphereId;
      let atmosphere = soundStore.atmospheres.find(a => a.id === atmosId);
      
      // Fallback: Si aucune atmosphère active, on prend la première disponible
      if (!atmosphere && soundStore.atmospheres.length > 0) {
        atmosphere = soundStore.atmospheres[0];
      }

      const sounds = atmosphere ? Object.values(atmosphere.pads)
        .filter(p => !!p.filePath) // Uniquement les pads avec un fichier
        .map(p => ({
          id: p.id, 
          title: p.title || `Son ${p.id.split('_')[1]}`, 
          active: true 
        })) : [];

      let universalPads: UniversalPad[] = [];
      try {
        const musicStore = useMusicStore.getState();
        const imageStore = useImageStore.getState();
        const ambientStore = useAmbientStore.getState();

        // MUSIC
        let musicPlaylist = musicStore.playlists.find(p => p.id === musicStore.activePlaylistId);
        if (!musicPlaylist && musicStore.playlists.length > 0) musicPlaylist = musicStore.playlists[0];
        const musicPads = (musicPlaylist?.pads.filter(p => !!p.url) || []).slice(0, 5).map(p => ({
          id: p.id, type: 'music' as const, label: p.label || 'Sans Nom', color: 'var(--accent)'
        }));

        // SOUND (SFX)
        let soundAtmosphere = soundStore.atmospheres.find(a => a.id === atmosId);
        if (!soundAtmosphere && soundStore.atmospheres.length > 0) soundAtmosphere = soundStore.atmospheres[0];
        const sfxPads = (soundAtmosphere ? Object.values(soundAtmosphere.pads) : [])
          .filter(p => !!p.filePath).slice(0, 16).map(p => ({
          id: p.id, type: 'sound' as const, label: p.title || p.id, color: 'var(--rose-500)'
        }));

        // IMAGE
        let favoriteImages = imageStore.mediaList.filter(m => m.isFavorite);
        if (favoriteImages.length === 0 && imageStore.mediaList.length > 0) {
          favoriteImages = imageStore.mediaList.slice(0, 12);
        }
        const imagePads = favoriteImages.slice(0, 12).map(m => ({
          id: m.id, type: 'image' as const, label: m.name, imageUrl: m.path, color: 'var(--emerald-500)'
        }));
        const resolvedImagePads = await Promise.all(imagePads.map(async (p) => {
          const resolvedUrl = await resolveToSendableUrl(p.imageUrl);
          return {
            ...p,
            type: 'image' as const,
            imageUrl: resolvedUrl
          };
        }));

        // AMBIENT
        const ambientPads = ambientStore.presets.slice(0, 12).map(p => ({
          id: p.id, type: 'ambient' as const, label: p.name, sublabel: p.universe, color: 'var(--blue-500)'
        }));

        universalPads = [...musicPads, ...sfxPads, ...resolvedImagePads, ...ambientPads];
      } catch (e) {
        console.error('[App] Failed to aggregate universal pads', e);
      }

      const moments = storyboardStore.moments
        .filter(m => m.campaignId === currentCampaignId)
        .map(m => ({ id: m.id, name: m.name }));


      const activeSession = sessions.find((s: import('./modules/session/store/types').GameSession) => 
          s.status === 'active' && String(s.campaignId) === String(currentCampaignId)
      ) || (sessions.length > 0 ? [...sessions].reverse().find((s: import('./modules/session/store/types').GameSession) => 
          String(s.campaignId) === String(currentCampaignId)
      ) : undefined);

      const notes = {
        public: activeSession?.publicSummary || activeSession?.sessionNotes || 'Aucun résumé public.',
        private: activeSession?.gmSecrets || activeSession?.sessionNotes || 'Aucune note secrète.'
      };

      const resolvedCombatants = (await Promise.all(
        combatStore.combatants.map(async (c) => {
          const resolvedAvatar = await resolveToSendableUrl(c.avatar || '');
          return {
            id: c.id, name: c.name, hp: c.hp, hpMax: c.hpMax,
            init: c.init, isPlayer: c.isPlayer, healthSystem: c.healthSystem,
            avatar: resolvedAvatar,
            statuses: c.statuses
          };
        })
      )).filter(c => c.isPlayer || !c.statuses?.some(s => {
        const n = s.name.toLowerCase();
        return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
      }));

      const combat = {
        combatants: resolvedCombatants,
        currentTurnIdx: combatStore.currentTurnIdx,
        round: combatStore.round
      };

      const clockStore = useClockStore.getState();
      const clock = {
        timestamp: clockStore.timestamp,
        mode: clockStore.mode,
        isClockProjected: clockStore.isClockProjected,
        theme: clockStore.theme,
        tensions: clockStore.tensions,
        timerRemaining: clockStore.timerRemaining,
        timerIsRunning: clockStore.timerIsRunning,
        timerLabel: clockStore.timerLabel,
        timerDuration: clockStore.timerDuration
      };

      const whiteboardStore = useWhiteboardStore.getState();
      const whiteboard = {
        paths: whiteboardStore.paths,
        activePath: whiteboardStore.activePath,
        laserPointer: whiteboardStore.laserPointer,
        backgroundMode: whiteboardStore.backgroundMode,
        currentTool: whiteboardStore.currentTool,
        currentColor: whiteboardStore.currentColor,
        currentWidth: whiteboardStore.currentWidth
      };

      const diceStore = useDiceStore.getState();
      const dice = {
        lastRoll: diceStore.lastRoll,
        isDiceProjected: diceStore.isDiceProjected,
        projectionTrigger: diceStore.projectionTrigger
      };
      
      const mapStore = useMapStore.getState();
      const map = {
          projectionTarget: mapStore.projectionTarget,
          projectedMapUrl: mapStore.projectedMapUrl,
          projectedIsVideo: mapStore.projectedIsVideo,
          projectedFogDataUrl: mapStore.projectedFogDataUrl,
          projectedTokens: mapStore.projectedTokens,
          projectedPings: mapStore.projectedPings,
          projectedMagicEffects: mapStore.projectedMagicEffects,
          projectedWeatherType: mapStore.projectedWeatherType,
          projectedWeatherIntensity: mapStore.projectedWeatherIntensity,
          projectedMapWidth: mapStore.projectedMapWidth,
          projectedMapHeight: mapStore.projectedMapHeight,
          projectedIsGridEnabled: mapStore.projectedIsGridEnabled,
          projectedGridSize: mapStore.projectedGridSize,
          projectedGridColor: mapStore.projectedGridColor,
          projectedGridOpacity: mapStore.projectedGridOpacity,
          projectedIsMapMuted: mapStore.projectedIsMapMuted,
          projectedMapVolume: mapStore.projectedMapVolume,
          projectedDangerZones: mapStore.projectedDangerZones
      };

      const activeCampaign = campaigns.find(c => String(c.id) === String(currentCampaignId));
      const activeDriver = sessionOSStore.getActiveDriver();

      const session = {
          campaignId: currentCampaignId,
          activeDiceConfig: activeDriver?.dice || null,
          campaigns: campaigns || [],
          players: await Promise.all(
              (players || []).map(async (p: import('./modules/session/store/types').Player) => ({
                  ...p,
                  characters: await Promise.all(
                      (p.characters || []).map(async (c) => {
                          const resolvedPortrait = await resolveToSendableUrl(c.portraitUrl);
                          const resolvedToken = c.tokenUrl ? await resolveToSendableUrl(c.tokenUrl) : undefined;
                          return {
                              ...c,
                              portraitUrl: resolvedPortrait,
                              tokenUrl: resolvedToken
                          };
                      })
                  )
              }))
          ),
          activeCampaignId: String(currentCampaignId),
          entities: await Promise.all(
              entities
                  .filter(e => e.isVisibleByPlayers && String(e.campaignId) === String(currentCampaignId))
                  .map(async (e) => {
                      const resolvedAvatar = await resolveToSendableUrl(e.avatar);
                      return { ...e, avatar: resolvedAvatar };
                  })
          ),
          clues: await Promise.all(
              clues
                  .filter(c => String(c.campaignId) === String(currentCampaignId)) // String comparison safety
                  .map(async c => {
                      const resolvedMedia = await resolveToSendableUrl(c.mediaUrl);
                      return {
                          ...c,
                          mediaUrl: resolvedMedia
                      };
                  })
          ),
          favorites: await Promise.all(
              (favoriteStore.favorites || [])
                  .filter(f => f.isSyncedToPlayerHub || (String(f.campaignId) === String(currentCampaignId) && f.ownerId))
                  .map(async f => {
                      const resolvedImage = f.imageUrl ? await resolveToSendableUrl(f.imageUrl) : undefined;
                      const resolvedToken = f.tokenUrl ? await resolveToSendableUrl(f.tokenUrl) : undefined;
                      return { ...f, imageUrl: resolvedImage, tokenUrl: resolvedToken };
                  })
          ),
          sessions: sessions.map(s => ({ 
              id: String(s.id), 
              campaignId: String(s.campaignId), 
              date: s.date,
              status: s.status,
              number: s.number,
              sessionEntityIds: s.sessionEntityIds || []
          })),
          activeSession: activeSession ? {
              id: String(activeSession.id),
              campaignId: String(activeSession.campaignId),
              status: activeSession.status,
              number: activeSession.number,
              sessionEntityIds: activeSession.sessionEntityIds || [],
              publicSummary: activeSession.publicSummary,
              gmSecrets: activeSession.gmSecrets
          } : null,
          activeCampaignName: activeCampaign?.name || null,
          activeCampaignWallpaper: activeCampaign?.wallpaperUrl ? await resolveToSendableUrl(activeCampaign.wallpaperUrl) : null,
          customSheetTemplates,
          customGameDrivers,
          transferRequests: freshSessionOS.transferRequests || [],
          atlasMaps: await Promise.all(
              (atlasMaps || [])
                  .filter(m => m.isVisited && String(m.campaignId) === String(currentCampaignId))
                  .map(async m => {
                      const resolvedUrl = await resolveToSendableUrl(m.fileUrl);
                      return { ...m, fileUrl: resolvedUrl };
                  })
          ),
      };

      const currentState = { sounds, moments, masterVolume: soundStore.masterVolume, combat, notes, whiteboard, clock, universalPads, session, dice, map };
      const diffPayload = force ? currentState : getDifferentialPayload(currentState, lastBroadcastRef.current);
      
      if (Object.keys(diffPayload).length > 0) {
         window.appBridge?.send('remote:broadcast-sync', diffPayload);
         lastBroadcastRef.current = currentState;
      }
      lastSyncRef.current = Date.now();
    } catch (e: unknown) { 
        const err = e instanceof Error ? e.message : String(e);
        console.error("[Sync] Error in handleSync:", err); 
    }
  }, [activeCampaignId, sessionOSStore, resolveToSendableUrl]);

  const handleAction = useCallback((data: RemoteAction) => {
    const { type, payload } = data;
    
    console.log(`[App] [RemoteAction] type: ${type}`, payload);

    // --- DICE ACTIONS ---
    if (type === 'dice:roll' || type === 'remote:dice:roll') {
      const p = payload as { 
        sides?: number, 
        die?: number, 
        count?: number, 
        modifier?: number, 
        mode?: string, 
        target?: number, 
        title?: string, 
        formula?: string,
        gearCount?: number, 
        useSystem?: boolean 
      };
      const sides = p.sides || p.die || 20;
      const count = p.count || 1;
      const modifier = p.modifier || 0;
      const mode = p.mode || 'standard';
      const target = p.target || 10;
      
      console.log(`[App] Global Dice Roll: ${count}d${sides} (${mode})`);
      
      const activeDriver = sessionOSStore.getActiveDriver();
      let result;
      let finalTitle = p.title || `${count}d${sides}`;

      // 1. Priorité au Mode Système si explicitement demandé
      if (p.useSystem && activeDriver) {
        result = DiceEngine.rollFromConfig(activeDriver.dice, {
          modifier,
          baseCount: count,
          gearCount: p.gearCount || 0,
          targetOverwrite: target
        });
        finalTitle = p.title || `Système (${activeDriver.name})`;
      } else {
        // 2. Fallback sur la logique manuelle étendue
        switch (mode) {
          case 'standard': 
            result = DiceEngine.rollStandard(sides, count, modifier); 
            break;
          case 'exploding': 
            result = DiceEngine.rollStandard(sides, count, modifier, true); 
            break;
          case 'threshold': 
            result = DiceEngine.rollThreshold(sides, count, modifier, target); 
            break;
          case 'pool': 
            result = DiceEngine.rollPool(sides, count, modifier, target); 
            break;
          case 'pool_explode': 
            result = DiceEngine.rollPool(sides, count, modifier, target, true); 
            break;
          case 'advantage': 
            result = DiceEngine.rollAdvantage(sides, modifier, true, target); 
            break;
          case 'disadvantage': 
            result = DiceEngine.rollAdvantage(sides, modifier, false, target); 
            break;
          case 'yze': 
            result = DiceEngine.rollYZE(count, p.target || p.gearCount || 0); 
            break;
          case 'fate': 
            result = DiceEngine.rollFate(count, modifier); 
            break;
          case 'rolemaster': 
            result = DiceEngine.rollRolemaster(modifier); 
            break;
          case 'formula':
            result = DiceEngine.rollFormula(p.formula || p.title || '1d20'); 
            break;
          default: 
            result = DiceEngine.rollStandard(sides, count, modifier);
        }
      }

      const record = {
        ...result,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        title: finalTitle
      };

      const diceStore = useDiceStore.getState();
      diceStore.setLastRoll(record);

      if (diceStore.isDiceProjected) {
        diceStore.triggerDiceProjection();
      }
    }
    
    if (type === 'dice:clear' || type === 'remote:dice:clear' || type === 'remote:dice:clear-dice') {
      console.log('[App] Global Clear Dice action');
      useDiceStore.getState().clearHistory();
    }

    // --- SYNC ACTIONS ---
    if (type === 'remote:request-sync') {
      console.log('[App] Forced sync request from tablet');
      handleSync(true); // Force full sync broadcast
    }

    // --- SOUND ACTIONS ---
    if (type === 'sound:trigger' || type === 'remote:sound:trigger') {
        const soundId = (payload as { id?: string }).id || (payload as { padId?: string }).padId || '';
        console.log(`[App] Remote Trigger Sound (+Lights): ${soundId}`, payload);
        if (soundId) {
            import('./modules/sound/SoundController').then(({ soundController }) => {
                soundController.togglePad(soundId);
            });
        }
    }
    if (type === 'sound:volume' || type === 'remote:sound:volume') {
        useSoundStore.getState().setMasterVolume((payload as { volume: number }).volume);
    }
    if (type === 'sound:stop-all' || type === 'remote:sound:stop-all') {
        useSoundStore.getState().stopAllPads();
    }
    
    // --- COMBAT ACTIONS ---
    if (type === 'combat:update-hp' || type === 'remote:combat:hp') {
      const { id, delta } = payload as { id: string; delta: number };
      const c = useCombatStore.getState().combatants.find(c => c.id === id);
      if (c) useCombatStore.getState().updateCombatant(id, { hp: Math.min(c.hpMax, Math.max(0, c.hp + delta)) });
    }
    if (type === 'combat:next-turn' || type === 'remote:combat:next') {
      useCombatStore.getState().nextTurn();
    }

    // --- SESSION ACTIONS ---
    if (type === 'session:update-character-narrative' || type === 'remote:session:update-character-narrative') {
      const { playerId, characterId, updates } = payload as { playerId: string; characterId: string; updates: any };
      useSessionOSStore.getState().updateCharacterNarrative(playerId, characterId, updates);
    }

    if (type === 'session:send-message') {
      console.log('[App] Receiving player message from remote:', payload.id);
      useSessionOSStore.getState().addSessionMessage(payload as import('./modules/session/store/types').SessionMessage);
    }

    if (type === 'session:request-item-transfer' || type === 'remote:session:request-item-transfer') {
      const { fromCharId, toCharId, item } = payload as { fromCharId: string; toCharId: string; item: any };
      console.log(`[App] Receiving transfer request: ${item.name} from ${fromCharId} to ${toCharId}`);
      useSessionOSStore.getState().requestItemTransfer(fromCharId, toCharId, item);
    }

    if (type === 'session:approve-item-transfer' || type === 'remote:session:approve-item-transfer') {
      const { requestId } = payload as { requestId: string };
      useSessionOSStore.getState().approveItemTransfer(requestId);
    }

    if (type === 'session:reject-item-transfer' || type === 'remote:session:reject-item-transfer') {
      const { requestId } = payload as { requestId: string };
      useSessionOSStore.getState().rejectItemTransfer(requestId);
    }

    if (type === 'storyboard:trigger' || type === 'remote:story:trigger') {
      const storyboard = useStoryboardStore.getState();
      const moments = storyboard.moments.filter(m => m.campaignId === activeCampaignId);
      const m = moments[(payload as { index: number }).index];
      if (m) storyboard.triggerMoment(m.id);
    }

    if (type === 'whiteboard:set-laser-pointer') {
      useWhiteboardStore.getState().setLaserPointer(payload as unknown as Point);
    }
    if (type === 'whiteboard:set-active-path') {
      useWhiteboardStore.getState().setActivePath((payload as { path: DrawingPath }).path, (payload as { drawerId: string }).drawerId);
    }
    if (type === 'whiteboard:draw' || type === 'whiteboard:add-path') {
      useWhiteboardStore.getState().addPath(payload as unknown as DrawingPath);
    }
    if (type === 'whiteboard:set-tool') {
      useWhiteboardStore.getState().setTool(payload as WhiteboardTool);
    }
    if (type === 'whiteboard:set-color') {
      useWhiteboardStore.getState().setColor(payload as string);
    }
    if (type === 'whiteboard:set-width') {
      useWhiteboardStore.getState().setWidth(payload as number);
    }
    if (type === 'whiteboard:clear') {
      useWhiteboardStore.getState().clearBoard();
    }
    if (type === 'whiteboard:undo') {
      useWhiteboardStore.getState().undo();
    }
    if (type === 'whiteboard:redo') {
      useWhiteboardStore.getState().redo();
    }

    // --- UNIVERSAL PADS TRIGGER ---
    if (type === 'remote:pad:trigger' || type === 'universal:trigger') {
      const { id } = payload as { id: string };
      console.log(`[App] [Remote:Pad:Trigger] id: ${id}`);

      // 1. Check Music
      const musicStore = useMusicStore.getState();
      const musicPad = musicStore.playlists.flatMap(p => p.pads).find(p => p.id === id);
      if (musicPad) {
        console.log(`[App] Triggering Music Pad: ${musicPad.label}`);
        musicStore.playPad(musicPad);
        handleSync(true);
        return;
      }

      // 2. Check Sound (SFX)
      const soundStore = useSoundStore.getState();
      const activeAtmos = soundStore.atmospheres.find(a => a.id === soundStore.activeAtmosphereId) || soundStore.atmospheres[0];
      if (activeAtmos && activeAtmos.pads[id]) {
          console.log(`[App] Triggering Sound Pad: ${id}`);
          import('./modules/sound/SoundController').then(({ soundController }) => {
              soundController.togglePad(id);
          });
          handleSync(true);
          return;
      }

      // 3. Check Image
      const imageStore = useImageStore.getState();
      const image = imageStore.mediaList.find(m => m.id === id);
      if (image) {
        console.log(`[App] Triggering Image Pad (Projection): ${image.name}`);
        imageStore.projectSolo(image);
        handleSync(true);
        return;
      }

      // 4. Check Ambient
      const ambientStore = useAmbientStore.getState();
      const ambientPreset = ambientStore.presets.find(p => p.id === id);
      if (ambientPreset) {
        console.log(`[App] Triggering Ambient Preset: ${ambientPreset.name}`);
        ambientStore.loadTheme(ambientPreset.universe, ambientPreset.name);
        handleSync(true);
        return;
      }
    }

    // Trigger an immediate sync after any remote action, EXCEPT high-frequency ones
    const highFreqActions = ['whiteboard:set-active-path', 'whiteboard:set-laser-pointer'];
    if (!highFreqActions.includes(type)) {
      handleSync(true);
    }
  }, [activeCampaignId, handleSync]);

  // Handle Remote Sync and Actions (Only on Main PC Window)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const windowTag = searchParams.get('window') || 'main';
    const isMainPC = windowTag === 'main' || !windowTag;

    const bridge = window.appBridge;
    if (!bridge?.remote) return;

    if (!isMainPC) {
      console.log(`[App] ${windowTag} window: Skipping remote action listeners.`);
      return;
    }

    // Démarrage de la surveillance des triggers spatiaux (GM uniquement)
    spatialTriggerService.startWatching();
    
    // Initialisation du MediaStore pour les résolutions d'URL (m-ID)
    useMediaStore.getState().initDB();

    // Synchroniser automatiquement la carte si le Combat-OS change (pour l'invisibilité des jetons liés)
    const unsubscribeCombat = useCombatStore.subscribe((state, prevState) => {
      if (state.combatants !== prevState.combatants) {
        useMapStore.getState().syncToPlayers();
      }
    });

    bridge.on('remote:request-sync', () => {
        console.log('[Sync] Remote requested full state sync');
        handleSync(true);
    });
    
    // Cleanup any existing listeners to be safe before adding new one
    bridge.remote.removeActions();
    const cleanupAction = bridge.remote.onAction(handleAction);

    // Subscribe to stores to trigger direct sync on change
    let lastPathsCount = useWhiteboardStore.getState().paths.length;
    const unsubWhiteboard = useWhiteboardStore.subscribe((state) => {
      if (state.paths.length !== lastPathsCount) {
        lastPathsCount = state.paths.length;
        handleSync(false); // Send full update when path added/removed/cleared
      } else {
        syncFast('whiteboard'); // High-frequency fluid movement
      }
    });
    const unsubClock = useClockStore.subscribe(() => syncFast('clock'));
    const unsubMusic = useMusicStore.subscribe(() => handleSync(false));
    const unsubSoundSync = useSoundStore.subscribe(() => handleSync(false));
    const unsubImage = useImageStore.subscribe(() => handleSync(false));
    const unsubAmbient = useAmbientStore.subscribe(() => handleSync(false));
    const unsubSessionOS = useSessionOSStore.subscribe(() => handleSync(false));
    const unsubDice = useDiceStore.subscribe(() => syncFast('dice'));
    const unsubFavorite = useFavoriteStore.subscribe(() => handleSync(false));
    const unsubStoryboard = useStoryboardStore.subscribe(() => handleSync(false));
    const unsubCombat = useCombatStore.subscribe(() => syncFast('combat'));
    const unsubMap = useMapStore.subscribe((state, prevState) => {
        // High frequency for pings/tokens, full sync for map changes
        if (state.projectedMapUrl !== prevState.projectedMapUrl || state.projectionTarget !== prevState.projectionTarget) {
            handleSync(false);
        } else {
            syncFast('map');
        }
    });

    handleSync();

    return () => {
      bridge.off('remote:request-sync', () => handleSync(true));
      cleanupAction();
      unsubWhiteboard();
      unsubClock();
      unsubMusic();
      unsubSoundSync();
      unsubImage();
      unsubAmbient();
      unsubSessionOS();
      unsubDice();
      unsubFavorite();
      unsubStoryboard();
      unsubCombat();
      unsubMap();
      unsubscribeCombat();
      console.log('[App] Remote effect cleanup - IPC listeners removed.');
    };
  }, [handleSync, syncFast, handleAction]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <ErrorBoundary moduleName="Dashboard"><SessionDashboard /></ErrorBoundary>;
      case 'dice': return <ErrorBoundary moduleName="Dice OS"><DiceBoard /></ErrorBoundary>;
      case 'music': return <ErrorBoundary moduleName="Music OS"><MusicDashboard /></ErrorBoundary>;
      case 'combat': return <ErrorBoundary moduleName="Combat OS"><CombatDashboard /></ErrorBoundary>;
      case 'map': return <ErrorBoundary moduleName="Map OS"><MapDashboard /></ErrorBoundary>;
      case 'npc': return <ErrorBoundary moduleName="NPC OS"><NPCDashboard /></ErrorBoundary>;
      case 'clock': return <ErrorBoundary moduleName="Clock OS"><ClockDashboard /></ErrorBoundary>;
      case 'ambient': return <ErrorBoundary moduleName="Ambient OS"><AmbientDashboard /></ErrorBoundary>;
      case 'table': return <ErrorBoundary moduleName="Table OS"><TableDashboard /></ErrorBoundary>;
      case 'web': return <ErrorBoundary moduleName="Web OS"><WebDashboard /></ErrorBoundary>;
      case 'image': return <ErrorBoundary moduleName="Image OS"><ImageDashboard /></ErrorBoundary>;
      case 'sound': return <ErrorBoundary moduleName="Sound OS"><SoundDashboard /></ErrorBoundary>;
      case 'light': return <ErrorBoundary moduleName="Light OS"><LightDashboard /></ErrorBoundary>;
      case 'favorite': return <ErrorBoundary moduleName="Favorite OS"><FavoriteDashboard /></ErrorBoundary>;
      case 'whiteboard': return <ErrorBoundary moduleName="Whiteboard OS"><WhiteboardDashboard /></ErrorBoundary>;
      case 'debug': return <ErrorBoundary moduleName="Debug OS"><DebugDashboard /></ErrorBoundary>;
      case 'voice': return <ErrorBoundary moduleName="Voice OS"><VoiceDashboard /></ErrorBoundary>;
      case 'obsidian': return <ErrorBoundary moduleName="Obsidian Panel"><ObsidianPanel /></ErrorBoundary>;
      case 'journal': return <ErrorBoundary moduleName="Journal OS"><JournalDashboard /></ErrorBoundary>;
      default: return <PlaceholderModule name={activeModule} />;
    }
  };

  const pathname = window.location.pathname.toLowerCase();
  const isProjectorView = searchParams.get('window') === 'projector' || pathname.includes('/projector');
  const isHubView = searchParams.get('window') === 'hub' || pathname.includes('/player-hub');
  const isTabletView = searchParams.get('window') === 'tablet' || pathname.includes('/tablet-hub');
  const isRemoteView = searchParams.get('window') === 'remote' || pathname.includes('/remote');

  return (
    <Suspense fallback={<div className="h-screen w-screen bg-black" />}>
      {isRemoteView ? (
        <ErrorBoundary moduleName="Remote Control"><RemoteControl /></ErrorBoundary>
      ) : isProjectorView ? (
        <ErrorBoundary moduleName="Projector View"><ProjectorView /></ErrorBoundary>
      ) : isHubView ? (
        <ErrorBoundary moduleName="Player Hub"><PlayerHub /></ErrorBoundary>
      ) : isTabletView ? (
        <ErrorBoundary moduleName="Tablet Hub"><TabletHub /></ErrorBoundary>
      ) : (
        <>
          <GlobalKeybinds />
          <SpotlightSearch />
          <ModalProvider />
          <ToastProvider />
          <AudioRouter />
          <MediaBrowser isOpen={isMediaHubOpen} onClose={closeMediaHub} onSelect={() => {}} title="MEDIA HUB" />
          <LoadingOverlay />
          {showSplash && <SplashScreenSelector onComplete={() => setShowSplash(false)} />}
          
          <Suspense fallback={null}>
            <MessageAlertOverlay />
          </Suspense>
          
          <Shell>{renderModule()}</Shell>
        </>
      )}
    </Suspense>
  );
}

export default App;
