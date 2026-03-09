import React, { useEffect, useState } from 'react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useMapStore } from '../../map/useMapStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import PlayerMapCanvas from '../../map/components/PlayerMapCanvas';
import { PlayerDrawingCanvas } from '../../whiteboard/components/PlayerDrawingCanvas';

const ProjectorView: React.FC = () => {
    const [imagePath, setImagePath] = useState<string | null>(null);
    const resolvedUrl = useMediaUrl(imagePath || undefined);
    const { initDB } = useMediaStore();

    const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');
    const { getMediaBlob } = useMediaStore();

    useEffect(() => {
        initDB();
        
        // Load existing states immediately
        useMapStore.persist.rehydrate();
        useWhiteboardStore.persist.rehydrate();

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
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        // Detect media type
        if (!imagePath || imagePath === '__tactical_map__' || imagePath === '__whiteboard__') {
            setMediaType('unknown');
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
        return <div className="w-screen h-screen bg-black" />;
    }
    
    if (isResolving) {
        return <div className="w-screen h-screen bg-black flex items-center justify-center" />;
    }

    // SPECIAL MODE: Whiteboard
    if (imagePath === '__whiteboard__') {
        return (
            <div className="w-screen h-screen bg-black overflow-hidden relative">
                <PlayerDrawingCanvas />
            </div>
        );
    }

    // SPECIAL MODE: Tactical Map
    if (imagePath === '__tactical_map__') {
        // We use the store's current state. If the target is 'monitor', we render the canvas.
        const isTargetMonitor = useMapStore.getState().projectionTarget === 'monitor';
        
        return (
            <div className="w-screen h-screen bg-black overflow-hidden relative">
                {isTargetMonitor ? (
                    <PlayerMapCanvas />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-800 font-black uppercase tracking-widest text-2xl">
                        Standby
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
            {resolvedUrl && mediaType === 'video' ? (
                <video
                    src={resolvedUrl}
                    autoPlay
                    loop
                    muted
                    className="max-w-full max-h-full object-contain"
                />
            ) : resolvedUrl ? (
                <img
                    src={resolvedUrl}
                    alt="Projection"
                    className="max-w-full max-h-full object-contain transition-opacity duration-1000 animate-in fade-in"
                />
            ) : null}
        </div>
    );
};

export default ProjectorView;
