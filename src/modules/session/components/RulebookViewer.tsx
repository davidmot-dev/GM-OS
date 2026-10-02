import React, { useState } from 'react';
import TexteMarkdown from '../../../components/TexteMarkdown';
import { useTranslation } from 'react-i18next';
import { 
    Sparkles, ArrowLeft, Dice5, Zap, Map, Archive, BookOpen, 
    Hammer, Info, ChevronRight, Globe
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';

import { tousLesPilotes } from '../store/tousLesPilotes';

import { RuleWorkshopViewer } from './RuleWorkshopViewer';

export const RulebookViewer: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { 
        activeCampaignId, 
        campaigns, 
        customGameDrivers,
        setCurrentView
    } = useSessionOSStore();

    const allDrivers = tousLesPilotes(customGameDrivers);
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    
    // Initial driver selection: from campaign or first available
    const initialDriver = allDrivers.find(d => d.id === activeCampaign?.system) || allDrivers[0];
    
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(initialDriver?.id || null);
    const [activeSection, setActiveSection] = useState<'core' | 'combat' | 'tactical' | 'ai' | 'loot' | 'notebook' | 'workshop'>('workshop');

    const driver = allDrivers.find(d => d.id === selectedDriverId);

    if (!driver) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 bg-app-bg text-app-text/40">
                <Hammer size={64} className="mb-6 opacity-20 animate-pulse" />
                <h2 className="text-xl font-bold uppercase tracking-widest">{t('modules:session.template_dashboard.status.no_drivers_found')}</h2>
                <button 
                    onClick={() => setCurrentView('cockpit')}
                    className="mt-8 px-6 py-2 bg-accent/20 border border-accent/40 text-accent rounded-xl hover:bg-accent hover:text-app-on-accent transition-all font-black text-xs uppercase tracking-widest"
                >
                    {t('modules:session.header.back_to_cockpit')}
                </button>
            </div>
        );
    }

    const navItems = [
        { id: 'workshop', label: t('modules:session.rule_engine_editor.nav.workshop'), icon: Sparkles, color: 'text-gm-violet', bg: 'bg-gm-violet/10' },
        { id: 'core', label: t('modules:session.rule_engine_editor.nav.core'), icon: Dice5, color: 'text-gm-cyan', bg: 'bg-gm-cyan/10' },
        { id: 'combat', label: t('modules:session.rule_engine_editor.nav.combat'), icon: Zap, color: 'text-gm-violet', bg: 'bg-gm-violet/10' },
        { id: 'tactical', label: t('modules:session.rule_engine_editor.nav.tactical'), icon: Map, color: 'text-gm-emerald', bg: 'bg-gm-emerald/10' },
        { id: 'ai', label: t('modules:session.rule_engine_editor.nav.ai'), icon: Sparkles, color: 'text-gm-violet', bg: 'bg-gm-violet/10' },
        { id: 'loot', label: t('modules:session.rule_engine_editor.nav.loot'), icon: Archive, color: 'text-gm-gold', bg: 'bg-gm-gold/10' },
        { id: 'notebook', label: t('modules:session.rule_engine_editor.nav.notebook'), icon: BookOpen, color: 'text-etat-info', bg: 'bg-etat-info/10' },
    ];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-app-bg text-app-text">
            {/* Header Premium Grimoire */}
            <div className="h-24 border-b border-app-border/10 bg-app-surface/40 backdrop-blur-3xl px-8 flex items-center justify-between z-50">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setCurrentView('cockpit')}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-app-text/5 border border-app-text/10 text-app-text/40 hover:text-app-text hover:border-accent/40 transition-all shadow-xl hover:scale-105 active:scale-95 group"
                    >
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    
                    <div className="h-12 w-[1px] bg-app-text/10" />

                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-app-bg/60 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-app-text/5">
                            {driver.emoji}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black font-display uppercase tracking-tight italic text-app-text drop-shadow-glow-accent/20">
                                    {driver.name}
                                </h1>
                                <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-ui-10 font-black text-accent uppercase tracking-widest">
                                    v{driver.version}
                                </span>
                            </div>
                            <p className="text-ui-10 font-bold text-app-text/40 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                                <Globe size={10} className="text-accent" />
                                {t('modules:session.header.grimoire_label')} — {driver.author}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Switcher Sub-nav */}
                    <div className="flex bg-app-bg/20 p-1 rounded-2xl border border-app-text/5">
                        <button 
                            onClick={() => setActiveSection('workshop')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeSection === 'workshop' 
                                    ? 'bg-gm-violet text-app-bg shadow-glow-purple/20' 
                                    : 'text-app-text/40 hover:text-app-text'
                            }`}
                        >
                            {t('modules:session.rule_engine_editor.nav.workshop')}
                        </button>
                        <button 
                            onClick={() => setActiveSection('core')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeSection !== 'workshop' 
                                    ? 'bg-accent text-app-on-accent shadow-glow-accent/20' 
                                    : 'text-app-text/40 hover:text-app-text'
                            }`}
                        >
                            {t('modules:session.rule_engine_editor.nav.system_ref')}
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-app-text/10 mx-2" />

                    {/* System Selector if multiple exist */}
                    {allDrivers.length > 1 && (
                        <div className="flex items-center gap-2 bg-app-bg/20 p-1.5 rounded-2xl border border-app-text/5">
                            <select 
                                value={selectedDriverId || ''}
                                onChange={(e) => setSelectedDriverId(e.target.value)}
                                className="bg-transparent text-xs font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer text-app-text/60 hover:text-accent transition-colors"
                            >
                                {allDrivers.map(d => (
                                    <option key={d.id} value={d.id} className="bg-app-bg text-app-text">{d.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Lateral Nav Sections */}
                <div className="w-28 border-r border-app-border/10 bg-app-surface/20 backdrop-blur-md flex flex-col items-center py-10 gap-6">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as any)}
                            className={`group relative w-16 h-16 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ${
                                activeSection === item.id 
                                ? `${item.bg} ${item.color} shadow-glow-accent/10 ring-1 ring-app-text/10` 
                                : 'text-app-text/30 hover:text-app-text/60 hover:bg-app-surface/40'
                            }`}
                        >
                            <item.icon size={24} className={`transition-transform duration-300 ${activeSection === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-ui-8 font-black uppercase tracking-tighter mt-1 opacity-60">{item.id}</span>
                            {activeSection === item.id && (
                                <div className={`absolute -right-1 w-1.5 h-8 rounded-full ${item.color.replace('text', 'bg')} shadow-[0_0_15px_currentColor]`} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Viewer */}
                <div className="flex-1 overflow-hidden flex flex-col bg-[radial-gradient(circle_at_top_right,rgba(var(--app-accent-rgb),0.03),transparent_50%)]">
                    {activeSection === 'workshop' ? (
                        // Le sélecteur du bandeau pilote l'atelier autant que la
                        // référence. Sans cela il ne changeait que le titre.
                        <RuleWorkshopViewer driverId={driver.id} />
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                             <div className="max-w-4xl mx-auto py-16 px-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                 {/* Section Rendering Logic */}
                                 <div className="space-y-10">
                            {activeSection === 'core' && (
                                <div className="space-y-8">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-4 text-gm-cyan">
                                            <Dice5 size={32} />
                                            <h2 className="text-4xl font-black uppercase tracking-tighter italic font-display">{t('modules:session.rule_engine_editor.core.title')}</h2>
                                        </div>
                                        <p className="text-app-text/60 text-lg leading-relaxed italic border-l-4 border-gm-cyan/30 pl-6">
                                            {driver.description}
                                        </p>
                                    </header>

                                    <div className="grid grid-cols-2 gap-8 mt-12">
                                        <div className="p-8 bg-app-surface/30 rounded-[3rem] border border-app-text/5 space-y-6">
                                            <div className="flex items-center gap-3 text-gm-cyan/60 uppercase text-ui-10 font-black tracking-widest">
                                                <Info size={14} /> {t('modules:session.rule_engine_editor.core.engine_label')}
                                            </div>
                                            <div className="text-3xl font-black text-app-text uppercase tracking-tight">
                                                {driver.dice.engine || 'Standard'}
                                            </div>
                                            <p className="text-xs text-app-text/40 font-medium leading-relaxed">
                                                {t(`modules:session.rule_engine_editor.core.engine_options.${driver.dice.engine || 'standard'}`)}
                                            </p>
                                        </div>

                                        <div className="p-8 bg-app-surface/30 rounded-[3rem] border border-app-text/5 space-y-6">
                                            <div className="flex items-center gap-3 text-gm-cyan/60 uppercase text-ui-10 font-black tracking-widest">
                                                <Dice5 size={14} /> {t('modules:session.rule_engine_editor.core.default_dice_label')}
                                            </div>
                                            <div className="text-5xl font-mono font-black text-accent uppercase tracking-tighter drop-shadow-glow-accent/40">
                                                {driver.dice.defaultDice}
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 w-fit">
                                                <span className="text-ui-10 font-black text-accent uppercase tracking-widest">{driver.dice.logic}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'combat' && (
                                <div className="space-y-8">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-4 text-etat-info">
                                            <Zap size={32} />
                                            <h2 className="text-4xl font-black uppercase tracking-tighter italic font-display">{t('modules:session.rule_engine_editor.combat.title')}</h2>
                                        </div>
                                    </header>

                                    <div className="space-y-6">
                                        <div className="p-8 bg-app-surface/30 rounded-[2.5rem] border border-app-text/5">
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-etat-info/60 mb-6">{t('modules:session.rule_engine_editor.combat.stats_title')}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {driver.combat.statsToTrack.map((stat, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-app-bg/20 rounded-2xl border border-app-text/5 group hover:border-etat-info/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-2 h-2 rounded-full ${stat.isMainHP ? 'bg-etat-danger shadow-glow-red' : stat.isResource ? 'bg-etat-info shadow-glow-blue' : 'bg-etat-info'}`} />
                                                            <span className="font-bold text-sm uppercase tracking-tight">{stat.label}</span>
                                                        </div>
                                                        <span className="font-mono text-xs text-app-text/40">{stat.fieldId}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-8 bg-app-surface/30 rounded-[2.5rem] border border-app-text/5 space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-etat-info/60">{t('modules:session.rule_engine_editor.combat.initiative_title')}</h3>
                                                <div className="text-2xl font-mono font-black text-app-text">{driver.combat.initiativeFormula}</div>
                                                <div className="text-ui-10 font-bold text-app-text/30 uppercase tracking-widest">Sort: {driver.combat.initiativeSort || 'DESC'}</div>
                                            </div>
                                            <div className="p-8 bg-app-surface/30 rounded-[2.5rem] border border-app-text/5 space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-etat-info/60">{t('modules:session.rule_engine_editor.combat.damage_title')}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {driver.combat.damageTypes?.map((d, i) => (
                                                        <span key={i} className="px-2 py-1 bg-app-text/5 border border-app-text/10 rounded text-ui-10 font-bold uppercase">{d}</span>
                                                    )) || <span className="text-xs italic opacity-40">Standard</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'tactical' && (
                                <div className="space-y-8">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-4 text-etat-succes">
                                            <Map size={32} />
                                            <h2 className="text-4xl font-black uppercase tracking-tighter italic font-display">{t('modules:session.rule_engine_editor.tactical.title')}</h2>
                                        </div>
                                    </header>

                                    {driver.tactical ? (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-5 gap-4">
                                                {Object.entries(driver.tactical.ranges).map(([key, range]) => (
                                                    <div key={key} className="p-6 bg-app-surface/30 rounded-3xl border border-app-text/5 text-center space-y-3">
                                                        <div className="text-ui-10 font-black uppercase tracking-widest text-etat-succes/60">{range.label}</div>
                                                        <div className="text-2xl font-black text-app-text">{range.maxUnits}u</div>
                                                        <div className={`text-ui-10 font-bold py-1 rounded-full ${range.modifier >= 0 ? 'bg-etat-succes/10 text-etat-succes' : 'bg-etat-danger/10 text-etat-danger'}`}>
                                                            {range.modifier >= 0 ? `+${range.modifier}` : range.modifier}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-6 bg-etat-succes/5 border border-etat-succes/20 rounded-3xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${driver.tactical.useTacticalAI ? 'bg-etat-succes text-app-bg' : 'bg-app-text/5 text-app-text/20'}`}>
                                                        <Sparkles size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black uppercase tracking-tight">{t('modules:session.rule_engine_editor.tactical.ai_toggle')}</div>
                                                        <p className="text-ui-10 opacity-40 uppercase font-bold">{driver.tactical.useTacticalAI ? t('common:status.enabled') : t('common:status.disabled')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-20 text-center opacity-20 border-2 border-dashed border-app-text/10 rounded-[3rem]">
                                            <Map size={64} className="mx-auto mb-4" />
                                            <p className="uppercase font-black tracking-widest">{t('modules:session.rule_engine_editor.tactical.no_config')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 'ai' && (
                                <div className="space-y-8">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-4 text-gm-violet">
                                            <Sparkles size={32} />
                                            <h2 className="text-4xl font-black uppercase tracking-tighter italic font-display">{t('modules:session.rule_engine_editor.ai.title')}</h2>
                                        </div>
                                    </header>

                                    <div className="space-y-8">
                                        <div className="p-8 bg-app-surface/30 rounded-[2.5rem] border border-app-text/5 space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gm-violet/60">{t('modules:session.rule_engine_editor.ai.instructions_label')}</h3>
                                            <div className="text-base text-app-text/70 leading-relaxed italic prose prose-invert prose-emerald max-w-none">
                                                <TexteMarkdown>
                                                    {driver.aiInstructions || ''}
                                                </TexteMarkdown>
                                            </div>
                                        </div>

                                        {driver.aiPersonas && Object.keys(driver.aiPersonas).length > 0 && (
                                            <div className="grid grid-cols-1 gap-6">
                                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gm-violet/60 px-4">{t('modules:session.rule_engine_editor.ai.personas_title')}</h3>
                                                {Object.entries(driver.aiPersonas).map(([id, text]) => (
                                                    <div key={id} className="p-8 bg-app-bg/30 rounded-[2.5rem] border border-app-text/5 space-y-4 group hover:border-gm-violet/30 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-black uppercase tracking-widest text-gm-violet">{id}</span>
                                                            <div className="w-2 h-2 rounded-full bg-gm-violet shadow-glow-violet" />
                                                        </div>
                                                        <div className="text-sm text-app-text/50 leading-relaxed italic prose prose-invert prose-sm max-w-none">
                                                            <TexteMarkdown>
                                                                {text || ''}
                                                            </TexteMarkdown>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeSection === 'loot' && (
                                <div className="space-y-8">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-4 text-etat-alerte">
                                            <Archive size={32} />
                                            <h2 className="text-4xl font-black uppercase tracking-tighter italic font-display">{t('modules:session.rule_engine_editor.loot.title')}</h2>
                                        </div>
                                    </header>

                                    {driver.lootTables && driver.lootTables.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {driver.lootTables.map((table, idx) => (
                                                <div key={idx} className="p-8 bg-app-surface/30 rounded-[2.5rem] border border-app-text/5 space-y-6">
                                                    <div className="flex items-center justify-between border-b border-app-text/5 pb-4">
                                                        <h3 className="text-xl font-black text-etat-alerte uppercase italic tracking-tight">{table.name}</h3>
                                                        <span className="px-2 py-1 bg-etat-alerte/10 rounded text-ui-10 font-black text-etat-alerte uppercase tracking-widest">
                                                            {table.rollMode}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {table.entries.map((entry, eIdx) => (
                                                            <div key={eIdx} className="flex items-center justify-between text-xs bg-app-bg/20 p-3 rounded-xl border border-app-text/5">
                                                                <span className="font-bold">{entry.name}</span>
                                                                <span className="font-mono text-etat-alerte/60 font-black">{entry.weight}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-20 text-center opacity-20 border-2 border-dashed border-app-text/10 rounded-[3rem]">
                                            <Archive size={64} className="mx-auto mb-4" />
                                            <p className="uppercase font-black tracking-widest">{t('modules:session.rule_engine_editor.loot.no_config')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeSection === 'notebook' && (
                                <div className="space-y-8">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-4 text-etat-info">
                                            <BookOpen size={32} />
                                            <h2 className="text-4xl font-black uppercase tracking-tighter italic font-display">{t('modules:session.rule_engine_editor.notebook.title')}</h2>
                                        </div>
                                    </header>

                                    <div className="p-12 bg-app-surface/30 rounded-[3rem] border border-app-text/5 flex flex-col items-center text-center space-y-8">
                                        <div className="w-24 h-24 bg-etat-info/10 rounded-full flex items-center justify-center text-etat-info border border-etat-info/20 shadow-glow-blue/10">
                                            <BookOpen size={48} />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-black text-app-text uppercase tracking-tight">{t('modules:session.rule_engine_editor.notebook.link_label')}</h3>
                                            <p className="text-app-text/40 text-sm max-w-md mx-auto">
                                                {t('modules:session.rule_engine_editor.notebook.description')}
                                            </p>
                                        </div>
                                        {driver.defaultNotebookUrl ? (
                                            <a 
                                                href={driver.defaultNotebookUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="px-8 py-4 bg-etat-info text-app-bg font-black uppercase text-sm tracking-widest rounded-2xl shadow-glow-blue/40 hover:scale-105 transition-all flex items-center gap-3"
                                            >
                                                {t('modules:session.rule_engine_editor.notebook.open_button')} <ChevronRight size={18} />
                                            </a>
                                        ) : (
                                            <div className="px-8 py-4 bg-app-text/5 border border-app-text/10 rounded-2xl text-app-text/20 font-black uppercase text-xs tracking-widest">
                                                {t('modules:session.rule_engine_editor.notebook.no_link')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
