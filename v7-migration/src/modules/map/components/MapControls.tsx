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
    ShieldAlert, Zap, GripHorizontal, Settings2, Volume2, VolumeX, ChevronDown, Check,
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

const ToolButton = ({ tool, currentTool, setTool, icon: Icon, label }: { tool: MapTool, currentTool: MapTool, setTool: (t: MapTool) => void, icon: React.ElementType, label: string }) => {
    const isActive = currentTool === tool;
    return (
        <button
            className={`p-2 rounded flex flex-col items-center justify-center gap-1 transition-colors w-[70px] ${isActive
                ? 'bg-accent shadow-glow-accent text-slate-950'
                : 'bg-app-bg hover:bg-app-surface text-slate-300 border border-app-border/50'
                }`}
            onClick={() => setTool(tool)}
            title={label}
        >
            <Icon size={20} className={isActive ? 'text-slate-950' : 'text-accent'} />
            <span className="text-[10px] uppercase font-bold">{label}</span>
        </button>
    );
};

const ModeButton = ({ mode, fogMode, setFogMode, icon: Icon, label }: { mode: FogMode, fogMode: FogMode, setFogMode: (m: FogMode) => void, icon: React.ElementType, label: string }) => {
    const isActive = fogMode === mode;
    const activeColor = mode === 'reveal' ? 'bg-green-500' : 'bg-red-500';
    const textColor = mode === 'reveal' ? 'text-green-500' : 'text-red-500';
    const shadow = mode === 'reveal' ? 'shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)]' : 'shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]';

    return (
        <button
            className={`flex-1 py-2 flex items-center justify-center gap-2 rounded transition-all border ${isActive
                ? `${activeColor} ${shadow} text-white border-transparent`
                : `bg-app-bg border-app-border hover:bg-app-surface ${textColor}`
                }`}
            onClick={() => setFogMode(mode)}
        >
            <Icon size={18} />
            <span className="font-bold">{label}</span>
        </button>
    );
};

const MapControls: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const mapStore = useMapStore();
    const uiStore = useMapUIStore();
    
    const {
        mapUrl, mapName, setMap,
        setFogDataUrl,
        addToken, tokens, clearTokens,
        triggerFogCommand,
        resetView,
        isGridEnabled, setGridEnabled,
        gridSize, setGridSize,
        gridOpacity, setGridOpacity,
        weatherType, setWeather,
        weatherIntensity,
        timeOfDay, setTimeOfDay,
        projectionTarget, clearProjectedState,
        magicEffects, clearMagicEffects, removeMagicEffect,
        dangerZones, removeDangerZone, clearDangerZones,
        dangerZonePresets,
        isMapMuted, setMapMuted, mapVolume, setMapVolume, mapOutputDeviceId, setMapOutputDevice,
        isVideo
    } = mapStore;

    const { 
        currentTool, setTool,
        fogMode, setFogMode,
        magicStyle, magicShape, setMagicSettings,
        selectedDangerPresetId, setSelectedDangerPresetId,
        dangerShape, setDangerShape,
        auraOverride, setAuraOverride,
        difficultTerrainOverride, setDifficultTerrainOverride,
        movementCostOverride, setMovementCostOverride,
        setNarrativePrompt,
        toggleNarrativeMode,
        isNarrativeOpen
    } = uiStore;

    const { isAnalyzing, requestTacticalAnalysis } = useTacticalAIStore();

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
                title: `🗺️ ${t('map.sidebar.import.removedTitle', { name: oldName })}`,
                content: t('map.sidebar.import.removedContent')
            });
        });
    };


    return (
        <aside className="w-80 bg-app-surface border-l border-app-border flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="p-4 border-b border-app-border bg-app-bg/30">
                <h2 className="text-accent font-display font-bold text-xl flex items-center gap-2">
                    <span className="text-2xl">🗺️</span> {t('map.dashboard', { defaultValue: 'Map OS' })}
                </h2>
                <p className="text-gray-400 text-xs mt-1">{t('map.sidebar.subtitle')}</p>
            </div>

            {/* Content Array */}
            <div className="p-4 flex flex-col gap-6">

                {/* Presets Section */}
                <section>
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-bold px-1 flex items-center gap-2">
                        <FolderOpen size={14} className="text-accent" />
                        {t('map.sidebar.presets')}
                    </h3>
                    <MapPresetGallery />
                </section>

                <hr className="border-gray-800" />

                {/* Import Section */}
                <section>
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold px-1">{t('map.sidebar.import.title')}</h3>
                    <div className="flex gap-2 mb-3">
                        <button
                            className="flex-1 bg-app-bg hover:bg-app-surface p-3 rounded-lg flex items-center justify-center gap-2 border border-app-border transition-colors text-sm"
                            onClick={() => setIsMediaBrowserOpen(true)}
                        >
                            <Upload size={18} className="text-accent" />
                            <span>{t('map.sidebar.import.button')}</span>
                        </button>
                        {mapUrl && (
                            <button
                                className="bg-rose-500/10 hover:bg-rose-500/20 p-3 rounded-lg flex items-center justify-center border border-rose-500/30 transition-colors text-rose-500"
                                onClick={handleClearMap}
                                title={t('map.sidebar.import.remove')}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>

                    {/* Narrative Generation Button */}
                    <button
                        disabled={isGenerating || !mapUrl}
                        onClick={handleGenerateNarrative}
                        className="w-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 p-2.5 rounded-lg border border-indigo-500/30 flex items-center justify-center gap-2 transition-all group disabled:opacity-30 disabled:grayscale"
                    >
                        {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Sparkles size={16} className="text-accent group-hover:scale-110 transition-transform animate-pulse" />
                        )}
                        <span className="text-[11px] font-black uppercase tracking-widest text-indigo-100 group-hover:text-accent transition-colors">{t('map.sidebar.oracle')}</span>
                    </button>
                </section>

                <hr className="border-gray-800" />

                {/* Layers Section */}
                <section>
                    <MapLayersPanel />
                </section>

                <hr className="border-gray-800" />

                {/* Tools Section */}
                <section>
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t('map.sidebar.fog.title')}</h3>
                        <div className="flex gap-1">
                            <button
                                className="text-gray-400 hover:text-green-500 transition-colors p-1 flex items-center gap-1"
                                onClick={handleRevealAll}
                                title={t('map.sidebar.fog.revealAll')}
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 flex items-center gap-1"
                                onClick={handleHideAll}
                                title={t('map.sidebar.fog.hideAll')}
                            >
                                <EyeOff size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <ModeButton mode="reveal" fogMode={fogMode} setFogMode={setFogMode} icon={Eye} label={t('map.sidebar.fog.reveal')} />
                        <ModeButton mode="hide" fogMode={fogMode} setFogMode={setFogMode} icon={EyeOff} label={t('map.sidebar.fog.hide')} />
                    </div>

                    {/* Tool Grid */}
                    <div className="flex gap-2 flex-wrap mb-4">
                        <ToolButton tool="move_token" currentTool={currentTool} setTool={setTool} icon={MousePointer2} label={t('map.sidebar.tools.tokens')} />
                        <ToolButton tool="brush" currentTool={currentTool} setTool={setTool} icon={Paintbrush} label={t('map.sidebar.tools.brush')} />
                        <ToolButton tool="rect" currentTool={currentTool} setTool={setTool} icon={Square} label={t('map.sidebar.tools.rect')} />
                        <ToolButton tool="circle" currentTool={currentTool} setTool={setTool} icon={Circle} label={t('map.sidebar.tools.circle')} />
                        <ToolButton tool="ping" currentTool={currentTool} setTool={setTool} icon={MapPin} label={t('map.sidebar.tools.ping')} />
                        <ToolButton tool="magic" currentTool={currentTool} setTool={setTool} icon={Sparkles} label={t('map.sidebar.tools.magic')} />
                        <ToolButton tool="danger" currentTool={currentTool} setTool={setTool} icon={ShieldAlert} label={t('map.sidebar.tools.danger')} />
                    </div>

                    {/* Magic Options */}
                    {currentTool === 'magic' && (
                        <div className="bg-app-bg/20 p-3 rounded border border-app-border flex flex-col gap-3">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-wider">
                                    <span>{t('map.sidebar.magic.type')}</span>
                                    <button onClick={handleClearMagic} className="text-rose-500 hover:text-rose-400">{t('map.sidebar.magic.clearAll')}</button>
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
                                            className={`p-1.5 rounded border text-[10px] flex flex-col items-center transition-all ${

                                                magicStyle === s.id 
                                                ? 'bg-accent/20 border-accent text-accent' 
                                                : 'bg-app-bg border-app-border text-slate-500 hover:bg-app-surface'
                                            }`}
                                        >
                                            <span>{s.icon}</span>
                                            <span className="font-bold truncate w-full text-center">{s.label}</span>
                                        </button>
                                    ))}
                                </div>

                            </div>
                            
                            <div>
                                <span className="text-[10px] text-slate-400 mb-2 block uppercase font-bold tracking-wider">{t('map.sidebar.magic.shape')}</span>
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
                                                    : 'bg-app-bg border-app-border text-slate-500 hover:bg-app-surface'
                                                }`}
                                            >
                                                <Icon size={14} />
                                                <span className="text-[10px] font-bold">{sh.label}</span>
                                            </button>
                                        );
                                    })}

                                </div>
                            </div>

                            {/* List of active effects */}
                            {magicEffects.length > 0 && (
                                <div className="mt-2 border-t border-app-border pt-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('map.sidebar.magic.activeEffects')} ({magicEffects.length})</span>
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
                                                    <span className="text-[10px] text-slate-300 capitalize truncate font-medium">
                                                        {t(`map.sidebar.magic.styles.${eff.style}`)} - {
                                                            eff.type === 'circle' ? t('map.sidebar.magic.shapes.circle') :
                                                            eff.type === 'rect' ? t('map.sidebar.magic.shapes.rect') :
                                                            eff.type === 'line' ? t('map.sidebar.magic.shapes.line') : t('map.sidebar.magic.shapes.cone')
                                                        }
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => removeMagicEffect(eff.id)}
                                                    className="p-1 text-slate-600 hover:text-rose-500 transition-colors"
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
                    )}

                </section>



                <hr className="border-gray-800" />

                {/* Danger Zones Section */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t('map.sidebar.danger.title', { defaultValue: 'Zones de Danger' })}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => gmCustom('map-danger-preset-editor')}
                                className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors"
                            >
                                {t('map.sidebar.danger.managePresets')}
                            </button>
                            <button
                                onClick={() => gmConfirm(t('map.sidebar.danger.clearConfirm'), clearDangerZones)}
                                className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
                            >
                                {t('map.sidebar.danger.clearAll')}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {currentTool === 'danger' ? (
                            <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                                <p className="text-[11px] text-rose-200/70 mb-3 italic">
                                    {t('map.sidebar.danger.instruction')}
                                </p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{t('map.sidebar.danger.shape')}</label>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => setDangerShape('rect')}
                                                title={t('map.sidebar.danger.shapes.rect')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'rect' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-slate-400 hover:text-slate-200'}`}
                                            >
                                                <Square size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDangerShape('circle')}
                                                title={t('map.sidebar.danger.shapes.circle')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'circle' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-slate-400 hover:text-slate-200'}`}
                                            >
                                                <Circle size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDangerShape('cone')}
                                                title={t('map.sidebar.danger.shapes.cone')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'cone' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-slate-400 hover:text-slate-200'}`}
                                            >
                                                <Triangle size={16} className="rotate-180" />
                                            </button>
                                            <button 
                                                onClick={() => setDangerShape('line')}
                                                title={t('map.sidebar.danger.shapes.line')}
                                                className={`flex-1 flex justify-center p-2 rounded border transition-all ${dangerShape === 'line' ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-slate-400 hover:text-slate-200'}`}
                                            >
                                                <GripHorizontal size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Toggles for Aura/DT Overrides */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setAuraOverride(!auraOverride)}
                                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border text-[10px] font-bold transition-all ${auraOverride ? 'bg-accent/20 border-accent text-accent' : 'bg-app-bg/50 border-app-border/50 text-slate-500 hover:text-slate-300'}`}
                                            title={t('map.sidebar.danger.aura')}
                                        >
                                            <Link size={14} />
                                            <span>{t('map.sidebar.danger.aura')}</span>
                                        </button>
                                        <button 
                                            onClick={() => setDifficultTerrainOverride(!difficultTerrainOverride)}
                                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border text-[10px] font-bold transition-all ${difficultTerrainOverride ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-app-bg/50 border-app-border/50 text-slate-500 hover:text-slate-300'}`}
                                            title={t('map.sidebar.danger.terrain')}
                                        >
                                            <Mountain size={14} />
                                            <span>{t('map.sidebar.danger.terrain')}</span>
                                        </button>
                                    </div>

                                    {difficultTerrainOverride && (
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">{t('map.sidebar.danger.dtCost')}</span>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="range" min="1" max="4" step="0.5" 
                                                    value={movementCostOverride}
                                                    onChange={(e) => setMovementCostOverride(parseFloat(e.target.value))}
                                                    className="w-20 h-1 accent-emerald-500 bg-gray-700 rounded-lg cursor-pointer"
                                                />
                                                <span className="text-[10px] font-mono text-emerald-500">x{movementCostOverride}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{t('map.sidebar.danger.presets')}</label>
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
                                                        <span className={`flex-1 text-[11px] ${isActive ? 'text-accent font-bold' : 'text-slate-300'}`}>
                                                            {preset.name}
                                                            <span className="ml-2 inline-flex gap-1 opacity-50">
                                                                {preset.isAura && <Link size={10} />}
                                                                {preset.isDifficultTerrain && <Mountain size={10} />}
                                                            </span>
                                                        </span>
                                                        {isActive ? (
                                                            <Zap size={14} className="text-accent animate-pulse" />
                                                        ) : (
                                                            <PlusCircle size={14} className="text-slate-600 group-hover:text-accent" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {dangerZones.map(zone => (
                                    <div key={zone.id} className="bg-app-bg/30 border border-app-border rounded p-2 flex flex-col gap-1 group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                                            <span className="text-[11px] text-slate-300 flex-1 truncate">{zone.name}</span>
                                            <div className="flex gap-1">
                                                {zone.isAura && <Link size={12} className="text-accent" />}
                                                {zone.isDifficultTerrain && <Mountain size={12} className="text-emerald-500" />}
                                            </div>
                                            <button 
                                                onClick={() => removeDangerZone(zone.id)}
                                                className="text-slate-600 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {zone.isAura && (
                                            <div className="text-[9px] text-slate-500 flex items-center gap-1 px-1 italic">
                                                <Users size={10} />
                                                <span>{t('map.sidebar.danger.carrier')}: {zone.parentTokenId ? (tokens.find(t => t.id === zone.parentTokenId)?.name || t('map.sidebar.danger.unknown')) : t('map.sidebar.danger.none')}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {dangerZones.length === 0 && (
                                    <p className="text-center py-4 text-[11px] text-slate-600 italic border border-dashed border-app-border rounded">
                                        {t('map.sidebar.danger.noActiveZones')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <hr className="border-gray-800" />

                {/* Weather Section */}
                <section>
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-bold px-1">{t('map.sidebar.weather.title')}</h3>
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
                                        : 'bg-app-bg border-app-border text-slate-500 hover:bg-app-surface'
                                    }`}
                                    title={w.label}
                                >
                                    <Icon size={18} />
                                    <span className="text-[9px] mt-1 font-bold uppercase">{w.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {weatherType !== 'none' && (
                        <div className="bg-app-bg/20 p-3 rounded border border-app-border">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
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
                                className="w-full h-1 accent-accent bg-gray-700 rounded-lg cursor-pointer"
                            />
                        </div>
                    )}
                </section>

                <hr className="border-gray-800" />

                {/* Time of Day Section */}
                <section>
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-bold px-1">{t('map.sidebar.time.title')}</h3>
                    <div className="flex gap-1.5 mb-2">
                        {[
                            { id: 'dawn', icon: Sunrise, label: t('map.sidebar.time.dawn'), color: 'text-orange-400' },
                            { id: 'day', icon: Sun, label: t('map.sidebar.time.day'), color: 'text-yellow-400' },
                            { id: 'overcast', icon: Cloudy, label: t('map.sidebar.time.overcast'), color: 'text-slate-400' },
                            { id: 'dusk', icon: Sunset, label: t('map.sidebar.time.dusk'), color: 'text-purple-400' },
                            { id: 'night', icon: Moon, label: t('map.sidebar.time.night'), color: 'text-indigo-400' },
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
                                        : 'bg-app-bg border-app-border text-slate-500 hover:bg-app-surface'
                                    }`}
                                    title={t.label}
                                >
                                    <Icon size={18} className={isActive ? 'text-accent' : t.color} />
                                    <span className="text-[8px] mt-1 font-bold uppercase truncate w-full text-center">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <hr className="border-gray-800" />

                {/* Grid Settings */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold">{t('map.sidebar.grid.title')}</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isGridEnabled} 
                                onChange={(e) => setGridEnabled(e.target.checked)} 
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>

                    {isGridEnabled && (
                        <div className="flex flex-col gap-3 bg-app-bg/20 p-3 rounded border border-app-border">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
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
                                    className="w-full h-1 accent-accent bg-gray-700 rounded-lg cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
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
                                    className="w-full h-1 accent-accent bg-gray-700 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </section>

                <hr className="border-gray-800" />

                {/* Combat Turn Section */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold text-gm-crimson flex items-center gap-2">
                           <Swords size={12} /> {t('map.sidebar.combat.title')}
                        </h3>
                        {combatants.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black bg-gm-crimson/20 text-gm-crimson px-2 py-0.5 rounded uppercase tracking-tighter">{t('map.sidebar.combat.round')} {round}</span>
                                <span className="text-[10px] font-black bg-app-surface text-app-text/60 px-2 py-0.5 rounded border border-app-border uppercase tracking-tighter">{currentTurnIdx + 1} / {combatants.length}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            disabled={combatants.length === 0}
                            onClick={prevTurn}
                            className="flex items-center justify-center gap-2 py-2 bg-app-bg hover:bg-app-surface border border-app-border rounded-lg text-xs font-bold text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
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
                </section>

                <hr className="border-gray-800" />

                {/* Tokens Section */}
                <section className="flex-1 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold text-gm-emerald">{t('map.sidebar.combatants.title')}</h3>
                        <button
                            onClick={handleClearTokens}
                            className={`p-1 rounded transition-colors ${tokens.length > 0 ? 'text-gray-400 hover:text-rose-500' : 'text-gray-700 cursor-not-allowed'}`}
                            title={t('map.sidebar.combatants.clear')}
                            disabled={tokens.length === 0}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {combatants.length === 0 ? (
                        <div className="bg-app-bg/10 border border-app-border border-dashed rounded-lg flex flex-col items-center justify-center p-4 text-center">
                                <Users size={32} className="text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500">{t('map.sidebar.combatants.none')}</p>
                                <p className="text-xs text-gray-600 mt-1">{t('map.sidebar.combatants.hint')}</p>
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
                    <div className="mt-2 text-[10px] text-gray-500 px-1 border-t border-gray-800 pt-2 text-center">
                        {t('map.sidebar.combatants.footer')}
                    </div>
                </section>

                {/* Audio Controls (Conditional for Videos) */}
                {isVideo && (
                    <section className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-3 px-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('map.sidebar.audio.title')}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMapMuted(!isMapMuted)}
                                    className={`p-1.5 rounded-lg transition-all ${isMapMuted ? 'text-rose-500 bg-rose-500/10' : 'text-accent bg-accent/10 hover:bg-accent/20'}`}
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
                                    className="w-full accent-accent h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums w-8 text-right">
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
                    </section>
                )}

                {/* Projection Action */}
                <section className="mt-auto pt-4 border-t border-gray-800 flex flex-col gap-3">
                    {projectionTarget && (
                        <div className="px-1 flex flex-col gap-2">
                            <div className="w-full flex flex-col items-center justify-center gap-1 p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent shadow-inner">
                                <div className="flex items-center gap-2">
                                    <Cast size={16} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">{t('map.sidebar.projection.active')}</span>
                                </div>
                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter tabular-nums truncate max-w-full">{t('map.sidebar.projection.target')} : {getDisplayLabel(projectionTarget)}</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (projectionTarget === 'monitor' && window.appBridge?.image?.closeAllDisplays) {
                                        window.appBridge.image.closeAllDisplays();
                                    }
                                    clearProjectedState();
                                }}
                                className="w-full py-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors uppercase font-bold tracking-widest"
                            >
                                {t('map.sidebar.projection.stop')}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 px-1 mb-2">
                        <button
                            onClick={() => requestTacticalAnalysis()}
                            disabled={isAnalyzing}
                            className={`group flex items-center gap-3 p-4 border rounded-xl transition-all shadow-lg ${
                                isAnalyzing 
                                ? 'bg-gm-violet/20 border-gm-violet/40 text-gm-violet animate-pulse' 
                                : 'bg-gm-violet/10 border-gm-violet/30 text-gm-violet hover:bg-gm-violet hover:text-white active:scale-95'
                            }`}
                        >
                            <Brain className={`shrink-0 ${isAnalyzing ? 'animate-spin-slow' : 'group-hover:scale-110 transition-transform'}`} size={20} />
                            <div className="text-left">
                                <span className="text-[10px] font-black uppercase tracking-widest block leading-none">{t('map.sidebar.ai.title')}</span>
                                <span className="text-[8px] opacity-60 uppercase font-bold">{isAnalyzing ? t('map.sidebar.ai.analyzing') : t('map.sidebar.ai.launch')}</span>
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 px-1">
                        <button
                            onClick={() => gmCustom('map-projection-select')}
                            className={`group flex flex-col items-center justify-center gap-2 p-4 border rounded-xl transition-all shadow-lg ${projectionTarget
                                ? 'bg-app-surface/50 border-app-border text-slate-400'
                                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100 hover:bg-indigo-500/20 active:scale-95'
                                }`}
                        >
                            <Cast className={projectionTarget ? 'text-slate-500' : 'text-accent group-hover:scale-110 transition-transform'} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{t('map.sidebar.projection.project')}</span>
                        </button>
                        <button
                            onClick={resetView}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-app-surface/40 hover:bg-app-surface border border-app-border/50 rounded-xl transition-all group shadow-lg"
                        >
                            <Maximize className="text-slate-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-white/80">{t('map.sidebar.projection.resetView')}</span>
                        </button>
                    </div>
                </section>

            </div>

            <MediaBrowser 
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={handleMediaSelect}
                allowedTypes={['image', 'video']}
                title={t('map.sidebar.import.title')}
            />
        </aside>
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
                className={`w-full flex items-center justify-between gap-3 bg-app-surface/30 border rounded-xl px-4 py-2.5 text-[8px] font-black uppercase tracking-widest transition-all ${isOpen ? 'border-accent text-white shadow-glow-accent/20' : 'border-app-border/50 text-slate-500 hover:border-app-border/10 hover:text-slate-300'}`}
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
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${currentId === 'default' ? 'bg-accent/20 text-white' : 'text-slate-400 hover:bg-app-surface/5 hover:text-white'}`}
                            >
                                <span>{t('map.sidebar.audio.defaultSpeaker')}</span>
                                {currentId === 'default' && <Check size={10} className="text-gm-violet" />}
                            </button>
                            
                            <div className="h-px bg-white/5 my-0.5 mx-1" />
                            
                            {devices.map((device) => (
                                <button
                                    key={device.deviceId}
                                    onClick={() => { onSelect(device.deviceId); setIsOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all text-left ${currentId === device.deviceId ? 'bg-gm-violet/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
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

export default MapControls;

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
                        <span className="text-[10px] uppercase text-gm-crimson">{combatant.name.substring(0, 2)}</span>
                    </div>
                )}
                <span className="text-sm text-slate-200 truncate">{combatant.name}</span>
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
                className={`p-1.5 rounded transition-colors ${isOnMap ? 'text-gray-600 cursor-not-allowed' : 'text-gm-emerald hover:bg-gm-emerald/20 hover:text-green-400'}`}
                title={isOnMap ? t('map.sidebar.combatants.alreadyOnMap') : t('map.sidebar.combatants.addToMap')}
            >
                <PlusCircle size={18} />
            </button>
        </div>
    );
};
