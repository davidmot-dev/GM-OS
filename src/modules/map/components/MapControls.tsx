import React from 'react';
import { useMapStore } from '../useMapStore';
import { useMapUIStore } from '../useMapUIStore';
import type { MapTool, FogMode, WeatherType, TimeOfDay } from '../types';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmConfirm, gmCustom } from '../../../stores/useModalStore';
import {
    Upload, EyeOff, Eye, Paintbrush, Square, Circle,
    Cast, Maximize, Users, MousePointer2, PlusCircle, Trash2, MapPin, FolderOpen,
    SkipBack, SkipForward, Swords, CloudRain, CloudSnow, Cloud, Sparkles, Triangle,
    ShieldAlert, Zap, GripHorizontal, Volume2, VolumeX, ChevronDown, Check,
    Link, Mountain, Sunrise, Sun, Cloudy, Sunset, Moon, Brain
} from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { useTranslation } from 'react-i18next';
import { useTacticalAIStore } from '../../tactical-ai/useTacticalAIStore';





import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import type { MapToken, MagicStyle, MagicShape } from '../types';
import { type Combatant } from '../../combat/useCombatStore';


import { useJournalStore } from '../../journal/useJournalStore';
import { useNarrativeGenerator } from '../hooks/useNarrativeGenerator';
import MapPresetGallery from './MapPresetGallery';
import MapLayersPanel from './MapLayersPanel';
import { useRegimeDInterface } from '../../session/hooks/useRegimeDInterface';
import HorsDePortee from '../../session/components/HorsDePortee';

import { Panneau } from '../../../components/socle';

/*
  **La Cartographie réagencée — refonte, phase 4, L3, étape 2 (2026-10-02).**
  La maquette retenue le 2026-09-26 (`documentation/Planning/stitch/
  cartographie/`) répond à *« tous les paramètres et options se mélangent »* :
  **le jeu est séparé de la préparation.** Ce fichier en porte trois pièces,
  qui lisent les mêmes magasins par `useControlesDeLaCarte` :

  - `BarreEnJeu` — la barre au-dessus de la carte : brouillard, forme, pions,
    tout révéler / masquer, ping, effet magique, zone de danger ;
  - `ActionsDeLaCarte` — l'en-tête : Cortex tactique, recadrer, projeter ;
  - `PanneauDeLaCarte` — à droite, « Actions en partie » en haut, puis
    « Préparation · Atelier » : presets, carte, grille, modèles, audio.

  Aucune fonction n'est ajoutée ni retirée ; les gestes coûteux gardent leur
  garde de régime (`HorsDePortee`).
*/

const ToolButton = ({ tool, currentTool, setTool, icon: Icon, label }: { tool: MapTool, currentTool: MapTool, setTool: (t: MapTool) => void, icon: React.ElementType, label: string }) => {
    const isActive = currentTool === tool;
    return (
        <button
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-ui-10 font-bold uppercase tracking-wide transition-colors ${isActive
                ? 'bg-accent border-accent shadow-glow-accent text-app-on-accent'
                : 'bg-app-bg hover:bg-app-surface text-app-text border-app-border/60'
                }`}
            onClick={() => setTool(tool)}
            aria-pressed={isActive}
            title={label}
        >
            <Icon size={15} className={isActive ? 'text-app-on-accent' : 'text-accent'} />
            <span>{label}</span>
        </button>
    );
};

const ModeButton = ({ mode, fogMode, setFogMode, icon: Icon, label }: { mode: FogMode, fogMode: FogMode, setFogMode: (m: FogMode) => void, icon: React.ElementType, label: string }) => {
    const isActive = fogMode === mode;
    const activeColor = mode === 'reveal' ? 'bg-etat-succes' : 'bg-etat-danger';
    const textColor = mode === 'reveal' ? 'text-etat-succes' : 'text-etat-danger';
    const shadow = mode === 'reveal' ? 'shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)]' : 'shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]';

    return (
        <button
            className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-ui-10 font-bold uppercase tracking-wide transition-all border ${isActive
                ? `${activeColor} ${shadow} text-app-bg border-transparent`
                : `bg-app-bg border-app-border hover:bg-app-surface ${textColor}`
                }`}
            onClick={() => setFogMode(mode)}
            aria-pressed={isActive}
        >
            <Icon size={15} />
            <span>{label}</span>
        </button>
    );
};

/** Un groupe de la barre de jeu : son étiquette, puis ses boutons. */
const Groupe: React.FC<{ etiquette?: string; children: React.ReactNode }> = ({ etiquette, children }) => (
    <div className="flex items-center gap-1 rounded-xl border border-app-border/50 bg-app-bg/40 p-1">
        {etiquette && <span className="px-1.5 text-ui-8 font-black uppercase tracking-widest text-app-subtle">{etiquette}</span>}
        {children}
    </div>
);

const titreDeSection = 'text-xs text-app-muted uppercase tracking-wider font-bold';

/**
 * **Les magasins et les gestes de la carte, une seule fois.** Les trois pièces
 * de l'écran les lisent ici : *trois copies des mêmes confirmations auraient
 * divergé à la première retouche.*
 */
function useControlesDeLaCarte() {
    const regime = useRegimeDInterface();
    const { t } = useTranslation(['modules', 'common']);
    const mapStore = useMapStore();
    const uiStore = useMapUIStore();
    
    /* Ce que les gestes ci-dessous emploient ; chaque pièce de l'écran lit le reste elle-même. */
    const { mapUrl, mapName, setMap, setFogDataUrl, tokens, clearTokens, triggerFogCommand, magicEffects, clearMagicEffects } = mapStore;

    const { status: tacticalStatus, requestTacticalAnalysis } = useTacticalAIStore();
    const isAnalyzing = tacticalStatus === 'analyzing';

    const { getDisplayLabel } = useHardwareStore();

    const { 
        combatants, 
        nextTurn, 
        prevTurn, 
        currentTurnIdx, 
        round 
    } = useCombatStore();
    const { mediaList } = useMediaStore();

    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = React.useState(false);

    const { generateNarrative, isGenerating } = useNarrativeGenerator();

    const handleGenerateNarrative = async () => {
        const text = await generateNarrative();
        if (text) {
            gmCustom('narrative-display', text);
        }
    };



    const handleMediaSelect = (mediaId: string) => {
        const media = mediaList.find(m => m.id === mediaId);
        if (!media) return;

        const isVideo = media.type === 'video';
        setMap(mediaId, isVideo, media.name.replace(/\.[^/.]+$/, "")); // Pass mediaId directly
        // Note: setMap now automatically loads fog from registry, no need to manual reset
    };

    const handleRevealAll = () => {
        gmConfirm(t('map.sidebar.fog.revealAllConfirm'), () => {
            triggerFogCommand('reveal_all');
        });
    };

    const handleHideAll = () => {
        gmConfirm(t('map.sidebar.fog.hideAllConfirm'), () => {
            triggerFogCommand('hide_all');
        });
    };

    const handleClearTokens = () => {
        if (tokens.length === 0) return;
        gmConfirm(t('map.sidebar.combatants.clearConfirm', { count: tokens.length }), () => {
            clearTokens();
        });
    };

    const handleClearMagic = () => {
        if (magicEffects.length === 0) return;
        gmConfirm(t('map.sidebar.magic.clearConfirm', { count: magicEffects.length }), () => {
            clearMagicEffects();
        });
    };


    const handleClearMap = () => {
        if (!mapUrl) return;
        gmConfirm(t('map.sidebar.import.removeConfirm'), () => {
            const oldName = mapName;
            setMap(null);
            setFogDataUrl(null);
            clearTokens();
            
            useJournalStore.getState().addEvent({
                type: 'LOCATION',
                // Retirer une carte de la table n'est pas un fait de la
                // fiction : même raison que « Carte chargée », dans
                // `useMapStore`.
                nature: 'trace',
                title: `🗺️ ${t('map.sidebar.import.removedTitle', { name: oldName })}`,
                content: t('map.sidebar.import.removedContent')
            });
        });
    };

    return {
        regime, t, mapStore, uiStore,
        tacticalStatus, requestTacticalAnalysis, isAnalyzing, getDisplayLabel,
        combatants, nextTurn, prevTurn, currentTurnIdx, round,
        isMediaBrowserOpen, setIsMediaBrowserOpen, isGenerating,
        handleGenerateNarrative, handleMediaSelect, handleRevealAll, handleHideAll,
        handleClearTokens, handleClearMagic, handleClearMap,
    };
}

/** **La barre « En jeu direct »**, au-dessus de la carte. */
export const BarreEnJeu: React.FC = () => {
    const { regime, t, uiStore, handleRevealAll, handleHideAll } = useControlesDeLaCarte();
    const { currentTool, setTool, fogMode, setFogMode } = uiStore;

    return (
        <div className="flex w-full flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-1 text-ui-9 font-black uppercase tracking-widest text-accent">
                <Zap size={13} /> {t('map.agencement.en_jeu')}
            </span>
            <Groupe etiquette={t('map.sidebar.fog.title')}>
                <ModeButton mode="reveal" fogMode={fogMode} setFogMode={setFogMode} icon={Eye} label={t('map.sidebar.fog.reveal')} />
                <ModeButton mode="hide" fogMode={fogMode} setFogMode={setFogMode} icon={EyeOff} label={t('map.sidebar.fog.hide')} />
            </Groupe>
            <Groupe etiquette={t('map.agencement.forme')}>
                <ToolButton tool="brush" currentTool={currentTool} setTool={setTool} icon={Paintbrush} label={t('map.sidebar.tools.brush')} />
                <ToolButton tool="rect" currentTool={currentTool} setTool={setTool} icon={Square} label={t('map.sidebar.tools.rect')} />
                <ToolButton tool="circle" currentTool={currentTool} setTool={setTool} icon={Circle} label={t('map.sidebar.tools.circle')} />
            </Groupe>
            <Groupe etiquette={t('map.agencement.tout')}>
                {/*
                    **Le geste le plus coûteux de tout le module.**
                    Tout révéler montre la carte entière aux joueurs
                    — ce qui ne se reprend pas : on peut recacher les
                    pixels, pas ce qu'ils ont vu.
                */}
                <HorsDePortee regime={regime} libelle={t('map.sidebar.fog.revealAll')} compact icone={<Eye size={15} />}>
                    <button
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-ui-10 font-bold uppercase tracking-wide text-app-muted hover:text-etat-succes hover:bg-app-surface transition-colors"
                        onClick={handleRevealAll}
                        title={t('map.sidebar.fog.revealAll')}
                    >
                        <Eye size={15} /> {t('map.sidebar.fog.revealAll')}
                    </button>
                </HorsDePortee>
                <button
                    className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-ui-10 font-bold uppercase tracking-wide text-app-muted hover:text-etat-danger hover:bg-app-surface transition-colors"
                    onClick={handleHideAll}
                    title={t('map.sidebar.fog.hideAll')}
                >
                    <EyeOff size={15} /> {t('map.sidebar.fog.hideAll')}
                </button>
            </Groupe>
            <Groupe etiquette={t('map.agencement.outils')}>
                <ToolButton tool="move_token" currentTool={currentTool} setTool={setTool} icon={MousePointer2} label={t('map.sidebar.tools.tokens')} />
                <ToolButton tool="ping" currentTool={currentTool} setTool={setTool} icon={MapPin} label={t('map.sidebar.tools.ping')} />
                <ToolButton tool="magic" currentTool={currentTool} setTool={setTool} icon={Sparkles} label={t('map.sidebar.tools.magic')} />
                <ToolButton tool="danger" currentTool={currentTool} setTool={setTool} icon={ShieldAlert} label={t('map.sidebar.tools.danger')} />
            </Groupe>
        </div>
    );
};

/** **Les actions de l'en-tête** : l'analyse tactique, recadrer, projeter. */
export const ActionsDeLaCarte: React.FC = () => {
    const { t, mapStore, isAnalyzing, requestTacticalAnalysis, getDisplayLabel } = useControlesDeLaCarte();
    const { projectionTarget, clearProjectedState, resetView } = mapStore;
    const bouton = 'flex h-9 items-center gap-2 rounded-lg border px-3 text-ui-10 font-bold uppercase tracking-wide transition-all active:scale-95';

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <button
                onClick={() => requestTacticalAnalysis()}
                disabled={isAnalyzing}
                title={isAnalyzing ? t('map.sidebar.ai.analyzing') : t('map.sidebar.ai.launch')}
                className={`${bouton} ${isAnalyzing
                    ? 'bg-gm-violet/20 border-gm-violet/40 text-gm-violet animate-pulse'
                    : 'bg-gm-violet/10 border-gm-violet/30 text-gm-violet hover:bg-gm-violet hover:text-app-bg'}`}
            >
                <Brain size={15} className={isAnalyzing ? 'animate-spin-slow' : ''} />
                {t('map.sidebar.ai.title')}
            </button>
            <button
                onClick={resetView}
                className={`${bouton} bg-app-surface/40 hover:bg-app-surface border-app-border/60 text-app-text`}
            >
                <Maximize size={15} className="text-app-muted" />
                {t('map.sidebar.projection.resetView')}
            </button>
            {projectionTarget ? (
                <button
                    onClick={() => {
                        if (projectionTarget === 'monitor' && window.appBridge?.image?.closeAllDisplays) {
                            window.appBridge.image.closeAllDisplays();
                        }
                        clearProjectedState();
                    }}
                    title={`${t('map.sidebar.projection.target')} : ${getDisplayLabel(projectionTarget)}`}
                    className={`${bouton} bg-accent/10 border-accent/40 text-accent hover:bg-etat-danger/10 hover:border-etat-danger/40 hover:text-etat-danger`}
                >
                    <Cast size={15} className="animate-pulse" />
                    {t('map.sidebar.projection.stop')}
                </button>
            ) : (
                <button
                    onClick={() => gmCustom('map-projection-select')}
                    className={`${bouton} bg-etat-info/10 border-etat-info/30 text-app-text hover:bg-etat-info/20`}
                >
                    <Cast size={15} className="text-accent" />
                    {t('map.sidebar.projection.project')}
                </button>
            )}
        </div>
    );
};

/** **Le panneau de droite** : ce qui se joue, puis ce qui se prépare. */
export const PanneauDeLaCarte: React.FC = () => {
    const {
        regime, t, mapStore, uiStore,
        combatants, nextTurn, prevTurn, currentTurnIdx, round,
        isMediaBrowserOpen, setIsMediaBrowserOpen, isGenerating,
        handleGenerateNarrative, handleMediaSelect, handleClearTokens, handleClearMagic, handleClearMap,
    } = useControlesDeLaCarte();
    const {
        mapUrl, addToken, tokens,
        isGridEnabled, setGridEnabled, gridSize, setGridSize, gridOpacity, setGridOpacity, gridColor, setGridColor,
        weatherType, setWeather, weatherIntensity, timeOfDay, setTimeOfDay,
        magicEffects, removeMagicEffect,
        dangerZones, removeDangerZone, clearDangerZones, dangerZonePresets,
        isMapMuted, setMapMuted, mapVolume, setMapVolume, mapOutputDeviceId, setMapOutputDevice,
        isVideo,
    } = mapStore;
    const {
        currentTool, setTool,
        magicStyle, magicShape, setMagicSettings,
        selectedDangerPresetId, setSelectedDangerPresetId,
        dangerShape, setDangerShape,
        auraOverride, setAuraOverride,
        difficultTerrainOverride, setDifficultTerrainOverride,
        movementCostOverride, setMovementCostOverride,
    } = uiStore;

    return (
        <>
            {/* ─────────────── Actions en partie ─────────────── */}
            <h2 className="flex items-center gap-2 px-1 text-ui-11 font-black uppercase tracking-widest text-accent">
                <Zap size={13} /> {t('map.agencement.en_partie')}
            </h2>

            <Panneau niveau={1} className="shrink-0 p-3 flex flex-col gap-2">
                    {/* Narrative Generation Button */}
                    <button
                        disabled={isGenerating || !mapUrl}
                        onClick={handleGenerateNarrative}
                        className="w-full bg-gradient-to-r from-gm-violet/20 to-gm-violet/10 hover:from-gm-violet/30 hover:to-gm-violet/20 p-2.5 rounded-lg border border-gm-violet/30 flex items-center justify-center gap-2 transition-all group disabled:opacity-30 disabled:grayscale"
                    >
                        {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Sparkles size={16} className="text-accent group-hover:scale-110 transition-transform animate-pulse" />
                        )}
                        <span className="text-ui-11 font-black uppercase tracking-widest text-app-text group-hover:text-accent transition-colors">{t('map.sidebar.oracle')}</span>
                    </button>
            </Panneau>

            {/* Les réglages de l'outil actif, là où on regarde quand on l'a choisi. */}
            {currentTool === 'magic' && (
                <Panneau niveau={1} className="shrink-0 p-3 flex flex-col gap-3">
                    <h3 className={titreDeSection}>{t('map.sidebar.tools.magic')}</h3>
                        <div className="bg-app-bg/20 p-3 rounded border border-app-border flex flex-col gap-3">
                            <div>
                                <div className="flex justify-between text-ui-10 text-app-muted mb-2 uppercase font-bold tracking-wider">
                                    <span>{t('map.sidebar.magic.type')}</span>
                                    <button onClick={handleClearMagic} className="text-etat-danger hover:text-etat-danger">{t('map.sidebar.magic.clearAll')}</button>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { id: 'fire', icon: '🔥', label: t('map.sidebar.magic.styles.fire') },
                                        { id: 'ice', icon: '❄️', label: t('map.sidebar.magic.styles.ice') },
                                        { id: 'acid', icon: '🧪', label: t('map.sidebar.magic.styles.acid') },
                                        { id: 'electric', icon: '⚡', label: t('map.sidebar.magic.styles.electric') },
                                        { id: 'arcane', icon: '🔮', label: t('map.sidebar.magic.styles.arcane') },
                                        { id: 'darkness', icon: '🌑', label: t('map.sidebar.magic.styles.darkness') },
                                        { id: 'poison', icon: '🤢', label: t('map.sidebar.magic.styles.poison') },
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setMagicSettings(s.id as MagicStyle, magicShape)}
                                            className={`p-1.5 rounded border text-ui-10 flex flex-col items-center transition-all ${

                                                magicStyle === s.id 
                                                ? 'bg-accent/20 border-accent text-accent' 
                                                : 'bg-app-bg border-app-border text-app-subtle hover:bg-app-surface'
                                            }`}
                                        >
                                            <span>{s.icon}</span>
                                            <span className="font-bold truncate w-full text-center">{s.label}</span>
                                        </button>
                                    ))}
                                </div>

                            </div>
                            
                            <div>
                                <span className="text-ui-10 text-app-muted mb-2 block uppercase font-bold tracking-wider">{t('map.sidebar.magic.shape')}</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'circle', icon: Circle, label: t('map.sidebar.magic.shapes.circle') },
                                        { id: 'rect', icon: Square, label: t('map.sidebar.magic.shapes.rect') },
                                        { id: 'line', icon: SkipForward, label: t('map.sidebar.magic.shapes.line') },
                                        { id: 'cone', icon: Triangle, label: t('map.sidebar.magic.shapes.cone') }
                                    ].map(sh => {
                                        const Icon = sh.icon; 
                                        return (
                                            <button
                                                key={sh.id}
                                                onClick={() => setMagicSettings(magicStyle, sh.id as MagicShape)}
                                                className={`p-2 rounded border flex items-center justify-center gap-2 transition-all ${
                                                    magicShape === sh.id 
                                                    ? 'bg-accent/20 border-accent text-accent' 
                                                    : 'bg-app-bg border-app-border text-app-subtle hover:bg-app-surface'
                                                }`}
                                            >
                                                <Icon size={14} />
                                                <span className="text-ui-10 font-bold">{sh.label}</span>
                                            </button>
                                        );
                                    })}

                                </div>
                            </div>

                            {/* List of active effects */}
                            {magicEffects.length > 0 && (
                                <div className="mt-2 border-t border-app-border pt-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-ui-10 text-app-muted uppercase font-bold tracking-wider">{t('map.sidebar.magic.activeEffects')} ({magicEffects.length})</span>
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {magicEffects.map((eff) => (
                                            <div key={eff.id} className="flex items-center justify-between p-2 bg-app-bg/40 rounded border border-app-border/50 group hover:border-accent/30 transition-all">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 
                                                        eff.style === 'fire' ? '#f97316' : 
                                                        eff.style === 'ice' ? '#3b82f6' : 
                                                        eff.style === 'electric' ? '#0ea5e9' : 
                                                        eff.style === 'acid' ? '#84cc16' : 
                                                        eff.style === 'arcane' ? '#a855f7' : 
                                                        eff.style === 'darkness' ? '#374151' : '#10b981'
                                                    }} />
                                                    <span className="text-ui-10 text-app-text capitalize truncate font-medium">
                                                        {t(`map.sidebar.magic.styles.${eff.style}`)} - {
                                                            eff.type === 'circle' ? t('map.sidebar.magic.shapes.circle') :
                                                            eff.type === 'rect' ? t('map.sidebar.magic.shapes.rect') :
                                                            eff.type === 'line' ? t('map.sidebar.magic.shapes.line') : t('map.sidebar.magic.shapes.cone')
                                                        }
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => removeMagicEffect(eff.id)}
                                                    className="p-1 text-app-subtle hover:text-etat-danger transition-colors"
                                                    title={t('map.sidebar.magic.removeEffect')}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                </Panneau>
            )}

            {currentTool === 'danger' && (
                <Panneau niveau={1} className="shrink-0 p-3 flex flex-col gap-3">
                    <h3 className={titreDeSection}>{t('map.sidebar.tools.danger')}</h3>
                            <div className="bg-etat-danger/5 border border-etat-danger/20 rounded-lg p-3">
                                <p className="text-ui-11 text-etat-danger/70 mb-3 italic">
                                    {t('map.sidebar.danger.instruction')}
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-ui-10 text-app-subtle uppercase font-bold block mb-1">{t('map.sidebar.danger.shape')}</label>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => setDangerShape('rect')}
                                                title={t('map.sidebar.danger.shapes.rect')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'rect' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-app-muted hover:text-app-text'}`}
                                            >
                                                <Square size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDangerShape('circle')}
                                                title={t('map.sidebar.danger.shapes.circle')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'circle' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-app-muted hover:text-app-text'}`}
                                            >
                                                <Circle size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDangerShape('cone')}
                                                title={t('map.sidebar.danger.shapes.cone')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'cone' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-app-muted hover:text-app-text'}`}
                                            >
                                                <Triangle size={16} className="rotate-180" />
                                            </button>
                                            <button 
                                                onClick={() => setDangerShape('line')}
                                                title={t('map.sidebar.danger.shapes.line')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'line' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-app-muted hover:text-app-text'}`}
                                            >
                                                <GripHorizontal size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Toggles for Aura/DT Overrides */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setAuraOverride(!auraOverride)}
                                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border text-ui-10 font-bold transition-all ${auraOverride ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-app-subtle hover:text-app-text'}`}
                                            title={t('map.sidebar.danger.aura')}
                                        >
                                            <Link size={14} />
                                            <span>{t('map.sidebar.danger.aura')}</span>
                                        </button>
                                        <button 
                                            onClick={() => setDifficultTerrainOverride(!difficultTerrainOverride)}
                                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border text-ui-10 font-bold transition-all ${difficultTerrainOverride ? 'bg-etat-succes/20 border-etat-succes text-etat-succes' : 'bg-app-bg/50 border-app-border/50 text-app-subtle hover:text-app-text'}`}
                                            title={t('map.sidebar.danger.terrain')}
                                        >
                                            <Mountain size={14} />
                                            <span>{t('map.sidebar.danger.terrain')}</span>
                                        </button>
                                    </div>

                                    {difficultTerrainOverride && (
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-ui-10 text-app-subtle uppercase font-bold">{t('map.sidebar.danger.dtCost')}</span>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="range" min="1" max="4" step="0.5" 
                                                    value={movementCostOverride}
                                                    onChange={(e) => setMovementCostOverride(parseFloat(e.target.value))}
                                                    className="w-20 h-1 accent-etat-succes bg-app-surface-2 rounded-lg cursor-pointer"
                                                />
                                                <span className="text-ui-10 font-mono text-etat-succes">x{movementCostOverride}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-ui-10 text-app-subtle uppercase font-bold block mb-1">{t('map.sidebar.danger.presets')}</label>
                                        <div className="grid grid-cols-1 gap-1">
                                            {dangerZonePresets.map(preset => {
                                                const isActive = selectedDangerPresetId === preset.id;
                                                return (
                                                    <button
                                                        key={preset.id}
                                                        onClick={() => setSelectedDangerPresetId(preset.id)}
                                                        className={`flex items-center gap-2 p-2 rounded border transition-all text-left group ${
                                                            isActive
                                                            ? 'bg-accent/20 border-accent shadow-glow-accent/10'
                                                            : 'bg-app-bg/50 hover:bg-app-surface border-app-border/50'
                                                        }`}
                                                    >
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.color }} />
                                                        <span className={`flex-1 text-ui-11 ${isActive ? 'text-accent font-bold' : 'text-app-text'}`}>
                                                            {preset.name}
                                                            <span className="ml-2 inline-flex gap-1 opacity-50">
                                                                {preset.isAura && <Link size={10} />}
                                                                {preset.isDifficultTerrain && <Mountain size={10} />}
                                                            </span>
                                                        </span>
                                                        {isActive ? (
                                                            <Zap size={14} className="text-accent animate-pulse" />
                                                        ) : (
                                                            <PlusCircle size={14} className="text-app-subtle group-hover:text-accent" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                </Panneau>
            )}

            <Panneau niveau={1} className="shrink-0 p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs text-app-muted uppercase tracking-wider font-bold text-gm-crimson flex items-center gap-2">
                           <Swords size={12} /> {t('map.sidebar.combat.title')}
                        </h3>
                        {combatants.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-ui-10 font-black bg-gm-crimson/20 text-gm-crimson px-2 py-0.5 rounded uppercase tracking-tighter">{t('map.sidebar.combat.round')} {round}</span>
                                <span className="text-ui-10 font-black bg-app-surface text-app-text/60 px-2 py-0.5 rounded border border-app-border uppercase tracking-tighter">{currentTurnIdx + 1} / {combatants.length}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            disabled={combatants.length === 0}
                            onClick={prevTurn}
                            className="flex items-center justify-center gap-2 py-2 bg-app-bg hover:bg-app-surface border border-app-border rounded-lg text-xs font-bold text-app-text disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <SkipBack size={14} />
                            <span>{t('map.sidebar.combat.prev')}</span>
                        </button>
                        <button
                            disabled={combatants.length === 0}
                            onClick={nextTurn}
                            className="flex items-center justify-center gap-2 py-2 bg-gm-crimson/10 hover:bg-gm-crimson/20 border border-gm-crimson/30 rounded-lg text-xs font-bold text-gm-crimson shadow-glow-crimson/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg"
                        >
                            <span>{t('map.sidebar.combat.next')}</span>
                            <SkipForward size={14} />
                        </button>
                    </div>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h3 className="text-xs text-app-muted uppercase tracking-wider font-bold text-gm-emerald">{t('map.sidebar.combatants.title')}</h3>
                        {/* Vider les jetons en plein combat efface la position de tout le monde. */}
                        <HorsDePortee regime={regime} libelle={t('map.sidebar.combatants.clear')} compact icone={<Trash2 size={14} />}>
                            <button
                                onClick={handleClearTokens}
                                className={`p-1 rounded transition-colors ${tokens.length > 0 ? 'text-app-muted hover:text-etat-danger' : 'text-app-subtle cursor-not-allowed'}`}
                                title={t('map.sidebar.combatants.clear')}
                                disabled={tokens.length === 0}
                            >
                                <Trash2 size={14} />
                            </button>
                        </HorsDePortee>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {combatants.length === 0 ? (
                        <div className="bg-app-bg/10 border border-app-border border-dashed rounded-lg flex flex-col items-center justify-center p-4 text-center">
                                <Users size={32} className="text-app-subtle mb-2" />
                                <p className="text-sm text-app-muted">{t('map.sidebar.combatants.none')}</p>
                                <p className="text-xs text-app-subtle mt-1">{t('map.sidebar.combatants.hint')}</p>
                            </div>
                        ) : (
                            combatants.map(combatant => (
                                <MapCombatantItem
                                    key={combatant.id}
                                    combatant={combatant}
                                    tokens={tokens}
                                    addToken={addToken}
                                    setTool={setTool}
                                />
                            ))
                        )}
                    </div>
                    <div className="mt-2 text-ui-10 text-app-muted px-1 border-t border-app-border pt-2 text-center">
                        {t('map.sidebar.combatants.footer')}
                    </div>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-3 flex flex-col gap-3">
                    <h3 className="text-xs text-app-muted uppercase tracking-wider mb-3 font-bold px-1">{t('map.sidebar.weather.title')}</h3>
                    <div className="flex gap-2 mb-4">
                        {[
                            { id: 'none', icon: EyeOff, label: t('map.sidebar.weather.none') },
                            { id: 'rain', icon: CloudRain, label: t('map.sidebar.weather.rain') },
                            { id: 'snow', icon: CloudSnow, label: t('map.sidebar.weather.snow') },
                            { id: 'smoke', icon: Cloud, label: t('map.sidebar.weather.smoke') },
                        ].map((w) => {
                            const isActive = weatherType === w.id;
                            const Icon = w.icon;
                            return (
                                <button
                                    key={w.id}
                                    onClick={() => setWeather(w.id as WeatherType)}
                                    className={`flex-1 flex flex-col items-center justify-center p-2 rounded border transition-all ${
                                        isActive 
                                        ? 'bg-accent/20 border-accent text-accent shadow-glow-accent/20' 
                                        : 'bg-app-bg border-app-border text-app-subtle hover:bg-app-surface'
                                    }`}
                                    title={w.label}
                                >
                                    <Icon size={18} />
                                    <span className="text-ui-9 mt-1 font-bold uppercase">{w.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {weatherType !== 'none' && (
                        <div className="bg-app-bg/20 p-3 rounded border border-app-border">
                            <div className="flex justify-between text-xs text-app-muted mb-2">
                                <span>{t('map.sidebar.weather.intensity')}</span>
                                <span className="text-accent font-mono">{Math.round(weatherIntensity * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={weatherIntensity}
                                title={t('map.sidebar.weather.intensity')}
                                aria-label={t('map.sidebar.weather.intensity')}
                                onChange={(e) => setWeather(weatherType, parseFloat(e.target.value))}
                                className="w-full h-1 accent-accent bg-app-surface-2 rounded-lg cursor-pointer"
                            />
                        </div>
                    )}
                    <h3 className="text-xs text-app-muted uppercase tracking-wider mb-3 font-bold px-1">{t('map.sidebar.time.title')}</h3>
                    <div className="flex gap-1.5 mb-2">
                        {[
                            { id: 'dawn', icon: Sunrise, label: t('map.sidebar.time.dawn'), color: 'text-etat-alerte' },
                            { id: 'day', icon: Sun, label: t('map.sidebar.time.day'), color: 'text-gm-gold' },
                            { id: 'overcast', icon: Cloudy, label: t('map.sidebar.time.overcast'), color: 'text-app-muted' },
                            { id: 'dusk', icon: Sunset, label: t('map.sidebar.time.dusk'), color: 'text-gm-violet' },
                            { id: 'night', icon: Moon, label: t('map.sidebar.time.night'), color: 'text-etat-info' },
                        ].map((t) => {
                            const isActive = timeOfDay === t.id;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTimeOfDay(t.id as TimeOfDay)}
                                    className={`flex-1 flex flex-col items-center justify-center p-2 rounded border transition-all ${
                                        isActive 
                                        ? 'bg-accent/20 border-accent shadow-glow-accent/20 text-accent' 
                                        : 'bg-app-bg border-app-border text-app-subtle hover:bg-app-surface'
                                    }`}
                                    title={t.label}
                                >
                                    <Icon size={18} className={isActive ? 'text-accent' : t.color} />
                                    <span className="text-ui-8 mt-1 font-bold uppercase truncate w-full text-center">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-3">
                <MapLayersPanel />
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                    <h3 className={titreDeSection}>{t('map.agencement.zones_actives')}</h3>
                    <button
                        onClick={() => gmConfirm(t('map.sidebar.danger.clearConfirm'), clearDangerZones)}
                        className="text-ui-9 font-black uppercase tracking-widest text-etat-danger hover:text-etat-danger transition-colors"
                    >
                        {t('map.sidebar.danger.clearAll')}
                    </button>
                </div>
                            <div className="flex flex-col gap-1">
                                {dangerZones.map(zone => (
                                    <div key={zone.id} className="bg-app-bg/30 border border-app-border rounded p-2 flex flex-col gap-1 group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                                            <span className="text-ui-11 text-app-text flex-1 truncate">{zone.name}</span>
                                            <div className="flex gap-1">
                                                {zone.isAura && <Link size={12} className="text-accent" />}
                                                {zone.isDifficultTerrain && <Mountain size={12} className="text-etat-succes" />}
                                            </div>
                                            <button 
                                                onClick={() => removeDangerZone(zone.id)}
                                                className="text-app-subtle hover:text-etat-danger p-1 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {zone.isAura && (
                                            <div className="text-ui-9 text-app-subtle flex items-center gap-1 px-1 italic">
                                                <Users size={10} />
                                                <span>{t('map.sidebar.danger.carrier')}: {zone.parentTokenId ? (tokens.find(t => t.id === zone.parentTokenId)?.name || t('map.sidebar.danger.unknown')) : t('map.sidebar.danger.none')}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {dangerZones.length === 0 && (
                                    <p className="text-center py-4 text-ui-11 text-app-subtle italic border border-dashed border-app-border rounded">
                                        {t('map.sidebar.danger.noActiveZones')}
                                    </p>
                                )}
                            </div>
            </Panneau>

            {/* ─────────────── Préparation · Atelier ─────────────── */}
            <h2 className="mt-2 flex items-center gap-2 px-1 text-ui-11 font-black uppercase tracking-widest text-app-muted">
                <FolderOpen size={13} /> {t('map.agencement.preparation')}
            </h2>

            <Panneau niveau={1} className="shrink-0 p-3">
                <section>
                    <h3 className="text-xs text-app-muted uppercase tracking-wider mb-3 font-bold px-1 flex items-center gap-2">
                        <FolderOpen size={14} className="text-accent" />
                        {t('map.sidebar.presets')}
                    </h3>
                    <MapPresetGallery />
                </section>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-3">
                <h3 className={`${titreDeSection} mb-2 px-1`}>{t('map.agencement.carte_et_medias')}</h3>
                    <div className="flex gap-2 mb-3">
                        <button
                            className="flex-1 bg-app-bg hover:bg-app-surface p-3 rounded-lg flex items-center justify-center gap-2 border border-app-border transition-colors text-sm"
                            onClick={() => setIsMediaBrowserOpen(true)}
                        >
                            <Upload size={18} className="text-accent" />
                            <span>{t('map.sidebar.import.button')}</span>
                        </button>
                        {mapUrl && (
                            <HorsDePortee regime={regime} libelle={t('map.sidebar.import.remove')} compact icone={<Trash2 size={18} />}>
                                <button
                                    className="bg-etat-danger/10 hover:bg-etat-danger/20 p-3 rounded-lg flex items-center justify-center border border-etat-danger/30 transition-colors text-etat-danger"
                                    onClick={handleClearMap}
                                    title={t('map.sidebar.import.remove')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </HorsDePortee>
                        )}
                    </div>
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-3">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs text-app-muted uppercase tracking-wider font-bold">{t('map.sidebar.grid.title')}</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isGridEnabled} 
                                onChange={(e) => setGridEnabled(e.target.checked)} 
                            />
                            <div className="w-9 h-5 bg-app-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-fixe-blanc after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-fixe-blanc after:border-app-muted after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>

                    {isGridEnabled && (
                        <div className="flex flex-col gap-3 bg-app-bg/20 p-3 rounded border border-app-border">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-ui-10 text-app-muted mb-1">
                                    <span>{t('map.sidebar.grid.size')}</span>
                                    <span className="text-accent font-mono">{gridSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="200"
                                    step="10"
                                    value={gridSize}
                                    title={t('map.sidebar.grid.size')}
                                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                                    className="w-full h-1 accent-accent bg-app-surface-2 rounded-lg cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-ui-10 text-app-muted mb-1">
                                    <span>{t('map.sidebar.grid.opacity')}</span>
                                    <span className="text-accent font-mono">{Math.round(gridOpacity * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={gridOpacity}
                                    title={t('map.sidebar.grid.opacity')}
                                    onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
                                    className="w-full h-1 accent-accent bg-app-surface-2 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/*
                              **La couleur de grille, enfin offerte** (point M5,
                              2026-09-05). `setGridColor` existait depuis
                              toujours, la couleur voyageait dans les presets et
                              jusqu'à l'écran des joueurs — mais **aucun écran ne
                              l'appelait**, et la grille était blanche pour tout
                              le monde. *Toute la chaîne était là sauf le bouton
                              au bout.*

                              Le blanc reste le défaut : c'est ce que voient les
                              tables d'aujourd'hui, et rien ne doit bouger chez
                              elles.
                            */}
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-ui-10 text-app-muted">{t('map.sidebar.grid.color')}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={gridColor}
                                        title={t('map.sidebar.grid.color')}
                                        aria-label={t('map.sidebar.grid.color')}
                                        onChange={(e) => setGridColor(e.target.value)}
                                        className="w-8 h-6 rounded cursor-pointer bg-transparent border border-app-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setGridColor('#ffffff')}
                                        title={t('map.sidebar.grid.color_reset')}
                                        className="text-ui-9 uppercase tracking-wider text-app-subtle hover:text-app-text transition-colors"
                                    >
                                        {t('map.sidebar.grid.color_reset_short')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            </Panneau>

            <Panneau niveau={1} className="shrink-0 p-3 flex items-center justify-between gap-2">
                <h3 className={titreDeSection}>{t('map.agencement.modeles_de_zones')}</h3>
                <button
                    onClick={() => gmCustom('danger-preset-editor')}
                    className="text-ui-9 font-black uppercase tracking-widest text-accent hover:text-app-text transition-colors"
                >
                    {t('map.sidebar.danger.managePresets')}
                </button>
            </Panneau>

            {/* Audio Controls (Conditional for Videos) */}
            {isVideo && (
                <Panneau niveau={1} className="shrink-0 p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-ui-10 font-black uppercase tracking-widest text-app-subtle">{t('map.sidebar.audio.title')}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMapMuted(!isMapMuted)}
                                    className={`p-1.5 rounded-lg transition-all ${isMapMuted ? 'text-etat-danger bg-etat-danger/10' : 'text-accent bg-accent/10 hover:bg-accent/20'}`}
                                    title={isMapMuted ? t('map.sidebar.audio.unmute') : t('map.sidebar.audio.mute')}
                                >
                                    {isMapMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-app-bg/40 p-2 py-3 rounded-xl border border-app-border/40">
                            <div className="flex-1 px-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={mapVolume}
                                    onChange={(e) => setMapVolume(parseFloat(e.target.value))}
                                    className="w-full accent-accent h-1.5 bg-app-surface-2 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <span className="text-ui-10 font-bold text-app-muted tabular-nums w-8 text-right">
                                {Math.round(mapVolume * 100)}%
                            </span>
                        </div>

                        {/* Output Device Selector (Consistent with Music/Sound OS) */}
                        <div className="relative device-selector-map">
                            <DeviceSelector 
                                currentId={mapOutputDeviceId} 
                                onSelect={setMapOutputDevice} 
                            />
                        </div>
                </Panneau>
            )}

            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={handleMediaSelect}
                allowedTypes={['image', 'video']}
                title={t('map.sidebar.import.title')}
            />
        </>
    );
};

/* --- Sub-components (Audio Device Selector) --- */

const DeviceSelector = ({ currentId, onSelect }: { currentId: string, onSelect: (id: string) => void }) => {
    const { t } = useTranslation(['modules', 'common']);
    const [isOpen, setIsOpen] = React.useState(false);
    const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
    const { getAudioLabel } = useHardwareStore();

    React.useEffect(() => {
        const fetchDevices = async () => {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            setDevices(allDevices.filter(d => d.kind === 'audiooutput'));
        };
        fetchDevices();
        navigator.mediaDevices.addEventListener('devicechange', fetchDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', fetchDevices);
    }, []);

    const currentLabel = getAudioLabel(currentId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-3 bg-app-surface/30 border rounded-xl px-4 py-2.5 text-ui-8 font-black uppercase tracking-widest transition-all ${isOpen ? 'border-accent text-app-text shadow-glow-accent/20' : 'border-app-border/50 text-app-subtle hover:border-app-border/10 hover:text-app-text'}`}
            >
                <span className="truncate max-w-[140px]">{currentLabel}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-[60]" 
                        onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute bottom-full right-0 mb-2 w-full bg-app-bg/95 backdrop-blur-2xl border border-app-border/50 rounded-2xl shadow-3xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 z-[70]">
                        <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                            <button
                                onClick={() => { onSelect('default'); setIsOpen(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-ui-8 font-black uppercase tracking-widest transition-all ${currentId === 'default' ? 'bg-accent/20 text-app-text' : 'text-app-muted hover:bg-app-surface/5 hover:text-app-text'}`}
                            >
                                <span>{t('map.sidebar.audio.defaultSpeaker')}</span>
                                {currentId === 'default' && <Check size={10} className="text-gm-violet" />}
                            </button>
                            
                            <div className="h-px bg-app-text/5 my-0.5 mx-1" />
                            
                            {devices.map((device) => (
                                <button
                                    key={device.deviceId}
                                    onClick={() => { onSelect(device.deviceId); setIsOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-ui-8 font-black uppercase tracking-widest transition-all text-left ${currentId === device.deviceId ? 'bg-gm-violet/20 text-app-text' : 'text-app-muted hover:bg-app-text/5 hover:text-app-text'}`}
                                >
                                    <span className="truncate pr-4">{getAudioLabel(device.deviceId)}</span>
                                    {currentId === device.deviceId && <Check size={10} className="text-gm-violet" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

interface MapCombatantItemProps {
    combatant: Combatant;
    tokens: MapToken[];
    addToken: (token: Omit<MapToken, 'id'>) => void;
    setTool: (tool: MapTool) => void;
}

const MapCombatantItem: React.FC<MapCombatantItemProps> = ({ combatant, tokens, addToken, setTool }) => {
    const { t } = useTranslation(['modules', 'common']);
    const isOnMap = tokens.some(t => t.linkedCombatantId === combatant.id);

    return (
        <div className="flex items-center justify-between p-2 bg-app-bg/30 border border-app-border rounded">
            <div className="flex items-center gap-3 overflow-hidden">
                {combatant.avatar ? (
                    <ResolvedImage 
                        src={combatant.avatar} 
                        alt="" 
                        className="w-6 h-6 rounded-full object-cover border border-app-border" 
                    />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-app-surface border border-app-border flex items-center justify-center">
                        <span className="text-ui-10 uppercase text-gm-crimson">{combatant.name.substring(0, 2)}</span>
                    </div>
                )}
                <span className="text-sm text-app-text truncate">{combatant.name}</span>
            </div>
            <button
                disabled={isOnMap}
                onClick={() => {
                    addToken({
                        name: combatant.name,
                        avatar: combatant.avatar || '',
                        x: 200 + Math.random() * 100,
                        y: 200 + Math.random() * 100,
                        size: 1,
                        linkedCombatantId: combatant.id
                    });
                    setTool('move_token');
                }}
                className={`p-1.5 rounded transition-colors ${isOnMap ? 'text-app-subtle cursor-not-allowed' : 'text-gm-emerald hover:bg-gm-emerald/20 hover:text-etat-succes'}`}
                title={isOnMap ? t('map.sidebar.combatants.alreadyOnMap') : t('map.sidebar.combatants.addToMap')}
            >
                <PlusCircle size={18} />
            </button>
        </div>
    );
};
