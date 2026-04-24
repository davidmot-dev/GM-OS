import React, { useEffect, useState, useCallback } from 'react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useMapStore } from '../../map/useMapStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import PlayerMapCanvas from '../../map/components/PlayerMapCanvas';
import { PlayerDrawingCanvas } from '../../whiteboard/components/PlayerDrawingCanvas';
import { useImageStore } from '../useImageStore';
import { useTranslation } from 'react-i18next';

/**
 * ProjectorView - VERSION DEBUG ROBUSTE
 */
const ProjectorView: React.FC = () => {
    const { t } = useTranslation('common');
    const storeTarget = useMapStore(state => state.projectionTarget);
    const urlDisplayId = new URLSearchParams(window.location.search).get('displayId');
    const targetId = (urlDisplayId || storeTarget || 'hub') as string;

    const projectedMapUrl = useMapStore(state => state.projectedMapUrl);
    const whiteboardTarget = useWhiteboardStore(state => state.projectionTarget);
    
    const [ipcCount, setIpcCount] = useState(0);
    const [imagePath, setImagePath] = useState<string | null>(null);

    const resolvedUrl = useMediaUrl(imagePath || undefined);
    const { initDB, getMediaBlob } = useMediaStore();
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');

    const updateImageSource = useCallback((newSource: string | null) => {
        console.log(`[ProjectorView] [${targetId}] Updating Source:`, newSource);
        setImagePath(newSource);
    }, [targetId]);

    // Initialisation
    useEffect(() => {
        const boot = async () => {
            console.log(`[ProjectorView] Booting for target: ${targetId}`);
            await initDB();
            // Force rehydratation immédiate
            await useImageStore.persist.rehydrate();
            await useMapStore.persist.rehydrate();
            await useWhiteboardStore.persist.rehydrate();
            
            // 📡 AUTO-SYNC : Signaler au MJ qu'on est prêt
            window.appBridge?.image?.syncHubData('projector-ready', targetId);
        };
        boot();

        if (window.appBridge?.on) {
            // Nettoyage des anciens écouteurs pour éviter les fuites
            const removeUpdate = window.appBridge.on('image:update-display', (_event: unknown, paths: string[]) => {
                setIpcCount(c => c + 1);
                const data = paths && paths.length > 0 ? paths[0] : 'EMPTY';
                console.log(`[ProjectorView] [${targetId}] IPC Received:`, paths);
                updateImageSource(data === 'EMPTY' ? null : data);
            });

            // 📡 Écoute du canal GLOBAL (Broadcast)
            const removeSync = window.appBridge.on('image:sync-hub-data', (_event: unknown, ...args: unknown[]) => {
                const [type, data] = args as [string, string];
                if (type === 'image') {
                    setIpcCount(c => c + 1);
                    console.log(`[ProjectorView] [${targetId}] Global Sync Received:`, data);
                    updateImageSource(data || null);
                }
            });

            // 🗺️ Écoute du canal MAP
            const removeMapSync = window.appBridge.on('map:sync-projector', (_event: unknown, payload: any) => {
                if (payload && payload.target === targetId) {
                    setIpcCount(c => c + 1);
                    console.log(`[ProjectorView] [${targetId}] Map Sync Received:`, payload);
                    
                    // On met à jour le store local pour que PlayerMapCanvas réagisse
                    useMapStore.setState(prev => ({
                        ...prev,
                        projectionTarget: targetId,
                        projectedMapUrl: payload.mapUrl,
                        projectedIsVideo: payload.isVideo,
                        projectedFogDataUrl: payload.fogDataUrl,
                        projectedTokens: payload.tokens || [],
                        projectedWeatherType: payload.weatherType,
                        projectedWeatherIntensity: payload.weatherIntensity,
                        projectedTimeOfDay: payload.timeOfDay,
                        projectedMapWidth: payload.mapWidth,
                        projectedMapHeight: payload.mapHeight,
                        projectedIsGridEnabled: payload.isGridEnabled,
                        projectedGridSize: payload.gridSize,
                        projectedGridColor: payload.gridColor,
                        projectedGridOpacity: payload.gridOpacity,
                        projectedMagicEffects: payload.magicEffects || [],
                        projectedDangerZones: payload.dangerZones || []
                    }));

                    // Si on projette une carte, on efface l'image solo
                    updateImageSource(null);
                }
            });
            
            return () => {
                if (typeof removeUpdate === 'function') removeUpdate();
                if (typeof removeSync === 'function') removeSync();
                if (typeof removeMapSync === 'function') removeMapSync();
            };
        }
    }, [initDB, targetId, updateImageSource]);

    const projections = useImageStore(state => state.projections);
    
    // Synchronisation via le Store (UNIQUEMENT AU BOOT)
    useEffect(() => {
        if (!targetId || ipcCount > 0) return;
        
        const activeMediaId = projections[targetId];
        
        console.log(`[ProjectorView] [${targetId}] Store Sync Check:`, activeMediaId);

        if (activeMediaId !== undefined && activeMediaId !== imagePath) {
            console.log(`[ProjectorView] [${targetId}] Store Syncing to:`, activeMediaId);
            updateImageSource(activeMediaId || null);
        }
    }, [projections, targetId, imagePath, updateImageSource, ipcCount]);

    // Détection du type de média
    useEffect(() => {
        if (!imagePath || imagePath.startsWith('__')) return;
        const detectType = async () => {
            if (imagePath.startsWith('m-')) {
                const blob = await getMediaBlob(imagePath);
                setMediaType(blob?.type.startsWith('video/') ? 'video' : 'image');
            } else {
                setMediaType('image');
            }
        };
        detectType();
    }, [imagePath, getMediaBlob]);

    const isMapActive = !!(projectedMapUrl && targetId === storeTarget);
    const isWhiteboardActive = targetId === whiteboardTarget;

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
            {/* STANDBY MESSAGE */}
            {!imagePath && !isMapActive && !isWhiteboardActive && (
                <div className="text-white/10 uppercase text-xs tracking-widest">{t('common:standby')}</div>
            )}
            
            {/* LAYER 0: MAP */}
            {isMapActive && (
                <div className="absolute inset-0 z-0">
                    <PlayerMapCanvas 
                         onMapClick={(x, y) => {
                            window.appBridge?.ipc?.send('map:ping', { x, y, color: '#06b6d4', targetId });
                        }}
                    />
                </div>
            )}

            {/* LAYER 10: IMAGES / VIDEOS */}
            {imagePath && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    {resolvedUrl && mediaType === 'video' ? (
                        <video 
                            key={imagePath || 'vid'} 
                            src={resolvedUrl} 
                            autoPlay 
                            loop 
                            muted 
                            className="w-full h-full object-contain animate-in fade-in duration-500" 
                        />
                    ) : resolvedUrl ? (
                        <div key={imagePath || 'img'} className="w-full h-full relative flex items-center justify-center animate-in fade-in duration-700">
                            <img 
                                src={resolvedUrl} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 transform scale-110" 
                            />
                            <img 
                                src={resolvedUrl} 
                                alt="GM-OS Projector" 
                                className="relative z-10 max-w-[95%] max-h-[95%] object-contain shadow-2xl" 
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-accent/20">
                            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            )}

            {/* LAYER 20: WHITEBOARD */}
            {isWhiteboardActive && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    <PlayerDrawingCanvas />
                </div>
            )}

            {/* Subtle overlay for identity */}
            <div className="absolute bottom-4 right-4 z-50 text-[10px] text-white/5 uppercase tracking-[0.3em]">
                {isMapActive ? 'Map-OS' : isWhiteboardActive ? 'Whiteboard-OS' : 'Image-OS'} // Terminal Active
            </div>
        </div>
    );
};

export default ProjectorView;
