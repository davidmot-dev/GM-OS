import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { Swords, MapPin, Monitor, Heart, Shield, Wind, Zap, Lock, BookOpen, ArrowLeft, Edit2, CheckCircle, Image as ImageIcon, Sparkles, Layers, Skull, Search, Users } from 'lucide-react';
import { FieldGauge, FieldRating } from './fields/SheetFields';
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
import { useSheetCalculator } from '../hooks/useSheetCalculator';
import { Calculator } from 'lucide-react';

const ROLE_COLORS = {
    ally: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20',
    hostile: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
    boss: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
};

const ROLE_ICONS = {
    ally: Shield,
    neutral: Users,
    hostile: Swords,
    boss: Skull,
};

// --- Sub-components ---
/**
 * La jauge d'un PNJ — **la même que celle des personnages**.
 *
 * Cet écran en portait une copie qui affichait des pourcentages sur une échelle
 * de cent imposée, alors que chaque champ déclare son maximum. Deux jauges
 * divergentes pour la même donnée, c'est la garantie qu'un des deux écrans dira
 * un jour autre chose que l'autre — on emploie donc celle de `SheetFields`,
 * corrigée le 2026-08-15.
 */

const FieldNumber: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
    t: (key: string) => string;
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
    t: (key: string) => string;
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
    t: (key: string) => string;
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

const FieldSelect: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
    t: (key: string) => string;
}> = ({ field, value, onChange, t }) => (
    <div className="flex items-center justify-between p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label className="text-[11px] font-black uppercase tracking-wider text-app-text/60">{field.label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-48 bg-app-surface text-app-text text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/40 border border-white/5"
            title={field.label}
        >
            <option value="" disabled>{t('common:actions.select_placeholder')}</option>
            {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const FieldTextarea: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
    t: (key: string) => string;
}> = ({ field, value, onChange }) => (
    <div className="flex flex-col gap-2 p-3 bg-app-bg/40 rounded-xl border border-app-border/40 col-span-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-app-text/60">{field.label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-app-text text-sm focus:outline-none border-b border-app-border/40 focus:border-accent/40 transition-colors resize-none custom-scrollbar"
            title={field.label}
            placeholder={field.label}
        />
    </div>
);


/**
 * `FieldRating` vient de `SheetFields`, comme `FieldGauge`.
 *
 * Cet écran en portait une copie avec les mêmes pastilles vides invisibles —
 * `bg-black/20 border-white/10`. Deux composants pour la même donnée, c'est la
 * garantie qu'une correction n'en atteindra qu'un : celle du 2026-08-15 aurait
 * laissé les fiches de PNJ illisibles.
 */

const FieldFormula: React.FC<{
    field: SheetField;
    value: number;
}> = ({ field, value }) => (
    <div className="flex items-center justify-between p-3 bg-accent/5 rounded-xl border border-accent/20 shadow-inner group">
        <label className="text-[10px] font-black uppercase tracking-widest text-accent/60 flex items-center gap-2">
            <Calculator size={12} className="group-hover:rotate-12 transition-transform" />
            {field.label}
        </label>
        <span className="text-[11px] font-black text-white bg-accent/20 px-3 py-1 rounded-lg border border-accent/10 min-w-[3rem] text-center font-mono">
            {value}
        </span>
    </div>
);


interface NpcDetailProps {
    embeddedId?: string;
}

const NpcDetail: React.FC<NpcDetailProps> = ({ embeddedId }) => {
    const { t } = useTranslation(['modules', 'common']);
    const { 
        entities, 
        selectedEntityId, 
        setSelectedEntity, 
        updateEntity, 
        updateEntityHP, 
        updateEntityMaxHP, 
        updateEntitySheetData,
        toggleEntityVisibility,
        customSheetTemplates,
        atlasMaps,
        clues, activeCampaignId, setCurrentView, setActiveCampaignFormSection, setEditingClueId,
        generateEntityPortrait, isGeneratingAIImage 
    } = useSessionOSStore();
    const { closeModal } = useModalStore();
    const { addToken } = useMapStore();
    const currentId = embeddedId || selectedEntityId;
    const selectedNpc = entities.find(e => e.id === currentId);
    const currentTemplate = customSheetTemplates.find(t => t.id === selectedNpc?.templateId);
    const { evaluateFormula } = useSheetCalculator(selectedNpc || null, currentTemplate || null);
    useVoiceAutomation();

    const ROLE_LABELS = {
        ally: t('modules:session.npc_detail.affinity.ally'),
        neutral: t('modules:session.npc_detail.affinity.neutral'),
        hostile: t('modules:session.npc_detail.affinity.hostile'),
        boss: t('modules:session.npc_detail.affinity.boss'),
    };

    const [isEditing, setIsEditing] = useState(false);
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const [showAIPrompt, setShowAIPrompt] = useState(false);


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
                {t('modules:session.npc_detail.placeholder')}
            </div>
        );
    }

    const handleSendToMap = () => {
        const { selectedAtlasMapId } = useSessionOSStore.getState();
        addToken({
            name: selectedNpc.name,
            avatar: selectedNpc.avatar,
            x: 200, y: 200, size: 1,
        });
        const linkedMapIds = selectedNpc.linkedMapIds || [];
        if (selectedAtlasMapId && !linkedMapIds.includes(selectedAtlasMapId)) {
            updateEntity(selectedNpc.id, { linkedMapIds: [...linkedMapIds, selectedAtlasMapId] });
        }
        gmToast(t('modules:session.toasts.entity_added_to_map', { name: selectedNpc.name }));
    };

    const handleAddToCombat = () => {
        useCombatStore.getState().addCombatant({
            name: selectedNpc.name,
            init: selectedNpc.initiative,
            hp: selectedNpc.hp,
            hpMax: selectedNpc.maxHp,
            avatar: selectedNpc.avatar,
            isPlayer: false,
            faction: 'enemy',
            sourceEntityId: selectedNpc.id,
            statuses: []
        });
        gmToast(t('modules:session.toasts.entity_added_to_combat', { name: selectedNpc.name }));
    };

    const linkedMaps = atlasMaps.filter(m => (selectedNpc.linkedMapIds || []).includes(m.id));
    const linkedClues = clues.filter(c => c.ownerId === selectedNpc.id && c.campaignId === activeCampaignId);

    const handleClueClick = (clueId?: string) => {
        setActiveCampaignFormSection('clues');
        if (clueId) setEditingClueId(clueId);
        setCurrentView('campaign-editor');
        if (embeddedId) closeModal();
    };

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates || [])];
    const template = allTemplates.find(t => t.id === selectedNpc.templateId) || DEFAULT_SHEET_TEMPLATES[0];

    return (
        <div className="flex-1 h-full bg-app-bg/60 p-12 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header / Actions */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={handleClose}
                    className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-text/40 hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    {embeddedId ? t('common:actions.close') : t('modules:favorite.back')}
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
                    {isEditing ? t('modules:session.npc_detail.actions.finish') : t('modules:session.npc_detail.actions.edit')}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-12 flex-1 overflow-hidden">
                {/* Portrait & Health */}
                <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col gap-6">
                    <div 
                        className={`aspect-[4/5] rounded-3xl overflow-hidden border-2 shadow-2xl relative group bg-app-surface transition-all ${
                            isEditing ? 'border-accent cursor-pointer hover:shadow-glow-accent' : 'border-app-border/20 shadow-accent/5'
                        }`}
                        onClick={() => isEditing && setIsMediaBrowserOpen(true)}
                    >
                        <div className="absolute inset-0">
                            <ResolvedImage src={selectedNpc.avatar} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" />
                            <ResolvedImage src={selectedNpc.avatar} alt={selectedNpc.name} className={`relative z-10 w-full h-full object-contain ${selectedNpc.status === 'dead' ? 'grayscale contrast-125 brightness-75' : ''}`} />
                        </div>

                        {selectedNpc.status === 'dead' && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-rose-950/20 backdrop-grayscale-[0.5]">
                                <div className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest rotate-[-10deg] border border-rose-400/50">{t('modules:session.npc_detail.status.dead')}</div>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 gap-4">
                            <button onClick={(e) => { e.stopPropagation(); setIsMediaBrowserOpen(true); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"><ImageIcon size={32} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setShowAIPrompt(true); }} className="p-3 bg-accent text-slate-950 rounded-full hover:scale-110 shadow-glow-accent"><Sparkles size={32} /></button>
                        </div>
                        
                        {isGeneratingAIImage && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                                <div className="flex flex-col items-center gap-4 animate-pulse">
                                    <Sparkles size={48} className="text-accent animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">{t('modules:session.npc_detail.status.generating')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <HealthManager id={selectedNpc.id} type="npc" />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex flex-col gap-2">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input 
                                    type="text" value={selectedNpc.name || ''}
                                    onChange={(e) => updateEntity(selectedNpc.id, { name: e.target.value })}
                                    className="bg-app-surface/50 border border-accent/30 rounded-xl px-4 py-2 text-2xl font-black text-white w-full focus:outline-none focus:border-accent"
                                />
                                <input 
                                    type="text" value={selectedNpc.description || ''}
                                    onChange={(e) => updateEntity(selectedNpc.id, { description: e.target.value })}
                                    className="bg-app-surface/30 border border-app-border rounded-lg px-4 py-1.5 text-sm text-app-text/60 w-full focus:outline-none italic"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h2 className={`text-4xl font-display font-black tracking-tight ${selectedNpc.status === 'dead' ? 'text-slate-500 line-through' : 'text-accent'}`}>{selectedNpc.name}</h2>
                                    <p className="text-app-text/40 text-sm italic">{selectedNpc.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const roles: (keyof typeof ROLE_LABELS)[] = ['ally', 'neutral', 'hostile', 'boss'];
                                            const nextRole = roles[(roles.indexOf(selectedNpc.role as any || 'neutral') + 1) % roles.length];
                                            updateEntity(selectedNpc.id, { role: nextRole });
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${ROLE_COLORS[selectedNpc.role || 'neutral']}`}
                                        title={t('common:actions.edit')}
                                    >
                                        {React.createElement(ROLE_ICONS[selectedNpc.role || 'neutral'], { size: 14 })}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{ROLE_LABELS[selectedNpc.role as keyof typeof ROLE_LABELS || 'neutral']}</span>
                                    </button>
                                    <button
                                        onClick={() => updateEntity(selectedNpc.id, { status: selectedNpc.status === 'dead' ? 'alive' : 'dead' })}
                                        className={`p-2 rounded-xl border-2 transition-all ${selectedNpc.status === 'dead' ? 'bg-rose-600 border-rose-400 text-white' : 'bg-app-surface border-app-border text-app-text/20 hover:text-rose-500 hover:border-rose-500/50'}`}
                                    >
                                        <Skull size={20} />
                                    </button>
                                    <button
                                        onClick={() => toggleEntityVisibility(selectedNpc.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${selectedNpc.isVisibleByPlayers ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-app-surface/40 border-app-border/40 text-app-text/40'}`}
                                    >
                                        <Monitor size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedNpc.isVisibleByPlayers ? t('common:status.online') : t('common:status.offline')}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Editor / Display */}
                    <div className="grid grid-cols-5 gap-3">
                        {/* Standard Stats Always Editable or Driver-based */}
                        <div className="col-span-2 bg-app-surface/60 border border-accent/30 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                            <Heart size={14} className="text-rose-500" />
                            <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg border border-white/5 h-7">
                                <input 
                                    type="number" value={selectedNpc.hp ?? 0}
                                    onChange={(e) => updateEntityHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                    className="w-20 bg-transparent text-center text-white font-black text-xs outline-none"
                                    title={t('common:status.vitality')}
                                />
                                <span className="text-app-text/20 font-bold text-xs">/</span>
                                <input 
                                    type="number" value={selectedNpc.maxHp ?? 10}
                                    onChange={(e) => updateEntityMaxHP(selectedNpc.id, parseInt(e.target.value) || 0)}
                                    className="w-20 bg-transparent text-center text-app-text/40 font-black text-xs outline-none"
                                    title={t('common:status.vitality')}
                                />
                            </div>
                            <span className="text-[8px] font-bold text-accent uppercase tracking-widest">{t('common:status.vitality')}</span>
                        </div>
                        <div className="col-span-1 bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                            <Shield size={14} className="text-blue-400" />
                            <input type="number" value={selectedNpc.ac ?? 10} onChange={e => updateEntity(selectedNpc.id, { ac: parseInt(e.target.value) || 0 })} className="w-full bg-transparent text-center text-white font-black text-xs outline-none" title={t('modules:session.forms.labels.ac')} />
                            <span className="text-[8px] font-bold text-app-text/20 uppercase">{t('modules:session.forms.labels.ac')}</span>
                        </div>
                        <div className="col-span-1 bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                            <Wind size={14} className="text-emerald-400" />
                            <input type="number" value={selectedNpc.speed ?? 30} onChange={e => updateEntity(selectedNpc.id, { speed: parseInt(e.target.value) || 0 })} className="w-full bg-transparent text-center text-white font-black text-xs outline-none" title={t('modules:session.forms.labels.speed')} />
                            <span className="text-[8px] font-bold text-app-text/20 uppercase">{t('modules:session.forms.labels.speed')}</span>
                        </div>
                        <div className="col-span-1 bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
                            <Zap size={14} className="text-amber-400" />
                            <input type="number" value={selectedNpc.initiative ?? 0} onChange={e => updateEntity(selectedNpc.id, { initiative: parseInt(e.target.value) || 0 })} className="w-full bg-transparent text-center text-white font-black text-xs outline-none" title={t('modules:session.forms.labels.initiative')} />
                            <span className="text-[8px] font-bold text-app-text/20 uppercase">{t('modules:session.forms.labels.initiative')}</span>
                        </div>
                    </div>

                    {/* Template Selection */}
                    {isEditing && (
                        <div className="p-4 bg-app-surface/20 border border-white/5 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2"><Layers size={14} className="text-accent"/><label className="text-[11px] font-black uppercase tracking-widest text-app-text/60">{t('modules:session.npc_detail.sections.sheet_template')}</label></div>
                            <div className="grid grid-cols-2 gap-2">
                                {allTemplates.map(t => (
                                    <button 
                                        key={t.id} onClick={() => updateEntity(selectedNpc.id, { templateId: t.id })}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedNpc.templateId === t.id ? 'bg-accent/10 border-accent text-accent' : 'bg-app-bg border-app-border text-app-text/40'}`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Sections */}
                    {!isEditing && template && template.id !== 'generic' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                < BookOpen size={16} className="text-accent" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-accent">{t('modules:session.npc_detail.sections.sheet_dossier')} : {template.name}</h3>
                            </div>
                            {template.sections.map((section, sidx) => (
                                <div key={sidx} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-app-text/20">{section.label}</span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {section.fields.map(field => {
                                            const value = selectedNpc.sheetData?.[field.id] ?? field.defaultValue;
                                            const onChange = (v: string | number | boolean) => updateEntitySheetData(selectedNpc.id, field.id, v);
                                            
                                            if (field.type === 'gauge') return <FieldGauge key={field.id} field={field} value={value as number} onChange={onChange} />;
                                            if (field.type === 'number') return <FieldNumber key={field.id} field={field} value={value as number} onChange={onChange} t={t} />;
                                            if (field.type === 'text') return <FieldText key={field.id} field={field} value={value as string} onChange={onChange} t={t} />;
                                            if (field.type === 'checkbox') return <FieldCheckbox key={field.id} field={field} value={value as boolean} onChange={onChange} t={t} />;
                                            if (field.type === 'select') return <FieldSelect key={field.id} field={field} value={value as string} onChange={onChange} t={t} />;
                                            if (field.type === 'textarea') return <FieldTextarea key={field.id} field={field} value={value as string} onChange={onChange} t={t} />;
                                            if (field.type === 'rating') return <FieldRating key={field.id} field={field} value={value as number} onChange={onChange} />;
                                            if (field.type === 'formula') return <FieldFormula key={field.id} field={field} value={evaluateFormula(field.formula || '')} />;
                                            
                                            return null;
                                        })}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}

                    {/* Notes & Secret Info */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 rounded-2xl bg-app-surface/30 border border-white/5 space-y-2">
                            <div className="flex items-center gap-2"><BookOpen size={14} className="text-app-text/40"/><h4 className="text-[10px] font-black uppercase text-app-text/40">{t('modules:session.npc_detail.sections.notes')}</h4></div>
                            <textarea className="w-full bg-transparent text-xs text-app-text/80 outline-none resize-none min-h-[80px]" value={selectedNpc.roleplayingNotes || ''} onChange={e => updateEntity(selectedNpc.id, { roleplayingNotes: e.target.value })} placeholder={t('modules:session.npc_detail.placeholders.roleplay')} />
                        </div>
                        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-2">
                            <div className="flex items-center gap-2"><Lock size={14} className="text-accent"/><h4 className="text-[11px] font-black uppercase text-accent">{t('modules:session.npc_detail.sections.secrets')}</h4></div>
                            <textarea className="w-full bg-transparent text-xs text-app-text/80 outline-none resize-none min-h-[80px]" value={selectedNpc.gmSecretInfo || ''} onChange={e => updateEntity(selectedNpc.id, { gmSecretInfo: e.target.value })} placeholder={t('modules:session.npc_detail.placeholders.secrets')} />
                        </div>
                    </div>

                    {/* Nexus / Maps Links */}
                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-gm-gold/60 flex items-center gap-2"><Search size={14}/> {t('modules:session.npc_detail.sections.clues')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {linkedClues.map(c => (
                                    <button key={c.id} onClick={() => handleClueClick(c.id)} className="px-3 py-1.5 rounded-xl bg-black/20 border border-white/5 text-[9px] font-black text-white/40 hover:text-gm-gold hover:border-gm-gold/40 transition-all">{c.title}</button>
                                ))}
                                {linkedClues.length === 0 && <span className="text-[10px] italic text-app-text/10">{t('modules:session.npc_detail.sections.no_clue')}</span>}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase text-app-text/40 flex items-center gap-2"><MapPin size={14}/> {t('modules:session.npc_detail.sections.maps')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {linkedMaps.map(m => (
                                    <span key={m.id} className="px-3 py-1.5 rounded-xl bg-black/20 border border-white/5 text-[9px] font-black text-white/40">{m.name}</span>
                                ))}
                                {linkedMaps.length === 0 && <span className="text-[10px] italic text-app-text/10">{t('modules:session.npc_detail.sections.no_map')}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            {!isEditing && (
                <div className="mt-8 flex gap-4 pt-4 border-t border-app-border">
                    <button onClick={handleAddToCombat} className="flex-1 flex items-center justify-center gap-2 bg-app-surface hover:bg-app-surface/80 text-white font-bold py-3 rounded-xl text-xs transition-all border border-white/5"><Swords size={16}/>{t('modules:session.npc_detail.actions.combat')}</button>
                    <button onClick={handleSendToMap} className="flex-1 flex items-center justify-center gap-2 border border-accent/50 text-accent hover:bg-accent/10 font-bold py-3 rounded-xl text-xs transition-all"><MapPin size={16}/>{t('modules:session.npc_detail.actions.map')}</button>
                    <button onClick={() => useImageStore.getState().projectEntity(selectedNpc)} className="flex-1 flex items-center justify-center gap-2 bg-accent text-white font-black py-3 rounded-xl text-xs transition-all shadow-glow-accent"><Monitor size={16}/>{t('modules:session.npc_detail.actions.project')}</button>
                </div>
            )}

            <MediaBrowser isOpen={isMediaBrowserOpen} onClose={() => setIsMediaBrowserOpen(false)} onSelect={(id) => { updateEntity(selectedNpc.id, { avatar: id }); setIsMediaBrowserOpen(false); }} allowedTypes={['image']} title={t('modules:session.npc_detail.sections.portrait')} />
            <AIPromptOverlay isOpen={showAIPrompt} onClose={() => setShowAIPrompt(false)} isGenerating={isGeneratingAIImage} title={t('modules:session.npc_gallery.ai_title', { name: selectedNpc.name })} onGenerate={(inst) => generateEntityPortrait(selectedNpc.id, inst).then(() => setShowAIPrompt(false))} />
        </div>
    );
};

export default NpcDetail;
