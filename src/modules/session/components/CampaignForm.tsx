import React, { useState } from 'react';
import CluesManager from './CluesManager';
import { useSessionOSStore } from '../store/index';
import type { Campaign } from '../store/types';
import { 
    Search,
    Image as ImageIcon, Sparkles, Layout, 
    Info, 
    ExternalLink, 
    Save, X, BookOpen, Map, ArrowLeft, Fingerprint, Edit3, Loader2, MapPin, Brain, PenTool, Check
} from 'lucide-react';
import { useGemStore } from '../../../stores/useGemStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { gmToast } from '../../../stores/useToastStore';
import { personaGeneratorService } from '../../ai/PersonaGeneratorService';

interface CampaignFormProps {
    campaign?: Campaign | { campaignId: string };
    isNew?: boolean;
    onClose: () => void;
}

type SectionId = 'identity' | 'narrative' | 'clues' | 'ambience' | 'world' | 'intelligence';

const CampaignForm: React.FC<CampaignFormProps> = ({ campaign, isNew, onClose }) => {
    const { 
        campaigns, activeCampaignId, atlasMaps, addCampaign, updateCampaign,
        customSheetTemplates, customGameDrivers,
        activeCampaignFormSection, setActiveCampaignFormSection
    } = useSessionOSStore();
    
    // Identity logic
    const propCampaign = campaign && 'id' in campaign ? campaign as Campaign : 
                        (campaign && 'campaignId' in campaign ? campaigns.find(c => c.id === (campaign as { campaignId: string }).campaignId) : undefined);
    
    // Fallback to active campaign if no prop is provided (e.g. standalone view from cockpit)
    // Only happens if not explicitly in 'isNew' mode
    const fullCampaign = isNew ? undefined : (propCampaign || campaigns.find(c => c.id === activeCampaignId));

    const [name, setName] = useState(fullCampaign?.name || '');
    const [system, setSystem] = useState(fullCampaign?.system || 'generic');
    const [description, setDescription] = useState(fullCampaign?.description || '');
    const [synopsis, setSynopsis] = useState(fullCampaign?.synopsis || '');
    const [wallpaperUrl, setWallpaperUrl] = useState(fullCampaign?.wallpaperUrl || '');
    const [notebookUrl, setNotebookUrl] = useState(fullCampaign?.notebookUrl || '');
    const [systemPath, setSystemPath] = useState(fullCampaign?.systemPath || '');
    const [campaignPath, setCampaignPath] = useState(fullCampaign?.campaignPath || '');
    const [activeLocationIds, setActiveLocationIds] = useState<string[]>(fullCampaign?.activeLocationIds || []);
    const [aiPersonas, setAiPersonas] = useState<Record<string, string>>(fullCampaign?.aiPersonas || {});
    
    // UI State
    const activeSection = activeCampaignFormSection || 'identity';
    const setActiveSection = setActiveCampaignFormSection;
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const allDrivers = [...DEFAULT_GAME_DRIVERS, ...customGameDrivers];
    const { gems, syncGemsWithDefaults } = useGemStore();
    
    React.useEffect(() => {
        syncGemsWithDefaults();
    }, [syncGemsWithDefaults]);

    // Async data rehydration: if fullCampaign becomes available after mount, 
    // sync our local states to avoid overwriting store with empty data.
    React.useEffect(() => {
        if (fullCampaign && !isNew) {
            if (!name && fullCampaign.name) setName(fullCampaign.name);
            if (!system && fullCampaign.system) setSystem(fullCampaign.system);
            if (!description && fullCampaign.description) setDescription(fullCampaign.description);
            if (!synopsis && fullCampaign.synopsis) setSynopsis(fullCampaign.synopsis);
            if (!wallpaperUrl && fullCampaign.wallpaperUrl) setWallpaperUrl(fullCampaign.wallpaperUrl);
            if (!notebookUrl && fullCampaign.notebookUrl) setNotebookUrl(fullCampaign.notebookUrl);
            if (!systemPath && fullCampaign.systemPath) setSystemPath(fullCampaign.systemPath);
            if (!campaignPath && fullCampaign.campaignPath) setCampaignPath(fullCampaign.campaignPath);
            if (activeLocationIds.length === 0 && fullCampaign.activeLocationIds?.length) {
                setActiveLocationIds(fullCampaign.activeLocationIds);
            }
            if (Object.keys(aiPersonas).length === 0 && fullCampaign.aiPersonas) {
                setAiPersonas(fullCampaign.aiPersonas);
            }
        }
    }, [fullCampaign, isNew]);

    const campaignMaps = atlasMaps.filter(m => m.campaignId === fullCampaign?.id);
    const resolvedWallpaper = useMediaUrl(wallpaperUrl);
    const isEdit = !!fullCampaign;

    const hasUnsavedChanges = isNew || 
        name !== (fullCampaign?.name || '') ||
        system !== (fullCampaign?.system || 'generic') ||
        description !== (fullCampaign?.description || '') ||
        synopsis !== (fullCampaign?.synopsis || '') ||
        wallpaperUrl !== (fullCampaign?.wallpaperUrl || '');

    const handleSubmit = () => {
        const campaignData = {
            name,
            system,
            description,
            synopsis,
            wallpaperUrl,
            notebookUrl,
            systemPath,
            campaignPath,
            activeLocationIds,
            aiPersonas
        } as Partial<Campaign>;

        if (isEdit && fullCampaign) {
            updateCampaign(fullCampaign.id, campaignData);
            gmToast('Paramètres de campagne mis à jour.');
        } else {
            addCampaign(campaignData as Omit<Campaign, 'id'>);
            gmToast('Nouvelle campagne initialisée.');
        }
        onClose();
    };

    const handleAutoGenerate = async () => {
        if (!name) {
            gmToast('Nom de campagne requis pour la génération.', 'error');
            return;
        }
        setIsGenerating(true);
        try {
            const personas = await personaGeneratorService.generateAllPersonas({
                name,
                universe: system,
                style: description || system,
                objective: synopsis
            }, false);
            setAiPersonas(personas);
            gmToast('Résonances Éthériques synchronisées.');
        } catch (error) {
            gmToast('Échec de la synchronisation neurale.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const sidebarItems: { id: SectionId; icon: any; label: string }[] = [
        { id: 'identity', icon: Layout, label: 'Identité' },
        { id: 'narrative', icon: BookOpen, label: 'Narration' },
        { id: 'clues', icon: Search, label: 'Indices' },
        { id: 'ambience', icon: ImageIcon, label: 'Ambiance' },
        { id: 'world', icon: Map, label: 'Monde' },
        { id: 'intelligence', icon: Sparkles, label: 'Intelligence' },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0c] text-[#dee5ff] font-['Space_Grotesk'] overflow-hidden">
            {/* Top Command Bar */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-2xl z-50">
                <div className="flex items-center gap-6">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-xs font-bold border border-white/5"
                    >
                        <ArrowLeft size={14} />
                        Retour Cockpit
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gm-gold/10 flex items-center justify-center border border-gm-gold/20">
                            <Fingerprint className="text-gm-gold" size={18} />
                        </div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
                            Editor <span className="text-white/20 px-2">//</span> 
                            <span className="text-gm-gold">{isEdit ? 'Modification de Campagne' : 'Nouvelle Aventure'}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        title="Synchroniser avec le Nexus"
                        className={`flex items-center gap-2 font-black px-6 py-2 rounded-xl text-[10px] tracking-widest uppercase transition-all ${
                            hasUnsavedChanges 
                                ? 'bg-gm-gold text-black hover:bg-yellow-500 shadow-glow-gold/40 animate-pulse border border-gm-gold/50' 
                                : 'bg-gm-gold/20 text-gm-gold/60 hover:bg-gm-gold/40 hover:text-gm-gold border border-transparent'
                        }`}
                    >
                        <Save size={14} />
                        Synchroniser Nexus
                    </button>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white/20 hover:text-white hover:bg-red-500/20 transition-all border border-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Navigation Sidebar */}
                <aside className="w-20 flex flex-col items-center py-8 gap-6 border-r border-white/5 bg-[#0d0d0f]/50 backdrop-blur-xl">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveSection(item.id)}
                            title={item.label}
                            className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                activeSection === item.id 
                                ? 'bg-gm-gold text-black shadow-glow-gold' 
                                : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-white/60'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="absolute left-full ml-4 px-3 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-gm-gold opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-50 whitespace-nowrap">
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
                <main className="flex-1 overflow-y-auto custom-scrollbar p-16 bg-[#0a0a0c]">
                    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        {/* 1. IDENTITY SECTION */}
                        {activeSection === 'identity' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-4">
                                        <Layout className="text-gm-gold" size={28} />
                                        Identité Fondamentale
                                    </h2>
                                    <p className="text-sm text-white/40 tracking-wide uppercase font-bold">Définissez les paramètres de base de votre univers.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gm-gold/60 px-2 flex items-center gap-2">
                                            <Edit3 size={12} /> Nom de l'Opération
                                        </label>
                                        <input 
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="ex: Chroniques du Vide"
                                            className="w-full bg-[#121215] border border-white/5 rounded-2xl py-5 px-6 text-base font-bold tracking-wide focus:outline-none focus:border-gm-gold/40 focus:ring-1 focus:ring-gm-gold/20 transition-all text-[#dee5ff]"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gm-gold/60 px-2 flex items-center gap-2">
                                            <Sparkles size={12} /> Référentiel Système
                                        </label>
                                        <select 
                                            value={system}
                                            onChange={e => setSystem(e.target.value)}
                                            title="Référentiel Système"
                                            className="w-full bg-[#121215] border border-white/5 rounded-2xl py-5 px-6 text-base font-bold tracking-wide focus:outline-none focus:border-gm-gold/40 transition-all text-[#dee5ff] appearance-none"
                                        >
                                            <optgroup label="Systèmes de jeu (Drivers)">
                                                {allDrivers.map(d => (
                                                    <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Templates UI">
                                                {allTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gm-gold/60 px-2 flex items-center gap-2">
                                        <Info size={12} /> Description Courte (Tagline)
                                    </label>
                                    <input 
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Une brève accroche pour votre aventure..."
                                        className="w-full bg-[#121215] border border-white/5 rounded-2xl py-5 px-6 text-base font-bold focus:outline-none focus:border-gm-gold/40 transition-all text-white/70"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. NARRATIVE SECTION */}
                        {activeSection === 'narrative' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-4">
                                        <BookOpen className="text-gm-gold" size={28} />
                                        Trame Narrative
                                    </h2>
                                    <p className="text-sm text-white/40 tracking-wide uppercase font-bold">Documentez les enjeux et le synopsis de l'intrigue.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gm-gold/60 px-2 flex items-center gap-2">
                                        <PenTool size={12} /> Synopsis de l'Aventure
                                    </label>
                                    <textarea 
                                        value={synopsis}
                                        onChange={e => setSynopsis(e.target.value)}
                                        placeholder="Détaillez ici les points clés de l'histoire..."
                                        rows={12}
                                        className="w-full bg-[#121215] border border-white/5 rounded-[2.5rem] p-10 text-lg leading-relaxed focus:outline-none focus:border-gm-gold/40 transition-all font-serif italic text-white/60 resize-none custom-scrollbar"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 3. AMBIENCE SECTION */}
                        {activeSection === 'ambience' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-4">
                                        <ImageIcon className="text-gm-gold" size={28} />
                                        Ambiance Visuelle
                                    </h2>
                                    <p className="text-sm text-white/40 tracking-wide uppercase font-bold">Configurez l'esthétique du centre de commandement.</p>
                                </div>

                                <div 
                                    className="relative aspect-video rounded-[3rem] bg-[#121215] border-2 border-dashed border-white/5 hover:border-gm-gold/30 transition-all duration-700 group cursor-pointer overflow-hidden flex items-center justify-center p-4 shadow-2xl"
                                    onClick={() => setIsMediaBrowserOpen(true)}
                                >
                                    {wallpaperUrl && resolvedWallpaper ? (
                                        <>
                                            <ResolvedAsset src={wallpaperUrl} className="w-full h-full object-cover rounded-[2.5rem] opacity-60 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                            <div className="absolute inset-x-8 bottom-8 p-10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                                                <div className="px-10 py-4 bg-gm-gold text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-glow-gold">Changer le Wallpaper</div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 text-white/10 group-hover:text-gm-gold/40 transition-all duration-500">
                                            <ImageIcon size={64} strokeWidth={1} />
                                            <span className="text-xs font-black uppercase tracking-[0.4em]">Définir Wallpaper de Campagne</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 4. WORLD SECTION */}
                        {activeSection === 'world' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-4">
                                        <Map className="text-gm-gold" size={28} />
                                        Atlas & Lieux Actifs
                                    </h2>
                                    <p className="text-sm text-white/40 tracking-wide uppercase font-bold">Épinglez les dossiers tactiques pour y accéder en session.</p>
                                </div>

                                {campaignMaps.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                        {campaignMaps.map(map => {
                                            const isActive = activeLocationIds.includes(map.id);
                                            return (
                                                <button
                                                    key={map.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isActive) {
                                                            setActiveLocationIds(activeLocationIds.filter(id => id !== map.id));
                                                        } else {
                                                            setActiveLocationIds([...activeLocationIds, map.id]);
                                                        }
                                                    }}
                                                    className={`flex flex-col rounded-[2.5rem] border transition-all duration-500 overflow-hidden group ${
                                                        isActive
                                                        ? 'bg-gm-gold/10 border-gm-gold/40 shadow-glow-gold/10'
                                                        : 'bg-[#121215] border-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                                                        <ResolvedAsset 
                                                            src={map.fileUrl} 
                                                            className={`w-full h-full object-cover transition-all duration-700 ${isActive ? 'scale-110 opacity-100' : 'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-80'}`} 
                                                            alt={map.name}
                                                        />
                                                        {isActive && (
                                                            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gm-gold text-black flex items-center justify-center shadow-glow-gold">
                                                                <Check size={16} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-6 text-center">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-gm-gold' : 'text-white/30 group-hover:text-white/60'}`}>{map.name}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-20 border-2 border-dashed border-white/5 rounded-[3rem] text-center flex flex-col items-center gap-6">
                                        <MapPin size={48} className="text-white/10" />
                                        <div className="space-y-2">
                                            <p className="text-xs font-black uppercase tracking-widest text-white/20">Aucune carte associée</p>
                                            <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest max-w-xs px-6">Liez des cartes via le World Atlas pour les épingler ici.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. INTELLIGENCE SECTION */}
                        {activeSection === 'intelligence' && (
                            <div className="space-y-12">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-4">
                                        <Sparkles className="text-gm-gold" size={28} />
                                        Intelligence OS (AI)
                                    </h2>
                                    <p className="text-sm text-white/40 tracking-wide uppercase font-bold">Configurez les vecteurs de résonance AI et RAG.</p>
                                </div>

                                <div className="p-10 rounded-[3rem] bg-gradient-to-br from-gm-purple/10 to-transparent border border-gm-purple/20 space-y-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-gm-purple/20 flex items-center justify-center text-gm-purple border border-gm-purple/30 shadow-glow-purple/10">
                                            <Brain size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-gm-purple">NotebookLM Integration</h3>
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Surcharge locale de la base de connaissances</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gm-purple/60 px-2 flex items-center gap-2">
                                            <ExternalLink size={12} /> Knowledge UUID / URL
                                        </label>
                                        <input 
                                            value={notebookUrl}
                                            onChange={e => setNotebookUrl(e.target.value)}
                                            placeholder="Surchargez ici l'ID ou l'URL du NotebookLM..."
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm font-mono tracking-wider focus:outline-none focus:border-gm-purple/50 transition-all text-gm-purple shadow-inner"
                                        />
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2 flex items-center gap-2">
                                                <PenTool size={12} /> System Rules Path
                                            </label>
                                            <input value={systemPath} onChange={e => setSystemPath(e.target.value)} placeholder="ex: systems/pathfinder" className="w-full bg-black/20 border border-white/5 rounded-xl py-4 px-5 text-xs text-white/40 focus:outline-none focus:border-gm-purple/30 tracking-tight" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2 flex items-center gap-2">
                                                <PenTool size={12} /> Campaign Notes Path
                                            </label>
                                            <input value={campaignPath} onChange={e => setCampaignPath(e.target.value)} placeholder="ex: campaigns/ironhelm" className="w-full bg-black/20 border border-white/5 rounded-xl py-4 px-5 text-xs text-white/40 focus:outline-none focus:border-gm-purple/30 tracking-tight" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gm-purple">Neural Overrides</h3>
                                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest italic">Instructions spécifiques pour les Gems IA</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAutoGenerate}
                                            disabled={isGenerating}
                                            className="flex items-center gap-3 px-6 py-2.5 bg-gm-purple/10 hover:bg-gm-purple/20 text-gm-purple border border-gm-purple/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-glow-purple/5"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            Auto-Générer
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {gems.map(gem => {
                                            const hasOverride = !!aiPersonas[gem.id];
                                            return (
                                                <div key={gem.id} className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col gap-4 ${hasOverride ? 'bg-gm-purple/10 border-gm-purple/30 shadow-glow-purple/5' : 'bg-[#121215] border-white/5'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasOverride ? 'bg-gm-purple text-black shadow-glow-purple/20' : 'bg-white/5 text-white/20'}`}>
                                                            <Sparkles size={16} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{gem.name}</span>
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
                                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-white/40 focus:border-gm-purple/40 resize-none outline-none custom-scrollbar transition-all"
                                                        placeholder={`Prompt override for ${gem.name}...`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. CLUES SECTION */}
                        {activeSection === 'clues' && (
                            <CluesManager />
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
                title="Saisie Visuelle: Nexus Wallpaper"
            />
        </div>
    );
};

export default CampaignForm;
