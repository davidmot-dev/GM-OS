import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { SheetField } from '../../../data/defaultSheetTemplates';
import { Save, CheckSquare, Square, FolderOpen, Layers, FileText, Trash2, Lock, BookOpen, Eye, Heart } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';
import { gmToast } from '../../../stores/useToastStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaStore } from '../../../stores/useMediaStore';

// --- Sub-components ---

const FieldGauge: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => (
    <div className="group space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{field.label}</label>
            <span className="text-[10px] font-black text-accent font-mono">{value}%</span>
        </div>
        <div className="relative h-2 bg-app-bg rounded-full overflow-hidden border border-app-border/40">
            <div
                className="absolute inset-y-0 left-0 bg-accent transition-all duration-300"
                style={{ width: `${value}%` }}
            />
            <input
                type="range" min={0} max={100} step={1} value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
            />
        </div>
    </div>
);

const FieldNumber: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => (
    <div className="flex items-center justify-between p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{field.label}</label>
        <input
            type="number"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-16 bg-app-surface text-app-text text-center font-mono text-sm font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
    </div>
);

const FieldText: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
}> = ({ field, value, onChange }) => (
    <div className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 w-28 flex-shrink-0">{field.label}</label>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-transparent text-app-text text-sm font-medium focus:outline-none border-b border-app-border focus:border-accent/50 transition-colors pb-0.5"
        />
    </div>
);

const FieldCheckbox: React.FC<{
    field: SheetField;
    value: boolean;
    onChange: (val: boolean) => void;
}> = ({ field, value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40 w-full hover:border-accent/20 transition-all"
    >
        {value ? <CheckSquare size={16} className="text-accent flex-shrink-0" /> : <Square size={16} className="text-app-text/20 flex-shrink-0" />}
        <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 cursor-pointer">{field.label}</label>
    </button>
);

// --- Main Component ---

const CharacterSheetEditor: React.FC = () => {
    const {
        players, selectedPlayerId, selectedCharacterId,
        customSheetTemplates, updateCharacterSheetData, updateCharacterVisuals, updateCharacterNarrative,
        updateCharacterHP
    } = useSessionOSStore();
    const { mediaList, getMediaBlob } = useMediaStore();

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    const character = selectedPlayer?.characters.find(c => c.id === selectedCharacterId);

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const template = allTemplates.find(t => t.id === character?.templateId) ?? allTemplates.find(t => t.id === 'generic')!;

    // Compute default data from template, merged with saved sheetData
    const getInitialData = (): Record<string, string | number | boolean> => {
        if (!character || !template) return {};
        const out: Record<string, string | number | boolean> = {};
        for (const section of template.sections) {
            for (const field of section.fields) {
                out[field.id] = character.sheetData?.[field.id] ?? field.defaultValue;
            }
        }
        return out;
    };

    const [localData, setLocalData] = useState<Record<string, string | number | boolean>>(getInitialData);
    const [saved, setSaved] = useState(false);
    const [mediaBrowserTarget, setMediaBrowserTarget] = useState<'portrait' | 'token' | 'document' | null>(null);
    const [description, setDescription] = useState(character?.description ?? '');
    const [gmNotes, setGmNotes] = useState(character?.gmNotes ?? '');

    const portraitUrl = useMediaUrl(character?.portraitUrl);
    const tokenUrl = useMediaUrl(character?.tokenUrl);

    if (!character || !template) return null;

    const getValue = (fieldId: string, defaultValue: number | string | boolean) => {
        return localData[fieldId] ?? defaultValue;
    };

    const updateLocal = (fieldId: string, value: string | number | boolean) => {
        setSaved(false);
        setLocalData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = () => {
        if (!selectedPlayer) return;
        // Save sheet data
        for (const [fieldId, value] of Object.entries(localData)) {
            updateCharacterSheetData(selectedPlayer.id, character.id, fieldId, value);
        }
        // Save narrative fields
        updateCharacterNarrative(selectedPlayer.id, character.id, { description, gmNotes });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleMediaSelect = (mediaId: string) => {
        if (!selectedPlayer || !mediaBrowserTarget) return;
        if (mediaBrowserTarget === 'document') {
            const current = character.linkedDocumentIds ?? [];
            if (!current.includes(mediaId)) {
                updateCharacterNarrative(selectedPlayer.id, character.id, {
                    linkedDocumentIds: [...current, mediaId]
                });
            }
            setMediaBrowserTarget(null);
            return;
        }
        updateCharacterVisuals(selectedPlayer.id, character.id, {
            [mediaBrowserTarget === 'portrait' ? 'portraitUrl' : 'tokenUrl']: mediaId,
        });
        setMediaBrowserTarget(null);
    };

    const handleRemoveDocument = (docId: string) => {
        if (!selectedPlayer) return;
        const current = character.linkedDocumentIds ?? [];
        updateCharacterNarrative(selectedPlayer.id, character.id, {
            linkedDocumentIds: current.filter(id => id !== docId)
        });
    };

    const openDocument = async (docId: string) => {
        const blob = await getMediaBlob(docId);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    // Separate gauge fields from other fields for layout
    const gaugeFields = (section: typeof template.sections[0]) => section.fields.filter(f => f.type === 'gauge');
    const otherFields = (section: typeof template.sections[0]) => section.fields.filter(f => f.type !== 'gauge');

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Media Browser */}
            <MediaBrowser
                isOpen={mediaBrowserTarget !== null}
                onClose={() => setMediaBrowserTarget(null)}
                onSelect={handleMediaSelect}
                allowedTypes={mediaBrowserTarget === 'document' ? ['document'] : ['image']}
                title={
                    mediaBrowserTarget === 'portrait' ? 'Choisir un portrait' : 
                    mediaBrowserTarget === 'token' ? 'Choisir un token' : 
                    'Lier un document'
                }
            />

            {/* Save Bar */}
            <div className="flex items-center justify-between px-8 py-3 border-b border-app-border bg-app-bg/60 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.emoji}</span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-app-text/40">{template.name}</p>
                        <p className="text-[10px] text-app-text/20">Fiche de {character.name}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-black text-xs tracking-widest transition-all ${
                        saved
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-accent hover:opacity-90 text-app-bg shadow-lg shadow-accent/20 hover:scale-105 active:scale-95'
                    }`}
                >
                    <Save size={14} />
                    {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto p-8 grid grid-cols-12 gap-8">

                    {/* Left Col: Visuals */}
                    <div className="col-span-3 space-y-5">

                        {/* Portrait */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-app-text/40 mb-2">Portrait</p>
                            <div
                                className="aspect-[3/4] rounded-2xl overflow-hidden bg-app-bg border border-app-border shadow-2xl relative group cursor-pointer"
                                onClick={() => setMediaBrowserTarget('portrait')}
                            >
                                {portraitUrl ? (
                                    <img src={portraitUrl} alt={character.name} className="w-full h-full object-cover object-top" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-app-text/20">
                                        <FolderOpen size={32} />
                                    </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-app-bg/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4">
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMediaBrowserTarget('portrait');
                                        }}
                                        className="flex flex-col items-center gap-1 hover:text-accent transition-colors text-app-text/40"
                                    >
                                        <FolderOpen size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Changer</span>
                                    </div>
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (character.portraitUrl) {
                                                useImageStore.getState().projectUrl(character.portraitUrl);
                                                gmToast(`Image de ${character.name} projetée !`);
                                            }
                                        }}
                                        className="flex flex-col items-center gap-1 hover:text-accent transition-colors text-app-text/40"
                                    >
                                        <Eye size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Projeter</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Token */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-app-text/40 mb-2 flex items-center gap-1.5">
                                <Layers size={10} /> Token (Map / Combat)
                            </p>
                            <div
                                className="w-full aspect-square rounded-2xl overflow-hidden bg-app-bg border-2 border-dashed border-app-border hover:border-accent/50 relative group cursor-pointer transition-all flex items-center justify-center"
                                onClick={() => setMediaBrowserTarget('token')}
                            >
                                {tokenUrl ? (
                                    <img src={tokenUrl} alt="Token" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-app-text/20 group-hover:text-accent/60 transition-colors">
                                        <Layers size={28} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Pas de token</span>
                                    </div>
                                )}
                                {tokenUrl && (
                                    <div className="absolute inset-0 bg-app-bg/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                        <FolderOpen size={20} className="text-accent" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-accent">Changer</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[9px] text-app-text/20 mt-1.5 text-center">Utilisé dans Map-OS et Combat-OS</p>
                        </div>

                        {/* Identity */}
                        <div className="space-y-1 text-center">
                            <h2 className="text-lg font-black text-app-text">{character.name}</h2>
                            <p className="text-xs text-app-text/40 italic">{character.classRace}</p>
                        </div>

                        {/* HP quick control */}
                        <div className="p-4 bg-app-bg/60 border border-accent/20 rounded-xl space-y-3 shadow-lg shadow-red-500/5">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-accent">Vigueur (PV)</span>
                                <Heart size={12} className="text-red-500 animate-pulse" />
                            </div>
                            
                                <div className="flex items-center justify-center gap-1.5 bg-app-bg/40 py-1.5 rounded-lg border border-app-border/40">
                                    <input 
                                        type="number" 
                                        value={character.hp}
                                        onChange={(e) => updateCharacterHP(selectedPlayerId!, character.id, parseInt(e.target.value) || 0)}
                                        className="w-14 bg-transparent text-center text-app-text font-black text-xs focus:outline-none"
                                    />
                                    <span className="text-app-text/20 font-bold text-xs">/</span>
                                    <input 
                                        type="number" 
                                        value={character.maxHp}
                                        onChange={() => {
                                            // Still no easy maxHp update exposed here without significant refactor
                                        }}
                                        className="w-14 bg-transparent text-center text-app-text/40 font-black text-xs focus:outline-none"
                                    />
                                </div>
                            
                            <div className="w-full bg-app-bg h-1.5 rounded-full overflow-hidden border border-app-border/40 ring-1 ring-white/5 p-[1px]">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${character.hp / character.maxHp > 0.6 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : character.hp / character.maxHp > 0.3 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-700 to-rose-500'}`}
                                    style={{ width: `${Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100))}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Sheet Sections */}
                    <div className="col-span-9 space-y-6">
                        {template.sections.map(section => {
                            const gauges = gaugeFields(section);
                            const others = otherFields(section);
                            return (
                                <div key={section.id} className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/20 pb-2">{section.label}</h3>

                                    {/* Gauges: 2-column grid */}
                                    {gauges.length > 0 && (
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                            {gauges.map(field => (
                                                <FieldGauge
                                                    key={field.id}
                                                    field={field}
                                                    value={Number(getValue(field.id, field.defaultValue))}
                                                    onChange={val => updateLocal(field.id, val)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Other fields */}
                                    {others.length > 0 && (
                                        <div className="space-y-2">
                                            {others.map(field => {
                                                const val = getValue(field.id, field.defaultValue);
                                                if (field.type === 'number') return (
                                                    <FieldNumber key={field.id} field={field} value={Number(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'text') return (
                                                    <FieldText key={field.id} field={field} value={String(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                if (field.type === 'checkbox') return (
                                                    <FieldCheckbox key={field.id} field={field} value={Boolean(val)} onChange={v => updateLocal(field.id, v)} />
                                                );
                                                return null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* === UNIVERSAL SECTIONS (always visible) === */}

                    {/* Description */}
                    <div className="col-span-9 border-t border-app-border pt-6 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/20 pb-2 flex items-center gap-2">
                            <BookOpen size={12} /> Description
                        </h3>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Description du personnage — visible par les joueurs…"
                            className="w-full bg-app-bg/40 border border-app-border rounded-xl p-4 text-sm text-app-text placeholder-app-text/20 resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/20 transition-all leading-relaxed"
                        />
                    </div>

                    {/* GM Notes */}
                    <div className="col-span-9 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 border-b border-amber-500/20 pb-2 flex items-center gap-2">
                            <Lock size={12} /> Notes du MJ
                            <span className="ml-auto text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full normal-case tracking-normal font-bold">Privé</span>
                        </h3>
                        <textarea
                            value={gmNotes}
                            onChange={e => setGmNotes(e.target.value)}
                            rows={4}
                            placeholder="Notes secrètes du MJ — jamais visible par les joueurs…"
                            className="w-full bg-amber-950/10 border border-amber-500/10 rounded-xl p-4 text-sm text-app-text placeholder-app-text/20 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/20 transition-all leading-relaxed"
                        />
                    </div>

                    {/* Linked Documents */}
                    <div className="col-span-9 space-y-3">
                        <div className="flex items-center justify-between border-b border-accent/20 pb-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                                <FileText size={12} /> Documents Liés
                            </h3>
                            <button
                                onClick={() => setMediaBrowserTarget('document')}
                                className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-all"
                            >
                                + Lier un document
                            </button>
                        </div>
                        {(character.linkedDocumentIds ?? []).length === 0 ? (
                            <div
                                onClick={() => setMediaBrowserTarget('document')}
                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-app-border hover:border-accent/30 cursor-pointer transition-all group"
                            >
                                <FileText size={24} className="text-app-text/20 group-hover:text-accent/50 transition-colors" />
                                <p className="text-xs text-app-text/20 group-hover:text-app-text/40 transition-colors">Cliquez pour lier un PDF, Word, etc. depuis le Media Hub</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {(character.linkedDocumentIds ?? []).map(docId => {
                                    const media = mediaList.find(m => m.id === docId);
                                    const ext = media?.name.split('.').pop()?.toUpperCase() ?? '?';
                                    return (
                                        <div key={docId} className="flex items-center gap-3 px-4 py-2.5 bg-app-bg/40 border border-app-border/40 rounded-xl hover:border-app-border/60 transition-all group">
                                            <FileText size={14} className="text-emerald-400 flex-shrink-0" />
                                            <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{ext}</span>
                                            <button
                                                onClick={() => openDocument(docId)}
                                                className="flex-1 text-left text-sm text-app-text/80 hover:text-app-text transition-colors truncate"
                                            >
                                                {media?.name ?? docId}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveDocument(docId)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-app-text/20 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CharacterSheetEditor;
