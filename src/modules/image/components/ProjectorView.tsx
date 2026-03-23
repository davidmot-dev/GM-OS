import React, { useEffect, useState } from 'react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useMapStore } from '../../map/useMapStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import PlayerMapCanvas from '../../map/components/PlayerMapCanvas';
import { PlayerDrawingCanvas } from '../../whiteboard/components/PlayerDrawingCanvas';
import { useVoiceStore } from '../../voice/useVoiceStore';
import { useTacticalAIStore } from '../../tactical-ai/useTacticalAIStore';
import { useImageStore } from '../useImageStore';
import { useCombatStore } from '../../combat/useCombatStore';


const ProjectorView: React.FC = () => {
    const { projectionTarget } = useMapStore();
    const { backgroundMode } = useWhiteboardStore();
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [voiceLevel, setVoiceLevel] = useState(0);

    // Voice Sync Animation values
    // We don't check 'isSyncNPC' here because the Projector receives 'voice-level' ONLY if 
    // it's supposed to animate (filtered by VoiceEngine).
    const syncActive = voiceLevel > 0.05;
    const voiceScale = syncActive ? 1 + (voiceLevel * 0.15) : 1;
    const voiceGlow = syncActive ? `0 0 ${voiceLevel * 30}px rgba(6, 182, 212, ${voiceLevel})` : 'none';
    const resolvedUrl = useMediaUrl(imagePath || undefined);
    const { initDB } = useMediaStore();

    const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');
    const { getMediaBlob } = useMediaStore();

    useEffect(() => {
        initDB();
        
        // Rehydrate on mount to catch existing state
        const syncAtStart = async () => {
            await Promise.all([
                useMapStore.persist.rehydrate(),
                useWhiteboardStore.persist.rehydrate(),
                useVoiceStore.persist.rehydrate(),
                useImageStore.persist.rehydrate(),
                useCombatStore.persist.rehydrate()
            ]);
        };
        syncAtStart();

        // Fallback: If store says we are projecting to monitor, auto-set tactical map mode
        // This helps if the IPC event was missed or happened before window was ready
        const currentTarget = useMapStore.getState().projectionTarget;
        if (currentTarget === 'monitor' && !imagePath) {
            setImagePath('__tactical_map__');
        }

        // Initialize from Image Store projections if available
        const imageState = useImageStore.getState();
        const targetId = projectionTarget as string;
        if (targetId) {
            const myProjectionId = imageState.projections[targetId];
            if (myProjectionId) {
                const media = imageState.mediaList.find(m => m.id === myProjectionId);
                if (media) setImagePath(media.path);
                else setImagePath(myProjectionId);
            }
        }
        
        // Hide scrollbars and set black background
        document.body.style.overflow = 'hidden';
        document.body.style.backgroundColor = '#000';
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        // Listen for IPC updates
        if (window.appBridge?.on) {
            window.appBridge.on('image:update-display', (_event: unknown, paths: unknown) => {
                const typedPaths = paths as string[];
                if (typedPaths && typedPaths.length > 0 && typedPaths[0]) {
                    setImagePath(typedPaths[0]);
                } else {
                    setImagePath(null); // Blackout
                }
            });

            window.appBridge.on('image:clear-display', () => {
                setImagePath(null);
            });

            window.appBridge.on('image:sync-hub-data', (_event: unknown, ...args: unknown[]) => {
                const [type, data] = args as [string, string];
                if (type === 'voice-level') {
                    setVoiceLevel(parseFloat(data) || 0);
                }
            });
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.backgroundColor = '';
        };
    }, [initDB]);

    // Rehydrate Stores on storage changes (Cross-window Sync)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'gmos-map-storage') {
                useMapStore.persist.rehydrate();
            }
            if (e.key === 'gm-os-whiteboard-storage-v1') {
                useWhiteboardStore.persist.rehydrate();
            }
            if (e.key === 'gmos-voice-storage') {
                useVoiceStore.persist.rehydrate();
            }
            if (e.key === 'gm-os-tactical-ai') {
                useTacticalAIStore.persist.rehydrate();
            }
            if (e.key === 'gmos-image-storage') {
                useImageStore.persist.rehydrate();
            }
            if (e.key === 'gmos-combat-storage') {
                useCombatStore.persist.rehydrate();
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        // Detect media type
        if (!imagePath || imagePath === '__tactical_map__' || imagePath === '__whiteboard__') {
            setMediaType(prev => prev !== 'unknown' ? 'unknown' : prev);
            return;
        }

        const detectType = async () => {
            if (imagePath.startsWith('m-')) {
                const blob = await getMediaBlob(imagePath);
                if (blob) {
                    if (blob.type.startsWith('video/')) {
                        setMediaType('video');
                    } else {
                        setMediaType('image');
                    }
                } else {
                    setMediaType('image'); // default fallback
                }
            } else {
                // Infer from extension
                const ext = imagePath.split('.').pop()?.toLowerCase();
                if (['mp4', 'webm', 'ogg'].includes(ext || '')) {
                    setMediaType('video');
                } else {
                    setMediaType('image');
                }
            }
        };

        detectType();
    }, [imagePath, getMediaBlob]);

    // While resolving a media ID, we wait for the blob URL to avoid broken image icons
    const isResolving = imagePath?.startsWith('m-') && !resolvedUrl && imagePath !== '__tactical_map__' && imagePath !== '__whiteboard__';

    if (!imagePath) {
        return <div className="w-screen h-screen bg-app-bg" />;
    }
    
    if (isResolving) {
        return <div className="w-screen h-screen bg-app-bg flex items-center justify-center" />;
    }

    // SPECIAL MODE: Whiteboard
    if (imagePath === '__whiteboard__') {
        return (
            <div className={`w-screen h-screen overflow-hidden relative transition-colors duration-500 ${backgroundMode === 'light' ? 'bg-white' : 'bg-app-bg'}`}>
                <PlayerDrawingCanvas />
            </div>
        );
    }

    // SPECIAL MODE: Tactical Map
    // We show the map if explicitly requested OR as a fallback if the monitor is active but no other image is set
    if (imagePath === '__tactical_map__' || (projectionTarget === 'monitor' && !imagePath)) {
        // We use the store's current state. If the target is 'monitor', we render the canvas.
        const isTargetMonitor = projectionTarget === 'monitor';

        
        return (
            <div className="w-screen h-screen bg-app-bg overflow-hidden relative">
                {isTargetMonitor ? (
                    <div className="relative w-full h-full">
                        <PlayerMapCanvas onMapClick={(x, y) => useMapStore.getState().addPing(x, y, '#06b6d4')} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-app-text font-black uppercase tracking-widest text-2xl">
                        Standby
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-app-bg flex items-center justify-center overflow-hidden">
            {resolvedUrl && mediaType === 'video' ? (
                <video
                    src={resolvedUrl}
                    autoPlay
                    loop
                    muted
                    className="max-w-full max-h-full object-contain"
                />
            ) : resolvedUrl ? (
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Blurred background */}
                    <img
                        src={resolvedUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-[80px] opacity-40 scale-125"
                    />
                    {/* Crisp centered image */}
                    <img
                        src={resolvedUrl}
                        alt="Projection"
                        style={{
                            transform: `scale(${voiceScale})`,
                            boxShadow: voiceGlow,
                        }}
                        className="relative z-10 max-w-full max-h-full object-contain transition-all duration-75 animate-in fade-in rounded-lg"
                    />
                </div>
            ) : null}
        </div>
    );
};

export default ProjectorView;
