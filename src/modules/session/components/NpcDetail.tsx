import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Swords, MapPin, Monitor, Heart, Shield, Wind, Zap, Lock, BookOpen, ArrowLeft, Edit2, CheckCircle, Image as ImageIcon, MessageSquare, Compass, Send, Trash2, XCircle, MoreVertical, Map, Info, Sparkles, Layers } from 'lucide-react';
import { DEFAULT_SHEET_TEMPLATES, type SheetField } from '../../../data/defaultSheetTemplates';
import { useMapStore } from '../../map/useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useImageStore } from '../../image/useImageStore';
import { gmToast } from '../../../stores/useToastStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useModalStore } from '../../../stores/useModalStore';
import { ResolvedImage } from '../../../components/ResolvedImage';

// --- Sub-components (Reused or adapted from CharacterSheetEditor) ---
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
        className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40 w-full hover:border-accent/20 transition-all flex-shrink-0"
    >
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${value ? 'bg-accent border-accent' : 'border-app-text/20'}`}>
            {value && <CheckCircle size={10} className="text-white" />}
        </div>
        <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 cursor-pointer">{field.label}</label>
    </button>
);

interface NpcDetailProps {
    embeddedId?: string;
}

const NpcDetail: React.FC<NpcDetailProps> = ({ embeddedId }) => {
    const { entities, selectedEntityId, setSelectedEntity, updateEntity, atlasMaps } = useSessionOSStore();
    const { closeModal } = useModalStore();
    const { addToken } = useMapStore();

    const currentId = embeddedId || selectedEntityId;
    const [isEditing, setIsEditing] = useState(false);
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);

    const selectedNpc = entities.find(e => e.id === currentId);

    const handleClose = () => {
        if (embeddedId) {
            closeModal();
        } else {
            setSelectedEntity(null);
        }
    };

    if (!selectedNpc) {
        return (
            <div className="flex-1 flex items-center justify-center bg-app-bg/20 text-app-text/20 italic text-sm p-20">
                Sélectionnez un PNJ pour afficher ses détails
            </div>
        );
    }

    const handleSendToMap = () => {
        const { selectedAtlasMapId } = useSessionOSStore.getState();
        
        // 1. Add visual token to Map-OS
        addToken({
            name: selectedNpc.name,
            avatar: selectedNpc.avatar,
            x: 200, // Move away from corner
            y: 200,
            size: 1,
        });

        // 2. Link NPC to the active Atlas map if we have one
        const linkedMapIds = selectedNpc.linkedMapIds || [];
        if (selectedAtlasMapId && !linkedMapIds.includes(selectedAtlasMapId)) {
            updateEntity(selectedNpc.id, {
                linkedMapIds: [...linkedMapIds, selectedAtlasMapId]
            });
        }

        gmToast(`${selectedNpc.name} placé sur la carte`);
    };

    const handleAddToCombat = () => {
        useCombatStore.getState().addCombatant({
            name: selectedNpc.name,
            init: selectedNpc.initiative,
            hp: selectedNpc.hp,
            hpMax: selectedNpc.maxHp,
            avatar: selectedNpc.avatar,
            isPlayer: false,
            sourceEntityId: selectedNpc.id,
            statuses: []
        });
        gmToast(`${selectedNpc.name} ajouté au combat !`);
    };

    const linkedMaps = atlasMaps.filter(m => (selectedNpc.linkedMapIds || []).includes(m.id));

    return (
        <div className="flex-1 h-full bg-app-bg/60 p-12 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={handleClose}
                    className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-text/40 hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    {embeddedId ? 'Fermer' : 'Retour à la Galerie'}
                </button>

                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all font-bold text-sm uppercase tracking-widest ${
                        isEditing 
                        ? 'bg-accent text-white border-accent shadow-glow-accent' 
                        : 'bg-app-surface border-app-border text-app-text/40 hover:text-white hover:border-white/30'
                    }`}
                >
                    {isEditing ? <CheckCircle size={18} /> : <Edit2 size={18} />}
                    {isEditing ? 'Terminer l\'édition' : 'Editer la fiche'}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-12 flex-1 overflow-hidden">

                {/* Left Col: Cinematic Portrait */}
                <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col gap-6">
                    <div 
                        className={`aspect-[4/5] rounded-3xl overflow-hidden border-2 shadow-2xl relative group bg-app-surface transition-all ${
                            isEditing ? 'border-accent cursor-pointer hover:shadow-glow-accent' : 'border-app-border/20 shadow-accent/5'
                        }`}
                        onClick={() => isEditing && setIsMediaBrowserOpen(true)}
                    >
                        <div className="absolute inset-0">
                            <ResolvedImage
                                src={selectedNpc.avatar}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110"
                            />
                            <ResolvedImage
                                src={selectedNpc.avatar}
                                alt={selectedNpc.name}
                                className="relative z-10 w-full h-full object-contain"
                            />
                        </div>
                        {isEditing ? (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon size={48} className="text-white" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-t from-app-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>

                    {/* Status Badge */}
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1">Vigueur & État</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['alive', 'injured', 'dead', 'unknown'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateEntity(selectedNpc.id, { status: s })}
                                        className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                            selectedNpc.status === s 
                                            ? 'bg-white text-app-bg border-white' 
                                            : 'bg-app-surface border-app-border text-app-text/40 hover:border-app-border/60'
                                        }`}
                                    >
                                        {s === 'alive' ? 'Vivant' : s === 'injured' ? 'Blessé' : s === 'dead' ? 'Mort' : 'Inconnu'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-app-surface/50 border border-app-border">
                            <div className={`w-2 h-2 rounded-full ${
                                selectedNpc.status === 'alive' ? 'bg-emerald-500' : 
                                selectedNpc.status === 'injured' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                                selectedNpc.status === 'dead' ? 'bg-red-500' : 'bg-app-text/40'}`} 
                            />
                            <span className="text-[10px] uppercase font-black tracking-widest text-app-text/60">
                                {selectedNpc.status === 'alive' ? 'Vivant' : 
                                 selectedNpc.status === 'injured' ? 'Blessé' :
                                 selectedNpc.status === 'dead' ? 'Mort' : 'Statut Inconnu'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Col: Stats & Lore */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        {isEditing ? (
                            <>
                                <input 
                                    type="text"
                                    value={selectedNpc.name}
                                    onChange={(e) => updateEntity(selectedNpc.id, { name: e.target.value })}
                                    className="bg-app-surface/50 border border-accent/30 rounded-xl px-4 py-2 text-2xl font-black text-white focus:outline-none focus:border-accent transition-all"
                                />
                                <input 
                                    type="text"
                                    value={selectedNpc.description}
                                    onChange={(e) => updateEntity(selectedNpc.id, { description: e.target.value })}
                                    className="bg-app-surface/30 border border-app-border rounded-lg px-4 py-1.5 text-sm text-app-text/60 focus:outline-none focus:border-app-border/60 transition-all font-medium italic"
                                />
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl font-display font-black text-accent leading-tight tracking-tight mb-1">
                                    {selectedNpc.name}
                                </h2>
                                <p className="text-app-text/40 text-sm font-medium italic">{selectedNpc.description}</p>
                            </>
                        )}
                                       {/* Stats Grid - Dynamic based on Game Driver */}
                    <div className={`grid gap-3 ${isEditing ? 'grid-cols-1' : 'grid-cols-4'}`}>
                        {(() => {
                            const { getActiveDriver } = useSessionOSStore.getState();
                            const driver = getActiveDriver();
                            const statsToTrack = driver?.combat.statsToTrack || [];
                            
                            if (isEditing) {
                                return (
                                    <>
                                        {/* Type & Role Selectors (keeping them in editing mode for layout) */}
                                        <div className="grid grid-cols-2 gap-4 mb-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1">Type d'entité</label>
                                                <div className="flex gap-2">
                                                    {(['pc', 'npc', 'monster'] as const).map(t => (
                                                        <button
                                                            key={t}
                                                            onClick={() => updateEntity(selectedNpc.id, { type: t })}
                                                            className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                                                                selectedNpc.type === t ? 'bg-accent text-white border-accent' : 'bg-app-surface/40 border-app-border text-app-text/40'
                                                            }`}
                                                        >
                                                            {t === 'pc' ? 'Joueur' : t === 'npc' ? 'PNJ' : 'Monstre'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1">Rôle / Boss</label>
                                                <div className="flex gap-2">
                                                    {(['ally', 'neutral', 'hostile', 'boss'] as const).map(r => (
                                                        <button
                                                            key={r}
                                                            onClick={() => updateEntity(selectedNpc.id, { role: r })}
                                                            className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                                                                selectedNpc.role === r ? 'bg-white text-app-bg border-white' : 'bg-app-surface/40 border-app-border text-app-text/40'
                                                            }`}
                                                        >
                                                            {r === 'ally' ? 'Allié' : r === 'neutral' ? 'Neutre' : r === 'hostile' ? 'Host' : 'Boss'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Core Stats Editor */}
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="col-span-1 bg-app-surface/60 border border-accent/30 p-3 rounded-xl flex flex-col items-center justify-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Heart size={14} className="text-red-500" />
                                                    <span className="text-[9px] font-black text-accent uppercase tracking-widest">Vitalité</span>
                                                </div>
                                                <div className="flex items-center gap-1 bg-app-bg/50 px-2 py-1 rounded-lg border border-white/5">
                                                    <input 
                                                        type="number" value={selectedNpc.hp}
                                                        onChange={(e) => updateEntity(selectedNpc.id, { hp: parseInt(e.target.value) || 0 })}
                                                        className="w-10 bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                    />
                                                    <span className="text-app-text/20">/</span>
                                                    <input 
                                                        type="number" value={selectedNpc.maxHp}
                                                        onChange={(e) => updateEntity(selectedNpc.id, { maxHp: parseInt(e.target.value) || 0 })}
                                                        className="w-10 bg-transparent text-center text-app-text/40 font-black text-xs focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                                                <Shield size={14} className="text-blue-400" />
                                                <input 
                                                    type="number" value={selectedNpc.ac}
                                                    onChange={(e) => updateEntity(selectedNpc.id, { ac: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                />
                                                <span className="text-[8px] font-bold text-app-text/20 uppercase tracking-widest">Armure</span>
                                            </div>
                                            <div className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                                                <Wind size={14} className="text-emerald-400" />
                                                <input 
                                                    type="number" value={selectedNpc.speed}
                                                    onChange={(e) => updateEntity(selectedNpc.id, { speed: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                />
                                                <span className="text-[8px] font-bold text-app-text/20 uppercase tracking-widest">Vitesse</span>
                                            </div>
                                            <div className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                                                <Zap size={14} className="text-amber-400" />
                                                <input 
                                                    type="number" value={selectedNpc.initiative}
                                                    onChange={(e) => updateEntity(selectedNpc.id, { initiative: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                />
                                                <span className="text-[8px] font-bold text-app-text/20 uppercase tracking-widest">Init</span>
                                            </div>
                                        </div>
                                    </>
                                );
                            }

                            // Read-only mode: Dynamic Stats from Driver
                            if (statsToTrack.length > 0) {
                                return statsToTrack.map((stat, i) => {
                                    // Map standard fields or sheetData
                                    let val: string | number = "??";
                                    if (stat.isMainHP) val = `${selectedNpc.hp}/${selectedNpc.maxHp}`;
                                    else if (stat.fieldId === 'ac') val = selectedNpc.ac;
                                    else if (stat.fieldId === 'speed') val = `${selectedNpc.speed} ft`;
                                    else if (stat.fieldId === 'initiative') val = `+${selectedNpc.initiative}`;
                                    else val = (selectedNpc.sheetData?.[stat.fieldId] as any) ?? 0;

                                    return (
                                        <div key={i} className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent/20 transition-all">
                                            {stat.isMainHP ? <Heart size={14} className="text-red-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />}
                                            <span className="text-white font-black text-xs">{val}</span>
                                            <span className="text-[9px] uppercase font-bold text-app-text/20 tracking-wider group-hover:text-app-text/40">{stat.label}</span>
                                        </div>
                                    );
                                });
                            }

                            // Fallback to standard 4 stats if no driver or stats defined
                            return (
                                [
                                    { label: 'HP', val: `${selectedNpc.hp}/${selectedNpc.maxHp}`, icon: <Heart size={14} className="text-red-400" /> },
                                    { label: 'AC', val: selectedNpc.ac, icon: <Shield size={14} className="text-blue-400" /> },
                                    { label: 'Speed', val: `${selectedNpc.speed} ft`, icon: <Wind size={14} className="text-emerald-400" /> },
                                    { label: 'Init', val: `+${selectedNpc.initiative}`, icon: <Zap size={14} className="text-amber-400" /> },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent/20 transition-all">
                                        {stat.icon}
                                        <span className="text-white font-black text-xs">{stat.val}</span>
                                        <span className="text-[9px] uppercase font-bold text-app-text/20 tracking-wider group-hover:text-app-text/40">{stat.label}</span>
                                    </div>
                                ))
                            );
                        })()}
                    </div>
                    </div>

                    {/* Dynamic System Sheets Support */}
                    {(() => {
                        const { customSheetTemplates, updateEntitySheetData } = useSessionOSStore.getState();
                        const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates || [])];
                        
                        if (isEditing) {
                            return (
                                <div className="space-y-4 p-4 bg-app-surface/20 border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-2 px-1">
                                        <Layers size={14} className="text-accent" />
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-app-text/60">Modèle de Fiche Système</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {allTemplates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => updateEntity(selectedNpc.id, { templateId: t.id })}
                                                className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center gap-2 ${
                                                    selectedNpc.templateId === t.id 
                                                    ? 'bg-accent/10 border-accent text-accent' 
                                                    : 'bg-app-bg border-app-border text-app-text/40 hover:border-app-border/60 hover:text-app-text/60'
                                                }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${selectedNpc.templateId === t.id ? 'bg-accent shadow-[0_0_8px_rgba(var(--color-accent),0.5)]' : 'bg-app-text/20'}`} />
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        const template = allTemplates.find(t => t.id === selectedNpc.templateId);
                        if (!template || template.id === 'generic') return null;

                        return (
                            <div className="space-y-6 pt-4 border-t border-white/5 mt-4">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} className="text-accent" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">Fiche Système : {template.name}</h3>
                                </div>
                                {template.sections.map((section, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-app-text/20">{section.title}</span>
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {section.fields.map(field => {
                                                const value = selectedNpc.sheetData?.[field.id] ?? field.defaultValue;
                                                const handleChange = (val: any) => updateEntitySheetData(selectedNpc.id, field.id, val);

                                                if (field.type === 'gauge') return <FieldGauge key={field.id} field={field} value={value as number} onChange={handleChange} />;
                                                if (field.type === 'number') return <FieldNumber key={field.id} field={field} value={value as number} onChange={handleChange} />;
                                                if (field.type === 'text') return <FieldText key={field.id} field={field} value={value as string} onChange={handleChange} />;
                                                if (field.type === 'checkbox') return <FieldCheckbox key={field.id} field={field} value={value as boolean} onChange={handleChange} />;
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* Text Areas */}
                    <div className="flex flex-col gap-4">
                        {/* Roleplaying Notes */}
                        <div className="p-4 rounded-2xl bg-app-surface/30 border border-white/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen size={14} className="text-app-text/40" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Notes d'Interprétation</h4>
                            </div>
                            <textarea
                                className="w-full bg-transparent border-none text-app-text/80 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-app-text/10 min-h-[80px]"
                                value={selectedNpc.roleplayingNotes}
                                onChange={(e) => updateEntity(selectedNpc.id, { roleplayingNotes: e.target.value })}
                                placeholder="Comment jouer ce personnage..."
                            />
                        </div>

                        {/* Secret GM Notes */}
                        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                <Lock size={48} className="text-accent" />
                            </div>
                            <div className="flex items-center gap-2 mb-1 relative z-10">
                                <Lock size={14} className="text-accent" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Informations Secrètes</h4>
                            </div>
                            <textarea
                                className="w-full bg-transparent border-none text-app-text/80 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-app-text/10 min-h-[80px] relative z-10"
                                value={selectedNpc.gmSecretInfo}
                                onChange={(e) => updateEntity(selectedNpc.id, { gmSecretInfo: e.target.value })}
                                placeholder="Secrets, complots, intentions cachées..."
                            />
                        </div>
                    </div>

                    {/* Linked Maps */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin size={14} className="text-app-text/40" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Présent sur les cartes</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {linkedMaps.length > 0 ? linkedMaps.map(map => (
                                <div
                                    key={map.id}
                                    className="px-3 py-1.5 rounded-lg bg-app-surface/60 border border-app-border text-[10px] text-app-text/60 font-bold hover:border-accent/30 transition-all cursor-pointer flex items-center gap-2 group"
                                >
                                    <MapPin size={10} className="text-app-text/20 group-hover:text-accent" />
                                    {map.name}
                                </div>
                            )) : (
                                <p className="text-[10px] text-app-text/10 italic">Aucune carte liée</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!isEditing && (
                <div className="mt-8 flex gap-4 pt-4 border-t border-app-border">
                    <button
                        onClick={handleAddToCombat}
                        className="flex-1 flex items-center justify-center gap-2 bg-app-surface hover:bg-app-surface/80 text-white font-bold py-3 rounded-xl text-xs transition-all border border-white/5 active:scale-[0.98]"
                    >
                        <Swords size={16} />
                        Envoyer au Combat
                    </button>
                    <button
                        onClick={handleSendToMap}
                        className="flex-1 flex items-center justify-center gap-2 border border-accent/50 text-accent hover:bg-accent/10 font-bold py-3 rounded-xl text-xs transition-all active:scale-[0.98]"
                    >
                        <MapPin size={16} />
                        Placer sur la Carte
                    </button>
                    <button
                        onClick={() => useImageStore.getState().projectEntity(selectedNpc)}
                        className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-white font-black py-3 rounded-xl text-xs transition-all shadow-glow-accent active:scale-[0.98]"
                    >
                        <Monitor size={16} />
                        Projeter au Hub
                    </button>
                </div>
            )}

            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    updateEntity(selectedNpc.id, { avatar: id });
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title="Changer le Portrait"
            />
        </div>
    );
};

export default NpcDetail;
