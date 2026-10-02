import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '../useMapStore';
import type { DangerZonePreset } from '../types';
import { 
    Plus, Trash2, Palette, Lightbulb, Volume2, Music, 
    ChevronRight, ChevronDown, AlertCircle, Zap, Layers,
    Activity, Shield, Settings2, Sparkles
} from 'lucide-react';
import { useTuilesVisibles } from '../../light/hooks/useTuilesVisibles';
import { useAmbientStore } from '../../ambient/useAmbientStore';
import { useSoundStore } from '../../sound/useSoundStore';

/**
 * DangerZonePresetEditor
 * UI for managing and editing Danger Zone templates.
 * Redesigned with "Obsidian Nexus" aesthetic.
 */
const DangerZonePresetEditor: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { dangerZonePresets, addDangerZonePreset, updateDangerZonePreset, removeDangerZonePreset } = useMapStore();
    
    // External Stores for Dropdowns
    /* Le même verdict que la grille de Light-OS : une zone de danger ne doit
       pas pouvoir viser l'ambiance d'une campagne qu'on ne joue pas. */
    const { capturees: lightScenes } = useTuilesVisibles();
    const { tracks: ambientTracks } = useAmbientStore();
    const { atmospheres: soundAtmospheres, activeAtmosphereId } = useSoundStore();

    // Compute sound pads for active atmosphere
    const activeAtmos = soundAtmospheres.find(a => a.id === activeAtmosphereId);
    const soundPads = activeAtmos ? Object.values(activeAtmos.pads).filter(p => p.title || p.id) : [];

    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
        dangerZonePresets.length > 0 ? dangerZonePresets[0].id : null
    );

    const selectedPreset = dangerZonePresets.find(p => p.id === selectedPresetId);

    const handleUpdate = (updates: Partial<DangerZonePreset>) => {
        if (selectedPresetId) {
            updateDangerZonePreset(selectedPresetId, updates);
        }
    };

    const handleCreate = () => {
        const newPreset: Omit<DangerZonePreset, 'id'> = {
            name: t('map.dangerEditor.newModel'),
            color: '#53ddfc', // Default to Obsidian Cyan
        };
        const added = addDangerZonePreset(newPreset);
        if (added) setSelectedPresetId(added.id);
    };

    const handleDelete = (id: string) => {
        if (dangerZonePresets.length <= 1) return;
        removeDangerZonePreset(id);
        if (selectedPresetId === id) {
            setSelectedPresetId(dangerZonePresets.find(p => p.id !== id)?.id || null);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full min-h-[600px] bg-app-bg text-app-text font-['Space_Grotesk'] overflow-hidden">
            {/* Sidebar: Preset List */}
            <div className="w-full md:w-72 border-r border-app-surface-2 flex flex-col bg-app-bg/80 backdrop-blur-xl">
                <div className="p-6 border-b border-app-surface-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers size={18} className="text-gm-cyan" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gm-cyan/80">{t('map.dangerEditor.models')}</span>
                    </div>
                    <button 
                        onClick={handleCreate}
                        title={t('map.dangerEditor.newModel') as string}
                        className="p-2 bg-gm-cyan/10 text-gm-cyan hover:bg-gm-cyan/20 border border-gm-cyan/20 rounded-lg transition-all active:scale-95"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {dangerZonePresets.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => setSelectedPresetId(preset.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all relative group overflow-hidden ${
                                selectedPresetId === preset.id 
                                ? 'bg-gm-cyan/10 border border-gm-cyan/30' 
                                : 'hover:bg-app-surface-2/50 border border-transparent text-app-muted hover:text-app-text'
                            }`}
                        >
                            {/* Accent Glow for selected */}
                            {selectedPresetId === preset.id && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-gm-cyan shadow-[0_0_10px_rgba(83,221,252,0.8)]" />
                            )}
                            
                            <div 
                                className="w-4 h-4 rounded-full border border-app-text/10 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.1)]" 
                                style={{ backgroundColor: preset.color } as React.CSSProperties} 
                            />
                            <div className="flex flex-col items-start min-w-0 flex-1">
                                <span className={`text-sm font-bold truncate w-full ${selectedPresetId === preset.id ? 'text-app-text' : ''}`}>
                                    {preset.name}
                                </span>
                                {preset.isAura && (
                                    <span className="text-ui-10 text-gm-cyan/60 uppercase font-black tracking-tighter">{t('map.dangerEditor.auraActive')}</span>
                                )}
                            </div>
                            <ChevronRight size={14} className={`transition-all ${selectedPresetId === preset.id ? 'text-gm-cyan translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-app-bg relative overflow-hidden">
                {/* Background Decorative Gradients */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gm-cyan/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-etat-info/5 blur-[100px] rounded-full pointer-events-none" />

                {selectedPreset ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gm-cyan/10 rounded-xl border border-gm-cyan/20">
                                        <Settings2 size={24} className="text-gm-cyan" />
                                    </div>
                                    <h2 className="text-3xl font-black text-app-text tracking-tight leading-none uppercase italic">
                                        {selectedPreset.name}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-4 text-ui-10 font-bold text-app-subtle uppercase tracking-widest pl-1">
                                    <span className="flex items-center gap-1.5 border-r border-app-border pr-4">
                                        <Activity size={12} className="text-gm-cyan/50" />
                                        Nexus ID: <span className="text-app-muted">{selectedPreset.id.substring(0, 8)}...</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Shield size={12} className="text-etat-succes/50" />
                                        Statut: <span className="text-etat-succes">Synchronisé</span>
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleDelete(selectedPreset.id)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-etat-danger/5 text-etat-danger hover:bg-etat-danger/15 border border-etat-danger/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                            >
                                <Trash2 size={14} />
                                {t('map.dangerEditor.delete')}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left Column: Visual & Identity */}
                            <section className="space-y-6">
                                <SectionHeader icon={Palette} title={t('map.dangerEditor.visualConfig')} />
                                
                                <div className="p-6 bg-app-surface/40 backdrop-blur-md rounded-2xl border border-app-surface-2 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gm-cyan/5 blur-3xl pointer-events-none group-hover:bg-gm-cyan/10 transition-colors" />
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-ui-10 font-black text-gm-cyan/60 uppercase tracking-widest ml-1">{t('map.dangerEditor.modelName')}</label>
                                            <input 
                                                type="text" 
                                                value={selectedPreset.name}
                                                onChange={(e) => handleUpdate({ name: e.target.value })}
                                                className="w-full bg-app-bg border-b-2 border-app-border focus:border-gm-cyan px-4 py-3 text-lg font-bold text-app-text transition-all outline-none rounded-t-lg"
                                                placeholder={t('map.dangerEditor.placeholderName') as string}
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-ui-10 font-black text-gm-cyan/60 uppercase tracking-widest ml-1">{t('map.dangerEditor.signature')}</label>
                                            <div className="flex gap-4 p-4 bg-app-bg/50 rounded-xl border border-app-surface-2">
                                                <div className="relative">
                                                    <input 
                                                        type="color" 
                                                        value={selectedPreset.color}
                                                        onChange={(e) => handleUpdate({ color: e.target.value })}
                                                        title={t('map.dangerEditor.signature') as string}
                                                        className="w-14 h-14 bg-transparent cursor-pointer rounded-lg overflow-hidden border-none p-0"
                                                    />
                                                    <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-app-text/10 ring-inset" />
                                                </div>
                                                <div className="flex flex-col justify-center gap-1">
                                                    <input 
                                                        type="text" 
                                                        value={selectedPreset.color}
                                                        onChange={(e) => handleUpdate({ color: e.target.value })}
                                                        className="bg-transparent text-xl font-mono font-black text-app-text outline-none uppercase tracking-tighter w-28"
                                                        title={t('map.dangerEditor.hexCode') as string}
                                                    />
                                                    <span className="text-ui-9 text-app-subtle font-bold uppercase tracking-widest italic">{t('map.dangerEditor.hexCode')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SectionHeader icon={AlertCircle} title={t('map.dangerEditor.tacticalProps')} color="text-etat-succes" />
                                <div className="p-6 bg-app-surface/40 backdrop-blur-md rounded-2xl border border-app-surface-2 space-y-6">
                                    <TacticalSwitch 
                                        label={t('map.dangerEditor.auraLabel')} 
                                        description={t('map.dangerEditor.auraDesc')}
                                        active={!!selectedPreset.isAura}
                                        onToggle={() => handleUpdate({ isAura: !selectedPreset.isAura })}
                                    />

                                    <div className="h-px bg-app-surface-2/50" />

                                    <TacticalSwitch 
                                        label={t('map.dangerEditor.movementLabel')} 
                                        description={t('map.dangerEditor.movementDesc')}
                                        active={!!selectedPreset.isDifficultTerrain}
                                        color="emerald"
                                        onToggle={() => handleUpdate({ isDifficultTerrain: !selectedPreset.isDifficultTerrain })}
                                    />

                                    {selectedPreset.isDifficultTerrain && (
                                        <div className="space-y-4 pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-ui-10 font-black text-etat-succes/60 uppercase tracking-widest">{t('map.dangerEditor.multiCost')}</label>
                                                <span className="bg-etat-succes/10 text-etat-succes px-2 py-0.5 rounded-lg text-xs font-black italic">
                                                    x{selectedPreset.movementCost || 2.0}
                                                </span>
                                            </div>
                                            <div className="relative h-6 flex items-center">
                                                <input 
                                                    type="range" 
                                                    min="1" 
                                                    max="5" 
                                                    step="0.5"
                                                    value={selectedPreset.movementCost || 2.0}
                                                    onChange={(e) => handleUpdate({ movementCost: parseFloat(e.target.value) })}
                                                    title={t('map.dangerEditor.multiCost') as string}
                                                    className="w-full accent-etat-succes hover:accent-etat-succes transition-all cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex justify-between text-ui-8 font-bold text-app-subtle uppercase">
                                                <span>{t('map.dangerEditor.normal')}</span>
                                                <span>{t('map.dangerEditor.lethal')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Right Column: Interaction & Audio */}
                            <section className="space-y-6">
                                <SectionHeader icon={Zap} title={t('map.dangerEditor.domotics')} color="text-etat-alerte" />
                                
                                <div className="p-6 bg-app-surface/40 backdrop-blur-md rounded-2xl border border-app-surface-2 space-y-6">
                                    <ObsidianSelect 
                                        label={t('map.dangerEditor.lightScene')}
                                        icon={Lightbulb}
                                        value={selectedPreset.hueSceneId || ''}
                                        options={lightScenes.map(s => ({ id: s.id, name: s.name }))}
                                        onChange={(val) => handleUpdate({ hueSceneId: val })}
                                        accent="amber"
                                        placeholder={t('common:none') || '-- Aucun --'}
                                    />

                                    <ObsidianSelect 
                                        label={t('map.dangerEditor.ambientAtmo')}
                                        icon={Music}
                                        value={selectedPreset.audioAtmosphereId || ''}
                                        options={ambientTracks.map((t, i) => ({ id: t.id, name: t.label || `Piste ${i+1}` }))}
                                        onChange={(val) => handleUpdate({ audioAtmosphereId: val })}
                                        accent="blue"
                                        placeholder={t('common:none') || '-- Aucun --'}
                                    />

                                    <ObsidianSelect 
                                        label={t('map.dangerEditor.audioPad')}
                                        icon={Volume2}
                                        value={selectedPreset.audioPadId || ''}
                                        options={soundPads.map(p => ({ id: p.id, name: p.title || `Pad ${p.id}` }))}
                                        onChange={(val) => handleUpdate({ audioPadId: val })}
                                        accent="cyan"
                                        placeholder={t('common:none') || '-- Aucun --'}
                                    />
                                </div>

                                {/* Tips / System Info */}
                                <div className="p-6 bg-app-surface/20 rounded-2xl border border-app-surface-2 flex gap-4 relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1 h-full bg-etat-alerte/30" />
                                     <div className="p-3 bg-etat-alerte/10 rounded-xl h-fit">
                                         <Sparkles className="text-etat-alerte shadow-[0_0_10px_rgba(251,191,36,0.5)]" size={18} />
                                     </div>
                                     <div className="space-y-2 text-app-text">
                                         <p className="text-ui-10 font-black text-etat-alerte uppercase tracking-widest pl-1">{t('map.dangerEditor.protocol')}</p>
                                         <p className="text-xs leading-relaxed italic opacity-80">
                                            {t('map.dangerEditor.protocolDesc')}
                                         </p>
                                     </div>
                                </div>
                            </section>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-app-subtle gap-6 animate-in fade-in zoom-in duration-500">
                        <div className="p-8 bg-gm-cyan/5 rounded-full border border-gm-cyan/10 relative">
                            <Layers size={84} className="opacity-20 text-gm-cyan" />
                            <div className="absolute inset-0 animate-pulse bg-gm-cyan/5 rounded-full blur-2xl" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-app-muted uppercase tracking-[0.3em]">{t('map.dangerEditor.initRequired')}</h3>
                            <p className="text-sm italic text-app-subtle px-10">{t('map.dangerEditor.initDesc')}</p>
                        </div>
                        <button 
                            onClick={handleCreate}
                            className="group flex items-center gap-3 px-8 py-3 bg-gm-cyan/10 text-gm-cyan hover:bg-gm-cyan/20 border border-gm-cyan/30 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            {t('map.dangerEditor.newMatrix')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- Internal Modular Sub-components --- */

const SectionHeader = ({ icon: Icon, title, color = "text-gm-cyan" }: { icon: React.ElementType, title: string, color?: string }) => (
    <div className="flex items-center gap-2 mb-2 pl-1">
        <div className={`p-1.5 rounded-lg bg-app-text/5 ${color}`}>
            <Icon size={14} />
        </div>
        <h3 className={`text-ui-10 font-black uppercase tracking-[0.25em] ${color}`}>{title}</h3>
    </div>
);

const TacticalSwitch = ({ label, description, active, onToggle, color = "cyan" }: { 
    label: string, 
    description: string, 
    active: boolean, 
    onToggle: () => void,
    color?: 'cyan' | 'emerald' | 'amber'
}) => {
    const accents = {
        cyan: 'bg-gm-cyan shadow-[0_0_15px_rgba(83,221,252,0.4)]',
        emerald: 'bg-etat-succes shadow-[0_0_15px_rgba(16,185,129,0.4)]',
        amber: 'bg-etat-alerte shadow-[0_0_15px_rgba(245,158,11,0.4)]'
    };

    return (
        <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
            <div className="space-y-1">
                <label className="text-sm font-black text-app-text group-hover:text-gm-cyan transition-colors uppercase tracking-wider">{label}</label>
                <p className="text-ui-10 text-app-subtle font-bold italic">{description}</p>
            </div>
            <div className={`w-14 h-7 p-1 rounded-full transition-all duration-300 flex items-center ${active ? accents[color] : 'bg-app-bg border border-app-border'}`}>
                <div className={`w-5 h-5 bg-fixe-blanc rounded-full transition-all duration-300 shadow-sm ${active ? 'translate-x-[26px]' : 'translate-x-0'}`} />
            </div>
        </div>
    );
};

const ObsidianSelect = ({ 
    label, icon: Icon, value, options, onChange, placeholder = "-- Aucun --", accent = "cyan" 
}: { 
    label: string, icon: React.ElementType, value: string, options: { id: string, name: string }[], onChange: (val: string) => void, placeholder?: string, accent?: string 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.id === value);

    const accentClasses: Record<string, string> = {
        cyan: 'text-gm-cyan border-gm-cyan/20',
        amber: 'text-etat-alerte border-etat-alerte/20',
        emerald: 'text-etat-succes border-etat-succes/20',
        blue: 'text-etat-info border-etat-info/20'
    };

    return (
        <div className="space-y-2 relative">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={12} className={accentClasses[accent].split(' ')[0]} />
                <label className="text-ui-10 font-black text-app-subtle uppercase tracking-widest">{label}</label>
            </div>
            
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-app-bg border border-app-surface-2 hover:border-app-border rounded-xl px-4 py-3 text-sm text-app-text transition-all outline-none group text-left"
            >
                <span className={`font-bold truncate ${selectedOption ? 'text-app-text' : 'text-app-subtle italic'}`}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown size={14} className={`text-app-subtle group-hover:text-gm-cyan transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 w-full mt-2 bg-app-surface border border-app-surface-2 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            <button
                                onClick={() => { onChange(''); setIsOpen(false); }}
                                className="w-full text-left px-4 py-3 text-xs text-app-subtle hover:bg-app-surface-2 rounded-lg transition-colors italic font-bold"
                            >
                                {placeholder}
                            </button>
                            {options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-xs rounded-lg transition-all ${
                                        value === opt.id 
                                        ? 'bg-gm-cyan/20 text-gm-cyan font-black italic' 
                                        : 'text-app-text hover:bg-app-surface-2 font-bold'
                                    }`}
                                >
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DangerZonePresetEditor;
