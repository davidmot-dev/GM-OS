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
import { videoDuMarqueur, adresseDIntegration, PREFIXE_YOUTUBE } from '../../web/youtube';
import { useNiveauDuLecteurYouTube } from '../../web/pilotageDuLecteurYouTube';

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
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'youtube' | 'unknown'>('unknown');
    /* Le même fait que `mediaType`, lisible depuis un rappel qui ne re-rend pas. */
    const estUneVideo = useRef(false);

    /*
      **Le niveau dicté par le meneur — 2026-09-05.**

      La vidéo joue ici, dans la fenêtre de projection, et ne peut pas rejoindre
      le bus audio qui vit dans celle du meneur. Celui-ci calcule le niveau et
      l'envoie ; on l'applique. Voir [[gainDeLaVideo]].

      ⚠️ **Il part à 1 et non à 0.** Un projecteur ouvert avant que le meneur
      n'ait touché à quoi que ce soit n'a rien reçu — *un silence qu'on ne
      s'explique pas coûte plus cher qu'un son trop fort, parce qu'on ne sait pas
      où chercher.* Le meneur renvoie de toute façon le niveau à chaque
      changement de projection.
    */
    const [niveauDuSon, setNiveauDuSon] = useState(1);
    const elementVideo = useRef<HTMLVideoElement | null>(null);
    const cadreYouTube = useRef<HTMLIFrameElement | null>(null);

    /*
      ⭐ **Le cadre YouTube obéit au même niveau — 2026-09-05.** L'enceinte de
      sortie reste hors de portée ; le niveau, non. Voir
      [[pilotageDuLecteurYouTube]].
    */
    const muetAuDepart = useRef(niveauDuSon === 0);

    /* Sans condition : un cadre absent ne reçoit rien, et il n'y a rien à dire. */
    useNiveauDuLecteurYouTube(cadreYouTube, niveauDuSon, true);

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
            if (type === 'son-video') {
                const niveau = Number(data);
                // Un message abîmé ne doit pas rendre la vidéo muette pour de bon.
                if (Number.isFinite(niveau)) setNiveauDuSon(Math.min(1, Math.max(0, niveau)));
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
        if (!imagePath) return;

        /*
          **Une vidéo YouTube se reconnaît à son marqueur, pas à un blob.** Elle
          ne passe pas par le Media Hub : rien à charger, rien à renifler.

          Elle compte comme une vidéo pour `estUneVideo` — donc elle **part sans
          attendre le fondu**. Un cadre distant gardé monté et transparent
          continuerait de jouer son son, et aucun réglage de GM-OS ne pourrait
          l'en empêcher.
        */
        if (imagePath.startsWith(PREFIXE_YOUTUBE)) {
            estUneVideo.current = true;
            setMediaType('youtube');
            return;
        }
        if (imagePath.startsWith('__')) return;

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

    /*
      **Le niveau s'applique à l'élément, pas par un attribut.**

      React n'a pas de propriété `volume` : la seule voie est l'élément lui-même.
      L'effet se rejoue aussi quand la source change, parce qu'un nouveau
      `<video>` naît toujours à plein volume — *un réglage qui ne se réapplique
      pas à la relève n'est vrai qu'une fois.*
    */
    useEffect(() => {
        const element = elementVideo.current;
        if (!element) return;
        element.volume = niveauDuSon;
    }, [niveauDuSon, imagePath, mediaType]);

    /*
      **Si la lecture avec son est refusée, on joue en muet plutôt que rien.**

      Electron autorise la lecture automatique, mais le réglage est modifiable et
      un navigateur ordinaire la refuse. Le refus est **silencieux** : la vidéo
      resterait figée sur sa première image, indiscernable d'une photographie, en
      pleine séance. *Une dégradation annoncée vaut mieux qu'une panne muette* —
      d'où la seconde tentative, et la trace dans la console.
    */
    useEffect(() => {
        const element = elementVideo.current;
        if (!element || mediaType !== 'video') return;

        element.play().catch((raison) => {
            console.warn('[ProjectorView] Lecture avec son refusée, reprise en muet :', raison);
            element.muted = true;
            element.play().catch(() => { /* Là, il n'y a plus rien à tenter. */ });
        });
    }, [imagePath, mediaType]);

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
                    
                    {mediaType === 'youtube' && videoDuMarqueur(imagePath ?? '') ? (
                        /*
                          **Le cadre YouTube — 2026-09-05, à la demande de David.**

                          ⚠️ **Son son n'obéit à personne ici.** Un cadre distant
                          ne se branche sur aucun contexte audio, et `niveauDuSon`
                          ne l'atteint pas : c'est le lecteur de YouTube qui tient
                          son volume. Le meneur le sait avant de projeter — Web-OS
                          le lui dit — et le geste de repli est de couper l'écran.

                          `allow` liste ce que le cadre a le droit de faire : sans
                          `autoplay`, la vidéo attendrait un clic que personne ne
                          peut donner sur un écran de projection.

                          ⭐ **Son niveau, lui, obéit depuis le 2026-09-05** :
                          `enablejsapi=1` et un ordre par `postMessage`. Ce qui
                          reste hors de portée est l'enceinte de sortie, pas le
                          volume.
                        */
                        <iframe
                            ref={cadreYouTube}
                            key={imagePath}
                            src={adresseDIntegration(videoDuMarqueur(imagePath ?? '')!, { muet: muetAuDepart.current })}
                            title="Vidéo YouTube projetée"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                            style={{ animation: `gmos-fondu-entrant ${FONDU_DE_LIMAGE_MS}ms ease-in-out` }}
                        />
                    ) : resolvedUrl && mediaType === 'video' ? (
                        /*
                          **La vidéo a du son depuis le 2026-09-05.** Elle était
                          `muted` en dur : elle jouait, et personne ne l'entendait.

                          `loop` est conservé — c'est le comportement d'origine, et
                          il sert l'usage courant, une boucle d'ambiance. Une vidéo
                          qui doit s'arrêter se coupe au blackout.
                        */
                        <video 
                            ref={elementVideo}
                            key={imagePath || 'vid'} 
                            src={resolvedUrl} 
                            autoPlay 
                            loop 
                            playsInline
                            className="w-full h-full object-contain"
                            style={{ animation: `gmos-fondu-entrant ${FONDU_DE_LIMAGE_MS}ms ease-in-out` }}
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
                            {/*
                              ⛔ **Le fondu d'entrée est une vraie animation, pas
                              `animate-in fade-in`** : ce projet n'a pas le
                              greffon `tailwindcss-animate`, ces classes n'y
                              produisent aucune règle, et l'image apparaissait
                              donc d'un coup depuis toujours — seule la SORTIE,
                              portée par le style en ligne du parent, jouait.

                              ⚠️ Sans mode de remplissage : `both` garderait
                              l'opacité de fin et **battrait l'opacité en ligne
                              du parent**, qui est ce qui joue le fondu de
                              sortie ; l'image ne s'éteindrait plus jamais.
                            */}
                            <div
                                key={resolvedUrl}
                                className="w-full h-full relative flex items-center justify-center"
                                style={{ animation: `gmos-fondu-entrant ${FONDU_DE_LIMAGE_MS}ms ease-in-out` }}
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
                            {isMapWindow && <div className="text-ui-10 uppercase tracking-widest animate-pulse">Chargement de la carte...</div>}
                        </div>
                    ) : null}
                </>
            )}

            {/* LAYER 3 : LE TITRE DU MOMENT — au-dessus de l'image, jamais de la carte */}
            <TitreProjete cible={targetId} />

            {/* Subtle overlay for identity */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 z-50">
                <div className="text-ui-10 text-white/20 uppercase tracking-[0.3em]">
                    {isMapWindow ? 'Map-OS' : isWhiteboardWindow ? 'Whiteboard-OS' : 'Image-OS'}
                </div>
            </div>
        </div>
    );
};

export default ProjectorView;
