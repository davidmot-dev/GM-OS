import React, { useState } from 'react';
import { useMapStore } from '../useMapStore';
import type { DangerZonePreset } from '../types';
import { 
    Plus, Trash2, Palette, Lightbulb, Volume2, Music, 
    ChevronRight, ChevronDown, AlertCircle, Zap 
} from 'lucide-react';
import { useLightStore } from '../../light/useLightStore';
import { useAmbientStore } from '../../ambient/useAmbientStore';
import { useSoundStore } from '../../sound/useSoundStore';

const DangerZonePresetEditor: React.FC = () => {
    const { dangerZonePresets, addDangerZonePreset, updateDangerZonePreset, removeDangerZonePreset } = useMapStore();
    
    // External Stores for Dropdowns
    const { scenes: lightScenes } = useLightStore();
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
            name: 'Nouveau Preset',
            color: '#ff0000',
        };
        addDangerZonePreset(newPreset);
    };

    const handleDelete = (id: string) => {
        if (dangerZonePresets.length <= 1) return;
        removeDangerZonePreset(id);
        if (selectedPresetId === id) {
            setSelectedPresetId(dangerZonePresets.find(p => p.id !== id)?.id || null);
        }
    };

    // --- Custom Select Sub-component ---
    const CustomSelect = ({ 
        label, 
        icon: Icon, 
        value, 
        options, 
        onChange, 
        placeholder = "-- Aucun --" 
    }: { 
        label: string, 
        icon: any, 
        value: string, 
        options: { id: string, name: string }[], 
        onChange: (val: string) => void,
        placeholder?: string
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(o => o.id === value);

        return (
            <div className="space-y-2 relative">
                <div className="flex items-center gap-2 text-slate-400 ml-1">
                    <Icon size={12} className={label.includes('Hue') ? 'text-amber-400' : label.includes('Boucle') ? 'text-blue-400' : 'text-emerald-400'} />
                    <label className="text-[11px] font-medium">{label}</label>
                </div>
                
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 hover:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white transition-all outline-none"
                >
                    <span className={selectedOption ? 'text-white' : 'text-slate-500'}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                    <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                        <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                <button
                                    onClick={() => { onChange(''); setIsOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    {placeholder}
                                </button>
                                {options.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                                            value === opt.id ? 'bg-accent/20 text-accent font-bold' : 'text-slate-300 hover:bg-slate-800'
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

    return (
        <div className="flex flex-col md:flex-row h-full min-h-[600px] bg-slate-900/50">
            {/* Sidebar: Preset List */}
            <div className="w-full md:w-64 border-r border-slate-800 flex flex-col bg-slate-900/40">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modèles</span>
                    <button 
                        onClick={handleCreate}
                        title="Créer un nouveau modèle"
                        className="p-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-all"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {dangerZonePresets.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => setSelectedPresetId(preset.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                                selectedPresetId === preset.id 
                                ? 'bg-accent/20 border border-accent/30 shadow-lg shadow-accent/5' 
                                : 'hover:bg-slate-800/50 border border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <div 
                                className="w-3 h-3 rounded-full shadow-sm" 
                                style={{ backgroundColor: preset.color }} 
                            />
                            <span className={`text-xs font-medium flex-1 text-left truncate ${selectedPresetId === preset.id ? 'text-accent' : ''}`}>
                                {preset.name}
                            </span>
                            <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedPresetId === preset.id ? 'text-accent opacity-100' : ''}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main: Editor Form */}
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {selectedPreset ? (
                    <>
                        {/* Header Info */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {selectedPreset.name}
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: selectedPreset.color }} />
                                </h2>
                                <p className="text-xs text-slate-500">ID: {selectedPreset.id}</p>
                            </div>
                            <button 
                                onClick={() => handleDelete(selectedPreset.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all border border-rose-500/20"
                            >
                                <Trash2 size={14} />
                                Supprimer
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* General Settings */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Palette size={14} /> Configuration Visuelle
                                </h3>
                                
                                <div className="space-y-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                                    <div className="space-y-2">
                                        <label className="text-[11px] text-slate-400 ml-1">Nom du modèle</label>
                                        <input 
                                            type="text" 
                                            value={selectedPreset.name}
                                            onChange={(e) => handleUpdate({ name: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 focus:border-accent/50 rounded-xl px-4 py-2.5 text-sm text-white transition-all outline-none"
                                            placeholder="Ex: Zone de Lave"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[11px] text-slate-400 ml-1">Couleur d'affichage</label>
                                        <div className="flex gap-3">
                                            <input 
                                                type="color" 
                                                value={selectedPreset.color}
                                                onChange={(e) => handleUpdate({ color: e.target.value })}
                                                className="w-12 h-10 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer p-1"
                                            />
                                            <input 
                                                type="text" 
                                                value={selectedPreset.color}
                                                onChange={(e) => handleUpdate({ color: e.target.value })}
                                                className="flex-1 bg-slate-950 border border-slate-800 focus:border-accent/50 rounded-xl px-4 py-2.5 text-sm text-white font-mono transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interaction Settings */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} /> Domotique & Audio
                                </h3>

                                <div className="space-y-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-800/50">
                                    <CustomSelect 
                                        label="Scène Phillips Hue"
                                        icon={Lightbulb}
                                        value={selectedPreset.hueSceneId || ''}
                                        options={Object.values(lightScenes).map(s => ({ id: s.id, name: s.name }))}
                                        onChange={(val) => handleUpdate({ hueSceneId: val })}
                                    />

                                    <CustomSelect 
                                        label="Ambiance Audio (Boucle)"
                                        icon={Music}
                                        value={selectedPreset.audioAtmosphereId || ''}
                                        options={ambientTracks.map((t, i) => ({ id: t.id, name: `${i+1}: ${t.label || 'Sans nom'}` }))}
                                        onChange={(val) => handleUpdate({ audioAtmosphereId: val })}
                                        placeholder="-- Aucune --"
                                    />

                                    <CustomSelect 
                                        label="Pad Audio (Effet ponctuel)"
                                        icon={Volume2}
                                        value={selectedPreset.audioPadId || ''}
                                        options={soundPads.map(p => ({ id: p.id, name: `${p.id}: ${p.title || 'Vide'}` }))}
                                        onChange={(val) => handleUpdate({ audioPadId: val })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tip Box */}
                        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 flex gap-4">
                            <AlertCircle className="text-accent shrink-0" size={20} />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-accent uppercase tracking-wider">Note du Système</p>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Les changements sont appliqués instantanément. Ces presets apparaissent dans le menu "Forms" lors du dessin sur la carte. Les IDs audio et lumière doivent correspondre à ceux définis dans vos modules respectifs.
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <Palette size={48} className="opacity-20" />
                        <p className="text-sm italic">Sélectionnez un modèle ou créez-en un nouveau pour commencer l'édition.</p>
                        <button 
                            onClick={handleCreate}
                            className="px-6 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-xl font-bold transition-all border border-accent/20"
                        >
                            Créer mon premier modèle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DangerZonePresetEditor;
