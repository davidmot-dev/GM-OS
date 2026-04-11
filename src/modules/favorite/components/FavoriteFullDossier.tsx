import React, { useState } from 'react';
import { useFavoriteStore, type FavoriteEntity } from '../useFavoriteStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useMapStore } from '../../map/useMapStore';
import { useModalStore } from '../../../stores/useModalStore';
import {
    Save, Plus, Trash2, ArrowLeft,
    Image as ImageIcon, FolderOpen,
    Layers, ScrollText, Activity,
    User, MapPin, Sparkles, BookOpen, Sword
} from 'lucide-react';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmToast } from '../../../stores/useToastStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { aiService } from '../../ai/AIService';
import { MessageSquare, Copy, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FavoriteFullDossier: React.FC = () => {
    const { favorites, selectedFavoriteId, updateFavorite, setViewMode } = useFavoriteStore();
    const { closeModal, type: modalType } = useModalStore();
    const { addCombatant } = useCombatStore();
    const { addToken } = useMapStore();
    const { t, i18n } = useTranslation(['modules', 'common']);

    const entity = favorites.find(f => f.id === selectedFavoriteId);
    const [formData, setFormData] = useState<Partial<FavoriteEntity>>(entity || {});

    // Session Data
    const campaigns = useSessionOSStore(s => s.campaigns);
    const players = useSessionOSStore(s => s.players);

    // UI States
    const [browserTarget, setBrowserTarget] = useState<'imageUrl' | 'tokenUrl' | null>(null);
    const [isGeneratingDialogues, setIsGeneratingDialogues] = useState(false);

    // Resolved URLs for display
    const resolvedImageUrl = useMediaUrl(formData.imageUrl);
    const resolvedTokenUrl = useMediaUrl(formData.tokenUrl);

    const handleMediaSelect = (mediaId: string) => {
        if (browserTarget) {
            setFormData(prev => ({ ...prev, [browserTarget]: mediaId }));
            setBrowserTarget(null);
        }
    };

    if (!entity) return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
            <p>{t('modules:favorite.sections.no_dossier')}</p>
            <button onClick={() => setViewMode('grid')} className="mt-4 text-accent hover:underline">{t('modules:favorite.actions.back_library')}</button>
        </div>
    );

    const handleSave = () => {
        if (entity.id && formData) {
            updateFavorite(entity.id, formData);
            gmToast(t('modules:favorite.actions.save_success'));
        }
    };

    const handleGenerateDialogues = async () => {
        if (!entity || isGeneratingDialogues) return;
        
        setIsGeneratingDialogues(true);
        try {
            const isEnglish = i18n.language === 'en';
            const systemPrompt = isEnglish 
                ? `You are an expert Game Master assistant.
                TASK: Generate 5 typical dialogue lines for this NPC.
                RULES:
                1. Lines must reflect their personality, lore, and secret notes.
                2. Respond ONLY as a JSON array of strings: ["Line 1", "Line 2", ...].
                3. Language: English.
                4. Be immersive and concise.`
                : `Tu es un assistant de Maître de Jeu expert. 
                TACHE : Génère 5 répliques de dialogue typiques pour ce PNJ.
                RÈGLES :
                1. Les répliques doivent refléter sa personnalité, son lore et ses notes secrètes.
                2. Réponds UNIQUEMENT sous forme d'un tableau JSON de chaînes de caractères : ["Réplique 1", "Réplique 2", ...].
                3. Langue : Français.
                4. Sois immersif et concis.`;
            
            const prompt = isEnglish
                ? `Generate 5 lines for:
                Name: ${entity.name}
                Title: ${entity.subtitle || 'N/A'}
                Lore: ${entity.lore || 'N/A'}
                Secret Notes (use for tone): ${entity.secretNotes || 'N/A'}
                Attributes: ${JSON.stringify(entity.attributes || {})}
                `
                : `Génère 5 répliques pour :
                Nom : ${entity.name}
                Titre : ${entity.subtitle || 'N/A'}
                Lore : ${entity.lore || 'N/A'}
                Notes Secrètes (à utiliser pour le ton) : ${entity.secretNotes || 'N/A'}
                Attributs : ${JSON.stringify(entity.attributes || {})}
                `;
            
            const result = await aiService.generateJSON<string[]>(prompt, systemPrompt);
            if (Array.isArray(result)) {
                updateFavorite(entity.id, { dialoguePrep: result });
                gmToast(t('modules:favorite.actions.gen_success'));
            }
        } catch (err) {
            console.error("Failed to generate dialogues", err);
            gmToast(t('modules:favorite.actions.gen_error'), "error");
        } finally {
            setIsGeneratingDialogues(false);
        }
    };

    const handleCopyDialogue = (text: string) => {
        navigator.clipboard.writeText(text);
        gmToast(t('modules:favorite.actions.copy_dialogue'));
    };

    const typeConfig = {
        npc: { icon: User, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
        place: { icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
        item: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        lore: { icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' }
    };

    const currentType = typeConfig[formData.type as keyof typeof typeConfig] || typeConfig.npc;

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-app-bg font-display text-slate-200">
            <MediaBrowser
                isOpen={browserTarget !== null}
                onClose={() => setBrowserTarget(null)}
                onSelect={handleMediaSelect}
                allowedTypes={['image']}
                title={`${t('common:actions.select')} ${browserTarget === 'tokenUrl' ? t('modules:favorite.placeholders.select_token') : t('modules:favorite.placeholders.select_portrait')}`}
            />
            {/* 1. Global Header */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-app-surface/40 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => {
                            if (modalType) {
                                closeModal();
                            } else {
                                setViewMode('grid');
                            }
                        }}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-accent/50 hover:bg-accent/10 transition-all"
                    >
                        <ArrowLeft size={16} className="text-slate-500 group-hover:text-accent" />
                        <span className="text-xs font-bold tracking-widest text-slate-400 group-hover:text-accent">{t('modules:favorite.back')}</span>
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex items-center gap-3">
                        <currentType.icon size={18} className={currentType.color} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${currentType.color}`}>
                            {t(`modules:favorite.categories.${formData.type}`)} {t('modules:favorite.sections.dossier')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {formData.type === 'npc' && (
                        <button
                            onClick={() => {
                                addCombatant({
                                    name: formData.name || entity.name,
                                    hp: 10,
                                    hpMax: 10,
                                    init: Math.floor(Math.random() * 20) + 1,
                                    isPlayer: false,
                                    avatar: formData.tokenUrl || entity.tokenUrl || formData.imageUrl || entity.imageUrl,
                                    statuses: []
                                });
                                gmToast(`${formData.name || entity.name} ${t('modules:favorite.actions.sent_to_combat')}`);
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 font-bold text-[10px] tracking-widest hover:bg-rose-500/20 transition-all flex items-center gap-2 border border-rose-500/20"
                        >
                            <Sword size={14} />
                            {t('common:sections.combat')}
                        </button>
                    )}

                    {(formData.type === 'npc' || formData.type === 'place') && (
                        <button
                            onClick={() => {
                                addToken({
                                    name: formData.name || entity.name,
                                    avatar: formData.tokenUrl || formData.imageUrl || entity.tokenUrl || entity.imageUrl || '',
                                    x: 200,
                                    y: 200,
                                    size: 1
                                });
                                gmToast(`${formData.name || entity.name} ${t('modules:favorite.actions.sent_to_map')}`);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-[10px] tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2 border border-emerald-500/20"
                        >
                            <MapPin size={14} />
                            {t('common:sections.map')}
                        </button>
                    )}

                    <div className="h-6 w-px bg-white/10 mx-2" />

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const newVal = !formData.isSyncedToPlayerHub;
                                setFormData(prev => ({ ...prev, isSyncedToPlayerHub: newVal }));
                                updateFavorite(entity.id, { isSyncedToPlayerHub: newVal });
                                gmToast(`${formData.name || entity.name} ${newVal ? t('modules:favorite.actions.synced_player') : t('modules:favorite.actions.removed_player')}`);
                            }}
                            className={`px-4 py-2 rounded-xl border font-bold text-[10px] tracking-widest transition-all flex items-center gap-2
                                ${formData.isSyncedToPlayerHub
                                    ? 'bg-accent/20 border-accent text-accent shadow-glow-accent'
                                    : 'bg-app-bg border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}
                        >
                            <span className="material-symbols-outlined text-sm">{formData.isSyncedToPlayerHub ? 'visibility' : 'visibility_off'}</span>
                            {t('modules:favorite.sections.player_hub')}
                        </button>

                        {formData.isSyncedToPlayerHub && (
                            <button
                                onClick={() => {
                                    const newMode = formData.displayMode === 'theater' ? 'card' : 'theater';
                                    setFormData(prev => ({ ...prev, displayMode: newMode }));
                                    updateFavorite(entity.id, { displayMode: newMode });
                                    gmToast(newMode === 'theater' ? t('modules:favorite.actions.theater_active') : t('modules:favorite.actions.card_active'));
                                }}
                                className={`w-10 rounded-xl border transition-all flex items-center justify-center
                                    ${formData.displayMode === 'theater'
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-glow-amber/20'
                                        : 'bg-app-bg border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}
                                title={formData.displayMode === 'theater' ? t('common:sections.card') : t('common:sections.theater')}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {formData.displayMode === 'theater' ? 'close_fullscreen' : 'fullscreen'}
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-white/10 mx-2" />

                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-xl bg-accent text-slate-950 font-black text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
                    >
                        <Save size={16} />
                        {t('common:actions.save')}
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {/* 2. Identity Banner (Hero Section) */}
                <section className="relative px-12 py-16 overflow-hidden border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center gap-6">
                        <div className="space-y-2 w-full max-w-3xl">
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-transparent text-5xl md:text-7xl font-black text-white text-center focus:outline-none placeholder:text-slate-800 tracking-tighter"
                                placeholder={t('modules:favorite.placeholders.hero_name')}
                            />
                            <input
                                type="text"
                                value={formData.subtitle || ''}
                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                className="w-full bg-transparent text-lg md:text-xl font-medium text-accent text-center focus:outline-none placeholder:text-slate-800 tracking-wide"
                                placeholder={t('modules:favorite.placeholders.hero_subtitle')}
                            />
                        </div>

                        {/* Type Selector Tabs */}
                        <div className="flex bg-app-surface/80 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                            {(['npc', 'place', 'item', 'lore'] as const).map(t_type => {
                                const cfg = typeConfig[t_type];
                                const isActive = formData.type === t_type;
                                return (
                                    <button
                                        key={t_type}
                                        onClick={() => setFormData({ ...formData, type: t_type })}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                            ${isActive
                                                ? `${cfg.bg} ${cfg.color} shadow-inner`
                                                : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <cfg.icon size={14} />
                                        {t(`modules:favorite.categories.${t_type}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 3. Content Grid */}
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/5 border-x border-white/5">

                    {/* LEFT COLUMN: VISUALS */}
                    <div className="lg:col-span-3 p-8 space-y-8 bg-app-bg/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <ImageIcon size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:favorite.sections.visual_assets')}</h3>
                        </div>

                        {/* Portrait */}
                        <div className="space-y-4">
                            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden glass-panel border border-white/10 group shadow-2xl">
                                {resolvedImageUrl ? (
                                    <img src={resolvedImageUrl} alt="Portrait" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                                        <ImageIcon size={48} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('modules:favorite.sections.no_portrait')}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => setBrowserTarget('imageUrl')}
                                    className="absolute bottom-4 right-4 p-3 rounded-full bg-accent text-slate-950 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                    title={t('common:mediaBrowser.importAsset')}
                                >
                                    <FolderOpen size={18} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder={t('common:standby')}
                                value={formData.imageUrl || ''}
                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="w-full bg-app-bg/50 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-slate-500 focus:outline-none focus:border-accent/30 font-mono"
                            />
                        </div>

                        {/* Token */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-accent/30 bg-app-bg group shadow-lg">
                                    {resolvedTokenUrl ? (
                                        <img src={resolvedTokenUrl} alt="Token" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                                            <Layers size={24} />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setBrowserTarget('tokenUrl')}
                                        className="absolute inset-0 flex items-center justify-center bg-app-bg/60 opacity-0 group-hover:opacity-100 transition-all"
                                        title={t('common:mediaBrowser.importAsset')}
                                    >
                                        <FolderOpen size={16} className="text-accent" />
                                    </button>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('modules:favorite.placeholders.select_token')}</h4>
                                    <input
                                        type="text"
                                        placeholder={t('common:standby')}
                                        value={formData.tokenUrl || ''}
                                        onChange={e => setFormData({ ...formData, tokenUrl: e.target.value })}
                                        className="w-full bg-app-bg/50 border border-white/5 rounded-lg px-3 py-1.5 text-[9px] text-slate-500 focus:outline-none focus:border-accent/30 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN: NARRATIVE */}
                    <div className="lg:col-span-5 p-12 space-y-6 bg-app-bg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-500">
                                <ScrollText size={16} />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:favorite.sections.narrative')}</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 font-serif italic">{t('modules:favorite.sections.dossier')}</span>
                        </div>

                        <textarea
                            value={formData.lore || ''}
                            onChange={e => setFormData({ ...formData, lore: e.target.value })}
                            className="w-full bg-transparent border-none text-lg md:text-xl text-slate-300 focus:outline-none min-h-[350px] leading-relaxed custom-scrollbar font-serif italic placeholder:text-slate-700"
                            placeholder={t('modules:favorite.placeholders.lore_placeholder')}
                        />

                        {/* Secret GM Notes */}
                        <div className="pt-8 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-accent/50">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:favorite.sections.notes_secret')}</h3>
                            </div>
                            <textarea
                                value={formData.secretNotes || ''}
                                onChange={e => setFormData({ ...formData, secretNotes: e.target.value })}
                                className="w-full bg-app-bg/30 border border-white/5 rounded-2xl p-6 text-sm text-accent/80 focus:outline-none focus:border-accent/30 min-h-[200px] leading-relaxed custom-scrollbar font-mono placeholder:text-slate-900"
                                placeholder={t('modules:favorite.placeholders.secret_placeholder')}
                            />
                        </div>

                        {/* AI Dialogue Prep Section */}
                        {formData.type === 'npc' && (
                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MessageSquare size={16} />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:favorite.detail.dialogue_prep')}</h3>
                                    </div>
                                    <button
                                        onClick={handleGenerateDialogues}
                                        disabled={isGeneratingDialogues}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isGeneratingDialogues 
                                                ? 'bg-accent/10 text-accent/50 animate-pulse' 
                                                : 'bg-accent text-slate-950 hover:scale-105 active:scale-95 shadow-lg shadow-accent/20'
                                        }`}
                                    >
                                        {isGeneratingDialogues 
                                            ? t('modules:favorite.placeholders.ai_oracle_wait') 
                                            : t('modules:favorite.oracle.title')}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {entity.dialoguePrep && entity.dialoguePrep.length > 0 ? (
                                        entity.dialoguePrep.map((line, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => handleCopyDialogue(line)}
                                                className="group relative bg-app-surface/40 hover:bg-accent/5 border border-white/5 hover:border-accent/20 rounded-2xl p-6 cursor-pointer transition-all animate-in slide-in-from-bottom-4"
                                                style={{ animationDelay: `${idx * 150}ms` }}
                                            >
                                                <p className="text-lg text-slate-300 italic pr-12 leading-relaxed">"{line}"</p>
                                                <div className="absolute top-6 right-6 p-2 rounded-lg bg-accent/10 text-accent opacity-0 group-hover:opacity-100 transition-all">
                                                    <Copy size={16} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-app-surface/20">
                                            <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.3em]">{t('modules:favorite.placeholders.ai_no_dialogue')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: MECHANICS */}
                    <div className="lg:col-span-4 p-8 space-y-12 bg-app-bg/50 backdrop-blur-sm">

                        {/* Ownership Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-slate-500">
                                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:favorite.sections.assignment')}</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <section className="space-y-2 text-left">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('modules:favorite.placeholders.campaign')}</label>
                                    <select
                                        title={t('modules:favorite.placeholders.campaign')}
                                        value={formData.campaignId || ''}
                                        onChange={e => setFormData({ ...formData, campaignId: e.target.value || undefined, ownerId: undefined })}
                                        className="w-full bg-app-surface/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-accent/30"
                                    >
                                        <option value="">-- {t('modules:favorite.actions.none_campaign')} --</option>
                                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </section>

                                {formData.campaignId && formData.type === 'item' && (
                                    <section className="space-y-2 text-left animate-in fade-in">
                                        <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-1">{t('modules:favorite.placeholders.owner_private')}</label>
                                        <select
                                            title={t('modules:favorite.placeholders.owner_private')}
                                            value={formData.ownerId || ''}
                                            onChange={e => setFormData({ ...formData, ownerId: e.target.value || undefined })}
                                            className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                                        >
                                            <option value="">-- {t('modules:favorite.actions.none_inventory')} --</option>
                                            {players
                                                .flatMap(p => p.characters)
                                                .filter(c => c.campaignId === formData.campaignId)
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                    </section>
                                )}
                            </div>
                        </div>

                        {/* Attributes Section */}
                        <div className="space-y-6 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Activity size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:favorite.sections.attributes')}</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        const attrs = { ...(formData.attributes || {}) };
                                        attrs[`${t('modules:favorite.detail.traits')} ${Object.keys(attrs).length + 1}`] = '...';
                                        setFormData({ ...formData, attributes: attrs });
                                    }}
                                    className="p-1 px-3 rounded-lg bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all flex items-center gap-1"
                                >
                                    <Plus size={12} /> {t('common:actions.add')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(formData.attributes || {}).map(([key, value]) => (
                                    <div key={key} className="group relative flex items-center glass-panel border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all">
                                        <div className="flex-1 space-y-1">
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                {t([`modules:favorite.attributes.${key.trim().toLowerCase()}`, key])}
                                            </div>
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={e => {
                                                    const attrs = { ...formData.attributes };
                                                    attrs[key] = e.target.value;
                                                    setFormData({ ...formData, attributes: attrs });
                                                }}
                                                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const attrs = { ...formData.attributes };
                                                delete attrs[key];
                                                setFormData({ ...formData, attributes: attrs });
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:text-rose-400 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gauges Section */}
                        <div className="space-y-8 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Layers size={16} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('modules:favorite.sections.gauges')}</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        const stats = { ...(formData.stats || {}) };
                                        stats[`${t('modules:favorite.detail.gauges')} ${Object.keys(stats).length + 1}`] = 50;
                                        setFormData({ ...formData, stats });
                                    }}
                                    className="p-1 px-3 rounded-lg bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all flex items-center gap-1"
                                >
                                    <Plus size={12} /> {t('common:actions.add')}
                                </button>
                            </div>

                            <div className="space-y-8">
                                {Object.entries(formData.stats || {}).map(([stat, val]) => (
                                    <div key={stat} className="group space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                {t([`modules:favorite.attributes.${stat.trim().toLowerCase()}`, stat])}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-accent">{val}%</span>
                                                <button
                                                    onClick={() => {
                                                        const stats = { ...formData.stats };
                                                        delete stats[stat];
                                                        setFormData({ ...formData, stats });
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative h-2 bg-app-bg rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-accent transition-all duration-1000 ease-out shadow-glow-accent"
                                                style={{ width: `${val}%` }}
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={val}
                                                onChange={e => {
                                                    const stats = { ...formData.stats };
                                                    stats[stat] = parseInt(e.target.value);
                                                    setFormData({ ...formData, stats });
                                                }}
                                                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
