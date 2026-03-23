import { useMapStore } from './useMapStore';
import type { DangerZone } from './types';
import { useLightStore } from '../light/useLightStore';
import { useSoundStore } from '../sound/useSoundStore';
import { useAmbientStore } from '../ambient/useAmbientStore';

export class SpatialTriggerService {
    private static instance: SpatialTriggerService;
    
    // Snapshot de l'état avant l'activation des zones
    private worldSnapshot: {
        hueSceneId: string | null;
        ambientTrackIndex: number | null;
        soundAtmosphereId: string | null;
    } | null = null;

    // Liste des zones actuellement actives (contenant au moins un token)
    // L'ordre définit la priorité (la dernière entrée gagne)
    private activeZones: string[] = [];

    public static getInstance(): SpatialTriggerService {
        if (!SpatialTriggerService.instance) {
            SpatialTriggerService.instance = new SpatialTriggerService();
        }
        return SpatialTriggerService.instance;
    }

    /**
     * Démarre la surveillance réactive du store Map.
     * Permet de réagir aux mouvements de tokens même s'ils viennent d'un autre écran (Player Hub).
     */
    public startWatching(): void {
        console.log("[SpatialTrigger] Démarrage de la surveillance réactive...");
        
        useMapStore.subscribe((state, prevState) => {
            // 1. Surveillance des mouvements de Tokens
            if (state.tokens !== prevState.tokens) {
                state.tokens.forEach(token => {
                    const prev = prevState.tokens.find(t => t.id === token.id);
                    // On ne déclenche que si la position change réellement
                    if (!prev || prev.x !== token.x || prev.y !== token.y) {
                        this.evaluateTokenPosition(token.id, token.x, token.y);
                    }
                });
            }

            // 2. Surveillance des changements structurels de Zones
            // On évite de boucler sur activeTokenIds car c'est nous qui le mettons à jour !
            if (state.dangerZones !== prevState.dangerZones) {
                const structuralChange = state.dangerZones.some((zone, idx) => {
                    const prevZone = prevState.dangerZones[idx];
                    if (!prevZone) return true; // Nouvelle zone
                    return zone.x !== prevZone.x || 
                           zone.y !== prevZone.y || 
                           zone.width !== prevZone.width ||
                           zone.height !== prevZone.height ||
                           zone.hueSceneId !== prevZone.hueSceneId ||
                           zone.audioAtmosphereId !== prevZone.audioAtmosphereId;
                });

                if (structuralChange) {
                    console.log("[SpatialTrigger] Changement structurel de zone détecté, réévaluation globale...");
                    this.evaluateAll();
                }
            }
        });
    }

    /**
     * Vérifie si un point (x, y) est à l'intérieur d'une zone.
     */
    public isPointInZone(px: number, py: number, zone: DangerZone): boolean {
        if (zone.type === 'rect') {
            return px >= zone.x && px <= zone.x + zone.width &&
                   py >= zone.y && py <= zone.y + zone.height;
        } else if (zone.type === 'circle') {
            const dx = px - zone.x;
            const dy = py - zone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= (zone.radius || zone.width / 2);
        } else if (zone.type === 'cone') {
            const dx = px - zone.x;
            const dy = py - zone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > (zone.radius || zone.width)) return false;

            // Calcul de l'angle du point par rapport à l'origine du cône (en degrés)
            const anglePoint = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Calcul de la différence d'angle avec la rotation du cône (en degrés)
            let diff = Math.abs(anglePoint - zone.rotation);
            if (diff > 180) diff = 360 - diff;
            
            return diff <= 30; // Ouverture de 60 degrés (±30)
        } else if (zone.type === 'line') {
            // Rectangle orienté : on ramène le point dans le repère local de la ligne
            const dx = px - zone.x;
            const dy = py - zone.y;
            const rad = -zone.rotation * (Math.PI / 180);
            const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
            const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

            const thickness = zone.height || 40;
            return localX >= 0 && localX <= zone.width &&
                   localY >= -thickness / 2 && localY <= thickness / 2;
        }
        return false;
    }

    /**
     * Évalue les changements d'état pour tous les tokens et toutes les zones.
     * Utile lors de l'ajout d'une nouvelle zone ou au chargement.
     */
    public evaluateAll(): void {
        const { tokens, dangerZones } = useMapStore.getState();
        console.log(`[SpatialTrigger] Évaluation globale pour ${tokens.length} tokens et ${dangerZones.length} zones`);
        tokens.forEach(token => {
            this.evaluateTokenPosition(token.id, token.x, token.y);
        });
    }

    /**
     * Évalue les changements d'état pour un token donné.
     * Cette méthode doit être appelée à chaque mise à jour de position de token.
     */
    public evaluateTokenPosition(tokenId: string, x: number, y: number): void {
        const { dangerZones } = useMapStore.getState();
        
        // 1. Évaluer ce jeton par rapport à TOUTES les zones
        dangerZones.forEach(zone => {
            this.evaluateDetection(tokenId, x, y, zone);
        });

        // 2. Si ce jeton possède une AURA, évaluer TOUS les autres jetons par rapport à cette aura
        const tokenAura = dangerZones.find(z => z.parentTokenId === tokenId);
        if (tokenAura) {
            const { tokens } = useMapStore.getState();
            tokens.forEach(otherToken => {
                if (otherToken.id !== tokenId) {
                    this.evaluateDetection(otherToken.id, otherToken.x, otherToken.y, tokenAura);
                }
            });
        }
    }

    /**
     * Logique interne de détection pour une paire token/zone spécifique.
     */
    private evaluateDetection(tokenId: string, tx: number, ty: number, zone: DangerZone): void {
        const { updateDangerZone } = useMapStore.getState();
        const isInside = this.isPointInZone(tx, ty, zone);
        const currentlyInside = zone.activeTokenIds.includes(tokenId);

        if (isInside && !currentlyInside) {
            console.log(`[SpatialTrigger] DETECTION: Token ${tokenId} est DANS la zone ${zone.name}`);
            this.handleZoneEntry(tokenId, zone);
            updateDangerZone(zone.id, {
                activeTokenIds: [...zone.activeTokenIds, tokenId]
            });
        } else if (!isInside && currentlyInside) {
            console.log(`[SpatialTrigger] DETECTION: Token ${tokenId} est SORTI de la zone ${zone.name}`);
            const newActiveIds = zone.activeTokenIds.filter(id => id !== tokenId);
            this.handleZoneExit(tokenId, zone, newActiveIds.length === 0);
            updateDangerZone(zone.id, {
                activeTokenIds: newActiveIds
            });
        }
    }

    private handleZoneEntry(tokenId: string, zone: DangerZone): void {
        console.log(`[SpatialTrigger] Token ${tokenId} est entré dans la zone ${zone.name}`);

        // 1. Gérer la pile des zones actives
        const isZoneAlreadyActive = this.activeZones.includes(zone.id);
        
        // Si c'est la toute première zone activée, on prend un snapshot
        if (this.activeZones.length === 0) {
            this.captureWorldSnapshot();
        }

        if (!isZoneAlreadyActive) {
            this.activeZones.push(zone.id);
        } else {
            // On déplace la zone à la fin pour qu'elle ait la priorité (Last In Wins)
            this.activeZones = [...this.activeZones.filter(id => id !== zone.id), zone.id];
        }

        // 2. Appliquer les effets de la zone
        this.applyZoneEffects(zone);
    }

    private handleZoneExit(tokenId: string, zone: DangerZone, isLastToken: boolean): void {
        console.log(`[SpatialTrigger] Token ${tokenId} est sorti de la zone ${zone.name}. isLastToken: ${isLastToken}`);

        if (isLastToken) {
            console.log(`[SpatialTrigger] Plus de tokens dans la zone ${zone.name}. Mise à jour de la pile...`);
            console.log(`[SpatialTrigger] Pile AVANT:`, this.activeZones);
            
            // 🛑 Arrêter le son de cette zone si c'est une boucle Ambient
            if (zone.audioAtmosphereId?.startsWith('track-')) {
                const trackIdx = parseInt(zone.audioAtmosphereId.split('-')[1]);
                
                // Vérifier si une AUTRE zone active (contenant des tokens) utilise AUSSI cette piste
                const { dangerZones } = useMapStore.getState();
                const isTrackUsedByOthers = this.activeZones
                    .filter(id => id !== zone.id)
                    .some(id => {
                        const otherZone = dangerZones.find(z => z.id === id);
                        return otherZone?.audioAtmosphereId === zone.audioAtmosphereId;
                    });

                if (!isTrackUsedByOthers) {
                    console.log(`[SpatialTrigger] Arrêt du son pour la zone ${zone.name} (Index: ${trackIdx})`);
                    const { tracks, toggleTrack } = useAmbientStore.getState();
                    if (tracks[trackIdx] && tracks[trackIdx].isPlaying) {
                        toggleTrack(trackIdx);
                    }
                }
            }

            // Retirer la zone de la pile
            this.activeZones = this.activeZones.filter(id => id !== zone.id);
            console.log(`[SpatialTrigger] Pile APRÈS:`, this.activeZones);

            if (this.activeZones.length === 0) {
                // Plus aucune zone active -> Restaurer le monde
                this.restoreWorldSnapshot();
            } else {
                // Il reste des zones -> Appliquer la zone qui a maintenant la priorité (le nouveau sommet de pile)
                const { dangerZones } = useMapStore.getState();
                const topZoneId = this.activeZones[this.activeZones.length - 1];
                const topZone = dangerZones.find(z => z.id === topZoneId);
                if (topZone) {
                    console.log(`[SpatialTrigger] Retour à la zone de priorité: ${topZone.name}`);
                    this.applyZoneEffects(topZone);
                }
            }
        }
    }

    private captureWorldSnapshot(): void {
        const lightState = useLightStore.getState();
        const ambientState = useAmbientStore.getState();
        const soundState = useSoundStore.getState();

        // Trouver la piste ambient qui joue actuellement
        const playingTrackIndex = ambientState.tracks.findIndex(t => t.isPlaying);

        this.worldSnapshot = {
            // On préfère lastManualSceneId pour Hue car c'est la scène "voulue" par le MJ
            hueSceneId: lightState.lastManualSceneId || lightState.activeSceneId,
            ambientTrackIndex: playingTrackIndex !== -1 ? playingTrackIndex : null,
            soundAtmosphereId: soundState.activeAtmosphereId
        };

        console.log("[SpatialTrigger] Snapshot capturé AVANT activation:", {
            hue: this.worldSnapshot.hueSceneId,
            ambient: this.worldSnapshot.ambientTrackIndex,
            sound: this.worldSnapshot.soundAtmosphereId,
            initialActiveScene: lightState.activeSceneId,
            initialLastManual: lightState.lastManualSceneId
        });
    }

    private restoreWorldSnapshot(): void {
        if (!this.worldSnapshot) return;

        console.log("[SpatialTrigger] Restauration du snapshot...", this.worldSnapshot);

        // 1. Restaurer Hue
        const hue = (window as any).hueEngine;
        if (hue) {
            console.log(`[SpatialTrigger] Restauration Hue vers: ${this.worldSnapshot.hueSceneId}`);
            hue.applyScene(this.worldSnapshot.hueSceneId, true);
        }

        // 2. Restaurer Ambient
        const { tracks, toggleTrack, fadeOutAll } = useAmbientStore.getState();
        const currentPlayingIdx = tracks.findIndex(t => t.isPlaying);

        if (this.worldSnapshot.ambientTrackIndex !== null) {
            // Si une piste jouait et que ce n'est plus la même, on restore
            if (currentPlayingIdx !== this.worldSnapshot.ambientTrackIndex) {
                toggleTrack(this.worldSnapshot.ambientTrackIndex);
            }
        } else if (currentPlayingIdx !== -1) {
            // Aucune piste ne jouait -> On coupe tout
            fadeOutAll();
        }

        // 3. Restaurer Sound Atmos
        if (this.worldSnapshot.soundAtmosphereId) {
            const { setActiveAtmosphereId, activeAtmosphereId } = useSoundStore.getState();
            if (activeAtmosphereId !== this.worldSnapshot.soundAtmosphereId) {
                setActiveAtmosphereId(this.worldSnapshot.soundAtmosphereId);
            }
        }

        this.worldSnapshot = null;
    }

    private applyZoneEffects(zone: DangerZone): void {
        console.log(`[SpatialTrigger] Application des effets de la zone: ${zone.name}`);

        // 💡 Logique Hue
        if (zone.hueSceneId) {
            const hue = (window as any).hueEngine;
            if (hue) {
                hue.applyScene(zone.hueSceneId, true);
            } else {
                const { setActiveScene } = useLightStore.getState();
                setActiveScene(zone.hueSceneId, true);
            }
        }

        // 🎵 Logique Audio Ambient (Boucle)
        if (zone.audioAtmosphereId) {
            if (zone.audioAtmosphereId.startsWith('track-')) {
                const trackIdx = parseInt(zone.audioAtmosphereId.split('-')[1]);
                const { tracks, toggleTrack } = useAmbientStore.getState();
                // On n'active que si elle ne joue pas déjà
                if (tracks[trackIdx] && !tracks[trackIdx].isPlaying && tracks[trackIdx].url) {
                    toggleTrack(trackIdx);
                }
            } else {
                // C'est une atmosphère Sound (Collection de pads)
                const { setActiveAtmosphereId, activeAtmosphereId } = useSoundStore.getState();
                if (activeAtmosphereId !== zone.audioAtmosphereId) {
                    setActiveAtmosphereId(zone.audioAtmosphereId);
                }
            }
        }
        
        // 🔊 Logique Audio Pad (Coup ponctuel)
        if (zone.audioPadId) {
            const { triggerPad, atmospheres, activeAtmosphereId } = useSoundStore.getState();
            const activeAtmos = atmospheres.find(a => a.id === activeAtmosphereId);
            const pad = activeAtmos?.pads[zone.audioPadId];
            
            if (pad && pad.filePath) {
                triggerPad(zone.audioPadId);
            }
        }
    }
}

export const spatialTriggerService = SpatialTriggerService.getInstance();
