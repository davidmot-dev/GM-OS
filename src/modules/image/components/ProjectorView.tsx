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

    const projections = useImageStore(state => state.projections);
    
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
            useImageStore.persist.rehydrate();
            
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
            
            return () => {
                if (typeof removeUpdate === 'function') removeUpdate();
                if (typeof removeSync === 'function') removeSync();
            };
        }
    }, [initDB, targetId, updateImageSource]);

    // Synchronisation via le Store (UNIQUEMENT AU BOOT)
    // Le store Zustand n'est pas synchronisé entre les fenêtres Electron en temps réel.
    // Dès qu'on reçoit un IPC (ipcCount > 0), le store local devient obsolète et on l'ignore définitivement.
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

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
            {!imagePath && <div className="text-white/10 uppercase text-xs tracking-widest">{t('common:standby')}</div>}
            
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
                    {/* Background Blur for atmosphere */}
                    <img 
                        src={resolvedUrl} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 transform scale-110" 
                    />
                    {/* Main Image */}
                    <img 
                        src={resolvedUrl} 
                        alt="GM-OS Projector" 
                        className="relative z-10 max-w-[95%] max-h-[95%] object-contain shadow-2xl" 
                    />
                </div>
            ) : imagePath && (
                <div className="flex flex-col items-center gap-4 text-accent/20">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Subtle overlay for identity */}
            <div className="absolute bottom-4 right-4 text-[10px] text-white/5 uppercase tracking-[0.3em]">
                Image-OS // Terminal Active
            </div>
        </div>
    );
};

export default ProjectorView;
