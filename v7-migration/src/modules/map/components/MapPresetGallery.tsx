import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '../useMapStore';
import { Save, FolderOpen, Trash2, Map as MapIcon, Check, X } from 'lucide-react';
import { gmConfirm } from '../../../stores/useModalStore';

const MapPresetGallery: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { mapPresets, saveCurrentAsPreset, loadPreset, deletePreset, mapName } = useMapStore();
    const [newPresetName, setNewPresetName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        if (!newPresetName.trim()) return;
        saveCurrentAsPreset(newPresetName.trim());
        setNewPresetName('');
        setIsSaving(false);
    };

    const handleLoad = (id: string, name: string) => {
        gmConfirm(t('map.presets.confirmLoad', { name, defaultValue: `Charger la configuration "${name}" ?\nCela remplacera l'état actuel de la carte.` }), () => {
            loadPreset(id);
        });
    };

    const handleDelete = (id: string, name: string) => {
        gmConfirm(t('map.presets.confirmDelete', { name, defaultValue: `Supprimer le preset "${name}" ?` }), () => {
            deletePreset(id);
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Quick Save Section */}
            <div className="bg-app-bg/40 border border-app-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('map.presets.new')}</span>
                    {!isSaving && (
                        <button 
                            onClick={() => {
                                setIsSaving(true);
                                setNewPresetName(mapName || t('map.presets.new'));
                            }}
                            className="bg-accent/10 hover:bg-accent/20 text-accent p-1.5 rounded-lg transition-all flex items-center gap-2"
                        >
                            <Save size={14} />
                            <span className="text-[9px] font-bold uppercase">{t('map.presets.saveState')}</span>
                        </button>
                    )}
                </div>

                {isSaving && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                        <input
                            autoFocus
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder={t('map.presets.placeholder')}
                            className="w-full bg-app-bg border border-accent/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') setIsSaving(false);
                            }}
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={handleSave}
                                className="flex-1 bg-accent text-slate-900 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-white transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={14} />
                                {t('map.presets.confirm')}
                            </button>
                            <button 
                                onClick={() => setIsSaving(false)}
                                title={t('map.presets.cancel')}
                                className="px-3 py-1.5 bg-app-surface border border-app-border rounded-lg text-slate-400 hover:text-white transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Presets List */}
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {mapPresets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-app-border rounded-xl opacity-40">
                        <FolderOpen size={32} className="mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-tight text-center">{t('map.presets.empty')}</p>
                    </div>
                ) : (
                    mapPresets.map(preset => (
                        <div 
                            key={preset.id}
                            className="group bg-app-bg/20 border border-app-border hover:border-accent/30 rounded-xl p-3 transition-all flex flex-col gap-2 relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
                                        <MapIcon size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 truncate uppercase tracking-tight">
                                        {preset.name}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleDelete(preset.id, preset.name)}
                                    title={t('map.presets.delete')}
                                    className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                                        <Check size={10} className="text-gm-emerald" />
                                        <span>{t('map.presets.count.tokens', { count: preset.tokens.length, defaultValue: `${preset.tokens.length} Pions` })}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                                        <Check size={10} className="text-rose-500" />
                                        <span>{t('map.presets.count.zones', { count: preset.dangerZones.length, defaultValue: `${preset.dangerZones.length} Zones` })}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleLoad(preset.id, preset.name)}
                                    className="bg-app-surface hover:bg-accent text-slate-300 hover:text-slate-900 px-3 py-1 rounded-lg border border-app-border hover:border-accent text-[9px] font-black uppercase tracking-widest transition-all"
                                >
                                    {t('map.presets.load')}
                                </button>
                            </div>
                            
                            {/* Visual Hint of the map name if available */}
                            {preset.mapName && (
                                <div className="text-[8px] text-slate-600 italic truncate mt-1 border-t border-app-border/30 pt-1">
                                    {t('map.presets.mapLabel')} : {preset.mapName}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <p className="text-[9px] text-slate-500 italic px-2">
                {t('map.presets.note')}
            </p>
        </div>
    );
};

export default MapPresetGallery;
