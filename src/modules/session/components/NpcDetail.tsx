import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Swords, MapPin, Monitor, Heart, Shield, Wind, Zap, Lock, BookOpen, ArrowLeft, Edit2, CheckCircle, Image as ImageIcon, Sparkles, Layers, Skull, Search } from 'lucide-react';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { DEFAULT_SHEET_TEMPLATES, type SheetField } from '../../../data/defaultSheetTemplates';
import { useMapStore } from '../../map/useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useImageStore } from '../../image/useImageStore';
import { gmToast } from '../../../stores/useToastStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useModalStore } from '../../../stores/useModalStore';
import { ResolvedImage } from '../../../components/ResolvedImage';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { useVoiceAutomation } from '../../voice/hooks/useVoiceAutomation';
import { HealthManager } from './health/HealthManager';


// --- Sub-components (Reused or adapted from CharacterSheetEditor) ---
const FieldGauge: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => (
    <div className="group space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-[11px] font-black uppercase tracking-wider text-app-text/60">{field.label}</label>
            <span className="text-[11px] font-black text-accent font-mono">{value}%</span>
        </div>
        <div className="relative h-2 bg-app-bg rounded-full overflow-hidden border border-app-border/40">
            <div
                className="absolute inset-y-0 left-0 bg-accent transition-all duration-300"
                style={{ width: `${value}%` }}
            />
            <input
                type="range" min={0} max={100} step={1} value={value ?? 0}
                onChange={e => onChange(parseInt(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
                title={`${field.label}: ${value ?? 0}%`}
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
        <label className="text-[11px] font-black uppercase tracking-wider text-app-text/60">{field.label}</label>
        <input
            type="number"
            value={value ?? 0}
            onChange={e => onChange(Number(e.target.value))}
            className="w-16 bg-app-surface text-app-text text-center font-mono text-sm font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/40"
            title={field.label}
        />
    </div>
);

const FieldText: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
}> = ({ field, value, onChange }) => (
    <div className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label className="text-[11px] font-black uppercase tracking-wider text-app-text/60 w-28 flex-shrink-0">{field.label}</label>
        <input
            type="text"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-transparent text-app-text text-sm font-medium focus:outline-none border-b border-app-border focus:border-accent/50 transition-colors pb-0.5"
            title={field.label}
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
        <label className="text-[11px] font-black uppercase tracking-wider text-app-text/60 cursor-pointer">{field.label}</label>
    </button>
);

interface NpcDetailProps {
    embeddedId?: string;
}

const NpcDetail: React.FC<NpcDetailProps> = ({ embeddedId }) => {
    const { 
        entities, selectedEntityId, setSelectedEntity, updateEntity, updateEntityHP, updateEntityMaxHP, atlasMaps,
        clues, setCurrentView, setActiveCampaignFormSection, setEditingClueId,
        generateEntityPortrait, isGeneratingAIImage 
    } = useSessionOSStore();
    const { closeModal } = useModalStore();
    const { addToken } = useMapStore();
    useVoiceAutomation();

    const currentId = embeddedId || selectedEntityId;

    const [isEditing, setIsEditing] = useState(false);
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const [showAIPrompt, setShowAIPrompt] = useState(false);

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
            hp: selectedNpc.healthSystem?.type === 'hp' ? Number(selectedNpc.healthSystem.data.current) : selectedNpc.hp,
            hpMax: selectedNpc.healthSystem?.type === 'hp' ? Number(selectedNpc.healthSystem.data.max) : selectedNpc.maxHp,
            avatar: selectedNpc.avatar,
            isPlayer: false,
            faction: 'enemy',
            sourceEntityId: selectedNpc.id,
            statuses: []
        });
        gmToast(`${selectedNpc.name} ajouté au combat !`);
    };

    const linkedMaps = atlasMaps.filter(m => (selectedNpc.linkedMapIds || []).includes(m.id));
    const linkedClues = clues.filter(c => c.ownerId === selectedNpc.id);

    const handleClueClick = (clueId?: string) => {
        setActiveCampaignFormSection('clues');
        if (clueId) setEditingClueId(clueId);
        setCurrentView('campaign-editor');
        if (embeddedId) closeModal();
    };

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
                                className={`relative z-10 w-full h-full object-contain ${selectedNpc.status === 'dead' ? 'grayscale contrast-125 brightness-75' : ''}`}
                            />
                        </div>

                        {selectedNpc.status === 'dead' && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-rose-950/20 backdrop-grayscale-[0.5]">
                                <div className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-lg shadow-rose-900/50 uppercase tracking-widest rotate-[-10deg] border border-rose-400/50">
                                    MORT / K.O
                                </div>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMediaBrowserOpen(true); }}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                title="Galerie Média"
                            >
                                <ImageIcon size={32} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowAIPrompt(true); }}
                                className="p-3 bg-accent text-slate-950 rounded-full hover:scale-110 transition-all shadow-glow-accent"
                                title="Générer par IA"
                            >
                                <Sparkles size={32} />
                            </button>
                        </div>
                        
                        {isGeneratingAIImage && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                                <div className="flex flex-col items-center gap-4 animate-pulse">
                                    <Sparkles size={48} className="text-accent animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Création en cours...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modular Health Manager */}
                    <div className="w-full">
                        <HealthManager id={selectedNpc.id} type="npc" />
                    </div>
                </div>

                {/* Right Col: Stats & Lore */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        {isEditing ? (
                            <>
                                <input 
                                    type="text"
                                    value={selectedNpc.name || ''}
                                    onChange={(e) => updateEntity(selectedNpc.id, { name: e.target.value })}
                                    className="bg-app-surface/50 border border-accent/30 rounded-xl px-4 py-2 text-2xl font-black text-white focus:outline-none focus:border-accent transition-all"
                                    title="Nom du personnage"
                                />
                                <input 
                                    type="text"
                                    value={selectedNpc.description || ''}
                                    onChange={(e) => updateEntity(selectedNpc.id, { description: e.target.value })}
                                    className="bg-app-surface/30 border border-app-border rounded-lg px-4 py-1.5 text-sm text-app-text/60 focus:outline-none focus:border-app-border/60 transition-all font-medium italic"
                                    title="Brève description"
                                />
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    <h2 className={`text-4xl font-display font-black leading-tight tracking-tight mb-1 transition-colors ${selectedNpc.status === 'dead' ? 'text-slate-500 line-through decoration-rose-600/50' : 'text-accent'}`}>
                                        {selectedNpc.name}
                                    </h2>
                                    <button
                                        onClick={() => updateEntity(selectedNpc.id, { status: selectedNpc.status === 'dead' ? 'alive' : 'dead' })}
                                        className={`p-2 rounded-xl border-2 transition-all flex items-center justify-center shadow-lg ${
                                            selectedNpc.status === 'dead' 
                                            ? 'bg-rose-600 border-rose-400 text-white shadow-glow-rose scale-110' 
                                            : 'bg-app-surface border-app-border text-app-text/20 hover:text-rose-500 hover:border-rose-500/50'
                                        }`}
                                        title={selectedNpc.status === 'dead' ? "Ressusciter" : "Marquer comme Mort / K.O"}
                                    >
                                        <Skull size={20} />
                                    </button>
                                </div>
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
                                                                {r === 'ally' ? 'Allié' : r === 'neutral' ? 'Neutre' : r === 'hostile' ? 'Hostile' : 'Boss'}
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
                                                            type="number" value={selectedNpc.hp ?? 0}
                                                            onChange={(e) => updateEntityHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                                            className="w-10 bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                            title="Points de Vie actuels"
                                                        />
                                                        <span className="text-app-text/20">/</span>
                                                        <input 
                                                            type="number" value={selectedNpc.maxHp ?? 10}
                                                            onChange={(e) => updateEntityMaxHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                                            className="w-10 bg-transparent text-center text-app-text/40 font-black text-xs focus:outline-none"
                                                            title="Points de Vie Max"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                                                    <Shield size={14} className="text-blue-400" />
                                                    <input 
                                                        type="number" value={selectedNpc.ac ?? 10}
                                                        onChange={(e) => updateEntity(selectedNpc.id, { ac: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                        title="Classe d'Armure"
                                                    />
                                                    <span className="text-[8px] font-bold text-app-text/20 uppercase tracking-widest">Armure</span>
                                                </div>
                                                <div className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                                                    <Wind size={14} className="text-emerald-400" />
                                                    <input 
                                                        type="number" value={selectedNpc.speed ?? 30}
                                                        onChange={(e) => updateEntity(selectedNpc.id, { speed: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                        title="Vitesse de déplacement"
                                                    />
                                                    <span className="text-[8px] font-bold text-app-text/20 uppercase tracking-widest">Vitesse</span>
                                                </div>
                                                <div className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                                                    <Zap size={14} className="text-amber-400" />
                                                    <input 
                                                        type="number" value={selectedNpc.initiative ?? 0}
                                                        onChange={(e) => updateEntity(selectedNpc.id, { initiative: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-transparent text-center text-white font-black text-xs focus:outline-none"
                                                        title="Bonus d'Initiative"
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
                                        const val = (selectedNpc.sheetData?.[stat.fieldId] as string | number) ?? 0;
                                        
                                        if (stat.isMainHP) {
                                            return (
                                                <div key={i} className="bg-app-surface/60 border border-accent/30 p-3 rounded-xl flex flex-col items-center justify-center gap-2 group hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] transition-all">
                                                    <div className="flex items-center gap-2">
                                                        <Heart size={14} className="text-red-500" />
                                                        <span className="text-[9px] font-black text-accent uppercase tracking-widest">{stat.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="bg-black/40 border border-white/5 w-10 h-8 rounded-lg flex items-center justify-center shadow-inner group-hover:border-accent/20 transition-all">
                                                            <input 
                                                                type="number" value={selectedNpc.hp ?? 0}
                                                                onChange={(e) => updateEntityHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                                                className="w-full bg-transparent text-center text-white font-black text-[10px] focus:outline-none"
                                                                title="Points de Vie actuels"
                                                            />
                                                        </div>
                                                        <span className="text-app-text/20 font-bold text-[10px]">/</span>
                                                        <div className="bg-black/20 border border-white/5 w-10 h-8 rounded-lg flex items-center justify-center shadow-inner group-hover:border-accent/10 transition-all">
                                                            <input 
                                                                type="number" value={selectedNpc.maxHp ?? 10}
                                                                onChange={(e) => updateEntityMaxHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                                                className="w-full bg-transparent text-center text-app-text/40 font-black text-[10px] focus:outline-none"
                                                                title="Points de Vie Max"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={i} className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent/20 transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-accent/40 mb-1" />
                                                <span className="text-app-text font-black text-xs">{val}</span>
                                                <span className="text-[10px] uppercase font-bold text-app-text/40 tracking-wide group-hover:text-app-text/60">{stat.label}</span>
                                            </div>
                                        );
                                    });
                                }

                                // Fallback to standard 4 stats if no driver or stats defined
                                return (
                                    [
                                        { label: 'PV', isHP: true, icon: <Heart size={14} className="text-red-400" /> },
                                        { label: 'CA', val: selectedNpc.ac, icon: <Shield size={14} className="text-blue-400" /> },
                                        { label: 'Vitesse', val: `${selectedNpc.speed} ft`, icon: <Wind size={14} className="text-emerald-400" /> },
                                        { label: 'Init.', val: `+${selectedNpc.initiative}`, icon: <Zap size={14} className="text-amber-400" /> },
                                    ].map((stat, i) => {
                                        if (stat.isHP) {
                                            return (
                                                <div key={i} className="bg-app-surface/60 border border-accent/20 p-3 rounded-xl flex flex-col items-center justify-center gap-2 group hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] transition-all">
                                                    <div className="flex items-center gap-2">
                                                        <Heart size={14} className="text-red-500" />
                                                        <span className="text-[9px] font-black text-accent uppercase tracking-widest">{stat.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-app-bg/50 px-2 py-1 rounded-lg border border-app-border/40">
                                                        <input 
                                                            type="number" value={selectedNpc.hp ?? 0}
                                                            onChange={(e) => updateEntityHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                                            className="w-10 bg-transparent text-center text-app-text font-black text-xs focus:outline-none"
                                                            title="Points de Vie actuels"
                                                        />
                                                        <span className="text-app-text/20 font-bold">/</span>
                                                        <input 
                                                            type="number" value={selectedNpc.maxHp ?? 10}
                                                            onChange={(e) => updateEntityMaxHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                                            className="w-10 bg-transparent text-center text-app-text/40 font-black text-xs focus:outline-none"
                                                            title="Points de Vie Max"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={i} className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent/20 transition-all">
                                                {stat.icon}
                                                <span className="text-app-text font-black text-xs">{stat.val}</span>
                                                <span className="text-[9px] uppercase font-bold text-app-text/20 tracking-wider group-hover:text-app-text/40">{stat.label}</span>
                                            </div>
                                        );
                                    })
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
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-app-text/40">{section.label}</span>
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {section.fields.map(field => {
                                                const value = selectedNpc.sheetData?.[field.id] ?? field.defaultValue;
                                                const handleChange = (val: string | number | boolean) => updateEntitySheetData(selectedNpc.id, field.id, val);

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
                                value={selectedNpc.roleplayingNotes || ''}
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
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-accent">Informations Secrètes</h4>
                            </div>
                            <textarea
                                className="w-full bg-transparent border-none text-app-text/80 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-app-text/10 min-h-[80px] relative z-10"
                                value={selectedNpc.gmSecretInfo || ''}
                                onChange={(e) => updateEntity(selectedNpc.id, { gmSecretInfo: e.target.value })}
                                placeholder="Secrets, complots, intentions cachées..."
                            />
                        </div>
                    </div>

                    {/* Linked Maps */}
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <Search size={14} className="text-gm-gold" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gm-gold/60">Indices Liés</h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {linkedClues.length > 0 ? linkedClues.map(clue => (
                                    <button
                                        key={clue.id}
                                        onClick={() => handleClueClick(clue.id)}
                                        className="group relative flex items-center gap-3 p-2 bg-[#121215] border border-white/5 rounded-2xl hover:border-gm-gold/40 transition-all text-left max-w-xs overflow-hidden"
                                        title={`Ouvrir "${clue.title}" dans le Nexus`}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-app-surface overflow-hidden flex-shrink-0 border border-white/5">
                                            {clue.mediaUrl ? (
                                                <ResolvedAsset src={clue.mediaUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/10">
                                                    <Search size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-[10px] font-black text-white/80 group-hover:text-gm-gold transition-colors truncate">{clue.title}</p>
                                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest leading-none mt-0.5">Cliquez pour voir</p>
                                        </div>
                                    </button>
                                )) : (
                                    <p className="text-[10px] text-app-text/10 italic px-1">Aucun indice découvert lié à ce personnage.</p>
                                )}
                            </div>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
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
                                    <p className="text-[10px] text-app-text/10 italic px-1">Aucune carte liée</p>
                                )}
                            </div>
                        </section>
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

            <AIPromptOverlay
                isOpen={showAIPrompt}
                onClose={() => setShowAIPrompt(false)}
                isGenerating={isGeneratingAIImage}
                title={`Portrait IA : ${selectedNpc.name}`}
                placeholder="Ex: cicatrices de combat, armure noire reluisante, fond volcanique..."
                onGenerate={(instructions) => {
                    generateEntityPortrait(selectedNpc.id, instructions).then(() => setShowAIPrompt(false));
                }}
            />
        </div>
    );
};

export default NpcDetail;
