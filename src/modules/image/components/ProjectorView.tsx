import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useMapStore } from '../../map/useMapStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import PlayerMapCanvas from '../../map/components/PlayerMapCanvas';
import { PlayerDrawingCanvas } from '../../whiteboard/components/PlayerDrawingCanvas';
import { useImageStore } from '../useImageStore';
import { useTranslation } from 'react-i18next';
import { openDB } from 'idb';

/**
 * Attempts to resolve an m-xxx media ID to a data: URI using the local IndexedDB.
 * Duplicate from useHubSync to avoid dependency cycle if moved to a hook, 
 * but for v7 we'll keep it here for robustness.
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
        console.error('[ProjectorView] Could not resolve m-id:', src, e);
    }
    return undefined;
}

const ProjectorView: React.FC = () => {
    const { t } = useTranslation('common');
    const searchParams = new URLSearchParams(window.location.search);
    const urlDisplayId = searchParams.get('displayId');
    const storeTarget = useMapStore(state => state.projectionTarget);
    const targetId = (urlDisplayId || storeTarget || 'monitor') as string;

    const projectedMapUrl = useMapStore(state => state.projectedMapUrl);
    const whiteboardTarget = useWhiteboardStore(state => state.projectionTarget);
    
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(undefined);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');
    const [isLoading, setIsLoading] = useState(false);

    const { initDB, getMediaBlob } = useMediaStore();

    const updateMedia = useCallback(async (path: string | null) => {
        if (!path) {
            setImagePath(null);
            setResolvedUrl(undefined);
            return;
        }

        console.log(`[ProjectorView] [${targetId}] Updating Media:`, path);
        setIsLoading(true);
        setImagePath(path);

        if (path.startsWith('m-')) {
            const dataUrl = await resolveMediaToDataUrl(path);
            setResolvedUrl(dataUrl);
            
            const blob = await getMediaBlob(path);
            setMediaType(blob?.type.startsWith('video/') ? 'video' : 'image');
        } else {
            setResolvedUrl(path);
            setMediaType('image');
        }
        setIsLoading(false);
    }, [targetId, getMediaBlob]);

    // 📡 SYNC LOGIC (BroadcastChannel & IPC)
    useEffect(() => {
        const boot = async () => {
            console.log(`[ProjectorView] Booting for target: ${targetId}`);
            await initDB();
            
            // Rehydration
            await useImageStore.persist.rehydrate();
            await useMapStore.persist.rehydrate();
            
            // Initial Sync from store
            const currentProj = useImageStore.getState().projections[targetId];
            if (currentProj) updateMedia(currentProj);

            // 🤝 HANDSHAKE
            const signalChannel = new BroadcastChannel('gmos-hub-signals');
            signalChannel.postMessage({ type: 'hub:ready', window: 'projector', targetId });
            signalChannel.close();
            
            window.appBridge?.ipc?.send('hub:ready', { window: 'projector', targetId });
        };
        boot();

        // ─── BroadcastChannels ──────────────────────────────────────────
        const imageChannel = new BroadcastChannel('gmos-image-sync');
        const mapChannel = new BroadcastChannel('gmos-map-sync');

        imageChannel.onmessage = (event) => {
            const { type, target, mediaPath, entity } = event.data;
            if (target !== targetId && target !== 'monitor') return;

            if (type === 'image:sync') updateMedia(mediaPath);
            if (type === 'image:clear') updateMedia(null);
            if (type === 'entity:sync') {
                const ent = typeof entity === 'string' ? JSON.parse(entity) : entity;
                const avatar = ent?.portraitUrl || ent?.imageUrl || ent?.avatar;
                updateMedia(avatar);
            }
        };

        mapChannel.onmessage = async (event) => {
            const msg = event.data;
            if (msg.target !== targetId && msg.target !== 'monitor' && msg.target !== 'all') return;

            if (msg.type === 'map:clear') {
                useMapStore.getState().resetProjectionState();
                return;
            }

            if (msg.type === 'map:sync') {
                let resolvedMapUrl: string | null = null;
                if (msg.mapId) {
                    resolvedMapUrl = await resolveMediaToDataUrl(msg.mapId) || null;
                }

                useMapStore.setState(prev => ({
                    ...prev,
                    projectionTarget: targetId,
                    projectedMapUrl: resolvedMapUrl,
                    projectedIsVideo: msg.isVideo,
                    projectedFogDataUrl: msg.fogDataUrl,
                    projectedTokens: msg.tokens || [],
                    projectedWeatherType: msg.weatherType,
                    projectedWeatherIntensity: msg.weatherIntensity,
                    projectedTimeOfDay: msg.timeOfDay,
                    projectedMapWidth: msg.mapWidth,
                    projectedMapHeight: msg.mapHeight,
                    projectedIsGridEnabled: msg.isGridEnabled,
                    projectedGridSize: msg.gridSize,
                    projectedGridColor: msg.gridColor,
                    projectedGridOpacity: msg.gridOpacity,
                }));
                
                // Clear solo image if map is active
                updateMedia(null);
            }
        };

        return () => {
            imageChannel.close();
            mapChannel.close();
        };
    }, [targetId, initDB, updateMedia]);

    const isMapActive = !!projectedMapUrl;
    const isWhiteboardActive = targetId === whiteboardTarget;

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
            {/* CINEMATIC OVERLAYS */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            <div className="absolute inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />

            {/* STANDBY / LOADING */}
            <AnimatePresence>
                {!imagePath && !isMapActive && !isWhiteboardActive && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                        <div className="text-accent/40 uppercase text-[10px] font-black tracking-[0.5em] animate-pulse">
                            {t('common:standby')}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* LAYER 0: MAP-OS */}
            <AnimatePresence>
                {isMapActive && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0"
                    >
                        <PlayerMapCanvas 
                             onMapClick={(x, y) => {
                                window.appBridge?.ipc?.send('map:ping', { x, y, color: '#06b6d4', targetId });
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LAYER 10: IMAGE-OS */}
            <AnimatePresence mode="wait">
                {imagePath && (
                    <motion.div 
                        key={imagePath}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="absolute inset-0 z-10 flex items-center justify-center"
                    >
                        {resolvedUrl && mediaType === 'video' ? (
                            <video 
                                src={resolvedUrl} 
                                autoPlay 
                                loop 
                                muted 
                                className="w-full h-full object-contain" 
                            />
                        ) : resolvedUrl ? (
                            <div className="w-full h-full relative flex items-center justify-center">
                                <motion.img 
                                    src={resolvedUrl} 
                                    alt="" 
                                    className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-40 transform scale-125" 
                                />
                                <img 
                                    src={resolvedUrl} 
                                    alt="GM-OS Projection" 
                                    className="relative z-10 max-w-[92%] max-h-[92%] object-contain shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5 rounded-sm" 
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LAYER 20: WHITEBOARD-OS */}
            {isWhiteboardActive && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    <PlayerDrawingCanvas />
                </div>
            )}

            {/* IDENTITY LABEL */}
            <div className="absolute bottom-6 right-8 z-50 flex items-center gap-4 opacity-30 group hover:opacity-100 transition-opacity">
                <div className="h-px w-12 bg-gradient-to-l from-white/40 to-transparent" />
                <div className="flex flex-col items-end">
                    <div className="text-[10px] text-white font-black uppercase tracking-[0.4em]">
                        {isMapActive ? 'Map-OS' : isWhiteboardActive ? 'Whiteboard-OS' : 'Image-OS'}
                    </div>
                    <div className="text-[8px] text-accent font-mono uppercase tracking-[0.2em] mt-0.5">
                        Terminal Active — {targetId}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectorView;
