import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { jaugesVuesParLesJoueurs } from '../../../store/useClockStore';
import type { TensionClock } from '../../../store/useClockStore';
import { openDB } from 'idb';

// 🛡️ Safe Dynamic Store Access Helpers
const getStore = (name: string) => (typeof window !== 'undefined' ? (window as any)[name] : null);

const EMPTY_OBJ = {};
const EMPTY_ARR: any[] = [];

/**
 * Attempts to resolve an m-xxx media ID to a data: URI using the local IndexedDB.
 */
async function resolveMediaToDataUrl(src: string | undefined): Promise<string | undefined> {
    if (!src) return undefined;
    if (!src.startsWith('m-')) return src;
    try {
        const db = await openDB('gmos-media-db');
        const item = await db.get('media', src);
        if (item?.blob) {
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(item.blob as Blob);
            });
        }
    } catch (e) {
        console.error('[useHubSync] Could not resolve m-id:', src, e);
    }
    if (!window.appBridge) {
        const host = window.location.hostname;
        return `http://${host}:3001/temp/${src}`;
    }
    return undefined;
}

export const useHubSync = () => {
    // ─────────────────────────────────────────────
    // Local State Hooks
    // ─────────────────────────────────────────────
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [liveImagePath, setLiveImagePath] = useState<string | null | undefined>(undefined);
    const [liveEntity, setLiveEntity] = useState<any | null>(null);
    const [sessionSummary, setSessionSummary] = useState<string>('');
    const [showDice, setShowDice] = useState(false);
    const [sharedRule, setSharedRule] = useState<any | null>(null);
    const [latency, setLatency] = useState<number | null>(null);

    const [resolvedFavorites, setResolvedFavorites] = useState<any[]>([]);
    const [resolvedNpcs, setResolvedNpcs] = useState<any[]>([]);
    const [resolvedAtlasMaps, setResolvedAtlasMaps] = useState<any[]>([]);

    const socketRef = useRef<WebSocket | null>(null);
    const diceTimerRef = useRef<any>(null);
    const lastDiceTriggerRef = useRef(0);

    // ─────────────────────────────────────────────
    // Dynamic Store Resolution (Hooks)
    // ─────────────────────────────────────────────
    const useImageStore = getStore('useImageStore');
    const useSessionOSStore = getStore('useSessionOSStore');
    const useClockStore = getStore('useClockStore');
    const useFavoriteStore = getStore('useFavoriteStore');
    const useCombatStore = getStore('useCombatStore');
    const useClientStore = getStore('useClientStore');
    const useDiceStore = getStore('useDiceStore');
    const useSyncStore = getStore('useSyncStore');

    // 🛡️ Individual Selectors (Stable)
    const projections = useImageStore ? useImageStore((s: any) => s.projections) : EMPTY_OBJ;
    
    const timestamp = useClockStore ? useClockStore((s: any) => s.timestamp) : Date.now();
    const mode = useClockStore ? useClockStore((s: any) => s.mode) : 'realtime';
    const theme = useClockStore ? useClockStore((s: any) => s.theme) : 'modern';
    /*
      **Les jauges secrètes ne quittent pas la machine du meneur** (point C1,
      2026-09-04). Ce crochet alimente le Player Hub ET les tablettes : c'est
      l'un des quatre chemins, et on caviarde à la source plutôt qu'à
      l'affichage — *ce qui n'est pas parti ne peut pas être lu.*
    */
    const toutesLesJauges = useClockStore ? useClockStore((s: any) => s.tensions) : EMPTY_ARR;
    const tensions = useMemo<TensionClock[]>(
        () => jaugesVuesParLesJoueurs<TensionClock>(toutesLesJauges), [toutesLesJauges]);
    const isClockProjected = useClockStore ? useClockStore((s: any) => s.isClockProjected) : false;

    const favorites = useFavoriteStore ? useFavoriteStore((s: any) => s.favorites) : EMPTY_ARR;
    
    const combatants = useCombatStore ? useCombatStore((s: any) => s.combatants) : EMPTY_ARR;
    const currentTurnIdx = useCombatStore ? useCombatStore((s: any) => s.currentTurnIdx) : 0;
    const round = useCombatStore ? useCombatStore((s: any) => s.round) : 0;
    const isCombatProjected = useCombatStore ? useCombatStore((s: any) => s.isCombatProjected) : false;

    const entities = useSessionOSStore ? useSessionOSStore((s: any) => s.entities) : EMPTY_ARR;
    const activeCampaignId = useSessionOSStore ? useSessionOSStore((s: any) => s.activeCampaignId) : null;
    const activeCampaignName = useSessionOSStore ? useSessionOSStore((s: any) => s.activeCampaignName) : '';
    const activeCampaignWallpaper = useSessionOSStore ? useSessionOSStore((s: any) => s.activeCampaignWallpaper) : null;
    const sessions = useSessionOSStore ? useSessionOSStore((s: any) => s.sessions) : EMPTY_ARR;
    const transferRequests = useSessionOSStore ? useSessionOSStore((s: any) => s.transferRequests) : EMPTY_ARR;
    const clues = useSessionOSStore ? useSessionOSStore((s: any) => s.clues) : EMPTY_ARR;
    const connectedCharacters = useSessionOSStore ? useSessionOSStore((s: any) => s.connectedCharacters) : EMPTY_OBJ;

    const deviceId = useClientStore ? useClientStore((s: any) => s.deviceId) : 'guest';
    const pseudo = useClientStore ? useClientStore((s: any) => s.pseudo) : '';
    const playerName = useClientStore ? useClientStore((s: any) => s.playerName) : '';
    const characterId = useClientStore ? useClientStore((s: any) => s.characterId) : null;
    const isOnboarded = useClientStore ? useClientStore((s: any) => s.isOnboarded) : false;

    const voiceLevel = useSyncStore ? useSyncStore((s: any) => s.voiceLevel) : 0;
    
    const projectionTrigger = useDiceStore ? useDiceStore((s: any) => s.projectionTrigger) : 0;
    const isDiceProjected = useDiceStore ? useDiceStore((s: any) => s.isDiceProjected) : false;

    const host = window.location.hostname;
    const port = 3001;

    // ─────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────
    const applySyncPayload = useCallback((payload: any) => {
        if (!payload) return;
        const { clock, combat, voiceLevel: vLevel, session, notes, dice, map, whiteboard } = payload;
        
        const sClock = getStore('useClockStore');
        const sCombat = getStore('useCombatStore');
        const sSync = getStore('useSyncStore');
        const sDice = getStore('useDiceStore');
        const sMap = getStore('useMapStore');
        const sMapUI = getStore('useMapUIStore');
        const sWhiteboard = getStore('useWhiteboardStore');
        const sSession = getStore('useSessionOSStore');
        const sFavorite = getStore('useFavoriteStore');

        if (clock && sClock) sClock.setState((prev: any) => ({ ...prev, ...clock }));
        if (combat && sCombat) sCombat.setState((prev: any) => ({ ...prev, ...combat }));
        if (vLevel !== undefined && sSync) sSync.getState().setVoiceLevel(vLevel);
        if (notes?.public !== undefined) setSessionSummary(notes.public);
        if (dice && sDice) sDice.setState((prev: any) => ({ ...prev, ...dice }));
        
        if (map && sMap) {
            const ui = sMapUI?.getState();
            if (ui?.isDraggingToken && ui?.selectedTokenId && map.projectedTokens) {
                const currentTokens = sMap.getState().projectedTokens || [];
                const incomingTokens = map.projectedTokens;
                const mergedTokens = incomingTokens.map((t: any) => {
                    if (t.id === ui.selectedTokenId) {
                        const localToken = currentTokens.find((lt: any) => lt.id === t.id);
                        return localToken ? { ...t, x: localToken.x, y: localToken.y } : t;
                    }
                    return t;
                });
                sMap.setState((prev: any) => ({ ...prev, ...map, projectedTokens: mergedTokens }));
            } else {
                sMap.setState((prev: any) => ({ ...prev, ...map }));
            }
        }

        if (whiteboard && sWhiteboard) {
            sWhiteboard.setState((prev: any) => ({ ...prev, ...whiteboard }));
        }

        if (session && sSession) {
            sSession.setState((prev: any) => {
                const updates: any = {};
                if (session.sessions !== undefined) updates.sessions = session.sessions;
                if (session.campaigns !== undefined) updates.campaigns = session.campaigns;
                if (session.players !== undefined) updates.players = session.players;
                if (session.clues !== undefined) updates.clues = session.clues;
                if (session.entities !== undefined) updates.entities = session.entities;
                if (session.atlasMaps !== undefined) updates.atlasMaps = session.atlasMaps;
                /*
                  **Envoyés depuis toujours, appliqués par personne.**

                  `useNexusSynchronizer` sérialise `customSheetTemplates` et
                  `customGameDrivers` dans chaque diffusion — le MJ paie donc le
                  coût de les envoyer —, et cette fonction les jetait. La
                  tablette n'avait que `DEFAULT_SHEET_TEMPLATES` : toute fiche
                  de personnage y retombait sur « Generic » et ses champs
                  `stat1`, `stat2`, `info1`, quel que soit le jeu.

                  Rien ne le signalait, parce que `resolveSheetTemplate` a un
                  repli parfaitement légitime — c'est encore la même famille :
                  quelque chose qui échoue sans le dire, sous couvert d'une
                  valeur par défaut plausible.
                */
                if (session.customSheetTemplates !== undefined) updates.customSheetTemplates = session.customSheetTemplates;
                if (session.customGameDrivers !== undefined) updates.customGameDrivers = session.customGameDrivers;
                /*
                  **Les cartes tenues en main, et les manifestes qui les
                  dessinent.** Envoyés depuis le 2026-08-30, et il faut les
                  appliquer : le MJ paierait sinon le coût de les diffuser pour
                  que la tablette les jette — c'est exactement ce qui est arrivé
                  aux gabarits de fiche, et rien ne l'avait signalé.

                  Les indices des cartes face cachée ne sont pas dans la charge :
                  `mainsPourLaTable` les retire à la source.
                */
                if (session.decks !== undefined) updates.decks = session.decks;
                if (session.mainsDesPaquets !== undefined) updates.mainsDesPaquets = session.mainsDesPaquets;
                if (session.demandesDeCarte !== undefined) updates.demandesDeCarte = session.demandesDeCarte;
                // Le compte des pioches, pour que la tablette dise ce qu'il
                // reste et éteigne un paquet vide. Des nombres, jamais des
                // indices : l'ordre de la pioche ne sort pas de chez le meneur.
                if (session.cartesRestantes !== undefined) updates.cartesRestantes = session.cartesRestantes;
                // 🛡️ NexusSynchronizer sends locks as `characterLocks`, accept both keys
                if (session.characterLocks !== undefined) updates.connectedCharacters = session.characterLocks;
                if (session.connectedCharacters !== undefined) updates.connectedCharacters = session.connectedCharacters;
                
                updates.activeCampaignId = session.activeCampaignId ?? prev.activeCampaignId;
                updates.activeCampaignName = session.activeCampaignName ?? (session.campaigns || prev.campaigns).find((c: any) => c.id === updates.activeCampaignId)?.name;
                if (session.activeCampaignWallpaper !== undefined) updates.activeCampaignWallpaper = session.activeCampaignWallpaper;
                return { ...prev, ...updates };
            });

            if (session.favorites !== undefined && sFavorite) {
                sFavorite.setState({ favorites: session.favorites });
            }

            /*
              Les réserves de table sont rangées par campagne dans leur propre
              store — c'est ce qui évite qu'une chronique hérite l'Impulsion
              d'une autre. On réécrit **la seule campagne diffusée**, sans
              toucher aux autres : le MJ n'en diffuse qu'une, et écraser toute
              la carte effacerait ce qu'une tablette sait d'une partie en
              sommeil.
            */
            const sReserves = getStore('useRessourcesDeTableStore');
            if (session.reservesDeTable !== undefined && sReserves && session.activeCampaignId) {
                sReserves.setState((prev: any) => ({
                    reserves: { ...prev.reserves, [session.activeCampaignId]: session.reservesDeTable },
                }));
            }
        }
    }, []);

    // WebSocket Connection
    useEffect(() => {
        if (!host) return;
        const sClient = getStore('useClientStore');
        if (!sClient) return;

        let socket: WebSocket | null = null;
        let reconnectTimer: any = null;
        let isActive = true;

        const startConnection = () => {
            if (!isActive) return;
            const socketUrl = `ws://${host}:${port}`;
            socket = new WebSocket(socketUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                if (!isActive) { socket?.close(); return; }
                setStatus('connected');
                const client = sClient.getState();
                client.setStatus('active');
                socket?.send(JSON.stringify({ 
                    type: 'remote:register',
                    payload: { 
                        deviceId: client.deviceId, 
                        pseudo: client.pseudo, 
                        playerName: client.playerName, 
                        characterId: client.characterId, 
                        role: 'hub' 
                    }
                }));
                socket?.send(JSON.stringify({ type: 'remote:request-sync' }));
            };

            socket.onclose = () => {
                if (!isActive) return;
                setStatus('error');
                sClient.getState().setStatus('disconnected');
                reconnectTimer = setTimeout(startConnection, 5000);
            };

            socket.onmessage = (event) => {
                if (!isActive) return;
                try {
                    const data = JSON.parse(event.data);
                    
                    // 🛡️ Handle server-side character collision rejection
                    if (data.type === 'remote:error') {
                        const { code, message } = data.payload || {};
                        console.error(`[useHubSync] Server Error (${code}):`, message);
                        if (code === 'character_taken') {
                            const sClient = getStore('useClientStore');
                            if (sClient) {
                                sClient.getState().setCharacterId(null);
                                sClient.getState().setLastError(message || 'Ce personnage est déjà connecté sur un autre appareil.');
                            }
                        }
                    }

                    // 🛡️ Handle GM ejection
                    if (data.type === 'remote:ejected') {
                        console.warn('[useHubSync] Ejected by GM');
                        const sClient = getStore('useClientStore');
                        if (sClient) {
                            sClient.getState().resetIdentity();
                            sClient.getState().setLastError('Connexion réinitialisée par le MJ.');
                        }
                    }
                    
                    if (data.type === 'sync' && data.payload) applySyncPayload(data.payload);
                    if (data.type === 'hub-projection') {
                        const { type, data: payload } = data.payload;
                        if (type === 'image') setLiveImagePath(payload || null);
                        if (type === 'entity') setLiveEntity(payload ? JSON.parse(payload) : null);
                        /*
                          Le canal porte aussi un type `titre`, qui n'est pas lu
                          ici : **le storyboard ne vise pas les tablettes**
                          (décision de David le 2026-08-31). Le titre s'affiche
                          sur les écrans de projection et le Player Hub.
                        */
                    }
                    if (data.type === 'session:receive-message' && data.payload) {
                        const sSession = getStore('useSessionOSStore');
                        if (sSession) sSession.getState().addSessionMessage(data.payload);
                    }
                    if (data.type === 'remote:pong') {
                        const now = Date.now();
                        const sentAt = data.payload?.sentAt || now;
                        setLatency(now - sentAt);
                    }
                    if (data.type === 'session:display-rule' && data.payload) setSharedRule(data.payload);
                } catch (err) { console.error('[useHubSync] Sync error:', err); }
            };
        };
        startConnection();
        return () => {
            isActive = false;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (socket) { socket.onclose = null; socket.close(); }
            socketRef.current = null;
        };
    }, [host, applySyncPayload]);

    // 🛰️ Latency / Ping Monitoring
    useEffect(() => {
        if (status !== 'connected') return;
        const interval = setInterval(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ 
                    type: 'remote:ping', 
                    payload: { sentAt: Date.now() } 
                }));
            }
        }, 15000); // Every 15 seconds
        return () => clearInterval(interval);
    }, [status]);

    // Reactive Registration (Triggers when character selection or identity changes)
    useEffect(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ 
                type: 'remote:register',
                payload: { deviceId, pseudo, playerName, characterId, role: 'hub' }
            }));
        }
    }, [deviceId, pseudo, playerName, characterId]);

    // IPC & Events
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleIpcUpdate = (_event: any, type: string, data: any) => {
            if (type === 'image') setLiveImagePath(data || null);
            else if (type === 'entity') setLiveEntity(data ? JSON.parse(data) : null);
            else if (type === 'voice-level') {
                const sSync = getStore('useSyncStore');
                if (sSync) sSync.getState().setVoiceLevel(parseFloat(data) || 0);
            }
            else if (type === 'map-ping') {
                // Handled via map-os canvas
            }
            else if (type === 'session:display-rule') setSharedRule(data as any);
        };

        const handleBroadcastSync = (_e: any, payload: any) => {
            if (payload?.type === 'FULL_RESET') {
                setLiveImagePath(null);
                setLiveEntity(null);
                return;
            }
            applySyncPayload(payload);
        };

        if (window.appBridge?.on) {
            window.appBridge.on('image:sync-hub-data', handleIpcUpdate);
            window.appBridge.on('map:ping', (_e: any, data: any) => handleIpcUpdate(null, 'map-ping', data));
            window.appBridge.on('remote:broadcast-sync', handleBroadcastSync);
        }

        const handleSendMessage = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            socketRef.current?.send(JSON.stringify({ type: 'session:send-message', payload: detail }));
        };

        const handleRequestTransfer = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const sSession = getStore('useSessionOSStore');
            if (sSession) sSession.getState().requestItemTransfer(detail.fromCharId, detail.toCharId, detail.item);
            socketRef.current?.send(JSON.stringify({ type: 'session:request-item-transfer', payload: detail }));
        };

        const handleRemoveItem = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const sSession = getStore('useSessionOSStore');
            if (sSession) sSession.getState().removeInventoryItem(detail.playerId, detail.characterId, detail.itemId);
            socketRef.current?.send(JSON.stringify({ type: 'session:remove-inventory-item', payload: detail }));
        };

        const handleSubmitFeedback = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            socketRef.current?.send(JSON.stringify({ type: 'session:submit-feedback', payload: detail }));
        };

        /*
          Le geste sur une réserve commune est déjà appliqué localement par
          `ajusterDepuisLaTablette` — d'où l'absence de second appel ici,
          contrairement aux transferts d'objets. Ne reste qu'à le dire au MJ,
          qui rejouera la même règle et rediffusera la valeur qui fait foi.
        */
        const handleAjusterReserve = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            socketRef.current?.send(JSON.stringify({ type: 'table:ajuster', payload: detail }));
        };

        /*
          **Ce que la tablette a déjà appliqué chez elle, et qu'il ne reste qu'à
          dire au MJ.**

          *Le défaut trouvé le 2026-08-29, en répondant à la question de David :
          « quand je fais une mise à jour sur la fiche HTML de la tablette,
          comment cela se répercute-t-il dans GM-OS ? »* La réponse était : **ça
          ne se répercutait pas.** Le store de la tablette diffusait bien son
          `CustomEvent`, le MJ savait bien le recevoir et l'appliquer — et
          personne, entre les deux, ne le mettait sur la socket. *Le chemin
          s'arrête avant le moteur*, une fois de plus, et sans rien casser : le
          joueur voyait sa saisie chez lui.

          `session:update-character-narrative` était dans le même cas depuis
          toujours : la description et les notes saisies sur une **vraie**
          tablette n'atteignaient pas le meneur. Le Player Hub, lui, s'en tirait
          par le pont Electron — d'où un défaut invisible tant qu'on essayait
          depuis la même machine.

          Ces deux-là n'appliquent RIEN localement ici : leur store l'a déjà fait
          avant de diffuser. Les rejouer doublerait l'écriture.
        */
        const AREACHEMINER = [
            'session:update-character-sheet-data',
            'session:update-character-narrative',
            /*
              **Ce qu'un joueur fait de ses cartes.** Même rail : le magasin du
              meneur détient la vérité du paquet, la tablette n'a qu'à dire ce
              qu'elle demande. Chaque action y vérifie que le demandeur tient
              bien la carte — le `characterId` vient du client.

              Ces quatre-là n'appliquent RIEN localement : la tablette ne
              possède pas le paquet, elle en reçoit un reflet.
            */
            'deck:piocher',
            'deck:jouer-carte',
            'deck:demander-don',
            'deck:accepter-don',
            'deck:refuser-don',
        ] as const;

        const acheminer = (e: Event) => {
            socketRef.current?.send(JSON.stringify({
                type: e.type,
                payload: (e as CustomEvent).detail,
            }));
        };

        window.addEventListener('session:send-message', handleSendMessage);
        window.addEventListener('session:request-item-transfer', handleRequestTransfer);
        window.addEventListener('session:remove-inventory-item', handleRemoveItem);
        window.addEventListener('session:submit-feedback', handleSubmitFeedback);
        window.addEventListener('table:ajuster', handleAjusterReserve);
        for (const nom of AREACHEMINER) window.addEventListener(nom, acheminer);

        return () => {
            window.removeEventListener('session:send-message', handleSendMessage);
            window.removeEventListener('session:request-item-transfer', handleRequestTransfer);
            window.removeEventListener('session:remove-inventory-item', handleRemoveItem);
            window.removeEventListener('session:submit-feedback', handleSubmitFeedback);
            window.removeEventListener('table:ajuster', handleAjusterReserve);
            for (const nom of AREACHEMINER) window.removeEventListener(nom, acheminer);
            if (window.appBridge?.off) {
                window.appBridge.off('image:sync-hub-data', handleIpcUpdate);
                window.appBridge.off('map:ping', handleIpcUpdate);
                window.appBridge.off('remote:broadcast-sync', handleBroadcastSync);
            }
        };
    }, [applySyncPayload]);

    // Asset Resolution
    useEffect(() => {
        let mounted = true;
        const resolveAssets = async () => {
            const sharedFavs = favorites.filter((f: any) => f.isSyncedToPlayerHub || (characterId && f.ownerId === characterId));
            const resFavs = await Promise.all(sharedFavs.map(async (f: any) => ({
                ...f,
                imageUrl: await resolveMediaToDataUrl(f.imageUrl) || f.imageUrl,
                tokenUrl: await resolveMediaToDataUrl(f.tokenUrl) || f.tokenUrl
            })));

            const activeNpcs = entities.filter((e: any) => String(e.campaignId) === String(activeCampaignId) && e.isVisibleByPlayers);
            const resNpcs = await Promise.all(activeNpcs.map(async (e: any) => ({
                ...e,
                avatar: await resolveMediaToDataUrl(e.avatar) || e.avatar
            })));

            const sSession = getStore('useSessionOSStore');
            const activeMaps = (sSession?.getState()?.atlasMaps || []).filter((m: any) => String(m.campaignId) === String(activeCampaignId) && m.isVisited);
            const resMaps = await Promise.all(activeMaps.map(async (m: any) => ({
                ...m,
                fileUrl: await resolveMediaToDataUrl(m.fileUrl) || m.fileUrl
            })));

            if (mounted) {
                setResolvedFavorites(resFavs);
                setResolvedNpcs(resNpcs);
                setResolvedAtlasMaps(resMaps);
            }
        };
        resolveAssets();
        return () => { mounted = false; };
    }, [favorites, entities, activeCampaignId, characterId]);

    // Dice Trigger
    useEffect(() => {
        if (isDiceProjected && projectionTrigger !== lastDiceTriggerRef.current) {
            lastDiceTriggerRef.current = projectionTrigger;
            setShowDice(true);
            if (diceTimerRef.current) clearTimeout(diceTimerRef.current);
            diceTimerRef.current = setTimeout(() => setShowDice(false), 5000);
        }
    }, [isDiceProjected, projectionTrigger]);

    return {
        status,
        liveImagePath,
        liveEntity,
        voiceLevel,
        sessionSummary,
        showDice,
        resolvedFavorites,
        resolvedNpcs,
        resolvedAtlasMaps,
        projections,
        timestamp,
        mode,
        theme,
        tensions,
        isClockProjected,
        combatants,
        currentTurnIdx,
        round,
        isCombatProjected,
        clues,
        activeCampaignId,
        activeCampaignName,
        activeCampaignWallpaper,
        sessions,
        transferRequests,
        connectedCharacters,
        isOnboarded,
        characterId,
        deviceId,
        pseudo,
        playerName,
        sharedRule,
        setSharedRule,
        latency
    };
};
