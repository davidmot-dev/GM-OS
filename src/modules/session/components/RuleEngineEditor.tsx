import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Sparkles, Brain, Save, ArrowLeft, PenTool, Music, Beaker, User,
    BookOpen, Dice5, Zap, Map, Archive, Plus, Trash2, type LucideIcon, Eye 
} from 'lucide-react';
import type { GameDriver, TacticalConfig } from '../../../types/drivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { gmToast } from '../../../stores/useToastStore';
import { Loader2 } from 'lucide-react';
import { useRuleEngine } from '../hooks/useRuleEngine';
import LienAuCorpus from '../../forge/corpus/LienAuCorpus';
import PanneauDesPersonas from '../../forge/corpus/PanneauDesPersonas';

export const RuleEngineEditor: React.FC = () => {
    const { t } = useTranslation(['settings', 'modules']);
    const { setEditingTemplateId, setCurrentView } = useSessionOSStore();
    const {
        driver,
        activeSection,
        setActiveSection,
        isGenerating,
        dice,
        combat,
        tactical,
        handleUpdate,
        handleBack,
        handleAutoGenerate,
        customSheetTemplates,
        gems
    } = useRuleEngine();

    if (!driver) return (
        <div className="flex-1 flex items-center justify-center bg-app-bg text-app-text/40 font-display uppercase tracking-widest text-xs">
            {t('modules:session.rule_engine_editor.loading')}
        </div>
    );

    const navItems = [
        { id: 'core', label: t('modules:session.rule_engine_editor.nav.core'), icon: Dice5, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { id: 'combat', label: t('modules:session.rule_engine_editor.nav.combat'), icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { id: 'tactical', label: t('modules:session.rule_engine_editor.nav.tactical'), icon: Map, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'ai', label: t('modules:session.rule_engine_editor.nav.ai'), icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { id: 'loot', label: t('modules:session.rule_engine_editor.nav.loot'), icon: Archive, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'notebook', label: t('modules:session.rule_engine_editor.nav.notebook'), icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg font-sans text-app-text/90">
            {/* Top Premium Bar */}
            <div className="h-20 border-b border-app-border/10 bg-app-surface/40 backdrop-blur-xl px-8 flex items-center justify-between z-50">
                <div className="flex-1 flex items-center gap-6">
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-accent/40 transition-all shadow-lg hover:scale-105 active:scale-95 group"
                        title={t('modules:session.rule_engine_editor.back_to_templates')}
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="h-10 w-[1px] bg-white/10 mx-2" />
                    <div className="flex-1 flex items-center gap-4">
                        <input
                            type="text"
                            value={driver.emoji || ''}
                            onChange={e => handleUpdate({ emoji: e.target.value })}
                            className="w-12 h-12 bg-app-bg/40 text-center text-2xl rounded-2xl p-1 border border-app-border/20 focus:outline-none focus:border-accent/50 shadow-inner"
                            maxLength={2}
                            title={t('modules:session.rule_engine_editor.emoji_title')}
                        />
                        <div className="flex-1 min-w-0">
                            <input
                                type="text"
                                value={driver.name || ''}
                                onChange={e => handleUpdate({ name: e.target.value })}
                                className="bg-transparent text-xl font-black text-app-text focus:outline-none border-b border-transparent focus:border-accent/40 transition-all w-full min-w-[600px] font-display uppercase tracking-tight"
                                placeholder={t('modules:session.rule_engine_editor.name_placeholder')}
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                                    {t('modules:session.rule_engine_editor.core_label')}
                                </span>
                                <span className="text-[9px] text-app-text/20 font-bold uppercase tracking-tighter">{t('common:id_label')}: {driver.id}</span>

                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => gmToast(t('modules:session.rule_engine_editor.sync_success'), "success")}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-app-bg font-black text-xs uppercase tracking-widest shadow-glow-accent/20 hover:opacity-90 transition-all"
                    title={t('modules:session.rule_engine_editor.sync_btn')}
                >
                    <Save size={16} /> {t('modules:session.rule_engine_editor.sync_btn')}
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-24 border-r border-app-border/10 bg-app-surface/20 backdrop-blur-md flex flex-col items-center py-8 gap-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as any)}
                            className={`group relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                activeSection === item.id 
                                ? `${item.bg} ${item.color} shadow-lg ring-1 ring-white/10` 
                                : 'text-app-text/40 hover:text-app-text hover:bg-app-surface/50'
                            }`}
                            title={item.label}
                        >
                            <item.icon size={22} className={`transition-transform duration-300 ${activeSection === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {activeSection === item.id && (
                                <div className={`absolute -right-1 w-1 h-6 rounded-full ${item.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Workspace */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(var(--app-accent-rgb),0.05),transparent_40%)]">
                    <div className="max-w-5xl mx-auto p-12 animate-fade-in">
                        
                        {activeSection === 'core' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-app-text tracking-tight uppercase italic flex items-center gap-4 font-display">
                                        <Dice5 className="text-accent" size={32} />
                                        {t('modules:session.rule_engine_editor.core.title')} <span className="text-accent/20 underline decoration-accent/40">Core</span>
                                    </h2>
                                    <p className="text-app-text/40 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        {t('modules:session.rule_engine_editor.core.description')}
                                    </p>
                                </header>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-3 block px-1">{t('modules:session.rule_engine_editor.core.engine_label')}</label>
                                            <select 
                                                value={dice.engine || 'standard'}
                                                onChange={e => handleUpdate({ dice: { ...dice, engine: e.target.value as GameDriver['dice']['engine'] } })}
                                                className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/20 text-sm text-app-text focus:border-accent/50 outline-none transition-all appearance-none cursor-pointer"
                                                title={t('modules:session.rule_engine_editor.core.engine_label')}
                                            >
                                                <option value="standard">{t('modules:session.rule_engine_editor.core.engine_options.standard')}</option>
                                                <option value="exploding">{t('modules:session.rule_engine_editor.core.engine_options.exploding')}</option>
                                                <option value="formula">{t('modules:session.rule_engine_editor.core.engine_options.formula')}</option>
                                                <option value="threshold">{t('modules:session.rule_engine_editor.core.engine_options.threshold')}</option>
                                                <option value="pool">{t('modules:session.rule_engine_editor.core.engine_options.pool')}</option>
                                                <option value="pool_explode">{t('modules:session.rule_engine_editor.core.engine_options.pool_explode')}</option>
                                                <option value="advantage">{t('modules:session.rule_engine_editor.core.engine_options.advantage')}</option>
                                                <option value="disadvantage">{t('modules:session.rule_engine_editor.core.engine_options.disadvantage')}</option>
                                                <option value="year-zero">{t('modules:session.rule_engine_editor.core.engine_options.year-zero')}</option>
                                                <option value="yze">{t('modules:session.rule_engine_editor.core.engine_options.yze')}</option>
                                                <option value="fate">{t('modules:session.rule_engine_editor.core.engine_options.fate')}</option>
                                                <option value="rolemaster">{t('modules:session.rule_engine_editor.core.engine_options.rolemaster')}</option>
                                                <option value="2d20">{t('modules:session.rule_engine_editor.core.engine_options.twodtwenty')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-3 block px-1">{t('modules:session.rule_engine_editor.core.default_dice_label')}</label>
                                            <input 
                                                type="text"
                                                value={dice.defaultDice || ''}
                                                onChange={e => handleUpdate({ dice: { ...dice, defaultDice: e.target.value } })}
                                                className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/20 font-mono text-base text-accent focus:border-accent/50 outline-none transition-all shadow-inner"
                                                placeholder={t('modules:session.rule_engine_editor.core.default_dice_placeholder')}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm flex flex-col justify-center">
                                        <div className="mb-6">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 mb-3 block px-1">{t('modules:session.rule_engine_editor.core.sheet_link_label')}</label>
                                            <div className="flex gap-2">
                                                <select 
                                                    value={driver.templateId}
                                                    onChange={e => handleUpdate({ templateId: e.target.value })}
                                                    className="flex-1 bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/20 text-sm text-app-text focus:border-accent/50 outline-none transition-all appearance-none cursor-pointer"
                                                    title={t('modules:session.rule_engine_editor.core.sheet_link_label')}
                                                >
                                                    <option value="">{t('modules:session.rule_engine_editor.core.sheet_link_none')}</option>
                                                    {[...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates].map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                                {driver.templateId && (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingTemplateId(driver.templateId);
                                                            setCurrentView('template-editor');
                                                        }}
                                                        className="p-4 bg-accent/20 border border-accent/40 text-accent rounded-2xl hover:bg-accent hover:text-white transition-all shadow-glow-accent/20"
                                                        title={t('common:actions.view')}
                                                    >
                                                        <Eye size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-app-text/40 leading-relaxed italic px-2">
                                            {t('modules:session.rule_engine_editor.core.sheet_link_description')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'combat' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-app-text tracking-tight uppercase italic flex items-center gap-4 font-display">
                                        <Zap className="text-indigo-400" size={32} />
                                        {t('modules:session.rule_engine_editor.combat.title')} & <span className="text-indigo-500/20 underline decoration-indigo-500/40">{t('modules:session.rule_engine_editor.combat.initiative_subtitle')}</span>
                                    </h2>
                                    <p className="text-app-text/40 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        {t('modules:session.rule_engine_editor.combat.description')}
                                    </p>
                                </header>

                                <div className="grid grid-cols-12 gap-8">
                                    <div className="col-span-7 p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 block px-1">{t('modules:session.rule_engine_editor.combat.init_formula_label')}</label>
                                                <input 
                                                    type="text"
                                                    value={combat.initiativeFormula || ''}
                                                    onChange={e => handleUpdate({ combat: { ...combat, initiativeFormula: e.target.value } })}
                                                    className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 font-mono text-base text-indigo-400 focus:border-indigo-500/40 outline-none shadow-inner"
                                                    placeholder={t('modules:session.rule_engine_editor.combat.init_formula_placeholder')}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 block px-1">{t('modules:session.rule_engine_editor.combat.health_type_label')}</label>
                                                <select 
                                                    value={combat.defaultHealthType || 'hp'}
                                                    onChange={e => handleUpdate({ combat: { ...combat, defaultHealthType: e.target.value as GameDriver['combat']['defaultHealthType'] } })}
                                                    className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 text-sm text-app-text focus:border-indigo-500/40 outline-none appearance-none cursor-pointer"
                                                    title={t('modules:session.rule_engine_editor.combat.health_type_label')}
                                                >
                                                    <option value="hp">{t('modules:session.rule_engine_editor.combat.health_options.hp')}</option>
                                                    <option value="wounds">{t('modules:session.rule_engine_editor.combat.health_options.wounds')}</option>
                                                    <option value="boxes">{t('modules:session.rule_engine_editor.combat.health_options.boxes')}</option>
                                                    <option value="clocks">{t('modules:session.rule_engine_editor.combat.health_options.clocks')}</option>
                                                    <option value="anatomy">{t('modules:session.rule_engine_editor.combat.health_options.anatomy')}</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/*
                                          **La santé de départ, amendable à la main.**

                                          Le champ est né le 2026-08-15, après que
                                          le pilote d'Alien a été forgé : sans cet
                                          encart, il aurait fallu redériver un
                                          quart d'heure pour une seule valeur, et
                                          repasser par le renommage et le
                                          nettoyage des anciens pilotes.

                                          C'est vrai de tout champ neuf : un pilote
                                          déjà enregistré ne se reforge pas pour
                                          suivre le code, il s'amende.
                                        */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 block px-1">
                                                Santé de départ — lue sur la fiche
                                            </label>
                                            <input
                                                type="text"
                                                value={combat.santeDeDepart || ''}
                                                onChange={e => handleUpdate({ combat: { ...combat, santeDeDepart: e.target.value } })}
                                                className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 font-mono text-base text-indigo-400 focus:border-indigo-500/40 outline-none shadow-inner"
                                                placeholder="ex. force — ou (force + agilite) / 2 + 1"
                                            />
                                            <p className="text-[9px] text-app-text/30 font-bold uppercase tracking-widest mt-3 px-2 leading-relaxed">
                                                Formule sur des identifiants de champs de la fiche. Vide : chaque écran
                                                garde les points de vie qu'il fournit. Un nombre seul n'a pas sa place
                                                ici — il vaudrait pour tout le monde.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-4 block px-1">{t('modules:session.rule_engine_editor.combat.sort_order_label')}</label>
                                            <div className="flex p-1 bg-app-bg/40 rounded-2xl border border-app-border/10 overflow-hidden">
                                                <button 
                                                    onClick={() => handleUpdate({ combat: { ...combat, initiativeSort: 'desc' } })}
                                                    className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${combat.initiativeSort !== 'asc' ? 'bg-indigo-500 text-white shadow-lg' : 'text-app-text/40 hover:text-app-text'}`}
                                                    title={t('modules:session.rule_engine_editor.combat.descending_title')}
                                                >
                                                    {t('modules:session.rule_engine_editor.combat.descending')}
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdate({ combat: { ...combat, initiativeSort: 'asc' } })}
                                                    className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${combat.initiativeSort === 'asc' ? 'bg-indigo-500 text-white shadow-lg' : 'text-app-text/40 hover:text-app-text'}`}
                                                    title={t('modules:session.rule_engine_editor.combat.ascending_title')}
                                                >
                                                    {t('modules:session.rule_engine_editor.combat.ascending')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-5 p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] flex flex-col justify-between group">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 mb-6 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                {t('modules:session.rule_engine_editor.combat.card_draw_title')}
                                            </h4>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 mb-3 block px-1">{t('modules:session.rule_engine_editor.combat.deck_size_label')}</label>
                                            <input 
                                                type="number"
                                                value={combat.initiativeCards || ''}
                                                onChange={e => handleUpdate({ combat: { ...combat, initiativeCards: e.target.value ? parseInt(e.target.value) : undefined } })}
                                                className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 font-mono text-base text-app-text focus:border-indigo-500/40 outline-none"
                                                placeholder={t('modules:session.rule_engine_editor.combat.deck_size_placeholder')}
                                            />
                                        </div>
                                        <p className="text-[10px] text-app-text/40 leading-relaxed uppercase font-bold tracking-tight border-t border-app-border/10 pt-4 mt-6">
                                            {t('modules:session.rule_engine_editor.combat.card_draw_description')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'tactical' && (
                            <div className="space-y-8">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-app-text tracking-tight uppercase italic flex items-center gap-4 font-display">
                                        <Map className="text-emerald-400" size={32} />
                                        {t('modules:session.rule_engine_editor.tactical.title')} <span className="text-emerald-500/20 underline decoration-emerald-500/40">{t('modules:session.rule_engine_editor.tactical.subtitle')}</span>
                                    </h2>
                                    <p className="text-app-text/40 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        {t('modules:session.rule_engine_editor.tactical.description')}
                                    </p>
                                </header>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/20 shadow-xl">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] font-black uppercase text-app-text tracking-[0.2em]">{t('modules:session.rule_engine_editor.tactical.enable_ai_label')}</label>
                                            <span className="text-[10px] text-emerald-500/60 font-medium italic">{t('modules:session.rule_engine_editor.tactical.enable_ai_description')}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleUpdate({ tactical: { ...tactical, useTacticalAI: !tactical.useTacticalAI } })}
                                            className={`w-14 h-7 rounded-full transition-all relative p-1 ${tactical.useTacticalAI ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-app-surface/40 border border-app-border/20'}`}
                                            title={tactical.useTacticalAI ? t('modules:session.rule_engine_editor.tactical.disable_ai_title') : t('modules:session.rule_engine_editor.tactical.enable_ai_title')}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-all transform ${tactical.useTacticalAI ? 'translate-x-7' : 'translate-x-0 opacity-40'}`} />
                                        </button>
                                    </div>

                                    <div className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-12 text-emerald-500/5 -rotate-12 select-none group-hover:scale-110 transition-transform">
                                            <Map size={240} />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="grid grid-cols-12 gap-4 mb-6 px-4">
                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-app-text/40">{t('modules:session.rule_engine_editor.tactical.zone_label')}</div>
                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-app-text/40 text-center">{t('modules:session.rule_engine_editor.tactical.max_threshold_label')}</div>
                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-app-text/40 text-center">{t('modules:session.rule_engine_editor.tactical.modifier_label')}</div>
                                            </div>

                                            <div className="space-y-3">
                                                {(['contact', 'courte', 'moyenne', 'longue', 'extreme'] as const).map(rangeKey => {
                                                    const range = tactical.ranges?.[rangeKey] || { label: t(`modules:session.rule_engine_editor.tactical.ranges.${rangeKey}`), maxUnits: 0, modifier: 0 };
                                                    return (
                                                        <div key={rangeKey} className="grid grid-cols-12 gap-4 items-center p-2 hover:bg-app-surface/40 rounded-2xl transition-all">
                                                            <div className="col-span-4 text-xs font-black uppercase tracking-widest text-app-text/80 pl-2 border-l-2 border-emerald-500/40 font-display">{t(`modules:session.rule_engine_editor.tactical.ranges.${rangeKey}`)}</div>
                                                            <div className="col-span-4 flex justify-center">
                                                                <input 
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={range.maxUnits}
                                                                    onChange={e => {
                                                                        const val = parseFloat(e.target.value);
                                                                        const newRanges = { ...(tactical.ranges || {}) } as TacticalConfig['ranges'];
                                                                        newRanges[rangeKey as keyof TacticalConfig['ranges']] = { ...range, maxUnits: isNaN(val) ? 0 : val };
                                                                        handleUpdate({ tactical: { ...tactical, ranges: newRanges } });
                                                                    }}
                                                                    className="w-24 bg-app-bg/40 text-center py-2.5 rounded-xl border border-app-border/10 text-xs font-mono text-emerald-400 focus:border-emerald-500/50 outline-none"
                                                                    placeholder={t('modules:session.rule_engine_editor.tactical.grid_placeholder')}
                                                                />
                                                            </div>
                                                            <div className="col-span-4 flex justify-center">
                                                                <input 
                                                                    type="number"
                                                                    value={range.modifier}
                                                                    onChange={e => {
                                                                        const val = parseInt(e.target.value);
                                                                        const newRanges = { ...(tactical.ranges || {}) } as TacticalConfig['ranges'];
                                                                        newRanges[rangeKey as keyof TacticalConfig['ranges']] = { ...range, modifier: val };
                                                                        handleUpdate({ tactical: { ...tactical, ranges: newRanges } });
                                                                    }}
                                                                    className={`w-24 bg-app-bg/40 text-center py-2.5 rounded-xl border border-app-border/10 text-xs font-mono focus:border-emerald-500/50 outline-none ${range.modifier > 0 ? 'text-emerald-400' : range.modifier < 0 ? 'text-rose-400' : 'text-app-text/40'}`}
                                                                    placeholder={t('modules:session.rule_engine_editor.tactical.modifier_placeholder')}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'ai' && (
                            <div className="space-y-12 pb-20">
                                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-black text-app-text tracking-tight uppercase italic flex items-center gap-4 font-display">
                                            <Sparkles className="text-violet-400" size={32} />
                                            {t('modules:session.rule_engine_editor.ai.title')} <span className="text-violet-500/20 underline decoration-violet-500/40">{t('modules:session.rule_engine_editor.ai.subtitle')}</span>
                                        </h2>
                                        <p className="text-app-text/40 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                            {t('modules:session.rule_engine_editor.ai.description')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleAutoGenerate}
                                        disabled={isGenerating}
                                        className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                                        title={t('modules:session.rule_engine_editor.ai.generate_btn')}
                                    >
                                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {isGenerating ? t('modules:session.rule_engine_editor.ai.generating') : t('modules:session.rule_engine_editor.ai.generate_btn')}
                                    </button>
                                </header>

                                <div className="space-y-8">
                                    <div className="p-8 bg-app-bg/40 border border-app-border/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Brain size={120} />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-400 mb-6 flex items-center gap-3 font-mono">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                            {t('modules:session.rule_engine_editor.ai.global_prompt_label')}
                                        </h4>
                                        <textarea 
                                            value={driver.aiInstructions || ''}
                                            onChange={e => handleUpdate({ aiInstructions: e.target.value })}
                                            placeholder={t('modules:session.rule_engine_editor.ai.global_prompt_placeholder')}
                                            className="w-full h-64 bg-app-bg/40 text-sm text-app-text/80 p-6 rounded-3xl border border-app-border/10 focus:border-violet-500/40 outline-none transition-all font-mono leading-relaxed custom-scrollbar shadow-inner"
                                        />
                                    </div>

                                    <div className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm relative overflow-hidden group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
                                                <Archive size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-400 font-mono">
                                                    Chemin de l'Atelier (RAG)
                                                </h4>
                                                <p className="text-[9px] text-app-text/40 font-bold uppercase tracking-tight mt-1">
                                                    Répertoire où seront sauvegardées et consultées les fiches de règles
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={driver.ragPath || ''}
                                                onChange={e => handleUpdate({ ragPath: e.target.value })}
                                                placeholder="ex: systems/my-system/rules"
                                                className="w-full bg-app-bg/40 px-6 py-4 rounded-2xl border border-app-border/10 focus:border-violet-500/40 outline-none transition-all font-mono text-sm"
                                            />
                                            <p className="text-[9px] text-app-text/20 font-bold uppercase tracking-widest mt-3 px-2 flex items-center gap-2">
                                                <Sparkles size={10} className="text-violet-400" />
                                                Le chemin doit être relatif au dossier <code className="text-violet-400/60">docs/</code> pour l'indexation IA.
                                            </p>
                                        </div>
                                    </div>

                                    {/*
                                      **Le corpus, puis ce qu'il contient déjà.**
                                      David, le 2026-08-14 : « il n'a pas récupéré
                                      les personas ». Il regardait cet écran, qui
                                      montrait huit zones de texte vides — parce
                                      qu'il n'affiche que l'override du pilote —
                                      pendant que les huit personas du corpus
                                      existaient et servaient à chaque réponse de
                                      l'Oracle. Un écran qui tait ce qui marche
                                      fait refaire le travail déjà fait.
                                    */}
                                    <LienAuCorpus pilote={driver} />

                                    <PanneauDesPersonas
                                        pilote={driver}
                                        lectureSeule
                                        noteLectureSeule={
                                            <p className="text-[11px] text-app-text/40 leading-relaxed">
                                                Ces personas appartiennent au corpus, pas à ce pilote :
                                                toutes les campagnes qui l'emploient les partagent. Elles se
                                                modifient dans la Forge, qui est le seul écran à écrire dans{' '}
                                                <code className="font-mono">docs/</code> — ici, on n'ajoute
                                                qu'un override propre à ce pilote, ci-dessous.
                                            </p>
                                        }
                                    />

                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-app-text/40 flex items-center gap-4 px-2">
                                            {t('modules:session.rule_engine_editor.ai.personas_title')}
                                            <div className="h-px bg-app-border/10 flex-1" />
                                        </h3>
                                        {/*
                                          Le mot « override » est écrit, parce que
                                          ces huit champs vides ne veulent pas dire
                                          « rien n'est défini » : ils veulent dire
                                          « rien n'écrase le corpus ».
                                        */}
                                        <p className="text-[11px] text-app-text/40 leading-relaxed px-2 -mt-2">
                                            Laissez vide pour employer la persona du corpus ci-dessus. Ce qui
                                            est écrit ici ne vaut que pour ce pilote et l'emporte sur elle.
                                        </p>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {gems.map((gem: { id: string; name: string; icon: string }) => {
                                                const iconMap: Record<string, LucideIcon> = { BookOpen, PenTool, Music, Beaker, Map, User, Sparkles, Brain };
                                                const Icon = iconMap[gem.icon] || Brain;
                                                const currValue = driver.aiPersonas?.[gem.id] || '';
                                                return (
                                                    <div key={gem.id} className={`p-6 rounded-[2rem] border transition-all duration-500 ${currValue ? 'bg-violet-500/5 border-violet-500/30' : 'bg-app-surface/20 border-app-border/10 hover:border-app-border/40'} group`}>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-3 rounded-2xl transition-all ${currValue ? 'bg-violet-500 text-white shadow-glow-violet' : 'bg-app-bg text-app-text/40'}`}>
                                                                    <Icon size={18} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${currValue ? 'text-violet-400' : 'text-app-text/40'}`}>{t(gem.name)}</span>
                                                                    <span className="text-[10px] text-app-text/20 font-medium font-sans">{t('modules:session.rule_engine_editor.ai.persona_type_label', { id: gem.id })}</span>
                                                                </div>
                                                            </div>
                                                            {currValue && <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_10px_rgba(139,92,246,1)]" />}
                                                        </div>
                                                        <textarea
                                                            value={currValue}
                                                            onChange={e => {
                                                                 const newVal = e.target.value;
                                                                 const newPersonas = { ...(driver.aiPersonas || {}) };
                                                                 if (newVal.trim() === '') {
                                                                     delete newPersonas[gem.id];
                                                                 } else {
                                                                     newPersonas[gem.id] = newVal;
                                                                 }
                                                                 handleUpdate({ aiPersonas: newPersonas });
                                                            }}
                                                            placeholder={t('modules:session.rule_engine_editor.ai.persona_prompt_placeholder', { name: t(gem.name) })}

                                                            className="w-full h-36 bg-app-bg/40 border border-app-border/10 rounded-2xl p-4 text-xs text-app-text/60 focus:border-violet-500/40 outline-none transition-all font-mono resize-none leading-relaxed custom-scrollbar"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'loot' && (
                            <div className="space-y-12">
                                <header className="space-y-2 mb-10">
                                    <h2 className="text-3xl font-black text-app-text tracking-tight uppercase italic flex items-center gap-4 font-display">
                                        <Archive className="text-amber-400" size={32} />
                                        {t('modules:session.rule_engine_editor.loot.title')} <span className="text-amber-500/20 underline decoration-amber-500/40">{t('modules:session.rule_engine_editor.loot.subtitle')}</span>
                                    </h2>
                                    <p className="text-app-text/40 text-sm max-w-2xl leading-relaxed uppercase tracking-widest font-bold">
                                        {t('modules:session.rule_engine_editor.loot.description')}
                                    </p>
                                </header>

                                <div className="space-y-8">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => {
                                                const newTables = [...(driver.lootTables || [])];
                                                newTables.push({
                                                    id: `table-${Date.now()}`,
                                                    name: t('modules:session.rule_engine_editor.loot.new_table_name'),
                                                    rolls: '1',
                                                    rollMode: 'weighted',
                                                    entries: []
                                                });
                                                handleUpdate({ lootTables: newTables });
                                            }}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-black text-[10px] uppercase tracking-widest shadow-glow-amber/5"
                                        >
                                            <Plus size={14} /> {t('modules:session.rule_engine_editor.loot.create_btn')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8 pb-20">
                                        {(driver.lootTables || []).map((table, tIdx) => (
                                            <div key={table.id} className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm group relative overflow-hidden transition-all hover:bg-app-surface/30">
                                                <div className="absolute top-0 right-0 p-8 text-amber-500/5 -rotate-12 pointer-events-none group-hover:scale-110 transition-transform">
                                                    <Archive size={120} />
                                                </div>

                                                <button 
                                                    onClick={() => {
                                                        const newTables = driver.lootTables?.filter(t => t.id !== table.id);
                                                        handleUpdate({ lootTables: newTables });
                                                    }}
                                                    className="absolute top-6 right-6 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 text-white transition-all opacity-0 group-hover:opacity-100"
                                                    title={t('modules:session.rule_engine_editor.loot.delete_table')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="grid grid-cols-12 gap-8 mb-8 relative z-10">
                                                    <div className="col-span-6">
                                                        <div className="flex items-center justify-between mb-2 px-1">
                                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">{t('modules:session.rule_engine_editor.loot.table_name_label')}</label>
                                                            <span className="text-[8px] font-mono text-app-text/20 bg-black/20 px-2 py-0.5 rounded border border-white/5 select-all" title="Cliquez pour sélectionner l'ID">
                                                                {t('common:id_label')}: {table.id}
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="text"
                                                            value={table.name}
                                                            onChange={e => {
                                                                const newTables = [...(driver.lootTables || [])];
                                                                newTables[tIdx] = { ...table, name: e.target.value };
                                                                handleUpdate({ lootTables: newTables });
                                                            }}
                                                            className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 text-lg font-bold text-app-text focus:border-amber-500/50 outline-none shadow-inner"
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60 mb-2 block px-1">{t('modules:session.rule_engine_editor.loot.rolls_label')}</label>
                                                        <input 
                                                            type="text"
                                                            value={table.rolls || ''}
                                                            onChange={e => {
                                                                const newTables = [...(driver.lootTables || [])];
                                                                newTables[tIdx] = { ...table, rolls: e.target.value };
                                                                handleUpdate({ lootTables: newTables });
                                                            }}
                                                            placeholder="1"
                                                            className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 font-mono text-center text-amber-400 focus:border-amber-500/50 outline-none shadow-inner text-sm"
                                                        />
                                                    </div>
                                                    <div className="col-span-3 flex flex-col justify-end">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <input 
                                                                type="checkbox"
                                                                checked={table.rollMode === 'weighted'}
                                                                onChange={e => {
                                                                    const newTables = [...(driver.lootTables || [])];
                                                                    newTables[tIdx] = { ...table, rollMode: e.target.checked ? 'weighted' : 'independent' };
                                                                    handleUpdate({ lootTables: newTables });
                                                                }}
                                                                id={`weighted-${table.id}`}
                                                                className="w-4 h-4 accent-amber-500 rounded border-white/10"
                                                            />
                                                            <label htmlFor={`weighted-${table.id}`} className="text-[10px] font-black uppercase tracking-widest text-app-text/60">{t('modules:session.rule_engine_editor.loot.weighted_label')}</label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 relative z-10">
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-app-text/30">{t('modules:session.rule_engine_editor.loot.entries_title')}</span>
                                                        <button 
                                                            onClick={() => {
                                                                const newTables = [...(driver.lootTables || [])];
                                                                newTables[tIdx].entries.push({
                                                                    name: t('modules:session.rule_engine_editor.loot.new_item_name'),
                                                                    type: 'item',
                                                                    weight: 1,
                                                                    minAmount: '1'
                                                                });
                                                                handleUpdate({ lootTables: newTables });
                                                            }}
                                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 hover:text-amber-300 transition-colors"
                                                        >
                                                            <Plus size={12} /> {t('modules:session.rule_engine_editor.loot.add_entry_btn')}
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {table.entries.map((entry, eIdx) => (
                                                            <div key={eIdx} className="grid grid-cols-12 gap-2 p-2 bg-app-bg/20 rounded-xl border border-app-border/5 hover:bg-app-bg/40 transition-all items-center">
                                                                <div className="col-span-2">
                                                                    <select
                                                                        value={entry.type || 'item'}
                                                                        onChange={e => {
                                                                            const newTables = [...(driver.lootTables || [])];
                                                                            newTables[tIdx].entries[eIdx] = { ...entry, type: e.target.value as any };
                                                                            handleUpdate({ lootTables: newTables });
                                                                        }}
                                                                        className="w-full bg-black/40 border border-white/5 rounded px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-400 outline-none"
                                                                    >
                                                                        <option value="item">{t('modules:session.rule_engine_editor.loot.entry_types.item')}</option>
                                                                        <option value="table">{t('modules:session.rule_engine_editor.loot.entry_types.table')}</option>
                                                                        <option value="currency">{t('modules:session.rule_engine_editor.loot.entry_types.currency')}</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-span-3">
                                                                    <input 
                                                                        type="text"
                                                                        value={entry.name}
                                                                        onChange={e => {
                                                                            const newTables = [...(driver.lootTables || [])];
                                                                            newTables[tIdx].entries[eIdx] = { ...entry, name: e.target.value };
                                                                            handleUpdate({ lootTables: newTables });
                                                                        }}
                                                                        className="w-full bg-transparent border-b border-white/5 focus:border-amber-500/30 text-xs text-app-text outline-none py-1"
                                                                        placeholder={entry.type === 'table' ? t('modules:session.rule_engine_editor.loot.placeholder_display_name') : t('modules:session.rule_engine_editor.loot.placeholder_name')}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <div className="flex flex-col">
                                                                        <label className="text-[7px] font-bold uppercase text-app-text/20 mb-0.5">{table.rollMode === 'weighted' ? t('modules:session.rule_engine_editor.loot.weight_label') : t('modules:session.rule_engine_editor.loot.chance_label')}</label>
                                                                        <input 
                                                                            type="number"
                                                                            value={entry.weight}
                                                                            onChange={e => {
                                                                                const newTables = [...(driver.lootTables || [])];
                                                                                newTables[tIdx].entries[eIdx] = { ...entry, weight: parseInt(e.target.value) || 0 };
                                                                                handleUpdate({ lootTables: newTables });
                                                                            }}
                                                                            className="w-full bg-black/20 text-center py-1 rounded border border-white/5 text-[10px] font-mono text-amber-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <div className="flex flex-col">
                                                                        <label className="text-[7px] font-bold uppercase text-app-text/20 mb-0.5">{t('modules:session.rule_engine_editor.loot.qty_label')}</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={entry.minAmount || ''}
                                                                            onChange={e => {
                                                                                const newTables = [...(driver.lootTables || [])];
                                                                                newTables[tIdx].entries[eIdx] = { ...entry, minAmount: e.target.value };
                                                                                handleUpdate({ lootTables: newTables });
                                                                            }}
                                                                            className="w-full bg-black/20 text-center py-1 rounded border border-white/5 text-[10px] font-mono text-cyan-400"
                                                                            placeholder="1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-2">
                                                                    {entry.type === 'table' && (
                                                                        <div className="flex flex-col">
                                                                            <label className="text-[7px] font-bold uppercase text-app-text/20 mb-0.5">{t('modules:session.rule_engine_editor.loot.target_id_label')}</label>
                                                                            <input 
                                                                                type="text"
                                                                                value={entry.metadata?.tableId || ''}
                                                                                onChange={e => {
                                                                                    const newTables = [...(driver.lootTables || [])];
                                                                                    const metadata = { ...(entry.metadata || {}), tableId: e.target.value };
                                                                                    newTables[tIdx].entries[eIdx] = { ...entry, metadata };
                                                                                    handleUpdate({ lootTables: newTables });
                                                                                }}
                                                                                className="w-full bg-black/20 text-center py-1 rounded border border-white/5 text-[9px] font-mono text-violet-400"
                                                                                placeholder={t('modules:session.rule_engine_editor.loot.placeholder_table_id')}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="col-span-1 flex justify-end">
                                                                    <button 
                                                                        onClick={() => {
                                                                            const newTables = [...(driver.lootTables || [])];
                                                                            newTables[tIdx].entries.splice(eIdx, 1);
                                                                            handleUpdate({ lootTables: newTables });
                                                                        }}
                                                                        className="p-1 px-2 text-red-400 hover:bg-red-500/20 rounded transition-all"
                                                                    >
                                                                        <Trash2 size={10} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notebook' && (
                            <div className="space-y-8 h-full flex flex-col items-center justify-center py-20">
                                <header className="text-center space-y-4 mb-12">
                                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-glow-blue/5">
                                        <BookOpen className="text-blue-400" size={48} />
                                    </div>
                                    <h2 className="text-4xl font-black text-app-text tracking-tight uppercase italic underline decoration-blue-500/40 font-display">
                                        NotebookLM <span className="text-blue-500/20">Sync</span>
                                    </h2>
                                    <p className="text-app-text/40 text-sm max-w-xl mx-auto leading-relaxed uppercase tracking-widest font-bold">
                                        {t('modules:session.rule_engine_editor.notebook.description')}
                                    </p>
                                </header>

                                <div className="w-full max-w-2xl p-10 bg-app-bg/40 border border-app-border/10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 text-blue-500/5 -rotate-12 translate-x-4 -translate-y-4 pointer-events-none">
                                        <BookOpen size={180} />
                                    </div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2 block px-2 italic">{t('modules:session.rule_engine_editor.notebook.link_label')}</label>
                                        <div className="relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500/40">
                                                <BookOpen size={20} />
                                            </div>
                                            <input 
                                                type="text"
                                                value={driver.defaultNotebookUrl || ''}
                                                onChange={e => handleUpdate({ defaultNotebookUrl: e.target.value })}
                                                placeholder={t('modules:session.rule_engine_editor.notebook.placeholder')}
                                                className="w-full bg-app-bg/60 text-sm text-app-text pl-16 pr-8 py-6 rounded-[2rem] border border-app-border/10 focus:outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner"
                                                title={t('modules:session.rule_engine_editor.notebook.title')}
                                            />
                                        </div>
                                        <div className="p-6 rounded-2xl bg-app-surface/20 border border-app-border/10 space-y-3">
                                            <p className="text-[11px] text-app-text/40 leading-relaxed font-medium">
                                                <strong className="text-blue-400/80 uppercase font-bold">{t('common:note')} :</strong> {t('modules:session.rule_engine_editor.notebook.hint')}
                                            </p>

                                            <div className="flex gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default RuleEngineEditor;
