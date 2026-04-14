import React from 'react';
import { useTranslation } from 'react-i18next';

import CluesManager from './CluesManager';
import { useSessionOSStore } from '../store/index';
import type { Campaign } from '../store/types';
import { 
    Search,
    Image as ImageIcon, Sparkles, Layout, 
    Info, 
    ExternalLink, 
    Save, X, BookOpen, Map, ArrowLeft, Fingerprint, Edit3, Loader2, MapPin, Brain, PenTool, Check,
    Users
} from 'lucide-react';
import NpcManagement from './NpcManagement';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { useCampaignEditor, type CampaignSectionId } from '../hooks/useCampaignEditor';

interface CampaignFormProps {
    campaign?: Campaign | { campaignId: string };
    isNew?: boolean;
    onClose: () => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ campaign, isNew, onClose }) => {
    const { t } = useTranslation(['modules', 'settings']);
    const { pendingPreFill, clearPendingPreFill } = useSessionOSStore();
    const {
        name, setName,
        system, setSystem,
        description, setDescription,
        synopsis, setSynopsis,
        wallpaperUrl, setWallpaperUrl,
        notebookUrl, setNotebookUrl,
        systemPath, setSystemPath,
        campaignPath, setCampaignPath,
        activeLocationIds, setActiveLocationIds,
        aiPersonas, setAiPersonas,
        
        isMediaBrowserOpen, setIsMediaBrowserOpen,
        isGenerating,
        activeSection, setActiveSection,
        
        allTemplates,
        allDrivers,
        gems,
        campaignMaps,
        isEdit,
        hasUnsavedChanges,
        
        handleSubmit,
        handleAutoGenerate
    } = useCampaignEditor({ campaign, isNew, onClose });

    const resolvedWallpaper = useMediaUrl(wallpaperUrl);

    const sidebarItems: { id: CampaignSectionId; icon: React.ElementType; label: string }[] = [
        { id: 'identity', icon: Layout, label: t('modules:session.campaign_form.sidebar.identity') },
        { id: 'narrative', icon: BookOpen, label: t('modules:session.campaign_form.sidebar.narrative') },
        { id: 'clues', icon: Search, label: t('modules:session.campaign_form.sidebar.clues') },
        { id: 'npc', icon: Users, label: t('modules:session.campaign_form.sidebar.npc') },
        { id: 'ambience', icon: ImageIcon, label: t('modules:session.campaign_form.sidebar.ambience') },
        { id: 'world', icon: Map, label: t('modules:session.campaign_form.sidebar.world') },
        { id: 'intelligence', icon: Sparkles, label: t('modules:session.campaign_form.sidebar.intelligence') },
    ];


    return (
        <div className="flex flex-col h-full w-full bg-app-bg text-app-text font-sans overflow-hidden">
            {/* Top Command Bar */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-app-border/10 bg-app-surface/40 backdrop-blur-2xl z-50">
                <div className="flex items-center gap-6">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-xs font-bold border border-white/5"
                    >
                        <ArrowLeft size={14} />
                        {t('modules:session.campaign_form.back_to_cockpit')}
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                            <Fingerprint className="text-accent" size={18} />
                        </div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-app-text/80 font-display">
                            Editor <span className="text-app-text/20 px-2 font-sans">//</span> 
                            <span className="text-accent">{isEdit ? t('modules:session.campaign_form.title_edit') : t('modules:session.campaign_form.title_new')}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        title={t('modules:session.campaign_form.sync_nexus_tooltip')}
                        className={`flex items-center gap-2 font-black px-6 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-all ${
                            hasUnsavedChanges 
                                ? 'bg-accent text-app-bg hover:opacity-90 shadow-glow-accent/40 animate-pulse border border-accent/50' 
                                : 'bg-accent/20 text-accent/60 hover:bg-accent/40 hover:text-accent border border-transparent'
                        }`}
                    >
                        <Save size={14} />
                        {t('modules:session.campaign_form.sync_nexus')}
                    </button>
                    <button 
                        type="button"
                        onClick={onClose}
                        title={t('modules:session.campaign_form.close_tooltip')}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white/20 hover:text-white hover:bg-red-500/20 transition-all border border-white/5"
                    >
                        <X size={18} />
                    </button>

                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Navigation Sidebar */}
                <aside className="w-20 flex flex-col items-center py-8 gap-6 border-r border-app-border/10 bg-app-surface/20 backdrop-blur-xl">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveSection(item.id)}
                            title={item.label}
                            className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                activeSection === item.id 
                                ? 'bg-accent text-app-bg shadow-glow-accent' 
                                : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/60'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="absolute left-full ml-4 px-3 py-1.5 bg-app-bg border border-app-border/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-50 whitespace-nowrap font-display">
                                {item.label}
                            </span>
                        </button>
                    ))}
                    
                    <div className="mt-auto flex flex-col gap-4">
                        <div className="w-8 h-px bg-white/5" />
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/10">
                            <Info size={18} />
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-16 bg-app-bg">
                    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        {/* 1. IDENTITY SECTION */}
                        {activeSection === 'identity' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-app-text flex items-center gap-4 font-display uppercase italic">
                                        <Layout className="text-accent" size={28} />
                                        {t('modules:session.campaign_form.identity.title')}
                                    </h2>
                                    <p className="text-sm text-app-text/40 tracking-wide uppercase font-bold">{t('modules:session.campaign_form.identity.subtitle')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-2 flex items-center gap-2">
                                            <Edit3 size={12} /> {t('modules:session.campaign_form.identity.name_label')}
                                        </label>
                                        <input 
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder={t('modules:session.campaign_form.identity.name_placeholder')}
                                            className="w-full bg-app-surface/20 border border-app-border/10 rounded-2xl py-5 px-6 text-base font-bold tracking-wide focus:outline-none focus:border-accent/40 transition-all text-app-text shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-2 flex items-center gap-2">
                                            <Sparkles size={12} /> {t('modules:session.campaign_form.identity.system_label')}
                                        </label>
                                        <select 
                                            value={system}
                                            onChange={e => setSystem(e.target.value)}
                                            title={t('modules:session.campaign_form.identity.system_label')}
                                            className="w-full bg-app-surface/20 border border-app-border/10 rounded-2xl py-5 px-6 text-base font-bold tracking-wide focus:outline-none focus:border-accent/40 transition-all text-app-text appearance-none cursor-pointer"
                                        >
                                            <optgroup label={t('modules:session.campaign_form.identity.system_groups.drivers')} className="bg-app-bg text-app-text">
                                                {allDrivers.map(d => (
                                                    <option key={d.id} value={d.id} className="bg-app-bg text-app-text">{d.emoji} {d.name}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label={t('modules:session.campaign_form.identity.system_groups.templates')} className="bg-app-bg text-app-text">
                                                {allTemplates.map(t_val => (
                                                    <option key={t_val.id} value={t_val.id} className="bg-app-bg text-app-text">{t_val.emoji} {t_val.name}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-2 flex items-center gap-2">
                                        <Info size={12} /> {t('modules:session.campaign_form.identity.description_label')}
                                    </label>
                                    <input 
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder={t('modules:session.campaign_form.identity.description_placeholder')}
                                        className="w-full bg-app-surface/20 border border-app-border/10 rounded-2xl py-5 px-6 text-base font-bold focus:outline-none focus:border-accent/40 transition-all text-app-text/70 shadow-inner"
                                    />
                                </div>

                            </div>
                        )}

                        {/* 2. NARRATIVE SECTION */}
                        {activeSection === 'narrative' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-app-text flex items-center gap-4 font-display uppercase italic">
                                        <BookOpen className="text-accent" size={28} />
                                        {t('modules:session.campaign_form.narrative.title')}
                                    </h2>
                                    <p className="text-sm text-app-text/40 tracking-wide uppercase font-bold">{t('modules:session.campaign_form.narrative.subtitle')}</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-2 flex items-center gap-2">
                                        <PenTool size={12} /> {t('modules:session.campaign_form.narrative.synopsis_label')}
                                    </label>
                                    <textarea 
                                        value={synopsis}
                                        onChange={e => setSynopsis(e.target.value)}
                                        placeholder={t('modules:session.campaign_form.narrative.synopsis_placeholder')}
                                        rows={12}
                                        className="w-full bg-app-surface/10 border border-app-border/10 rounded-[2.5rem] p-10 text-lg leading-relaxed focus:outline-none focus:border-accent/40 transition-all font-serif italic text-app-text/60 resize-none custom-scrollbar shadow-inner"
                                    />
                                </div>

                            </div>
                        )}

                        {/* 2.5 CLUES SECTION */}
                        {activeSection === 'clues' && <CluesManager />}

                        {/* 2.6 NPC SECTION */}
                        {activeSection === 'npc' && (
                            <div className="h-full overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-app-border bg-app-surface/50">
                                    <h2 className="text-xl font-bold flex items-center gap-2 font-display uppercase italic">
                                        <Users className="text-accent" />
                                        {t('modules:session.campaign_form.npc.title')}
                                    </h2>
                                    <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest mt-1">{t('modules:session.campaign_form.npc.subtitle')}</p>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <NpcManagement />
                                </div>
                            </div>
                        )}

                        {/* 3. AMBIENCE SECTION */}
                        {activeSection === 'ambience' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-app-text flex items-center gap-4 font-display uppercase italic">
                                        <ImageIcon className="text-accent" size={28} />
                                        {t('modules:session.campaign_form.ambience.title')}
                                    </h2>
                                    <p className="text-sm text-app-text/40 tracking-wide uppercase font-bold">{t('modules:session.campaign_form.ambience.subtitle')}</p>
                                </div>


                                <div 
                                    className="relative aspect-video rounded-[3rem] bg-app-surface/20 border-2 border-dashed border-app-border/20 hover:border-accent/40 transition-all duration-700 group cursor-pointer overflow-hidden flex items-center justify-center p-4 shadow-2xl"
                                    onClick={() => setIsMediaBrowserOpen(true)}
                                >
                                    {wallpaperUrl && resolvedWallpaper ? (
                                        <>
                                            <ResolvedAsset src={wallpaperUrl} className="w-full h-full object-cover rounded-[2.5rem] opacity-60 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent opacity-60" />
                                            <div className="absolute inset-x-8 bottom-8 p-10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                                                <div className="px-10 py-4 bg-accent text-app-bg text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-glow-accent">{t('modules:session.campaign_form.ambience.change_wallpaper')}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 text-app-text/10 group-hover:text-accent/40 transition-all duration-500">
                                            <ImageIcon size={64} strokeWidth={1} />
                                            <span className="text-xs font-black uppercase tracking-[0.4em]">{t('modules:session.campaign_form.ambience.set_wallpaper')}</span>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                        {/* 4. WORLD SECTION */}
                        {activeSection === 'world' && (
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Map className="text-accent" />
                                            {t('modules:session.campaign_form.world.title')}
                                        </h2>
                                        <p className="text-sm text-app-text/60 mt-1">
                                            {t('modules:session.campaign_form.world.subtitle')}
                                        </p>
                                    </div>

                                </div>

                                {/* Wiki Bridge for Locations */}
                                {pendingPreFill && pendingPreFill.type === 'location' && (
                                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start gap-4 animate-in slide-in-from-top-4">
                                        <div className="p-2 rounded-lg bg-accent/20 text-accent">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-accent">{t('modules:session.campaign_form.world.wiki_import_title')}</h3>
                                            <p className="text-sm text-app-text/80 mt-1">
                                                {t('modules:session.campaign_form.world.wiki_import_desc', { title: pendingPreFill.data.title })}
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <button 
                                                    onClick={() => {
                                                        setActiveSection('clues');
                                                        // CluesManager handles the rest
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-accent text-app-surface font-bold text-xs hover:bg-accent-bright transition-colors"
                                                >
                                                    {t('modules:session.campaign_form.world.import_as_clue')}
                                                </button>
                                                <button 
                                                    onClick={() => clearPendingPreFill()}
                                                    className="px-3 py-1.5 rounded-lg bg-app-surface border border-app-border text-xs hover:text-red-400 transition-colors"
                                                >
                                                    {t('modules:session.campaign_form.world.ignore')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {campaignMaps.map((map: { id: string; name: string; fileUrl: string }) => {
                                        const isActive = activeLocationIds.includes(map.id);
                                        return (
                                            <button
                                                key={map.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isActive) {
                                                        setActiveLocationIds(activeLocationIds.filter((id: string) => id !== map.id));
                                                    } else {
                                                        setActiveLocationIds([...activeLocationIds, map.id]);
                                                    }
                                                }}
                                                className={`flex flex-col rounded-[2.5rem] border transition-all duration-500 overflow-hidden group ${
                                                    isActive
                                                    ? 'bg-accent/10 border-accent/40 shadow-glow-accent/10'
                                                    : 'bg-app-surface/20 border-app-border/10 hover:border-app-border/20'
                                                }`}
                                            >
                                                <div className="aspect-[4/3] relative overflow-hidden bg-app-bg/40">
                                                    <ResolvedAsset 
                                                        src={map.fileUrl} 
                                                        className={`w-full h-full object-cover transition-all duration-700 ${isActive ? 'scale-110 opacity-100' : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80'}`} 
                                                        alt={map.name}
                                                    />
                                                    {isActive && (
                                                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-accent text-app-bg flex items-center justify-center shadow-glow-accent">
                                                            <Check size={16} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-6 text-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-accent font-display' : 'text-app-text/30 group-hover:text-app-text/60'}`}>{map.name}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 5. INTELLIGENCE SECTION */}
                        {activeSection === 'intelligence' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-app-text flex items-center gap-4 font-display uppercase italic">
                                        <Sparkles className="text-accent" size={28} />
                                        {t('modules:session.campaign_form.intelligence.title')}
                                    </h2>
                                    <p className="text-sm text-app-text/40 tracking-wide uppercase font-bold">{t('modules:session.campaign_form.intelligence.subtitle')}</p>
                                </div>


                                <div className="p-10 rounded-[3rem] bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 space-y-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-violet-500/20 flex items-center justify-center text-violet-400 border border-violet-500/30 shadow-glow-violet/10">
                                            <Brain size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-violet-400 font-display">{t('modules:session.campaign_form.intelligence.notebook_title')}</h3>
                                            <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-widest mt-1">{t('modules:session.campaign_form.intelligence.notebook_subtitle')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500/60 px-2 flex items-center gap-2">
                                            <ExternalLink size={12} /> {t('modules:session.campaign_form.intelligence.notebook_label')}
                                        </label>
                                        <input 
                                            value={notebookUrl}
                                            onChange={e => setNotebookUrl(e.target.value)}
                                            placeholder={t('modules:session.campaign_form.intelligence.notebook_placeholder')}
                                            className="w-full bg-app-bg/40 border border-app-border/10 rounded-2xl py-5 px-6 text-sm font-mono tracking-wider focus:outline-none focus:border-violet-500/50 transition-all text-violet-400 shadow-inner"
                                        />
                                    </div>


                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/20 px-2 flex items-center gap-2">
                                                <PenTool size={12} /> {t('modules:session.campaign_form.intelligence.rules_path_label')}
                                            </label>
                                            <input value={systemPath} onChange={e => setSystemPath(e.target.value)} placeholder={t('modules:session.campaign_form.intelligence.rules_path_placeholder')} className="w-full bg-app-bg/20 border border-app-border/10 rounded-xl py-4 px-5 text-xs text-app-text/40 focus:outline-none focus:border-violet-500/30 tracking-tight shadow-inner" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/20 px-2 flex items-center gap-2">
                                                <PenTool size={12} /> {t('modules:session.campaign_form.intelligence.notes_path_label')}
                                            </label>
                                            <input value={campaignPath} onChange={e => setCampaignPath(e.target.value)} placeholder={t('modules:session.campaign_form.intelligence.notes_path_placeholder')} className="w-full bg-app-bg/20 border border-app-border/10 rounded-xl py-4 px-5 text-xs text-app-text/40 focus:outline-none focus:border-violet-500/30 tracking-tight shadow-inner" />
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500">{t('modules:session.campaign_form.intelligence.neural_overrides')}</h3>
                                            <p className="text-[9px] text-app-text/20 font-bold uppercase tracking-widest italic">{t('modules:session.campaign_form.intelligence.neural_overrides_subtitle')}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAutoGenerate}
                                            disabled={isGenerating}
                                            className="flex items-center gap-3 px-6 py-2.5 bg-violet-600 text-white border border-violet-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-glow-violet/5"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            {t('modules:session.campaign_form.intelligence.auto_generate')}
                                        </button>
                                    </div>


                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {gems.map((gem: { id: string; name: string }) => {
                                            const hasOverride = !!aiPersonas[gem.id];
                                            return (
                                                <div key={gem.id} className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col gap-4 ${hasOverride ? 'bg-app-surface/40 border-violet-500/30 shadow-glow-violet/5' : 'bg-app-surface/20 border-app-border/10'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasOverride ? 'bg-violet-600 text-white shadow-glow-violet/20' : 'bg-app-bg text-app-text/20'}`}>
                                                            <Sparkles size={16} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-app-text/60">{t(gem.name)}</span>
                                                    </div>
                                                    <textarea 
                                                        value={aiPersonas[gem.id] || ''}
                                                        onChange={e => {
                                                            const next = { ...aiPersonas };
                                                            if (e.target.value) next[gem.id] = e.target.value;
                                                            else delete next[gem.id];
                                                            setAiPersonas(next);
                                                        }}
                                                        rows={3}
                                                        className="w-full bg-app-bg/40 border border-app-border/10 rounded-2xl p-4 text-[11px] text-app-text/40 focus:border-violet-500/40 resize-none outline-none custom-scrollbar transition-all shadow-inner"
                                                        placeholder={t('modules:session.campaign_form.intelligence.ai_placeholder', { name: t(gem.name) })}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            <MediaBrowser 
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    setWallpaperUrl(id);
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title={t('modules:session.campaign_form.wallpaper_browser_title')}
            />
        </div>
    );
};

export default CampaignForm;
