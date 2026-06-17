import { useMapStore } from '../modules/map/useMapStore';
import { useMapUIStore } from '../modules/map/useMapUIStore';
import { useWhiteboardStore } from '../modules/whiteboard/useWhiteboardStore';
import { useClockStore } from '../store/useClockStore';
import { useCombatStore } from '../modules/combat/useCombatStore';

/**
 * Service facilitating cross-window synchronization using BroadcastChannel.
 * This provides a secondary, ultra-reliable transport for local multi-window setups (e.g. GM + Player Hub on same PC),
 * bypassing potential IPC bottlenecks in Tauri/Electron.
 */
class CrossWindowEventService {
    private channel: BroadcastChannel;
    private isMainInstance: boolean = false;
    private instanceId: string = Math.random().toString(36).substring(2, 9);
    private isApplyingRemoteUpdate: boolean = false;
    private tokenLocks: Map<string, { ownerId: string, timestamp: number }> = new Map();
    private throttleTimer: ReturnType<typeof setTimeout> | null = null;
    private relayTimer: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.channel = new BroadcastChannel('gmos-cross-window-sync');
        this.setupListener();
    }

    /**
     * Initialize the service and determine if this window should broadcast or just listen.
     */
    public init(isMain: boolean) {
        this.isMainInstance = isMain;
        console.log(`[CrossWindowSync] [${this.instanceId}] Initialized as ${isMain ? 'MASTER' : 'SLAVE'}`);

        // Everyone subscribes to their local store to broadcast changes
        // This ensures bidirectional real-time sync across windows on the same machine.
        this.setupSubscribers();
    }

    private setupListener() {
        this.channel.onmessage = (event) => {
            const { type, payload, senderId } = event.data;

            // Ignore messages from ourselves
            if (senderId === this.instanceId) return;

            // Handle locks (Always)
            if (type === 'map:lock') {
                this.tokenLocks.set(payload.tokenId, { ownerId: senderId, timestamp: Date.now() });
                return;
            } else if (type === 'map:unlock') {
                this.tokenLocks.delete(payload.tokenId);
                return;
            }

            if (this.isMainInstance) {
                // Main instance handles client-initiated events
                switch (type) {
                    case 'hub:ready':
                        this.broadcastFullState();
                        break;
                    case 'map':
                        // Apply the slave's update to Master store
                        this.applyRemoteUpdate('map', payload);
                        // CRITICAL: Never relay raw slave payload to other slaves.
                        // The payload may have stale projectionTarget, partial data, or
                        // other slave-specific state that would corrupt other windows.
                        // Instead, debounce a full-state broadcast from Master (source of truth).
                        if (this.relayTimer) clearTimeout(this.relayTimer);
                        this.relayTimer = setTimeout(() => {
                            this.broadcastFullState();
                        }, 50);
                        break;
                }
            } else {
                // Slaves handle state updates
                this.applyRemoteUpdate(type, payload);
            }
        };
    }

    /**
     * Request exclusive control over a token.
     * Returns true if lock granted, false if someone else has it.
     */
    public requestLock(tokenId: string): boolean {
        const existingLock = this.tokenLocks.get(tokenId);
        if (existingLock && existingLock.ownerId !== this.instanceId) {
            // Lock held by someone else, check if expired (5s timeout)
            if (Date.now() - existingLock.timestamp < 5000) {
                console.warn(`[CrossWindowSync] Token ${tokenId} is locked by ${existingLock.ownerId}`);
                return false;
            }
        }
        
        // Take lock
        this.tokenLocks.set(tokenId, { ownerId: this.instanceId, timestamp: Date.now() });
        this.broadcast('map:lock', { tokenId });
        return true;
    }

    /**
     * Release control over a token.
     */
    public releaseLock(tokenId: string) {
        this.tokenLocks.delete(tokenId);
        this.broadcast('map:unlock', { tokenId });
    }

    /**
     * Check if a token is currently controlled by another window.
     */
    public isTokenLocked(tokenId: string): boolean {
        const lock = this.tokenLocks.get(tokenId);
        return !!(lock && lock.ownerId !== this.instanceId && (Date.now() - lock.timestamp < 5000));
    }

    private applyRemoteUpdate(type: string, payload: any) {
        this.isApplyingRemoteUpdate = true;
        try {
            switch (type) {
                case 'map':
                    {
                        const ui = useMapUIStore.getState();
                        const store = useMapStore.getState();
                        
                        // Protective merge: don't let remote updates override tokens currently being dragged locally
                        if (ui.isDraggingToken && ui.selectedTokenId) {
                            const currentProjected = store.projectedTokens;
                            const currentTokens = store.tokens;
                            
                            if (payload.projectedTokens) {
                                payload.projectedTokens = payload.projectedTokens.map((t: any) => {
                                    if (t.id === ui.selectedTokenId) {
                                        const localToken = currentProjected.find(lt => lt.id === t.id);
                                        return localToken ? { ...t, x: localToken.x, y: localToken.y } : t;
                                    }
                                    return t;
                                });
                            }

                            if (payload.tokens) {
                                payload.tokens = payload.tokens.map((t: any) => {
                                    if (t.id === ui.selectedTokenId) {
                                        const localToken = currentTokens.find(lt => lt.id === t.id);
                                        return localToken ? { ...t, x: localToken.x, y: localToken.y } : t;
                                    }
                                    return t;
                                });
                            }
                        }

                        // Special case: Master receives token positions from a slave window.
                        // We sync the positions into master's `tokens` array (source of truth)
                        // so the GM map stays up to date with slave-driven movements.
                        // NOTE: We do NOT add tokens/pings to the payload here, because this
                        // payload is only applied locally on Master. The relay to other slaves
                        // is done via broadcastFullState() which reads from the already-updated store.
                        if (this.isMainInstance) {
                            if (payload.projectedTokens) {
                                const currentTokens = store.tokens;
                                const updatedTokens = currentTokens.map(ct => {
                                    const incoming = payload.projectedTokens.find((pt: any) => pt.id === ct.id);
                                    return incoming ? { ...ct, x: incoming.x, y: incoming.y } : ct;
                                });
                                payload.tokens = updatedTokens;
                            }

                            if (payload.projectedPings) {
                                payload.pings = payload.projectedPings;
                            }
                        }

                        useMapStore.setState(prev => ({ ...prev, ...payload }));
                    }
                    break;
                case 'whiteboard':
                    useWhiteboardStore.setState(prev => ({ ...prev, ...payload }));
                    break;
                case 'combat':
                    useCombatStore.setState(prev => ({ ...prev, ...payload }));
                    break;
                case 'clock':
                    useClockStore.setState(prev => ({ ...prev, ...payload }));
                    break;
            }
        } finally {
            this.isApplyingRemoteUpdate = false;
        }
    }

    public isSyncing() {
        return this.isApplyingRemoteUpdate;
    }

    private setupSubscribers() {
        // Subscribe to store changes and broadcast them
        let prevState = useMapStore.getState();
        let lastMapBroadcast = 0;
        const MAP_THROTTLE = 33; // 30 FPS - Better balance between smoothness and CPU load

        useMapStore.subscribe((state) => {
            // CRITICAL: Avoid infinite loops by not re-broadcasting remote updates
            if (this.isApplyingRemoteUpdate) return;

            // Optimization: The isApplyingRemoteUpdate flag already prevents echoes.
            // Any state change that reaches here (isApplyingRemoteUpdate === false) 
            // is guaranteed to be a local interaction and should be broadcasted.
            // Only broadcast projection changes to avoid flooding
            const now = Date.now();
            const isProjectionChange = 
                state.projectedMapUrl !== prevState.projectedMapUrl || 
                state.projectionTarget !== prevState.projectionTarget;
            
            // We use a timeout to guarantee that the last throttled state is eventually broadcasted
            if (this.throttleTimer) {
                clearTimeout(this.throttleTimer);
                this.throttleTimer = null;
            }

            const processBroadcast = () => {
                const hasSignificantChanges = 
                    state.projectedMapUrl !== prevState.projectedMapUrl || 
                    state.projectedTokens !== prevState.projectedTokens ||
                    state.projectedPings !== prevState.projectedPings ||
                    state.projectionTarget !== prevState.projectionTarget ||
                    state.projectedWeatherType !== prevState.projectedWeatherType ||
                    state.projectedWeatherIntensity !== prevState.projectedWeatherIntensity ||
                    state.projectedTimeOfDay !== prevState.projectedTimeOfDay ||
                    state.projectedIsGridEnabled !== prevState.projectedIsGridEnabled ||
                    state.projectedGridSize !== prevState.projectedGridSize ||
                    state.projectedMagicEffects !== prevState.projectedMagicEffects ||
                    state.projectedFogDataUrl !== prevState.projectedFogDataUrl ||
                    state.projectedIsMapMuted !== prevState.projectedIsMapMuted;

                if (hasSignificantChanges) {
                    lastMapBroadcast = Date.now();
                    
                    // Lean Payload: Only send what is necessary
                    const payload: any = {
                        projectionTarget: state.projectionTarget
                    };

                    // 1. Tokens, Pings, Magic Effects (Frequent but light)
                    if (state.projectedTokens !== prevState.projectedTokens) {
                        payload.projectedTokens = state.projectedTokens;
                    }
                    if (state.projectedPings !== prevState.projectedPings) {
                        payload.projectedPings = state.projectedPings;
                    }
                    if (state.projectedMagicEffects !== prevState.projectedMagicEffects) {
                        payload.projectedMagicEffects = state.projectedMagicEffects;
                    }

                    // 2. Heavy Data (Only on change)
                    if (state.projectedMapUrl !== prevState.projectedMapUrl) {
                        payload.projectedMapUrl = state.projectedMapUrl;
                        payload.projectedIsVideo = state.projectedIsVideo;
                        payload.projectedMapWidth = state.projectedMapWidth;
                        payload.projectedMapHeight = state.projectedMapHeight;
                    }
                    
                    if (state.projectedFogDataUrl !== prevState.projectedFogDataUrl) {
                        payload.projectedFogDataUrl = state.projectedFogDataUrl;
                    }

                    // 3. Environment & Ambiance
                    if (state.projectedWeatherType !== prevState.projectedWeatherType || 
                        state.projectedWeatherIntensity !== prevState.projectedWeatherIntensity) {
                        payload.projectedWeatherType = state.projectedWeatherType;
                        payload.projectedWeatherIntensity = state.projectedWeatherIntensity;
                    }
                    if (state.projectedTimeOfDay !== prevState.projectedTimeOfDay) {
                        payload.projectedTimeOfDay = state.projectedTimeOfDay;
                    }

                    // 4. Grid and Settings (Stable)
                    if (state.projectedIsGridEnabled !== prevState.projectedIsGridEnabled || 
                        state.projectedGridSize !== prevState.projectedGridSize) {
                        payload.projectedIsGridEnabled = state.projectedIsGridEnabled;
                        payload.projectedGridSize = state.projectedGridSize;
                        payload.projectedGridColor = state.projectedGridColor;
                        payload.projectedGridOpacity = state.projectedGridOpacity;
                    }

                    if (state.projectedIsMapMuted !== prevState.projectedIsMapMuted) {
                        payload.projectedIsMapMuted = state.projectedIsMapMuted;
                        payload.projectedMapVolume = state.projectedMapVolume;
                    }

                    this.broadcast('map', payload);
                    prevState = state; // ONLY update prevState when we successfully broadcast!
                } else {
                    prevState = state; // Update even if no significant changes so we don't accumulate junk
                }
            };

            // Major changes (URL/Target) bypass throttle. Minor (Tokens/Pings) are throttled.
            if (isProjectionChange || (now - lastMapBroadcast > MAP_THROTTLE)) {
                processBroadcast();
            } else {
                // Schedule a flush so we don't drop the final state of a rapid sequence
                this.throttleTimer = setTimeout(() => {
                    processBroadcast();
                }, MAP_THROTTLE);
            }
        });

        let lastWhiteboardBroadcast = 0;
        const WB_THROTTLE = 50;

        useWhiteboardStore.subscribe((state) => {
            if (this.isApplyingRemoteUpdate) return;
            const now = Date.now();
            if (now - lastWhiteboardBroadcast > WB_THROTTLE) {
                lastWhiteboardBroadcast = now;
                this.broadcast('whiteboard', {
                    activePath: state.activePath,
                    laserPointer: state.laserPointer,
                    activeDrawerId: state.activeDrawerId,
                    version: state.version,
                    projectionTarget: state.projectionTarget
                });
            }
        });
    }

    /**
     * Broadcast an event to other windows.
     */
    public broadcast(type: string, payload: any) {
        this.channel.postMessage({ type, payload, senderId: this.instanceId });
    }

    private broadcastFullState() {
        // Send everything needed for initial sync
        const map = useMapStore.getState();
        this.broadcast('map', {
            projectionTarget: map.projectionTarget,
            projectedMapUrl: map.projectedMapUrl,
            projectedIsVideo: map.projectedIsVideo,
            projectedTokens: map.projectedTokens,
            projectedPings: map.projectedPings,
            projectedFogDataUrl: map.projectedFogDataUrl,
            projectedMapWidth: map.projectedMapWidth,
            projectedMapHeight: map.projectedMapHeight,
            projectedIsGridEnabled: map.projectedIsGridEnabled,
            projectedGridSize: map.projectedGridSize,
            projectedGridColor: map.projectedGridColor,
            projectedGridOpacity: map.projectedGridOpacity,
            projectedIsMapMuted: map.projectedIsMapMuted,
            projectedMapVolume: map.projectedMapVolume,
            projectedWeatherType: map.projectedWeatherType,
            projectedWeatherIntensity: map.projectedWeatherIntensity,
            projectedTimeOfDay: map.projectedTimeOfDay,
            projectedMagicEffects: map.projectedMagicEffects,
            projectedDangerZones: map.projectedDangerZones
        });

        const wb = useWhiteboardStore.getState();
        this.broadcast('whiteboard', {
            activePath: wb.activePath,
            laserPointer: wb.laserPointer,
            activeDrawerId: wb.activeDrawerId,
            version: wb.version,
            projectionTarget: wb.projectionTarget
        });
    }

    /**
     * Notify that this hub is ready to receive data.
     */
    public notifyReady() {
        if (this.isMainInstance) return;
        this.channel.postMessage({ type: 'hub:ready', senderId: this.instanceId });
    }
}

export const crossWindowSync = new CrossWindowEventService();
