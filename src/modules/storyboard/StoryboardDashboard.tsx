/* ⛔ `window.useToastStore` n'existe pas — voir `useStoryboardStore.ts`. */
import { gmToast } from '../../stores/useToastStore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from './useStoryboardStore';
import type { StoryboardMoment } from './useStoryboardStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { 
    Zap, 
    Plus, 
    Music, 
    Sun, 
    Map as MapIcon, 
    Image as ImageIcon, 
    Volume2,
    Save,
    X,
    Waves,
    Clapperboard,
    SlidersHorizontal } from 'lucide-react';
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
import { bruitagesProposes } from './bruitageDuMoment';
import { magasinDuHub } from '../../utils/magasinsDuHub';

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { EnTeteDuTableau, LigneDeMoment, DetailDuMoment } from './TableauDesMoments';
import { momentVoisin, type CleDeSource } from './sourcesDuMoment';

const StoryboardDashboard: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { moments, triggerMoment, arreterLeMoment, addMoment, updateMoment, deleteMoment, activeMomentId, setMoments, duplicateMoment } = useStoryboardStore();
    const { activeCampaignId, atlasMaps, campaigns } = useSessionOSStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editingMoment, setEditingMoment] = useState<StoryboardMoment | null>(null);

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
    /* L'atmosphère qui porte le pad : `PAD_03` existe dans chacune. */
    const [soundAtmosphereId, setSoundAtmosphereId] = useState('');
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = moments.findIndex(m => m.id === active.id);
            const newIndex = moments.findIndex(m => m.id === over.id);
            
            const newMoments = arrayMove(moments, oldIndex, newIndex);
            setMoments(newMoments);
        }
    };

    const momentEnCours = campaignMoments.find(m => m.id === activeMomentId) ?? null;
    const idsDuTableau = campaignMoments.map(m => m.id);
    const precedent = momentVoisin(idsDuTableau, momentEnCours?.id ?? null, -1);
    const suivant = momentVoisin(idsDuTableau, momentEnCours?.id ?? null, 1);

    /*
      **Ce que la source joue, en mots** — le détail du moment en cours. On
      lit les mêmes listes que le formulaire de réglage, pour qu'un nom lu ici
      soit le nom choisi là. Un identifiant qu'aucune liste ne connaît plus
      s'affiche tel quel : *un nom qui disparaît sans rien dire passe pour une
      source vide.*
    */
    const nommer = (cle: CleDeSource, m: StoryboardMoment): string => {
        const volume = (v?: number) => (typeof v === 'number' ? `${Math.round(v * 100)} %` : '');
        const avecVolume = (nom: string | undefined, v?: number) => [nom, volume(v)].filter(Boolean).join(' · ') || '—';
        switch (cle) {
            case 'musique': {
                const listes = magasinDuHub('useMusicStore')?.getState().playlists ?? [];
                const pad = listes.flatMap(pl => pl.pads).find(pd => pd.id === m.musicPadId);
                return avecVolume(pad?.label ?? m.musicPadId, m.musicVolume);
            }
            case 'ambiance': {
                const nom = ambientThemes.find(a => a.id === m.ambientThemeId)?.name
                    ?? ambientScenes.find(s => s.id === m.ambientSceneId)?.name;
                return avecVolume(nom, m.ambientVolume);
            }
            case 'lumiere':
                return tuilesLumineuses.find(tuile => tuile.id === m.lightSceneId)?.name ?? m.lightSceneId ?? '—';
            case 'carte':
                return atlasMaps.find(a => a.fileUrl === m.mapUrl)?.name ?? (m.mapUrl?.split(/[\\/]/).pop() || '—');
            case 'image': {
                const image = magasinDuHub('useImageStore')?.getState();
                if (m.diaporamaId) return image?.diaporamas?.find(d => d.id === m.diaporamaId)?.nom ?? m.diaporamaId;
                return image?.mediaList?.find(x => x.id === m.imageMediaId)?.name ?? m.imageMediaId ?? '—';
            }
            case 'bruitage': {
                const atmospheres = magasinDuHub('useSoundStore')?.getState().atmospheres ?? [];
                const pad = atmospheres
                    .filter(a => !m.soundAtmosphereId || a.id === m.soundAtmosphereId)
                    .flatMap(a => Object.values(a.pads ?? {}))
                    .find(pd => pd.id === m.soundPadId);
                return avecVolume(pad?.title ?? m.soundPadId, m.soundVolume);
            }
            case 'titre':
                return m.titre?.trim() || '—';
        }
    };

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
        /*
          Un moment plus ancien n'a pas d'atmosphère : il jouait celle qui est
          active. On la lui donne à l'ouverture — la liste le montre alors sous
          sa rubrique, et l'enregistrer fige ce qu'il jouait jusqu'ici.
        */
        setSoundAtmosphereId(moment.soundAtmosphereId
            || (moment.soundPadId
                ? (magasinDuHub('useSoundStore')?.getState().activeAtmosphereId ?? '')
                : ''));
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
        setSoundAtmosphereId('');
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
                const musicStore = magasinDuHub('useMusicStore')?.getState();
                if (musicStore) {
                    const padId = musicStore.deckA.isPlaying ? musicStore.deckA.activePadId : 
                                 (musicStore.deckB.isPlaying ? musicStore.deckB.activePadId : musicStore.deckA.activePadId);
                    if (padId) {
                        setMusicPadId(padId);
                        gmToast('ID Musique capturé !', 'info');
                    }
                }
                break;
            }
            case 'light': {
                const lightStore = magasinDuHub('useLightStore')?.getState();
                if (lightStore?.activeSceneId) {
                    setLightSceneId(lightStore.activeSceneId);
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
                const mapStore = magasinDuHub('useMapStore')?.getState();
                if (mapStore?.mapUrl) {
                    setMapUrl(mapStore.mapUrl);
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
                const imageStore = magasinDuHub('useImageStore')?.getState();
                const cible = imageStore?.projectionTarget || 'hub';
                const chemin = imageStore?.projections?.[cible];
                const media = chemin && imageStore?.mediaList?.find(
                    m => m.path === chemin || m.id === chemin,
                );
                if (media) {
                    setImageMediaId(media.id);
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
            soundAtmosphereId: soundPadId && soundAtmosphereId ? soundAtmosphereId : undefined,
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
        <div className="flex flex-col h-full bg-app-bg text-app-text">
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between bg-app-surface/40 border-b border-app-text/5 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-glow-accent/20 animate-pulse-slow">
                        <Clapperboard size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-app-text">{t('modules:storyboard.title')}</h2>
                        <p className="text-ui-10 font-bold text-app-subtle uppercase tracking-widest">{t('modules:storyboard.subtitle')}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={startNew}
                        className="flex items-center gap-2 px-6 py-3 bg-accent text-app-on-accent rounded-2xl text-ui-10 font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow-accent/20"
                    >
                        <Plus size={16} />
                        {t('modules:storyboard.add_sequence')}
                    </button>
                </div>
            </div>

            {/* Le tableau des moments à gauche ; à droite, le moment en cours — ou son réglage */}
            <div className="flex-1 overflow-hidden flex relative">
                <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar p-4">
                    <div className="overflow-x-auto rounded-xl border border-app-border bg-app-surface custom-scrollbar-h">
                        <div className="min-w-[44rem]">
                            <EnTeteDuTableau />
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={idsDuTableau} strategy={verticalListSortingStrategy}>
                                    {campaignMoments.map((moment, index) => (
                                        <LigneDeMoment
                                            key={moment.id}
                                            moment={moment}
                                            index={index}
                                            enCours={activeMomentId === moment.id}
                                            onJouer={triggerMoment}
                                            onArreter={arreterLeMoment}
                                            onRegler={startEdit}
                                            onSupprimer={deleteMoment}
                                            onDupliquer={duplicateMoment}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>

                        {campaignMoments.length === 0 && (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-app-subtle">
                                <Zap size={48} strokeWidth={1} className="mb-4 opacity-50" />
                                <p className="max-w-sm text-center text-sm font-black uppercase tracking-widest">
                                    {t('modules:storyboard.empty_state')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Editor Panel */}
                {isEditing ? (
                    <div className="w-[450px] shrink-0 bg-app-surface border-l border-app-border p-8 overflow-y-auto custom-scrollbar flex flex-col animate-in slide-in-from-right duration-500 z-20">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-app-text">{t('modules:storyboard.editor.title')}</h3>
                                <p className="text-ui-10 font-bold text-accent uppercase tracking-widest">{t('modules:storyboard.editor.subtitle')}</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-app-text/5 hover:bg-app-text/10 flex items-center justify-center transition-colors" title={t('modules:storyboard.editor.cancel')}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8 flex-1">
                            {/* Name Input */}
                            <div className="space-y-3">
                                <label className="text-ui-10 font-black uppercase tracking-widest text-app-subtle">{t('modules:storyboard.editor.name_label')}</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-app-bg/40 border border-app-text/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-accent outline-none transition-all shadow-inner"
                                    placeholder={t('modules:storyboard.editor.name_placeholder')}
                                />
                            </div>

                            {/* Music & Ambient Group */}
                            <div className="p-6 rounded-3xl bg-etat-info/5 border border-etat-info/10 space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-etat-info">
                                        <span className="flex items-center gap-2"><Music size={14} /> {t('modules:storyboard.editor.music_label')}</span>
                                        <button onClick={() => handleCapture('music')} className="text-ui-9 hover:underline lowercase bg-etat-info/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
                                    </label>
                                    <select 
                                        value={musicPadId}
                                        onChange={e => setMusicPadId(e.target.value)}
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-etat-info outline-none"
                                        title={t('modules:storyboard.editor.music_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {magasinDuHub('useMusicStore')?.getState().playlists?.map(pl => (
                                            <optgroup key={pl.id} label={pl.name}>
                                                {pl.pads.map(pad => (
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
                                        className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-etat-info/80 focus:border-etat-info outline-none"
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
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-gm-cyan">
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
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-cyan outline-none"
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
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-cyan outline-none"
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
                                        <p className="text-ui-10 text-etat-alerte/80 italic leading-snug">
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
                                        className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-gm-cyan/80 focus:border-gm-cyan outline-none"
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
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-gm-emerald">
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
                                                        ? 'border-app-text/5 text-app-text/25 hover:text-app-text/60'
                                                        : 'border-gm-emerald/40 text-gm-emerald bg-gm-emerald/10'
                                                }`}
                                            >
                                                {t(`modules:storyboard.editor.volume_${cle}`)}
                                            </button>

                                            {valeur === null ? (
                                                <span className="text-ui-10 text-app-text/20 italic flex-1 min-w-0">
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
                                                        className="flex-1 accent-etat-succes min-w-[6rem]"
                                                    />
                                                    <span className="text-ui-10 text-gm-emerald/80 w-10 text-right tabular-nums shrink-0">
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
                                                        className="w-20 bg-app-bg/40 border border-app-text/5 rounded-lg px-2 py-1 text-ui-10 text-right tabular-nums outline-none focus:border-gm-emerald shrink-0"
                                                    />
                                                    <span className="text-ui-9 text-app-text/25 shrink-0">ms</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-gm-crimson">
                                        <span className="flex items-center gap-2"><Volume2 size={14} /> {t('modules:storyboard.editor.sound_label')}</span>
                                    </label>
                                    <select 
                                        value={soundPadId ? `${soundAtmosphereId}::${soundPadId}` : ''}
                                        onChange={e => {
                                            const [atmosphere = '', pad = ''] = e.target.value ? e.target.value.split('::') : [];
                                            setSoundAtmosphereId(atmosphere);
                                            setSoundPadId(pad);
                                        }}
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-crimson outline-none"
                                        title={t('modules:storyboard.editor.sound_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {/*
                                          **Toutes les atmosphères, pas la seule active** —
                                          signalé par David le 2026-09-25. Une rubrique par
                                          atmosphère, selon la règle de Sound-OS lui-même
                                          pour la campagne ouverte (`bruitagesProposes`).
                                        */}
                                        {bruitagesProposes(
                                            magasinDuHub('useSoundStore')?.getState(),
                                            activeCampaignId ?? null,
                                            campaigns.map(c => c.id),
                                        ).map(({ atmosphere, pads }) => (
                                            <optgroup key={atmosphere.id} label={atmosphere.name}>
                                                {pads.map(p => (
                                                    <option key={p.id} value={`${atmosphere.id}::${p.id}`}>{p.title || p.id}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>

                                    {/* La sortie de ce bruitage-là. Vide : celle de Sound-OS. */}
                                    <select
                                        value={soundOutputId}
                                        onChange={e => setSoundOutputId(e.target.value)}
                                        className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-gm-crimson/80 focus:border-gm-crimson outline-none"
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
                            <div className="p-6 rounded-3xl bg-gm-gold/5 border border-gm-gold/10 space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-gm-gold">
                                        <span className="flex items-center gap-2"><Sun size={14} /> {t('modules:storyboard.editor.light_label')}</span>
                                        <button onClick={() => handleCapture('light')} className="text-ui-9 hover:underline lowercase bg-gm-gold/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
                                    </label>
                                    <select 
                                        value={lightSceneId}
                                        onChange={e => setLightSceneId(e.target.value)}
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-gold outline-none"
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
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-gm-emerald">
                                        <span className="flex items-center gap-2"><MapIcon size={14} /> {t('modules:storyboard.editor.map_label')}</span>
                                        <button onClick={() => handleCapture('map')} className="text-ui-9 hover:underline lowercase bg-gm-emerald/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
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
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-emerald outline-none"
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
                                                className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-gm-emerald/80 focus:border-gm-emerald outline-none"
                                                title={t('modules:storyboard.editor.map_screen_label')}
                                            >
                                                <option value="">{t('modules:storyboard.editor.map_screen_current')}</option>
                                                <option value="hub">{t('modules:storyboard.editor.screen_hub')}</option>
                                                {ecrans.map(ecran => (
                                                    <option key={ecran.id} value={ecran.id}>{getDisplayLabel(ecran.id)}</option>
                                                ))}
                                            </select>
                                            <label className="flex items-center gap-2 px-1 text-ui-11 font-bold text-gm-emerald/80 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={mapRevelee}
                                                    onChange={e => setMapRevelee(e.target.checked)}
                                                    className="accent-etat-succes"
                                                />
                                                {t('modules:storyboard.editor.map_revealed')}
                                            </label>
                                            {mapRevelee && (
                                                <p className="px-1 text-ui-10 text-app-subtle italic leading-snug">
                                                    {t('modules:storyboard.editor.map_revealed_hint')}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-ui-10 font-black uppercase tracking-widest text-gm-violet">
                                        <span className="flex items-center gap-2"><ImageIcon size={14} /> {t('modules:storyboard.editor.image_label')}</span>
                                        <button onClick={() => handleCapture('image')} className="text-ui-9 hover:underline lowercase bg-gm-violet/10 px-2 py-1 rounded">{t('modules:storyboard.editor.capture_active')}</button>
                                    </label>
                                    <select 
                                        value={imageMediaId}
                                        onChange={e => { setImageMediaId(e.target.value); if (e.target.value) setDiaporamaId(''); }}
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-violet outline-none"
                                        title={t('modules:storyboard.editor.image_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.none')}</option>
                                        {magasinDuHub('useImageStore')?.getState().mediaList?.map(m => (
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
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-violet outline-none"
                                        title={t('modules:storyboard.editor.diaporama_label')}
                                    >
                                        <option value="">{t('modules:storyboard.editor.diaporama_none')}</option>
                                        {magasinDuHub('useImageStore')?.getState().diaporamas?.map(d => (
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
                                        className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-4 py-2 text-ui-11 font-bold text-gm-violet/80 focus:border-gm-violet outline-none"
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
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-gm-violet outline-none"
                                        placeholder={t('modules:storyboard.editor.title_placeholder')}
                                        title={t('modules:storyboard.editor.title_label')}
                                    />

                                    {titre.trim() && (
                                        <div className="flex gap-3">
                                            <label className="flex-1 flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-gm-violet/60">
                                                    {t('modules:storyboard.editor.title_fade')}
                                                </span>
                                                <input
                                                    type="number" min={FONDU_MIN} max={FONDU_MAX} step={0.5}
                                                    value={titreFondu}
                                                    onChange={e => setTitreFondu(e.target.value)}
                                                    className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-4 py-2 text-ui-11 font-bold outline-none focus:border-gm-violet"
                                                />
                                            </label>
                                            <label className="flex-1 flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-gm-violet/60">
                                                    {t('modules:storyboard.editor.title_duration')}
                                                </span>
                                                <input
                                                    type="number" min={0} max={DUREE_MAX} step={1}
                                                    value={titreDuree}
                                                    onChange={e => setTitreDuree(e.target.value)}
                                                    placeholder={t('modules:storyboard.editor.title_permanent')}
                                                    className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-4 py-2 text-ui-11 font-bold outline-none focus:border-gm-violet"
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
                                                <span className="text-ui-9 uppercase tracking-widest text-gm-violet/60">
                                                    {t('modules:storyboard.editor.title_position')}
                                                </span>
                                                <select
                                                    value={titrePosition}
                                                    onChange={e => setTitrePosition(e.target.value)}
                                                    className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-3 py-2 text-ui-11 font-bold outline-none focus:border-gm-violet"
                                                >
                                                    {POSITIONS.map(p => (
                                                        <option key={p} value={p}>
                                                            {t(`modules:storyboard.editor.title_pos_${p}`)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="flex-1 min-w-[9rem] flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-gm-violet/60">
                                                    {t('modules:storyboard.editor.title_font')}
                                                </span>
                                                <select
                                                    value={titrePolice}
                                                    onChange={e => setTitrePolice(e.target.value)}
                                                    className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-3 py-2 text-ui-11 font-bold outline-none focus:border-gm-violet"
                                                >
                                                    <option value="">{t('modules:storyboard.editor.title_font_theme')}</option>
                                                    {POLICES_CONNUES.map(police => (
                                                        <option key={police.famille} value={police.famille}>{police.famille}</option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-gm-violet/60">
                                                    {t('modules:storyboard.editor.title_color')}
                                                </span>
                                                <input
                                                    type="color"
                                                    value={titreCouleur}
                                                    onChange={e => setTitreCouleur(e.target.value)}
                                                    className="h-[38px] w-14 bg-app-bg/20 border border-app-text/5 rounded-xl cursor-pointer"
                                                />
                                            </label>

                                            <label className="flex-1 min-w-[7rem] flex flex-col gap-1">
                                                <span className="text-ui-9 uppercase tracking-widest text-gm-violet/60">
                                                    {t('modules:storyboard.editor.title_outline')}
                                                </span>
                                                <select
                                                    value={titreContour}
                                                    onChange={e => setTitreContour(e.target.value)}
                                                    title={t('modules:storyboard.editor.title_outline_help')}
                                                    className="w-full bg-app-bg/20 border border-app-text/5 rounded-xl px-3 py-2 text-ui-11 font-bold outline-none focus:border-gm-violet"
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

                        <div className="pt-10 mt-10 border-t border-app-text/5 flex flex-col gap-4">
                            <button 
                                onClick={handleSave}
                                className="w-full bg-accent text-app-on-accent py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-glow-accent transition-all flex items-center justify-center gap-2 shadow-2xl"
                            >
                                <Save size={16} />
                                {t('modules:storyboard.editor.save')}
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="w-full bg-app-text/5 border border-app-text/5 text-app-muted py-4 rounded-2xl text-ui-10 font-black uppercase tracking-widest hover:bg-app-text/10 transition-all"
                            >
                                {t('modules:storyboard.editor.cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <aside className="w-[22rem] shrink-0 overflow-y-auto border-l border-app-border bg-app-surface/60 p-4 custom-scrollbar">
                        <DetailDuMoment
                            moment={momentEnCours}
                            nommer={nommer}
                            onPrecedent={precedent ? () => triggerMoment(precedent) : null}
                            onSuivant={suivant ? () => triggerMoment(suivant) : null}
                            onArreter={arreterLeMoment}
                        />
                    </aside>
                )}
            </div>
        </div>
    );
};

export default StoryboardDashboard;
