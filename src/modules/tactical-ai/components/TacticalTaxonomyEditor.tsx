import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Plus, Trash2, Undo2, Hash, Zap, Palette, Music, 
    ArrowRight, Search, LayoutList, Sliders, ChevronRight
} from 'lucide-react';
import { useTaxonomyStore } from '../useTaxonomyStore';
import type { TaxonomyMapping } from '../useTaxonomyStore';

export const TacticalTaxonomyEditor: React.FC = () => {
    const { t } = useTranslation('settings');
    const { mappings, addMapping, updateMapping, removeMapping, resetToDefault, ensureRangeRules } = useTaxonomyStore();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [soundFiles, setSoundFiles] = useState<string[]>([]);

    React.useEffect(() => {
        ensureRangeRules();
        
        // Load dynamic sound assets
        if (window.appBridge?.tactical?.listSounds) {
            window.appBridge.tactical.listSounds().then(setSoundFiles).catch(console.error);
        }
    }, [ensureRangeRules]);

    const filteredMappingsWithIndexes = mappings.map((m, i) => ({ ...m, originalIndex: i }))
        .filter(m => 
            m.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
            m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    // Grouping logic
    const groups = [
        { id: 'range', label: t('tactical.taxonomy.categories.ranges'), icon: ArrowRight },
        { id: 'status', label: t('tactical.taxonomy.categories.status'), icon: Hash },
        { id: 'element', label: t('tactical.taxonomy.categories.elements'), icon: Zap },
        { id: 'custom', label: t('tactical.taxonomy.categories.others'), icon: LayoutList }
    ];

    const getGroupForResult = (m: TaxonomyMapping) => {
        if (m.tags.includes('range')) return 'range';
        if (m.tags.includes('status')) return 'status';
        if (m.tags.includes('fire') || m.tags.includes('ice') || m.tags.includes('lightning') || m.tags.includes('acid')) return 'element';
        return 'custom';
    };

    const selectedMapping = selectedIndex !== null ? mappings[selectedIndex] : null;

    const handleAdd = () => {
        const newMapping: TaxonomyMapping = {
            keywords: ["nouveau"],
            tags: ["custom"],
            intensity: 0.5,
            hardware: { scene: "Custom", color: "#00ffff", priority: 2 }
        };
        addMapping(newMapping);
        setSelectedIndex(mappings.length);
    };

    const handleUpdate = <K extends keyof TaxonomyMapping>(field: K, value: TaxonomyMapping[K]) => {
        if (selectedIndex === null || !selectedMapping) return;
        updateMapping(selectedIndex, { ...selectedMapping, [field]: value });
    };

    const handleUpdateNested = <P extends 'hardware' | 'audio'>(
        parent: P, 
        field: string, 
        value: string | number
    ) => {
        if (selectedIndex === null || !selectedMapping) return;
        const currentParent = selectedMapping[parent] || {};
        updateMapping(selectedIndex, { 
            ...selectedMapping, 
            [parent]: { ...currentParent, [field]: value } 
        });
    };

    const handleKeywordAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim() && selectedMapping) {
            const val = e.currentTarget.value.trim().toLowerCase();
            if (!selectedMapping.keywords.includes(val)) {
                handleUpdate('keywords', [...selectedMapping.keywords, val]);
            }
            e.currentTarget.value = '';
        }
    };

    const handleKeywordRemove = (keyword: string) => {
        if (!selectedMapping) return;
        handleUpdate('keywords', selectedMapping.keywords.filter(k => k !== keyword));
    };

    const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim() && selectedMapping) {
            const val = e.currentTarget.value.trim().toLowerCase();
            if (!selectedMapping.tags.includes(val)) {
                handleUpdate('tags', [...selectedMapping.tags, val]);
            }
            e.currentTarget.value = '';
        }
    };

    const handleTagRemove = (tag: string) => {
        if (!selectedMapping) return;
        handleUpdate('tags', selectedMapping.tags.filter(t => t !== tag));
    };

    return (
        <div className="flex h-full animate-in fade-in duration-500">
            {/* Left Column: List */}
            <div className="w-80 border-r border-app-border/10 flex flex-col bg-app-surface/20">
                <div className="p-4 border-b border-app-border/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-app-text/60">
                            <LayoutList size={16} />
                            <span className="text-ui-10 font-black uppercase tracking-widest">{t('settings:sections.rules') || 'Règles'} ({mappings.length})</span>
                        </div>
                        <button 
                            onClick={handleAdd}
                            className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all shadow-glow-accent/5"
                            title={t('tactical.taxonomy.add_rule')}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/30" />
                        <input 
                            type="text"
                            placeholder={t('tactical.taxonomy.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-app-bg/50 border border-app-border/30 rounded-lg py-2 pl-9 pr-4 text-xs font-bold outline-none focus:border-accent/50 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6">
                    {groups.map((group) => {
                        const items = filteredMappingsWithIndexes.filter(m => getGroupForResult(m) === group.id);
                        if (items.length === 0) return null;

                        return (
                            <div key={group.id} className="space-y-2">
                                <div className="px-2 flex items-center gap-2 opacity-30">
                                    <group.icon size={10} />
                                    <span className="text-ui-9 font-black uppercase tracking-widest">{group.label}</span>
                                </div>
                                <div className="space-y-1">
                                    {items.map((m) => (
                                        <button
                                            key={m.originalIndex}
                                            onClick={() => setSelectedIndex(m.originalIndex)}
                                            className={`w-full group text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedIndex === m.originalIndex 
                                                ? 'bg-accent/10 border-accent/40 shadow-glow-accent/10' 
                                                : 'bg-transparent border-transparent hover:bg-app-surface/40 hover:border-app-border/40'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="size-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: m.hardware?.color || '#3b82f6' }} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-ui-11 font-black uppercase truncate ${selectedIndex === m.originalIndex ? 'text-accent' : 'text-app-text/80'}`}>
                                                        {m.keywords[0]}
                                                    </span>
                                                    <span className="text-ui-9 font-bold text-app-text/30 uppercase tracking-tighter truncate">
                                                        {m.tags.join(' • ')}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className={`shrink-0 transition-transform ${selectedIndex === m.originalIndex ? 'translate-x-1 text-accent' : 'opacity-0 group-hover:opacity-40 group-hover:translate-x-0.5'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-app-border/10">
                    <button 
                        onClick={() => {
                            if(confirm(t('tactical.taxonomy.confirm_reset') || "Réinitialiser ?")) resetToDefault();
                        }}
                        className="w-full py-2 flex items-center justify-center gap-2 text-ui-10 font-black uppercase tracking-widest text-app-text/40 hover:text-red-500 transition-colors"
                    >
                        <Undo2 size={14} />
                        {t('tactical.taxonomy.reset')}
                    </button>
                </div>
            </div>

            {/* Right Column: Editor */}
            <div className="flex-1 bg-app-surface/10 overflow-y-auto custom-scrollbar p-8">
                {selectedMapping ? (
                    <div className="max-w-2xl space-y-10 animate-in slide-in-from-right-4 duration-500">
                        {/* Header Header */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-app-text">
                                    {selectedMapping.keywords[0]}
                                </h3>
                                <p className="text-ui-10 font-bold uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                                    <Zap size={12} className="text-accent" /> {t('tactical.taxonomy.editor.title')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if(confirm(t('tactical.taxonomy.confirm_delete') || "Supprimer ?")) {
                                        removeMapping(selectedIndex!);
                                        setSelectedIndex(null);
                                    }
                                }}
                                className="p-3 rounded-xl bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                            {/* Left Forms */}
                            <div className="space-y-8">
                                {/* Keywords */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-app-text/60">
                                        <Hash size={16} />
                                        <span className="text-ui-10 font-black uppercase tracking-widest">{t('tactical.taxonomy.editor.trigger_keywords')}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMapping.keywords.map(k => (
                                            <span key={k} className="px-2 py-1 rounded bg-app-bg/50 border border-app-border/40 text-ui-10 font-bold text-accent uppercase flex items-center gap-1.5 group">
                                                {k}
                                                <button onClick={() => handleKeywordRemove(k)} className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        <input 
                                            type="text"
                                            placeholder="..."
                                            onKeyDown={handleKeywordAdd}
                                            className="bg-transparent border-none p-0 text-ui-10 font-bold text-app-text/40 outline-none w-16"
                                        />
                                    </div>
                                </section>

                                {/* Tags */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-app-text/60">
                                        <ArrowRight size={16} />
                                        <span className="text-ui-10 font-black uppercase tracking-widest">{t('tactical.taxonomy.editor.categories_tags')}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMapping.tags.map(t => (
                                            <span key={t} className="px-2 py-1 rounded bg-app-surface/40 border border-emerald-500/20 text-ui-10 font-bold text-emerald-500 uppercase flex items-center gap-1.5 group">
                                                {t}
                                                <button onClick={() => handleTagRemove(t)} className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        <input 
                                            type="text"
                                            placeholder="..."
                                            onKeyDown={handleTagAdd}
                                            className="bg-transparent border-none p-0 text-ui-10 font-bold text-app-text/40 outline-none w-16"
                                        />
                                    </div>
                                </section>

                                {/* Intensity Slider */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-app-text/60">
                                            <Sliders size={16} />
                                            <span className="text-ui-10 font-black uppercase tracking-widest">{t('tactical.taxonomy.editor.global_intensity')}</span>
                                        </div>
                                        <span className="text-xs font-mono font-black text-accent">{Math.round(selectedMapping.intensity * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={selectedMapping.intensity}
                                        onChange={(e) => handleUpdate('intensity', parseFloat(e.target.value))}
                                        className="w-full accent-accent h-1.5 bg-app-bg rounded-lg appearance-none cursor-pointer"
                                    />
                                </section>
                            </div>

                            {/* Right Forms */}
                            <div className="space-y-8">
                                {/* Hardware / Color */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-app-text/60">
                                        <Palette size={16} />
                                        <span className="text-ui-10 font-black uppercase tracking-widest">{t('tactical.taxonomy.editor.hardware_alerts')}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-app-bg/50 border border-app-border/40 space-y-4 shadow-xl">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-ui-10 font-bold uppercase tracking-widest text-app-text/30">{t('tactical.taxonomy.editor.alert_color')}</p>
                                                <p className="text-xs font-black font-mono text-app-text/60 uppercase">{selectedMapping.hardware?.color || '#000000'}</p>
                                            </div>
                                            <input 
                                                type="color"
                                                value={selectedMapping.hardware?.color || '#3b82f6'}
                                                onChange={(e) => handleUpdateNested('hardware', 'color', e.target.value)}
                                                className="size-12 rounded-xl bg-transparent border-2 border-app-border/50 cursor-pointer p-1"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-ui-10 font-bold uppercase tracking-widest text-app-text/30">{t('tactical.taxonomy.editor.scene_name')}</p>
                                            <input 
                                                type="text"
                                                value={selectedMapping.hardware?.scene || ''}
                                                onChange={(e) => handleUpdateNested('hardware', 'scene', e.target.value)}
                                                className="w-full bg-app-surface/40 border border-app-border/20 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-ui-10 font-bold uppercase tracking-widest text-app-text/30">{t('tactical.taxonomy.editor.priority_label')}</p>
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3].map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => handleUpdateNested('hardware', 'priority', p)}
                                                        className={`size-8 rounded-lg font-black text-xs transition-all ${selectedMapping.hardware?.priority === p 
                                                            ? 'bg-accent text-app-bg shadow-glow-accent/30' 
                                                            : 'bg-app-surface/40 text-app-text/40 hover:text-app-text'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Audio */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-app-text/60">
                                        <Music size={16} />
                                        <span className="text-ui-10 font-black uppercase tracking-widest">{t('tactical.taxonomy.editor.audio_echoes')}</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-ui-10 font-bold uppercase tracking-widest text-app-text/30">{t('tactical.taxonomy.editor.sound_effect')}</p>
                                            <select 
                                                value={selectedMapping.audio?.effect || ''}
                                                onChange={(e) => handleUpdateNested('audio', 'effect', e.target.value)}
                                                className="w-full bg-app-bg/50 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold text-accent outline-none"
                                            >
                                                <option value="" className="bg-app-bg text-app-text/40">{t('tactical.taxonomy.editor.none')}</option>
                                                {soundFiles.map(file => (
                                                    <option key={file} value={file} className="bg-app-bg text-white">
                                                        {file.replace(/\.(mp3|wav|ogg|m4a)$/i, '').replace(/_/g, ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-ui-10 font-bold uppercase tracking-widest text-app-text/30">{t('tactical.taxonomy.editor.contextual_ambiance')}</p>
                                            <select 
                                                value={selectedMapping.ambientSceneId || ''}
                                                onChange={(e) => handleUpdate('ambientSceneId', e.target.value)}
                                                className="w-full bg-app-bg/50 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold text-GM-Gold outline-none"
                                            >
                                                <option value="" className="bg-app-bg text-app-text/40">{t('tactical.taxonomy.editor.default_silence')}</option>
                                                <option value="scene-action" className="bg-app-bg text-red-500">{t('tactical.taxonomy.editor.intense_action')}</option>
                                                <option value="scene-tension" className="bg-app-bg text-amber-500">{t('tactical.taxonomy.editor.heavy_tension')}</option>
                                                <option value="scene-mystery" className="bg-app-bg text-purple-500">{t('tactical.taxonomy.editor.ethereal_mystery')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 hover:opacity-40 transition-opacity">
                        <div className="size-24 rounded-full border-4 border-dashed border-app-text/40 flex items-center justify-center">
                            <Zap size={48} />
                        </div>
                        <div>
                            <p className="text-xl font-black uppercase tracking-tighter">{t('tactical.taxonomy.engine_label')}</p>
                            <p className="text-xs font-bold uppercase tracking-widest">{t('tactical.taxonomy.select_rule_hint')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
