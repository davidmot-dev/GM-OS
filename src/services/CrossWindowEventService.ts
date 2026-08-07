import { useMapStore } from '../modules/map/useMapStore';
import { useMapUIStore } from '../modules/map/useMapUIStore';
import { useWhiteboardStore, type DrawingPath } from '../modules/whiteboard/useWhiteboardStore';
import { useClockStore } from '../store/useClockStore';
import { useCombatStore } from '../modules/combat/useCombatStore';
import { WindowTransport, type WindowMessage, type SenderRole } from './windowTransport';

/** Types qu'une fenêtre secondaire peut émettre avant d'avoir reçu l'état partagé. */
const GATE_EXEMPT_TYPES = new Set(['map:lock', 'map:unlock', 'hub:ready']);

/**
 * Retire la cible de projection d'un payload reçu d'une fenêtre secondaire.
 *
 * Exporté pour être testé directement : c'est une garde de correction, et une
 * garde qu'on ne peut pas exercer se retire toute seule au fil du temps.
 */
export function stripProjectionTarget(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;
    if (!('projectionTarget' in payload)) return payload;

    // Copie : le payload reçu peut être partagé avec d'autres destinataires.
    const copy = { ...payload };
    delete copy.projectionTarget;
    return copy;
}

/**
 * Service de synchronisation entre les fenêtres locales (MJ, Player Hub, projecteur).
 *
 * Le transport lui-même est délégué à `WindowTransport`, qui aiguille chaque type
 * de message soit vers le `BroadcastChannel` historique, soit vers le relais du
 * process principal. La bascule se fait flux par flux ; la liste des flux déjà
 * passés vit dans `RELAYED_TYPES`.
 */
class CrossWindowEventService {
    private transport: WindowTransport;
    private isMainInstance: boolean = false;
    private instanceId: string = Math.random().toString(36).substring(2, 9);
    private isApplyingRemoteUpdate: boolean = false;
    private tokenLocks: Map<string, { ownerId: string, timestamp: number }> = new Map();
    private throttleTimer: ReturnType<typeof setTimeout> | null = null;
    private relayTimer: ReturnType<typeof setTimeout> | null = null;
    /**
     * Une fenêtre secondaire a-t-elle déjà reçu l'état partagé ?
     *
     * Avant cela, son store ne contient que sa valeur initiale ou ce que sa
     * réhydratation lui a rendu — un tableau vide, une projection à `null`. Or
     * toute écriture dans le store déclenche une diffusion, et le maître adopte
     * ce qu'une fenêtre secondaire lui envoie. Une fenêtre qui s'ouvre effaçait
     * donc l'état de celle qui faisait autorité.
     *
     * Tant que ce drapeau est faux, la fenêtre écoute sans émettre. `notifyReady`
     * n'est pas concerné — c'est justement ce qui déclenche la réponse du maître,
     * donc il n'y a pas d'inter-blocage possible.
     */
    private hasReceivedSharedState: boolean = false;
    /**
     * Dernière valeur de `paths` réellement partie sur le réseau.
     *
     * Le tableau blanc rediffusait l'intégralité de ses tracés à chaque mise à
     * jour — 106 Ko à quarante tracés, vingt fois par seconde pendant qu'on
     * dessine, et à la cadence de la souris avec l'outil laser, que
     * l'étranglement ne freine pas. Or `paths` ne change presque jamais dans ces
     * mises à jour-là : ce qui bouge est `activePath` ou `laserPointer`.
     *
     * La comparaison est par **référence**, ce que Zustand rend fiable : toute
     * mutation de `paths` produit un nouveau tableau, et une mise à jour qui n'y
     * touche pas conserve le même. C'est la technique déjà employée par le flux
     * carte pour ses champs lourds.
     *
     * Omettre le champ est sûr parce que le destinataire **fusionne**
     * (`{ ...prev, ...payload }`) : sans `paths`, il garde le sien.
     *
     * Le sens de l'erreur est sûr : on peut renvoyer des tracés déjà connus,
     * jamais en omettre qui manqueraient. D'où la mise à jour **après** la
     * diffusion, et seulement si elle a eu lieu.
     */
    private lastBroadcastPaths: DrawingPath[] | null = null;

    constructor() {
        this.transport = new WindowTransport(
            'gmos-cross-window-sync',
            (message, senderRole) => this.handleMessage(message, senderRole),
        );
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

    private handleMessage(message: WindowMessage, senderRole?: SenderRole) {
        const { type, senderId } = message;
        const payload = message.payload as any;

        // Ignore messages from ourselves.
        // Le relais du process principal ne renvoie déjà rien à l'émetteur ;
        // ce filtre reste nécessaire au BroadcastChannel, qui, lui, ne fait
        // aucune distinction.
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
                case 'whiteboard':
                    // La cible de projection appartient au MJ : elle est décidée
                    // dans WhiteboardProjectionModal, qui ne vit que dans cette
                    // fenêtre. Une fenêtre secondaire n'en est jamais la source
                    // légitime, mais elle en diffuse une copie dans chacune de ses
                    // mises à jour — et sa valeur au démarrage est `null`, avant
                    // toute synchronisation.
                    //
                    // L'adopter éteignait la projection : le maître prenait le
                    // `null` du hub, puis le rediffusait à tout le monde. La panne
                    // n'apparaissait que selon l'ordre d'arrivée des messages, ce
                    // qui l'a rendue invisible jusqu'à ce que le passage du flux
                    // par le process principal change cet ordre.
                    //
                    // Le rôle vient du relais, pas du message : l'émetteur ne peut
                    // pas se déclarer MJ pour échapper au retrait. Hors Electron il
                    // n'y a personne pour l'attester — l'absence de rôle est donc
                    // traitée comme le cas le moins fiable.
                    this.applyRemoteUpdate(
                        'whiteboard',
                        senderRole === 'gm' ? payload : stripProjectionTarget(payload),
                    );
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
        this.hasReceivedSharedState = true;
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
            const isDrawingEnd = state.activePath === null;
            if (!isDrawingEnd && (now - lastWhiteboardBroadcast < WB_THROTTLE)) return;

            lastWhiteboardBroadcast = now;

            const payload: Record<string, unknown> = {
                activePath: state.activePath,
                laserPointer: state.laserPointer,
                activeDrawerId: state.activeDrawerId,
                version: state.version,
                projectionTarget: state.projectionTarget
            };

            // Les tracés ne repartent que s'ils ont changé. Voir lastBroadcastPaths.
            const pathsChanged = state.paths !== this.lastBroadcastPaths;
            if (pathsChanged) payload.paths = state.paths;

            if (this.broadcast('whiteboard', payload) && pathsChanged) {
                this.lastBroadcastPaths = state.paths;
            }
        });

        useCombatStore.subscribe((state) => {
            if (this.isApplyingRemoteUpdate) return;
            this.broadcast('combat', {
                combatants: state.combatants,
                currentTurnIdx: state.currentTurnIdx,
                round: state.round,
                isCombatProjected: state.isCombatProjected
            });
        });

        useClockStore.subscribe((state) => {
            if (this.isApplyingRemoteUpdate) return;
            this.broadcast('clock', {
                timestamp: state.timestamp,
                mode: state.mode,
                theme: state.theme,
                tensions: state.tensions,
                timerRemaining: state.timerRemaining,
                timerIsRunning: state.timerIsRunning,
                timerLabel: state.timerLabel,
                timerDuration: state.timerDuration,
                isClockProjected: state.isClockProjected
            });
        });
    }

    /**
     * Broadcast an event to other windows.
     *
     * @returns `false` si la garde de démarrage a retenu le message. L'appelant
     * qui tient une trace de ce qu'il a déjà envoyé — le flux du tableau blanc —
     * doit le savoir : sinon il croirait avoir diffusé des tracés restés sur place.
     */
    public broadcast(type: string, payload: any): boolean {
        // Une fenêtre secondaire qui n'a pas encore reçu l'état partagé n'a rien
        // à dire : ce qu'elle diffuserait viendrait de sa valeur initiale ou de
        // sa réhydratation, et écraserait la fenêtre qui fait autorité.
        //
        // Les verrous en sont exemptés : ils ne portent pas d'état partagé, donc
        // ne peuvent rien écraser, et les retenir laisserait un jeton saisissable
        // deux fois pendant les premières secondes d'une fenêtre.
        if (!this.isMainInstance && !this.hasReceivedSharedState && !GATE_EXEMPT_TYPES.has(type)) return false;

        this.transport.publish({ type, payload, senderId: this.instanceId });
        return true;
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

        // Les tracés partent toujours ici, sans la retenue de l'abonné : c'est
        // le chemin de resynchronisation, et son destinataire est justement une
        // fenêtre qui n'a rien à fusionner. En prendre note évite au passage un
        // renvoi redondant à la prochaine mise à jour.
        const wb = useWhiteboardStore.getState();
        if (this.broadcast('whiteboard', {
            paths: wb.paths,
            activePath: wb.activePath,
            laserPointer: wb.laserPointer,
            activeDrawerId: wb.activeDrawerId,
            version: wb.version,
            projectionTarget: wb.projectionTarget
        })) {
            this.lastBroadcastPaths = wb.paths;
        }
    }

    /**
     * Notify that this hub is ready to receive data.
     */
    public notifyReady() {
        if (this.isMainInstance) return;
        this.transport.publish({ type: 'hub:ready', senderId: this.instanceId });
    }
}

export const crossWindowSync = new CrossWindowEventService();
