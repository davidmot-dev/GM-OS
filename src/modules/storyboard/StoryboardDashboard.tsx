/* ⛔ `window.useToastStore` n'existe pas — voir `useStoryboardStore.ts`. */
import { gmToast } from '../../stores/useToastStore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from './useStoryboardStore';
import type { StoryboardMoment } from './useStoryboardStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { 
    Zap, 
    Trash2, 
    Plus, 
    Music, 
    Sun, 
    Map as MapIcon, 
    Image as ImageIcon, 
    Volume2,
    Save,
    X,
    Settings2,
    Play,
    Square,
    Waves,
    Clapperboard,
    ArrowRight,
    GripVertical,
    Copy, Images, SlidersHorizontal } from 'lucide-react';
import { useAmbientStore } from '../ambient/useAmbientStore';
import { useTuilesVisibles } from '../light/hooks/useTuilesVisibles';
import { useImageStore } from '../image/useImageStore';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { useSortiesAudioDisponibles } from '../../hooks/useSortiesAudioDisponibles';
import {
    FONDU_MAX, FONDU_MIN, FONDU_PAR_DEFAUT, DUREE_MAX,
    POSITIONS, CONTOURS, COULEUR_PAR_DEFAUT,
} from './titreProjete';
import { POLICES_CONNUES } from '../../theme/editionDuTheme';
import { estUneVideo } from '../../stores/typesDeMedia';

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableMomentProps {
    moment: StoryboardMoment;
    index: number;
    activeMomentId: string | null;
    isLast: boolean;
    onTrigger: (id: string) => void;
    /** Referme la parenthèse : l'image de la scène revient. */
    onArreter: () => void;
    onEdit: (moment: StoryboardMoment) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    isOverlay?: boolean;
}

const MomentFrame: React.FC<SortableMomentProps & { dragProps?: Record<string, unknown>, dragListeners?: Record<string, unknown> }> = ({ 
    moment, 
    index, 
    activeMomentId, 
    onTrigger,
    onArreter,
    onEdit, 
    onDelete,
    onDuplicate,
    isOverlay,
    dragProps,
    dragListeners
}) => {
    const { t } = useTranslation(['modules']);

    return (
        <div 
            className={`w-72 h-[420px] rounded-3xl relative transition-all duration-500 group ${
                activeMomentId === moment.id 
                    ? 'scale-105 z-20' 
                    : 'scale-95 opacity-80 hover:opacity-100 hover:scale-100 z-10'
            } ${isOverlay ? 'opacity-100 scale-100 shadow-2xl rotate-3 cursor-grabbing' : ''}`}
        >
            {/* Active Glow */}
            {activeMomentId === moment.id && !isOverlay && (
                <div className="absolute -inset-4 bg-accent/10 blur-3xl rounded-full animate-pulse pointer-events-none" />
            )}

            {/* Frame Content */}
            <div className={`h-full bg-app-surface/60 border-2 rounded-3xl p-6 flex flex-col backdrop-blur-md shadow-2xl transition-all ${
                activeMomentId === moment.id ? 'border-accent shadow-glow-accent/20' : 'border-white/5 group-hover:border-white/20'
            } ${isOverlay ? 'border-accent/50 bg-app-surface/90' : ''}`}>
                
                {/* Frame Header: Number & Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div 
                            {...dragProps} 
                            {...dragListeners} 
                            className="p-2 hover:bg-white/10 rounded-lg cursor-grab active:cursor-grabbing text-slate-600 hover:text-accent transition-colors"
                            title={t('modules:storyboard.actions.drag_hint')}
                        >
                            <GripVertical size={20} />
                        </div>
                        <span className={`text-3xl font-black italic opacity-20 ${activeMomentId === moment.id ? 'text-accent opacity-40' : ''}`}>
                            {(index + 1).toString().padStart(2, '0')}
                        </span>
                    </div>
                    {!isOverlay && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => onDuplicate(moment.id)}
                                className="p-2 bg-white/5 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
                                title={t('modules:storyboard.actions.duplicate')}
                            >
                                <Copy size={14} />
                            </button>
                            <button 
                                onClick={() => onEdit(moment)}
                                className="p-2 bg-white/5 hover:bg-accent hover:text-app-bg rounded-xl transition-all"
                                title={t('modules:storyboard.actions.edit')}
                            >
                                <Settings2 size={14} />
                            </button>
                            <button 
                                onClick={() => onDelete(moment.id)}
                                className="p-2 bg-white/5 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                title={t('modules:storyboard.actions.delete')}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Trigger Button */}
                <button 
                    /* Le même bouton arrête ce qu'il a lancé : un moment
                       qu'on ne peut couper que depuis un autre écran laisse son
                       image sur la table, et l'image de la scène ne revient
                       jamais. */
                    onClick={() => (activeMomentId === moment.id ? onArreter() : onTrigger(moment.id))}
                    disabled={isOverlay}
                    className="flex-1 flex flex-col items-center justify-center gap-4 group/play"
                >
                    <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                        activeMomentId === moment.id 
                            ? 'bg-accent text-app-bg border-accent shadow-glow-accent' 
                            : 'bg-white/5 border-white/10 group-hover/play:bg-white/10 group-hover/play:border-accent group-hover/play:text-accent'
                    }`}>
                        {activeMomentId === moment.id
                            ? <Square size={28} fill="currentColor" />
                            : <Play size={32} fill="currentColor" className="group-hover/play:scale-110 transition-transform" />}
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-center leading-tight group-hover/play:text-accent transition-colors">
                        {moment.name}
                    </h3>
                </button>

                {/* Linked Modules Strip */}
                <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-2">
                    {moment.musicPadId && <div title={t('modules:storyboard.editor.music_label')} className="flex flex-col items-center gap-1"><Music size={12} className="text-blue-400" /><div className="w-full h-0.5 bg-blue-400/30 rounded-full" /></div>}
                    {(moment.ambientSceneId || moment.ambientThemeId) && <div title={t('modules:storyboard.editor.ambient_label')} className="flex flex-col items-center gap-1"><Waves size={12} className="text-cyan-400" /><div className="w-full h-0.5 bg-cyan-400/30 rounded-full" /></div>}
                    {moment.lightSceneId && <div title={t('modules:storyboard.editor.light_label')} className="flex flex-col items-center gap-1"><Sun size={12} className="text-orange-400" /><div className="w-full h-0.5 bg-orange-400/30 rounded-full" /></div>}
                    {moment.mapUrl && <div title={t('modules:storyboard.editor.map_label')} className="flex flex-col items-center gap-1"><MapIcon size={12} className="text-emerald-400" /><div className="w-full h-0.5 bg-emerald-400/30 rounded-full" /></div>}
                    {moment.imageMediaId && <div title={t('modules:storyboard.editor.image_label')} className="flex flex-col items-center gap-1"><ImageIcon size={12} className="text-purple-400" /><div className="w-full h-0.5 bg-purple-400/30 rounded-full" /></div>}
                    {moment.diaporamaId && <div title={t('modules:storyboard.editor.diaporama_label')} className="flex flex-col items-center gap-1"><Images size={12} className="text-purple-400" /><div className="w-full h-0.5 bg-purple-400/30 rounded-full" /></div>}
                    {moment.soundPadId && <div title={t('modules:storyboard.editor.sound_label')} className="flex flex-col items-center gap-1"><Volume2 size={12} className="text-rose-400" /><div className="w-full h-0.5 bg-rose-400/30 rounded-full" /></div>}
                </div>
            </div>
        </div>
    );
};

const SortableMoment: React.FC<SortableMomentProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.moment.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="flex items-center shrink-0"
        >
            <MomentFrame 
                {...props} 
                dragProps={attributes as unknown as Record<string, unknown>} 
                dragListeners={listeners as unknown as Record<string, unknown>} 
                isOverlay={false}
            />
            {/* Connection Arrow */}
            {!props.isLast && (
                <div className="shrink-0 px-4 flex items-center justify-center">
                    <ArrowRight size={24} className="text-white/10" />
                </div>
            )}
        </div>
    );
};

const StoryboardDashboard: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { moments, triggerMoment, arreterLeMoment, addMoment, updateMoment, deleteMoment, activeMomentId, setMoments, duplicateMoment } = useStoryboardStore();
    const { activeCampaignId, atlasMaps } = useSessionOSStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editingMoment, setEditingMoment] = useState<StoryboardMoment | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Form State (for new/edit)
    const [name, setName] = useState('');
    const [musicPadId, setMusicPadId] = useState('');
    const [lightSceneId, setLightSceneId] = useState('');
    const [mapUrl, setMapUrl] = useState('');
    /*
      **Une carte vidéo rejouée depuis un moment repartait en image fixe.**

      `isMapVideo` était **lu** — `useStoryboardStore` le passe à `setMap` — et
      **écrit par personne** : le bouton de capture copiait `mapStore.mapUrl` et
      oubliait `mapStore.isVideo`, qui se trouve juste à côté. La vidéo est
      entrée dans le projet le 05/09 ; le storyboard ne l'a pas suivie.

      *Un champ lu que rien n'écrit ne lève aucune erreur : il rend la valeur par
      défaut, et le défaut ressemble à un choix.*
    */
    const [mapEstVideo, setMapEstVideo] = useState(false);
    /* Où la carte part, et si elle arrive révélée — vide : comme avant. */
    const [mapTarget, setMapTarget] = useState('');
    const [mapRevelee, setMapRevelee] = useState(false);
    const [imageMediaId, setImageMediaId] = useState('');
    const [diaporamaId, setDiaporamaId] = useState('');
    const [soundPadId, setSoundPadId] = useState('');
    /*
      ⚠️ **`null` veut dire « ne touche à rien », et 0 veut dire « coupe ».**
      Un nombre seul ne saurait pas porter les deux — et `volume || undefined`,
      le réflexe de tout le reste de ce formulaire, avalerait le zéro.
    */
    const [musicVolume, setMusicVolume] = useState<number | null>(null);
    const [musicVolumeFondu, setMusicVolumeFondu] = useState(1500);
    const [ambientVolume, setAmbientVolume] = useState<number | null>(null);
    const [ambientVolumeFondu, setAmbientVolumeFondu] = useState(1500);
    const [soundVolume, setSoundVolume] = useState<number | null>(null);
    const [soundVolumeFondu, setSoundVolumeFondu] = useState(1500);

    const [ambientThemeId, setAmbientThemeId] = useState('');
    const [ambientSceneId, setAmbientSceneId] = useState('');
    /*
      **Où ça sort — demandé par David le 2026-08-31.** Vide veut dire « comme
      avant » : le module garde sa sortie, l'image part sur l'écran choisi dans
      Image-OS. C'est ce qui fait qu'un moment écrit hier se joue à l'identique.
    */
    const [musicOutputId, setMusicOutputId] = useState('');
    const [soundOutputId, setSoundOutputId] = useState('');
    const [ambientOutputId, setAmbientOutputId] = useState('');
    const [imageTarget, setImageTarget] = useState('');
    /* Le titre du moment, et ses deux réglages. Voir `titreProjete.ts`. */
    const [titre, setTitre] = useState('');
    const [titreFondu, setTitreFondu] = useState(String(FONDU_PAR_DEFAUT));
    const [titreDuree, setTitreDuree] = useState('');
    /* Vide = le défaut d'avant ce réglage : haut, police du thème, blanc, ombre forte. */
    const [titrePosition, setTitrePosition] = useState<string>('haut');
    const [titrePolice, setTitrePolice] = useState('');
    const [titreCouleur, setTitreCouleur] = useState(COULEUR_PAR_DEFAUT);
    const [titreContour, setTitreContour] = useState<string>('fort');

    const { scenes: ambientScenes, presets: ambientThemes, themeChargeId } = useAmbientStore();
    /* Les tuiles que la campagne ouverte laisse voir — même verdict que
       partout ailleurs, voir `light/hooks/useTuilesVisibles.ts`. */
    const { capturees: tuilesLumineuses } = useTuilesVisibles();
    const sortiesAudio = useSortiesAudioDisponibles();
    const { getAudioLabel, getDisplayLabel } = useHardwareStore();
    const ecrans = useImageStore(e => e.displays);
    /*
      **Les écrans se relèvent en entrant ici.** La liste vit dans Image-OS et ne
      se remplit qu'à l'ouverture de son tableau de bord : sans ce relevé, régler
      un moment sans être passé par Image-OS n'offrirait que le Player Hub.
    */
    useEffect(() => { void useImageStore.getState().fetchDisplays(); }, []);

    const campaignMoments = moments.filter(m => m.campaignId === activeCampaignId);

    // DND Sensors with activation constraint
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = moments.findIndex(m => m.id === active.id);
            const newIndex = moments.findIndex(m => m.id === over.id);
            
            const newMoments = arrayMove(moments, oldIndex, newIndex);
            setMoments(newMoments);
        }
    };

    const activeMoment = moments.find(m => m.id === activeId);
    const activeIndex = moments.findIndex(m => m.id === activeId);

    const startEdit = (moment: StoryboardMoment) => {
        setEditingMoment(moment);
        setName(moment.name || '');
        setMusicPadId(moment.musicPadId || '');
        setLightSceneId(moment.lightSceneId || '');
        setMapUrl(moment.mapUrl || '');
        /*
          `??` et non `||` : un moment écrit avant ce correctif n'a pas le champ,
          et son adresse décide alors — un `.mp4` enregistré hier se rejouera en
          vidéo sans qu'on ait à rouvrir le moment. Un `false` explicite, lui,
          est un choix et doit être respecté.
        */
        setMapEstVideo(moment.isMapVideo ?? estUneVideo(moment.mapUrl || ''));
        setMapTarget(moment.mapTarget || '');
        setMapRevelee(moment.mapBrouillard === 'revelee');
        setImageMediaId(moment.imageMediaId || '');
        setDiaporamaId(moment.diaporamaId || '');
        setSoundPadId(moment.soundPadId || '');
        setMusicVolume(typeof moment.musicVolume === 'number' ? moment.musicVolume : null);
        setMusicVolumeFondu(moment.musicVolumeFondu ?? 1500);
        setAmbientVolume(typeof moment.ambientVolume === 'number' ? moment.ambientVolume : null);
        setAmbientVolumeFondu(moment.ambientVolumeFondu ?? 1500);
        setSoundVolume(typeof moment.soundVolume === 'number' ? moment.soundVolume : null);
        setSoundVolumeFondu(moment.soundVolumeFondu ?? 1500);
        setAmbientThemeId(moment.ambientThemeId || '');
        setAmbientSceneId(moment.ambientSceneId || '');
        setMusicOutputId(moment.musicOutputId || '');
        setSoundOutputId(moment.soundOutputId || '');
        setAmbientOutputId(moment.ambientOutputId || '');
        setImageTarget(moment.imageTarget || '');
        setTitre(moment.titre || '');
        setTitreFondu(String(moment.titreFondu ?? FONDU_PAR_DEFAUT));
        setTitreDuree(moment.titreDuree ? String(moment.titreDuree) : '');
        setTitrePosition(moment.titrePosition ?? 'haut');
        setTitrePolice(moment.titrePolice ?? '');
        setTitreCouleur(moment.titreCouleur ?? COULEUR_PAR_DEFAUT);
        setTitreContour(moment.titreContour ?? 'fort');
        setIsEditing(true);
    };

    const startNew = () => {
        setEditingMoment(null);
        setName(t('modules:storyboard.editor.name_placeholder').split(': ')[1] || 'New Moment');
        setMusicPadId('');
        setLightSceneId('');
        setMapUrl('');
        setMapTarget('');
        setMapRevelee(false);
        setImageMediaId('');
        setSoundPadId('');
        setMusicVolume(null);
        setMusicVolumeFondu(1500);
        setAmbientVolume(null);
        setAmbientVolumeFondu(1500);
        setSoundVolume(null);
        setSoundVolumeFondu(1500);
        setAmbientThemeId('');
        setAmbientSceneId('');
        setMusicOutputId('');
        setSoundOutputId('');
        setAmbientOutputId('');
        setImageTarget('');
        setTitre('');
        setTitreFondu(String(FONDU_PAR_DEFAUT));
        setTitreDuree('');
        setTitrePosition('haut');
        setTitrePolice('');
        setTitreCouleur(COULEUR_PAR_DEFAUT);
        setTitreContour('fort');
        setIsEditing(true);
    };

    const handleCapture = (type: 'music' | 'light' | 'map' | 'image' | 'sound' | 'ambient') => {

        switch (type) {
            case 'music': {
                const musicStore = (window as any).useMusicStore?.getState();
                if (musicStore) {
                    const padId = musicStore.deckA.isPlaying ? musicStore.deckA.activePadId : 
                                 (musicStore.deckB.isPlaying ? musicStore.deckB.activePadId : musicStore.deckA.activePadId);
                    if (padId) {
                        setMusicPadId(padId as string);
                        gmToast('ID Musique capturé !', 'info');
                    }
                }
                break;
            }
            case 'light': {
                const lightStore = (window as any).useLightStore?.getState();
                if (lightStore?.activeSceneId) {
                    setLightSceneId(lightStore.activeSceneId as string);
                    gmToast('Scène Lumière capturée !', 'info');
                }
                break;
            }
            /*
              **`currentMapUrl` n'existe pas** : le champ de `useMapStore`
              s'appelle `mapUrl`. Le bouton ne posait donc rien, et ne disait
              rien non plus — la garde `if` avalait l'échec. *Une capture muette
              est indiscernable d'une capture qui n'a rien trouvé.*
            */
            case 'map': {
                const mapStore = (window as any).useMapStore?.getState();
                if (mapStore?.mapUrl) {
                    setMapUrl(mapStore.mapUrl as string);
                    /*
                      **Le magasin de la carte fait foi**, pas l'extension : une
                      carte peut venir d'une adresse sans extension. On recopie
                      son verdict au lieu d'en rendre un second — *deux
                      classements pour un même fichier finissent par se
                      contredire*, la règle de `natureDuMedia`.
                    */
                    setMapEstVideo(Boolean(mapStore.isVideo));
                    gmToast(t('modules:storyboard.editor.captured_map'), 'info');
                } else {
                    gmToast(t('modules:storyboard.editor.capture_nothing'), 'warning');
                }
                break;
            }
            /*
              **`activeMediaId` n'existe pas non plus.** Image-OS retient
              `projections` — un chemin par écran — et `projectionTarget`,
              l'écran courant. Et le moment attend un **identifiant** de média
              là où les projections gardent un **chemin** : c'est la liste des
              médias qui fait le pont entre les deux.
            */
            case 'image': {
                const imageStore = (window as any).useImageStore?.getState();
                const cible = (imageStore?.projectionTarget as string) || 'hub';
                const chemin = imageStore?.projections?.[cible];
                const media = chemin && imageStore?.mediaList?.find(
                    (m: { id: string; path: string }) => m.path === chemin || m.id === chemin,
                );
                if (media) {
                    setImageMediaId(media.id as string);
                    gmToast(t('modules:storyboard.editor.captured_image'), 'info');
                } else {
                    gmToast(t('modules:storyboard.editor.capture_nothing'), 'warning');
                }
                break;
            }
            /*
              **Ces deux-là n'ont rien à capturer, et le disent maintenant.**
              Les messages précédents étaient bâtis sur les mauvaises clés — on
              lisait « Sound-OS : ex: Combat Final ». Sound-OS **empile** les
              bruitages (il n'y a pas de pad « actif » unique), et Ambient-OS
              applique ses scènes sans retenir laquelle : dans les deux cas, il
              n'existe aucun état courant à recopier.
            */
            case 'sound': {
                gmToast(t('modules:storyboard.editor.capture_unavailable'), 'warning');
                break;
            }
            /*
              ⭐ **Elle avait quelque chose à capturer, et on l'ignorait.** Le
              commentaire ci-dessus disait vrai d'une *scène* — Ambient-OS ne
              retient pas laquelle est appliquée. Mais il retient le **thème
              chargé** (`themeChargeId`), depuis qu'il existe. *Une capacité
              déclarée que personne ne lit n'est pas une capacité.*
            */
            case 'ambient': {
                if (themeChargeId) {
                    setAmbientThemeId(themeChargeId);
                } else {
                    gmToast(t('modules:storyboard.editor.capture_unavailable'), 'warning');
                }
                break;
            }
        }
    };

    const handleSave = () => {
        if (!activeCampaignId) return;

        const data = {
            name,
            musicPadId: musicPadId || undefined,
            lightSceneId: lightSceneId || undefined,
            mapUrl: mapUrl || undefined,
            isMapVideo: mapUrl && mapEstVideo ? true : undefined,
            /* Sans carte, ni écran ni brouillard : ils ne diraient rien. */
            mapTarget: mapUrl && mapTarget ? mapTarget : undefined,
            mapBrouillard: mapUrl && mapRevelee ? 'revelee' as const : undefined,
            /*
              ⚠️ **Un seul des deux part.** Ils visent la même place à l'écran :
              un moment qui porterait les deux les enverrait l'un après l'autre,
              et le second effacerait le premier. Les deux listes déroulantes
              s'éteignent déjà l'une l'autre à la saisie ; cette ligne le garantit
              **aussi pour un moment ouvert avant cette version**.
            */
            imageMediaId: diaporamaId ? undefined : (imageMediaId || undefined),
            diaporamaId: diaporamaId || undefined,
            soundPadId: soundPadId || undefined,
            /*
              ⛔ **Surtout pas `|| undefined` ici.** Un volume à 0 est un
              « coupe le son », et `0 || undefined` rend `undefined` : le moment
              ferait l'inverse exact de ce qu'on lui demande, en laissant la
              source à plein volume sur le silence voulu.
            */
            musicVolume: musicVolume ?? undefined,
            musicVolumeFondu: musicVolume !== null ? musicVolumeFondu : undefined,
            ambientVolume: ambientVolume ?? undefined,
            ambientVolumeFondu: ambientVolume !== null ? ambientVolumeFondu : undefined,
            soundVolume: soundVolume ?? undefined,
            soundVolumeFondu: soundVolume !== null ? soundVolumeFondu : undefined,
            ambientThemeId: ambientThemeId || undefined,
            ambientSceneId: ambientSceneId || undefined,
            musicOutputId: musicOutputId || undefined,
            soundOutputId: soundOutputId || undefined,
            ambientOutputId: ambientOutputId || undefined,
            imageTarget: imageTarget || undefined,
            titre: titre.trim() || undefined,
            // Vide veut dire permanent : on n'enregistre alors aucune durée.
            titreFondu: titre.trim() ? Number(titreFondu) || 0 : undefined,
            titreDuree: titre.trim() && Number(titreDuree) > 0 ? Number(titreDuree) : undefined,
            /* On ne range que ce qui s'écarte du défaut : un moment qui n'a rien
               choisi reste un moment sans réglage, et se relira comme tel. */
            titrePosition: titre.trim() && titrePosition !== 'haut' ? titrePosition : undefined,
            titrePolice: titre.trim() && titrePolice ? titrePolice : undefined,
            titreCouleur: titre.trim() && titreCouleur !== COULEUR_PAR_DEFAUT ? titreCouleur : undefined,
            titreContour: titre.trim() && titreContour !== 'fort' ? titreContour : undefined,
            campaignId: activeCampaignId,
            description: '',
            color: 'var(--accent)',
            icon: 'Zap'
        };

        if (editingMoment) {
            updateMoment(editingMoment.id, data);
        } else {
            addMoment(data);
        }
        setIsEditing(false);
        setEditingMoment(null);
    };


    return (
        <div className="flex flex-col h-full bg-app-bg text-slate-200">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between bg-app-surface/40 border-b border-white/5 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-glow-accent/20 animate-pulse-slow">
                        <Clapperboard size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t('modules:storyboard.title')}</h2>
                        <p className="text-ui-10 font-bold text-slate-500 uppercase tracking-widest">{t('modules:storyboard.subtitle')}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={startNew}
                        className="flex items-center gap-2 px-6 py-3 bg-accent text-app-bg rounded-2xl text-ui-10 font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow-accent/20"
                    >
                        <Plus size={16} />
                        {t('modules:storyboard.add_sequence')}
                    </button>
                </div>
            </div>

            {/* Main Content: Horizontal Timeline */}
            <div className="flex-1 overflow-hidden flex relative">
                {/* Horizontal Scrolling Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-h flex items-center px-12 py-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-accent/5">
                    
                    {/* Vertical Perforations Background */}
                    <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-around opacity-5 pointer-events-none">
                        {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-4 h-4 rounded bg-white" />)}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-around opacity-5 pointer-events-none">
                        {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-4 h-4 rounded bg-white" />)}
                    </div>

                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={campaignMoments.map(m => m.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {campaignMoments.map((moment, index) => (
                                <SortableMoment 
                                    key={moment.id}
                                    moment={moment}
                                    index={index}
                                    activeMomentId={activeMomentId}
                                    isLast={index === campaignMoments.length - 1}
                                    onTrigger={triggerMoment}
                                    onArreter={arreterLeMoment}
                                    onEdit={startEdit}
                                    onDelete={deleteMoment}
                                    onDuplicate={duplicateMoment}
                                />
                            ))}
                        </SortableContext>

                        <DragOverlay adjustScale={true}>
                            {activeId && activeMoment ? (
                                <MomentFrame 
                                    moment={activeMoment}
                                    index={activeIndex}
                                    activeMomentId={activeMomentId}
                                    isLast={true}
                                    onTrigger={() => {}}
                                    onArreter={() => {}}
                                    onEdit={() => {}}
                                    onDelete={() => {}}
                                    onDuplicate={() => {}}
                                    isOverlay={true}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    {campaignMoments.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-app-text/20 py-20">
                            <Zap size={64} strokeWidth={1} className="mb-4 opacity-50" />
                            <p className="text-sm font-black uppercase tracking-widest text-center max-w-sm">
                                {t('modules:storyboard.empty_state')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Sidebar Editor Panel */}
                {isEditing && (
                    <div className="w-[450px] bg-app-surface/80 border-l border-white/5 backdrop-blur-2xl p-8 overflow-y-auto custom-scrollbar flex flex-col shadow-2xl animate-in slide-in-from-right duration-500 z-50">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-white">{t('modules:storyboard.editor.title')}</h3>
                                <p className="text-ui-10 font-bold text-accent uppercase tracking-widest">{t('modules:storyboard.editor.subtitle')}</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" title={t('modules:storyboard.editor.cancel')}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8 flex-1">
                            {/* Name Input */}
                            <div className="space-y-3">
                                <label className="text-ui-10 font-black uppercase tracking-widest text-slate-500">{t('modules:storyboard.editor.name_label')}</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-accent outline-none transition-all shadow-inner"
                                    placeholder={t('modules:storyboard.editor.name_placeholder')}
                                />
                            </div>

                            {/* Music & Ambient Group */}
                            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-blue-400">
                                        <span className="flex items-center gap-2"><Music size={14} /> {t('modules:storyboard.editor.music_label')}</span>
                                        <button onClick={() => handleCapture('music')} className="text-ui-9 hover:underline lowercase bg-blue-400/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
                                    </label>
                                    <select 
                                        value={musicPadId}
                                        onChange={e => setMusicPadId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-blue-400 outline-none"
                                        title={t('modules:storyboard.editor.music_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {((window as any).useMusicStore?.getState() as { playlists: Array<{ id: string, name: string, pads: Array<{ id: string, label: string }> }> })?.playlists?.map((pl: any) => (
                                            <optgroup key={pl.id} label={pl.name}>
                                                {pl.pads.map((pad: any) => (
                                                    <option key={pad.id} value={pad.id}>{pad.label}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>

                                    {/*
                                      **La sortie de ce son-là, et de lui seul.**
                                      Vide = la sortie du module, c'est-à-dire le
                                      comportement d'avant le 2026-08-31.
                                    */}
                                    <select
                                        value={musicOutputId}
                                        onChange={e => setMusicOutputId(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-blue-400/80 focus:border-blue-400 outline-none"
                                        title={t('modules:storyboard.editor.output_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.output_module')}</option>
                                        {sortiesAudio.map(appareil => (
                                            <option key={appareil.deviceId} value={appareil.deviceId}>
                                                {getAudioLabel(appareil.deviceId)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-cyan-400">
                                        <span className="flex items-center gap-2"><Waves size={14} /> {t('modules:storyboard.editor.ambient_label')}</span>
                                    </label>
                                    {/*
                                      ⛔ **LE THÈME D'ABORD, ET C'EST TOUT LE SUJET.**

                                      Une *scène* d'Ambient-OS ne charge aucun son :
                                      elle pose des volumes sur les huit pistes en
                                      place. Sans thème, un moment appliquait donc
                                      « Tension » à ce qui traînait — ou à huit
                                      emplacements vides, **sans une erreur**.
                                      Signalé par David le 2026-09-20.
                                    */}
                                    <select
                                        value={ambientThemeId}
                                        onChange={e => setAmbientThemeId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-cyan-400 outline-none"
                                        title={t('modules:storyboard.editor.ambient_theme_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.ambient_theme_none')}</option>
                                        {ambientThemes.map((theme) => (
                                            <option key={theme.id} value={theme.id}>
                                                {t(theme.name, { defaultValue: theme.name })}
                                            </option>
                                        ))}
                                    </select>

                                    <select 
                                        value={ambientSceneId}
                                        onChange={e => setAmbientSceneId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-cyan-400 outline-none"
                                        title={t('modules:storyboard.editor.ambient_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {ambientScenes.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {t(s.name, { defaultValue: s.name })}
                                            </option>
                                        ))}
                                    </select>

                                    {/* ⚠️ Le dire là où la décision se prend : un moment
                                        qui ne pose que le mélange hérite de la matière
                                        du moment précédent, ce qui est parfois voulu. */}
                                    {ambientSceneId && !ambientThemeId && (
                                        <p className="text-ui-10 text-amber-400/80 italic leading-snug">
                                            {t('modules:storyboard.editor.ambient_sans_theme')}
                                        </p>
                                    )}

                                    {/*
                                      **La sortie de ce son-là, et de lui seul.**
                                      Vide = la sortie du module, c'est-à-dire le
                                      comportement d'avant le 2026-08-31.
                                    */}
                                    <select
                                        value={ambientOutputId}
                                        onChange={e => setAmbientOutputId(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-cyan-400/80 focus:border-cyan-400 outline-none"
                                        title={t('modules:storyboard.editor.output_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.output_module')}</option>
                                        {sortiesAudio.map(appareil => (
                                            <option key={appareil.deviceId} value={appareil.deviceId}>
                                                {getAudioLabel(appareil.deviceId)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/*
                                  ⭐ **LE DOSAGE — ce qui fait d'un moment un mixage.**

                                  Il savait déjà *quoi* jouer sur chaque source,
                                  jamais **dans quel rapport**. Une révélation
                                  chuchotée et une charge de cavalerie emploient
                                  les mêmes trois modules : ce qui les sépare est
                                  le dosage. Demandé par David le 2026-09-20.

                                  ⚠️ Chaque source s'active séparément, parce que
                                  **ne rien dire** et **couper** sont deux
                                  intentions différentes — et qu'un curseur seul
                                  ne saurait pas porter les deux.
                                */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-emerald-400">
                                        <span className="flex items-center gap-2">
                                            <SlidersHorizontal size={14} />
                                            {t('modules:storyboard.editor.volumes_label')}
                                        </span>
                                    </label>

                                    {([
                                        ['music', musicVolume, setMusicVolume, musicVolumeFondu, setMusicVolumeFondu],
                                        ['ambient', ambientVolume, setAmbientVolume, ambientVolumeFondu, setAmbientVolumeFondu],
                                        ['sound', soundVolume, setSoundVolume, soundVolumeFondu, setSoundVolumeFondu],
                                    ] as const).map(([cle, valeur, poser, fondu, poserLeFondu]) => (
                                        <div key={cle} className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => poser(valeur === null ? 1 : null)}
                                                title={valeur === null
                                                    ? t('modules:storyboard.editor.volume_activer')
                                                    : t('modules:storyboard.editor.volume_laisser')}
                                                className={`px-2 py-1 rounded-lg border text-ui-10 font-bold uppercase tracking-widest transition-colors w-28 shrink-0 text-left truncate ${
                                                    valeur === null
                                                        ? 'border-white/5 text-white/25 hover:text-white/60'
                                                        : 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10'
                                                }`}
                                            >
                                                {t(`modules:storyboard.editor.volume_${cle}`)}
                                            </button>

                                            {valeur === null ? (
                                                <span className="text-ui-10 text-white/20 italic flex-1 min-w-0">
                                                    {t('modules:storyboard.editor.volume_inchange')}
                                                </span>
                                            ) : (
                                                <>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        value={Math.round(valeur * 100)}
                                                        onChange={e => poser(Number(e.target.value) / 100)}
                                                        className="flex-1 accent-emerald-400 min-w-[6rem]"
                                                    />
                                                    <span className="text-ui-10 text-emerald-400/80 w-10 text-right tabular-nums shrink-0">
                                                        {Math.round(valeur * 100)} %
                                                    </span>
                                                    {/* Le fondu de CETTE source — couper net un bruitage
                                                        et laisser la musique glisser sont deux gestes. */}
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={30000}
                                                        step={100}
                                                        value={fondu}
                                                        onChange={e => poserLeFondu(Number(e.target.value))}
                                                        title={t('modules:storyboard.editor.volume_fondu')}
                                                        className="w-20 bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-ui-10 text-right tabular-nums outline-none focus:border-emerald-400 shrink-0"
                                                    />
                                                    <span className="text-ui-9 text-white/25 shrink-0">ms</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-rose-400">
                                        <span className="flex items-center gap-2"><Volume2 size={14} /> {t('modules:storyboard.editor.sound_label')}</span>
                                    </label>
                                    <select 
                                        value={soundPadId}
                                        onChange={e => setSoundPadId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-rose-400 outline-none"
                                        title={t('modules:storyboard.editor.sound_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {(() => {
                                            const state = (window as any).useSoundStore?.getState() as { activeAtmosphereId: string, atmospheres: Array<{ id: string, pads: Record<string, { id: string, title?: string, filePath?: string }> }> } | undefined;
                                            const atmosId = state?.activeAtmosphereId;
                                            const atmosphere = state?.atmospheres.find(a => a.id === atmosId);
                                            return atmosphere ? Object.values(atmosphere.pads).filter(p => p.filePath).map(p => (
                                                <option key={p.id} value={p.id}>{p.title || p.id}</option>
                                            )) : null;
                                        })()}
                                    </select>

                                    {/* La sortie de ce bruitage-là. Vide : celle de Sound-OS. */}
                                    <select
                                        value={soundOutputId}
                                        onChange={e => setSoundOutputId(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-rose-400/80 focus:border-rose-400 outline-none"
                                        title={t('modules:storyboard.editor.output_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.output_module')}</option>
                                        {sortiesAudio.map(appareil => (
                                            <option key={appareil.deviceId} value={appareil.deviceId}>
                                                {getAudioLabel(appareil.deviceId)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Visuals & Lights Group */}
                            <div className="p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10 space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-orange-400">
                                        <span className="flex items-center gap-2"><Sun size={14} /> {t('modules:storyboard.editor.light_label')}</span>
                                        <button onClick={() => handleCapture('light')} className="text-ui-9 hover:underline lowercase bg-orange-400/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
                                    </label>
                                    <select 
                                        value={lightSceneId}
                                        onChange={e => setLightSceneId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-orange-400 outline-none"
                                        title={t('modules:storyboard.editor.light_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {/*
                                          Le même verdict que la grille de
                                          Light-OS. ⚠️ Cette liste se lisait par
                                          `window.useLightStore.getState()`
                                          **pendant le rendu** : elle ne se
                                          rafraîchissait donc jamais, et une
                                          tuile capturée juste avant n'y
                                          apparaissait pas.
                                        */}
                                        {tuilesLumineuses.map(tuile => (
                                            <option key={tuile.id} value={tuile.id}>{tuile.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-emerald-400">
                                        <span className="flex items-center gap-2"><MapIcon size={14} /> {t('modules:storyboard.editor.map_label')}</span>
                                        <button onClick={() => handleCapture('map')} className="text-ui-9 hover:underline lowercase bg-emerald-400/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
                                    </label>
                                    <select 
                                        value={mapUrl}
                                        /*
                                          **Le choix dans l'Atlas décide aussi de la
                                          nature.** La liste porte des `fileUrl` de
                                          lieux : c'est l'extension qui tranche, par
                                          la même fonction que le Media Hub —
                                          `estUneVideo`. Une carte capturée depuis
                                          Map-OS, elle, garde le verdict du magasin.
                                        */
                                        onChange={e => { setMapUrl(e.target.value); setMapEstVideo(estUneVideo(e.target.value)); }}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-emerald-400 outline-none"
                                        title={t('modules:storyboard.editor.map_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {atlasMaps.filter(m => m.campaignId === activeCampaignId).map(m => (
                                            <option key={m.id} value={m.fileUrl}>{m.name}</option>
                                        ))}
                                    </select>

                                    {/*
                                      **Où elle part, et comment elle arrive** —
                                      demandé par David le 2026-09-25. N'apparaît
                                      qu'avec une carte : sans elle, ces deux
                                      réglages ne diraient rien.

                                      Vide : comme avant — la carte se charge
                                      dans Map-OS et la projection en cours, s'il
                                      y en a une, la suit.
                                    */}
                                    {mapUrl && (
                                        <>
                                            <select
                                                value={mapTarget}
                                                onChange={e => setMapTarget(e.target.value)}
                                                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-emerald-400/80 focus:border-emerald-400 outline-none"
                                                title={t('modules:storyboard.editor.map_screen_label')}
                                            >
                                                <option value="">{t('modules:storyboard.editor.map_screen_current')}</option>
                                                <option value="hub">{t('modules:storyboard.editor.screen_hub')}</option>
                                                {ecrans.map(ecran => (
                                                    <option key={ecran.id} value={ecran.id}>{getDisplayLabel(ecran.id)}</option>
                                                ))}
                                            </select>
                                            <label className="flex items-center gap-2 px-1 text-ui-11 font-bold text-emerald-400/80 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={mapRevelee}
                                                    onChange={e => setMapRevelee(e.target.checked)}
                                                    className="accent-emerald-400"
                                                />
                                                {t('modules:storyboard.editor.map_revealed')}
                                            </label>
                                            {mapRevelee && (
                                                <p className="px-1 text-ui-10 text-slate-500 italic leading-snug">
                                                    {t('modules:storyboard.editor.map_revealed_hint')}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-purple-400">
                                        <span className="flex items-center gap-2"><ImageIcon size={14} /> {t('modules:storyboard.editor.image_label')}</span>
                                        <button onClick={() => handleCapture('image')} className="text-ui-9 hover:underline lowercase bg-purple-400/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
                                    </label>
                                    <select 
                                        value={imageMediaId}
                                        onChange={e => { setImageMediaId(e.target.value); if (e.target.value) setDiaporamaId(''); }}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-purple-400 outline-none"
                                        title={t('modules:storyboard.editor.image_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {((window as unknown as Record<string, unknown>).useImageStore as { getState: () => { mediaList: Array<{ id: string, name: string }> } })?.getState()?.mediaList?.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>

                                    {/*
                                      **Ou un diaporama — 2026-09-13.**

                                      *« je veux pouvoir appeler ce diaporama après
                                      dans un Storyboard ».* Il part sur le même
                                      écran que l'image, parce que c'est la même
                                      place : le sélecteur d'écran ci-dessous vaut
                                      pour les deux.

                                      ⚠️ **Choisir l'un vide l'autre.** Un moment
                                      montre une image **ou** un diaporama ; les
                                      laisser coexister donnerait deux ordres pour
                                      un même écran, dont le second gagnerait une
                                      demi-seconde après le premier.
                                    */}
                                    <select
                                        value={diaporamaId}
                                        onChange={e => { setDiaporamaId(e.target.value); if (e.target.value) setImageMediaId(''); }}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-purple-400 outline-none"
                                        title={t('modules:storyboard.editor.diaporama_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.diaporama_none')}</option>
                                        {((window as unknown as Record<string, unknown>).useImageStore as { getState: () => { diaporamas?: Array<{ id: string, nom: string, imageIds: string[] }> } })?.getState()?.diaporamas?.map((d) => (
                                            <option key={d.id} value={d.id}>{d.nom} ({d.imageIds.length})</option>
                                        ))}
                                    </select>

                                    {/*
                                      **Sur quel écran.** Vide : la cible choisie
                                      dans Image-OS au moment du déclenchement —
                                      le comportement d'avant le 2026-08-31.
                                    */}
                                    <select
                                        value={imageTarget}
                                        onChange={e => setImageTarget(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-purple-400/80 focus:border-purple-400 outline-none"
                                        title={t('modules:storyboard.editor.screen_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.screen_current')}</option>
                                        <option value="hub">{t('modules:storyboard.editor.screen_hub')}</option>
                                        {/*
                                          ⛔ **`ecran.label` est l'étiquette du système, pas
                                          le nom donné par le meneur.**

                                          David, le 2026-09-13 : *« les noms des moniteurs
                                          ne sont pas corrects dans le storyboard »*. Cet
                                          écran affichait ce que Windows appelle le
                                          moniteur — quand ce n'est pas son identifiant
                                          brut — alors que les alias vivent dans
                                          `useHardwareStore`, rangés **par signature** pour
                                          survivre au rebranchement (§ 51 du 12/09).

                                          ⚠️ **Le même composant nommait déjà correctement
                                          les sorties audio**, trois listes plus haut, avec
                                          `getAudioLabel`. *Deux moitiés d'un même réglage
                                          écrites au même endroit, et une seule fait le
                                          détour par le nom du meneur.*

                                          Les deux autres écrans qui proposent un moniteur
                                          — l'atlas et les liens web — passent par
                                          `ecransDeProjection`, qui prend `getDisplayLabel`
                                          en paramètre. Celui-ci était le seul dehors.
                                        */}
                                        {ecrans.map(ecran => (
                                            <option key={ecran.id} value={ecran.id}>{getDisplayLabel(ecran.id)}</option>
                                        ))}
                                    </select>

                                    {/*
                                      **Le titre part sur le même écran que
                                      l'image** — c'est un titre SUR ce qu'on
                                      montre, pas une notification. Il s'affiche
                                      aussi sans image : « Trois jours plus tard »
                                      n'a pas besoin d'une nouvelle photo.
                                    */}
                                    <input
                                        type="text"
                                        value={titre}
                                        onChange={e => setTitre(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-purple-400 outline-none"
                                        placeholder={t('modules:storyboard.editor.title_placeholder')}
                                        title={t('modules:storyboard.editor.title_label')}
                                    />

                                    {titre.trim() && (
                                        <div className="flex gap-3">
                                            <label className="flex-1 flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-purple-400/60">
                                                    {t('modules:storyboard.editor.title_fade')}
                                                </span>
                                                <input
                                                    type="number" min={FONDU_MIN} max={FONDU_MAX} step={0.5}
                                                    value={titreFondu}
                                                    onChange={e => setTitreFondu(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-ui-11 font-bold outline-none focus:border-purple-400"
                                                />
                                            </label>
                                            <label className="flex-1 flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-purple-400/60">
                                                    {t('modules:storyboard.editor.title_duration')}
                                                </span>
                                                <input
                                                    type="number" min={0} max={DUREE_MAX} step={1}
                                                    value={titreDuree}
                                                    onChange={e => setTitreDuree(e.target.value)}
                                                    placeholder={t('modules:storyboard.editor.title_permanent')}
                                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-ui-11 font-bold outline-none focus:border-purple-400"
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {/*
                                      ⭐ **Où, dans quelle police, de quelle couleur** —
                                      demandé par David le 2026-09-21. Les polices sont
                                      celles des **réglages** (POLICES_CONNUES), sur sa
                                      demande : *une seconde liste de polices finirait
                                      par diverger de celle du thème.*
                                    */}
                                    {titre.trim() && (
                                        <div className="flex flex-wrap gap-3">
                                            <label className="flex-1 min-w-[7rem] flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-purple-400/60">
                                                    {t('modules:storyboard.editor.title_position')}
                                                </span>
                                                <select
                                                    value={titrePosition}
                                                    onChange={e => setTitrePosition(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-ui-11 font-bold outline-none focus:border-purple-400"
                                                >
                                                    {POSITIONS.map(p => (
                                                        <option key={p} value={p}>
                                                            {t(`modules:storyboard.editor.title_pos_${p}`)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="flex-1 min-w-[9rem] flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-purple-400/60">
                                                    {t('modules:storyboard.editor.title_font')}
                                                </span>
                                                <select
                                                    value={titrePolice}
                                                    onChange={e => setTitrePolice(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-ui-11 font-bold outline-none focus:border-purple-400"
                                                >
                                                    <option value="">{t('modules:storyboard.editor.title_font_theme')}</option>
                                                    {POLICES_CONNUES.map(police => (
                                                        <option key={police.famille} value={police.famille}>{police.famille}</option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-purple-400/60">
                                                    {t('modules:storyboard.editor.title_color')}
                                                </span>
                                                <input
                                                    type="color"
                                                    value={titreCouleur}
                                                    onChange={e => setTitreCouleur(e.target.value)}
                                                    className="h-[38px] w-14 bg-black/20 border border-white/5 rounded-xl cursor-pointer"
                                                />
                                            </label>

                                            <label className="flex-1 min-w-[7rem] flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-purple-400/60">
                                                    {t('modules:storyboard.editor.title_outline')}
                                                </span>
                                                <select
                                                    value={titreContour}
                                                    onChange={e => setTitreContour(e.target.value)}
                                                    title={t('modules:storyboard.editor.title_outline_help')}
                                                    className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-ui-11 font-bold outline-none focus:border-purple-400"
                                                >
                                                    {CONTOURS.map(contour => (
                                                        <option key={contour} value={contour}>
                                                            {t(`modules:storyboard.editor.title_outline_${contour}`)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 mt-10 border-t border-white/5 flex flex-col gap-4">
                            <button 
                                onClick={handleSave}
                                className="w-full bg-accent text-app-bg py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-glow-accent transition-all flex items-center justify-center gap-2 shadow-2xl"
                            >
                                <Save size={16} />
                                {t('modules:storyboard.editor.save')}
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="w-full bg-white/5 border border-white/5 text-slate-400 py-4 rounded-2xl text-ui-10 font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                {t('modules:storyboard.editor.cancel')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoryboardDashboard;
