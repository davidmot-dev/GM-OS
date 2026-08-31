import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useMapStore } from '../../map/useMapStore';
import { useWhiteboardStore } from '../../whiteboard/useWhiteboardStore';
import PlayerMapCanvas from '../../map/components/PlayerMapCanvas';
import { PlayerDrawingCanvas } from '../../whiteboard/components/PlayerDrawingCanvas';
import { useImageStore } from '../useImageStore';
import { useTranslation } from 'react-i18next';
import { TitreProjete } from '../../../components/TitreProjete';

/**
 * Le fondu de l'image projetée, à l'entrée comme à la sortie.
 *
 * Une seule durée pour les deux : *ce qui s'allume et ce qui s'éteint au même
 * rythme se lit comme un seul geste.*
 */
export const FONDU_DE_LIMAGE_MS = 700;

/**
 * ProjectorView - VERSION DEBUG ROBUSTE
 */
const ProjectorView: React.FC = () => {
    const { t } = useTranslation('common');
    const storeTarget = useMapStore(state => state.projectionTarget);
    const searchParams = new URLSearchParams(window.location.search);
    const isProjectorWindow = searchParams.get('window') === 'projector' || window.location.pathname.includes('/projector');
    const urlDisplayId = searchParams.get('displayId');
    const targetId = (urlDisplayId || (isProjectorWindow ? 'monitor' : storeTarget) || 'hub') as string;

    const projections = useImageStore(state => state.projections);
    
    const [ipcCount, setIpcCount] = useState(0);
    const [imagePath, setImagePath] = useState<string | null>(null);

    const resolvedUrl = useMediaUrl(imagePath && !imagePath.startsWith('__') ? imagePath : undefined);
    const { initDB, getMediaBlob } = useMediaStore();
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');
    /* Le même fait que `mediaType`, lisible depuis un rappel qui ne re-rend pas. */
    const estUneVideo = useRef(false);

    /*
      **L'image s'éteint en fondu, elle ne disparaît pas d'un coup.**

      *Demandé par David le 2026-08-31 : « quand je lance une autre séquence, tu
      dois aussi éteindre l'image en fade out de la séquence précédente ».*

      Effacer le chemin dès l'ordre reçu démonterait le nœud, et **supprimerait
      le fondu au lieu de le jouer** — la même leçon que le titre, une heure plus
      tôt. On garde donc le chemin le temps du fondu, et on ne pilote que
      l'opacité ; le chemin ne part qu'ensuite.

      ⚠️ **Une vidéo, elle, part tout de suite** : la garder montée en la rendant
      transparente la laisserait **jouer son son**. Une image muette peut
      s'attarder, pas une vidéo.
    */
    const [enSortie, setEnSortie] = useState(false);
    const sortieEnCours = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateImageSource = useCallback((newSource: string | null) => {
        console.log(`[ProjectorView] [${targetId}] Updating Source:`, newSource);
        if (sortieEnCours.current) {
            clearTimeout(sortieEnCours.current);
            sortieEnCours.current = null;
        }

        if (newSource === null && !estUneVideo.current) {
            setEnSortie(true);
            sortieEnCours.current = setTimeout(() => {
                setImagePath(null);
                setEnSortie(false);
            }, FONDU_DE_LIMAGE_MS);
            return;
        }

        setEnSortie(false);
        setImagePath(newSource);
    }, [targetId]);

    // Initialisation
    useEffect(() => {
        initDB();

        const handleUpdateDisplay = (_event: unknown, paths: string[]) => {
            setIpcCount(c => c + 1);
            const data = paths && paths.length > 0 ? paths[0] : 'EMPTY';
            updateImageSource(data === 'EMPTY' ? null : data);
        };

        const handleSyncHubData = (_event: unknown, ...args: unknown[]) => {
            const [type, data] = args as [string, string];
            if (type === 'image') {
                setIpcCount(c => c + 1);
                updateImageSource(data || null);
            }
        };

        if (window.appBridge?.on) {
            window.appBridge.on('image:update-display', handleUpdateDisplay);
            window.appBridge.on('image:sync-hub-data', handleSyncHubData);
            
            return () => {
                window.appBridge?.off?.('image:update-display', handleUpdateDisplay);
                window.appBridge?.off?.('image:sync-hub-data', handleSyncHubData);
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
                const type = blob?.type.startsWith('video/') ? 'video' : 'image';
                estUneVideo.current = type === 'video';
                setMediaType(type);
            } else {
                estUneVideo.current = false;
                setMediaType('image');
            }
        };
        detectType();
    }, [imagePath, getMediaBlob]);

    const { projectedMapUrl, projectionTarget: mapTarget } = useMapStore();
    const { projectionTarget: whiteboardTarget, backgroundMode } = useWhiteboardStore();
    
    // Logic: Active if either the store target matches OR the bridge sent the special signal
    // We separate "intent" (is this window a map window?) from "readiness" (do we have the data?)
    // "monitor" is a generic target that should match any projector window
    const isMapWindow = mapTarget === targetId || (mapTarget === 'monitor' && isProjectorWindow) || imagePath === '__tactical_map__';
    const isWhiteboardWindow = whiteboardTarget === targetId || (whiteboardTarget === 'monitor' && isProjectorWindow) || imagePath === '__whiteboard__';
    
    const isMapActive = !!(projectedMapUrl && isMapWindow);
    const isWhiteboardActive = isWhiteboardWindow; // Whiteboard doesn't need a URL to be "active" (blank canvas)

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden relative">
            {/* LAYER 0: MAP */}
            {isMapActive && (
                <div className="absolute inset-0 z-0">
                    <PlayerMapCanvas 
                        onMapClick={(x, y) => {
                            useMapStore.getState().addPing(x, y, '#06b6d4');
                        }}
                    />
                </div>
            )}

            {/* LAYER 1: WHITEBOARD */}
            {isWhiteboardActive && (
                <div className={`absolute inset-0 z-10 transition-colors duration-500 ${
                    backgroundMode === 'light' ? 'bg-white' : 'bg-black'
                }`}>
                    <PlayerDrawingCanvas />
                </div>
            )}

            {/* LAYER 2: IMAGES / VIDEOS (IMAGE-OS) */}
            {!isMapActive && !isWhiteboardActive && (
                <>
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
                        <div
                            className="w-full h-full relative flex items-center justify-center transition-opacity ease-in-out"
                            style={{
                                opacity: enSortie ? 0 : 1,
                                transitionDuration: `${FONDU_DE_LIMAGE_MS}ms`,
                            }}
                        >
                            {/*
                              **Deux couches, deux rôles.** Celle du dessus, avec
                              sa clé, rejoue le fondu d'ENTRÉE à chaque nouvelle
                              image ; celle du dessous ne pilote que l'opacité, et
                              c'est elle qui joue le fondu de SORTIE en gardant le
                              nœud monté. Une seule couche ne pourrait pas faire
                              les deux : la clé qui rejoue l'entrée démonte la
                              sortie.
                            */}
                            <div
                                key={resolvedUrl}
                                className="w-full h-full relative flex items-center justify-center animate-in fade-in"
                                style={{ animationDuration: `${FONDU_DE_LIMAGE_MS}ms` }}
                            >
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
                        </div>
                    ) : (imagePath || isMapWindow) ? (
                        <div className="flex flex-col items-center gap-4 text-accent/20">
                            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {isMapWindow && <div className="text-[10px] uppercase tracking-widest animate-pulse">Chargement de la carte...</div>}
                        </div>
                    ) : null}
                </>
            )}

            {/* LAYER 3 : LE TITRE DU MOMENT — au-dessus de l'image, jamais de la carte */}
            <TitreProjete cible={targetId} />

            {/* Subtle overlay for identity */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 z-50">
                <div className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
                    {isMapWindow ? 'Map-OS' : isWhiteboardWindow ? 'Whiteboard-OS' : 'Image-OS'}
                </div>
            </div>
        </div>
    );
};

export default ProjectorView;
