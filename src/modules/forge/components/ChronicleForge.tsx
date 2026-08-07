import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  FileUp, 
  Zap, 
  Trash2, 
  Sparkles, 
  Hammer, 
  Rocket, 
  Lightbulb,
  BookOpen,
  Users,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Shield,
  Dna,
  Globe,
  Eye,
  X
} from 'lucide-react';
import { useSessionOSStore, type WikiEntry, type AtlasMap, type Entity } from '../../session/useSessionOSStore';
import { type ForgeContextItem } from '../ForgeService';
import { chronicleForgeService, type ChronicleForgeResult } from '../ChronicleService';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { useAIStore } from '../../../stores/useAIStore';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';

interface NotebookSource {
  id: string;
  title: string;
  source_type: string;
}

interface Notebook {
  id: string;
  title: string;
  sources?: NotebookSource[];
}

const ChronicleForge: React.FC = () => {
  const { t } = useTranslation(['modules']);
  const { activeProvider } = useAIStore();
  const { customGameDrivers, addChronicle, campaigns } = useSessionOSStore();
  
  const [contextItems, setContextItems] = useState<ForgeContextItem[]>([]);
  const [existingCampaignName, setExistingCampaignName] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [result, setResult] = useState<ChronicleForgeResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'campaign' | 'entities' | 'locations' | 'lore'>('campaign');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // NotebookLM Integration State
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [notebookSources, setNotebookSources] = useState<NotebookSource[]>([]);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
  const [importingSources, setImportingSources] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const callMcpToolWithRetry = async <T = unknown>(serverName: string, toolName: string, args: Record<string, unknown>): Promise<T> => {
    const bridge = window.appBridge;
    if (!bridge?.mcp?.callTool) {
      throw new Error("Bridge MCP not available");
    }
    
    const mcpBridge = bridge.mcp;

    const checkError = (res: unknown): boolean => {
      const str = typeof res === 'string' ? res : JSON.stringify(res);
      return str.includes("Authentication expired") || str.includes("RPC Error 16") || str.includes("expired");
    };

    try {
      const toolResult = await mcpBridge.callTool(serverName, toolName, args);
      
      if (checkError(toolResult)) {
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        return await mcpBridge.callTool(serverName, toolName, args) as unknown as T;
      }
      
      return toolResult as unknown as T;
    } catch (err: unknown) {
      if (checkError(err)) {
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        return await mcpBridge.callTool(serverName, toolName, args) as unknown as T;
      }
      throw err;
    }
  };

  const handleOpenNotebookLM = async () => {
    setIsNotebookModalOpen(true);
    setIsLoadingNotebooks(true);
    try {
      const mcpResult = await callMcpToolWithRetry<{ notebooks?: Notebook[], data?: { notebooks: Notebook[] }, content?: string }>('notebooklm-mcp-server', 'notebook_list', { max_results: 100 });
      
      const rawData = mcpResult.notebooks || mcpResult.data?.notebooks || mcpResult.content;
      let notebooksToSet: Notebook[] = [];

      if (typeof rawData === 'string') {
        try {
          const parsed = JSON.parse(rawData);
          notebooksToSet = (parsed.notebooks || parsed.data || (Array.isArray(parsed) ? parsed : [])) as Notebook[];
        } catch {
          notebooksToSet = [];
        }
      } else if (Array.isArray(rawData)) {
        notebooksToSet = rawData as Notebook[];
      } else if (rawData && typeof rawData === 'object') {
        const obj = rawData as Record<string, unknown>;
        notebooksToSet = (obj.notebooks || obj.data || []) as Notebook[];
      }

      setNotebooks(notebooksToSet);
    } catch (err) {
      console.error(err);
      gmToast(t('modules:session.forge_module.notebook.fetch_error'), "error");
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleNotebookSelect = async (notebookId: string) => {
    setIsLoadingNotebooks(true);
    try {
      const mcpResult = await callMcpToolWithRetry<{ notebook?: unknown, sources?: unknown, content?: unknown }>('notebooklm-mcp-server', 'notebook_get', { notebook_id: notebookId });

      // Le client Gemini Notebook renvoie les sources **à côté** du carnet et
      // non dedans : `{ notebook: {...}, sources: [...] }`. Lire `.sources` sur
      // le seul objet `notebook` donnait une liste vide, sans erreur — le carnet
      // s'affichait, ses sources jamais.
      const siblingSources = Array.isArray(mcpResult.sources)
        ? (mcpResult.sources as Array<{ id?: string; title?: string; source_type?: string }>).map(s => ({
            id: s.id || 'unknown',
            title: s.title || 'Untitled Source',
            source_type: s.source_type || 'archive',
          }))
        : null;

      let notebookData = mcpResult.notebook || mcpResult.content;
      if (typeof notebookData === 'string') {
        try {
          const parsed = JSON.parse(notebookData);
          notebookData = parsed.notebook || parsed;
        } catch { /* use as is */ }
      }

      if (Array.isArray(notebookData) && notebookData[0]) {
        const raw = notebookData[0] as unknown[];
        const title = raw[0] as string;
        const sourcesRaw = (raw[1] || []) as Array<[Array<string>, string]>;
        
        const mappedSources: NotebookSource[] = sourcesRaw.map(s => ({
          id: s[0]?.[0] || 'unknown',
          title: s[1] || 'Untitled Source',
          source_type: 'archive'
        }));

        const mappedNotebook: Notebook = {
          id: notebookId,
          title: title,
          sources: mappedSources
        };

        setSelectedNotebook(mappedNotebook);
        setNotebookSources(mappedSources);
      } else if (notebookData && typeof notebookData === 'object') {
        const data = notebookData as Notebook & { sources?: NotebookSource[] };
        const sources = siblingSources ?? data.sources ?? [];
        setSelectedNotebook({ ...data, sources });
        setNotebookSources(sources);
      }
    } catch (err) {
      console.error(err);
      gmToast(t('modules:session.forge_module.notebook.sources_fetch_error'), "error");
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleSourceImport = async (sourceId: string, title: string) => {
    if (importingSources.has(sourceId)) return;

    gmConfirm(
      t('modules:session.forge_module.notebook.import_confirm', { title }),
      async () => {
        setImportingSources(prev => new Set(prev).add(sourceId));

        try {
          const mcpResult = await callMcpToolWithRetry<{ content: unknown }>('notebooklm-mcp-server', 'source_get_content', { source_id: sourceId });

          let content = mcpResult.content;
          if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
            try {
              const parsed = JSON.parse(content);
              content = parsed.content || parsed;
            } catch { /* use as is */ }
          }

          const newItem: ForgeContextItem = {
            id: crypto.randomUUID(),
            name: `[NB] ${title}`,
            type: 'text',
            content: typeof content === 'string' ? content : JSON.stringify(content),
            timestamp: Date.now()
          };
          setContextItems(prev => [...prev, newItem]);
          gmToast(t('modules:session.forge_module.notebook.import_success', { title }), "success");

        } catch (err) {
          console.error(err);
          gmToast(t('modules:session.forge_module.notebook.import_error'), "error");
        } finally {
          setImportingSources(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
          });
        }
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const reader = new FileReader();
        const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf');
        
        reader.onload = async () => {
          let content = reader.result as string;
          if (isPdf) {
            content = content.split(',')[1]; // Base64
          }

          const newItem: ForgeContextItem = {
            id: crypto.randomUUID(),
            name: f.name,
            type: isPdf ? 'pdf' : 'text',
            content: content,
            timestamp: Date.now()
          };
          setContextItems(prev => [...prev, newItem]);
        };

        if (isPdf) {
          reader.readAsDataURL(f);
        } else {
          reader.readAsText(f);
        }
      }
    }
  };

  const startForge = async () => {
    if (contextItems.length === 0) {
      gmToast(t('modules:session.chronicle_forge_module.sources_empty'), "error");
      return;
    }

    const driver = customGameDrivers.find(d => d.id === selectedDriverId) || 
                   DEFAULT_GAME_DRIVERS.find(d => d.id === selectedDriverId);
    if (!driver) {
      gmToast(t('modules:session.chronicle_forge_module.system_select'), "error");
      return;
    }

    setIsForging(true);
    setResult(null);
    try {
      const forgeResult = await chronicleForgeService.forgeChronicle(contextItems, driver, userInstructions, existingCampaignName);
      setResult(forgeResult);
      gmToast(t('modules:session.chronicle_forge_module.deploy_success'), "success");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Échec de la forge.";
      gmToast(`Échec de la Forge : ${errorMessage}`, "error");
    } finally {
      setIsForging(false);
    }
  };

  const handleCommit = () => {
    if (!result) return;
    
    const driver = customGameDrivers.find(d => d.id === selectedDriverId) || 
                   DEFAULT_GAME_DRIVERS.find(d => d.id === selectedDriverId);
    const templateId = driver?.templateId || 'generic';

    const existingCampaign = campaigns.find(c => c.name === existingCampaignName);

    addChronicle({
      campaign: {
        name: result.campaign?.name || t('modules:session.chronicle_forge_module.untitled'),
        description: result.campaign?.description || '',
        synopsis: result.campaign?.synopsis || '',
        system: selectedDriverId,
        activeLocationIds: [],
      },
      entities: (result.entities || []).map(e => ({
        ...e,
        name: e.name || t('modules:session.chronicle_forge_module.unknown_npc'),
        type: (e.type as Entity['type']) || 'npc',
        role: (e.role as Entity['role']) || 'neutral',
        status: (e.status as Entity['status']) || 'alive',
        avatar: e.avatar || '',
        hp: e.hp ?? 10,
        maxHp: e.maxHp ?? 10,
        ac: e.ac ?? 10,
        speed: e.speed ?? 30,
        initiative: e.initiative ?? 0,
        description: e.description || '',
        roleplayingNotes: e.roleplayingNotes || '',
        gmSecretInfo: e.gmSecretInfo || '',
        linkedMapIds: e.linkedMapIds || [],
        templateId: templateId,
      })),
      atlasMaps: (result.locations || []).map(l => ({
        ...l,
        name: l.name || t('modules:session.chronicle_forge_module.unnamed_location'),
        fileUrl: l.fileUrl || '',
        isVideo: !!l.isVideo,
        narrativeDescription: l.narrativeDescription || '',
        gmNotes: l.gmNotes || '',
        linkedEntities: l.linkedEntities || [],
        type: (l.type as AtlasMap['type']) || 'battlemap', 
      })),
      wikiEntries: (result.lore || []).map(l => ({
        ...l,
        title: l.title || t('modules:session.chronicle_forge_module.untitled_entry'),
        content: l.content || '',
        category: (l.category as WikiEntry['category']) || 'lore',
        tags: l.tags || [],
        imageUrls: l.imageUrls || [],
        linkedEntityIds: l.linkedEntityIds || [],
      })),
      existingCampaignId: existingCampaign?.id,
    });


    gmToast(t('modules:session.chronicle_forge_module.deploy_success'), "success");
    setResult(null);
    setContextItems([]);
  };

  return (
    <div className="h-full overflow-y-auto p-8 pt-20 flex flex-col gap-8 animate-in fade-in duration-500 custom-scrollbar bg-app-bg text-app-text font-sans">
      {/* Header Section */}
      <header className="flex items-center justify-between mb-0 pb-6 border-b border-accent/10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent/20 text-accent animate-pulse shadow-glow-accent/20 border border-accent/20">
            <Hammer size={24} />
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black uppercase tracking-widest text-app-text font-display">
               {t('modules:session.chronicle_forge_module.title').toUpperCase()} <span className="text-accent/50 text-xs font-mono tracking-widest ml-2">v5.2</span>
            </h1>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
               activeProvider === 'gemini' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow-emerald/20'
             }`}>
               <Sparkles size={12} className={activeProvider === 'gemini' ? '' : 'animate-pulse'} />
               {t('modules:session.forge_module.engine_label')} : {activeProvider === 'gemini' ? 'Gemini 1.5' : 'Gemma 4' }
             </div>
          </div>
          <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">{t('modules:session.chronicle_forge_module.subtitle')}</p>
        </div>

        <div className="flex items-center gap-4">
           {!result && (
             <button
              onClick={startForge}
              disabled={isForging || contextItems.length === 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all shadow-glow-accent/20 ${
                isForging || contextItems.length === 0 
                  ? 'bg-app-surface/20 text-app-text/20 opacity-50 cursor-not-allowed border border-app-border/10' 
                  : 'bg-accent text-white hover:scale-105 active:scale-95'
              }`}
              title={t('modules:session.chronicle_forge_module.ignite_button')}
             >
               {isForging ? <Zap className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
               {t('modules:session.chronicle_forge_module.ignite_button')}
             </button>
           )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 pb-20">
        {/* Left Column: Context Inputs */}
        <div className="col-span-4 flex flex-col gap-6">
          {/* Context Bin */}
          <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-accent font-display">
                <FileText className="w-6 h-6" /> {t('modules:session.chronicle_forge_module.sources_title')}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenNotebookLM}
                  className="p-2.5 hover:bg-accent/10 rounded-xl text-accent transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-accent/20"
                  title={t('modules:session.forge_module.notebook.title')}
                >
                  <Globe className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 hover:bg-white/5 rounded-xl text-app-text/40 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-app-border/10"
                  title={t('modules:session.forge_module.load_files_tooltip')}
                >
                  <FileUp className="w-6 h-6" />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple
                title="Sélecteur de fichiers"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5">
              {contextItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-app-border/20 flex items-center justify-center mb-4 text-app-text">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <p className="text-sm">{t('modules:session.chronicle_forge_module.sources_empty')}</p>
                </div>
              )}
              {contextItems.map(item => (
                <div key={item.id} className="group relative bg-app-text/5 p-4 rounded-xl border border-app-border/10 hover:border-accent/30 transition-all animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg">
                      {item.type === 'pdf' ? <Shield className="w-5 h-5 text-accent" /> : <FileText className="w-5 h-5 text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0 text-app-text">
                      <p className="text-base font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-app-text/40 uppercase tracking-widest leading-none mt-1">{item.type}</p>
                    </div>
                    <button 
                      onClick={() => setContextItems(prev => prev.filter(i => i.id !== item.id))}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                      title="Supprimer la source"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Area */}
          <div className="h-48 bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col">
            <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
              <Lightbulb className="w-4 h-4 text-amber-500" /> {t('modules:session.chronicle_forge_module.intentions_label')}
            </h2>
            <textarea
              placeholder={t('modules:session.chronicle_forge_module.intentions_placeholder')}
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-app-text/80 placeholder:text-app-text/30"
              title={t('modules:session.chronicle_forge_module.intentions_label')}
            />
          </div>

          {/* Enrichment / Target Campaign */}
          <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
            <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
               <BookOpen size={14} className="animate-pulse" /> {t('modules:session.chronicle_forge_module.target_label')}
            </h2>
            <input 
              type="text"
              list="existing-campaigns"
              value={existingCampaignName} 
              onChange={(e) => setExistingCampaignName(e.target.value)} 
              placeholder={t('modules:session.chronicle_forge_module.target_placeholder')} 
              className="w-full bg-transparent text-sm text-app-text/80 focus:outline-none placeholder:text-app-text/30 font-sans border-b border-app-border/10 pb-1 focus:border-accent/50 transition-all" 
              title={t('modules:session.chronicle_forge_module.target_label')}
            />
            <datalist id="existing-campaigns">
              {campaigns.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Driver Selector */}
          <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5">
            <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
              <Shield className="w-4 h-4" /> {t('modules:session.chronicle_forge_module.system_label')}
            </h2>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full bg-app-surface/60 border border-app-border/10 rounded-xl p-3 text-xs text-app-text outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer"
              title={t('modules:session.chronicle_forge_module.system_label')}
            >
              <option value="">{t('modules:session.chronicle_forge_module.system_select')}</option>
              {DEFAULT_GAME_DRIVERS.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.emoji} {driver.name}</option>
              ))}
              {customGameDrivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.emoji} {driver.name} (Custom)</option>
              ))}
            </select>

          </div>
        </div>

        {/* Right Column: Blueprint Preview */}
        <div className="col-span-8 bg-app-surface/40 rounded-2xl border border-app-border/10 flex flex-col overflow-hidden shadow-2xl min-h-[600px] text-app-text font-sans">
          {result ? (
            <>
              <div className="flex border-b border-app-border/10">
                {(['campaign', 'entities', 'locations', 'lore'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivePreviewTab(tab)}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
                      activePreviewTab === tab 
                        ? 'border-accent text-accent bg-accent/5' 
                        : 'border-transparent text-app-text/40 hover:text-app-text/60 hover:bg-app-text/5'
                    }`}
                    title={`Passer à l'onglet ${tab}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {tab === 'campaign' && <BookOpen className="w-4 h-4" />}
                      {tab === 'entities' && <Users className="w-4 h-4" />}
                      {tab === 'locations' && <MapPin className="w-4 h-4" />}
                      {tab === 'lore' && <Lightbulb className="w-4 h-4" />}
                      {t(`modules:session.chronicle_forge_module.tabs.${tab}`)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/5">
                {activePreviewTab === 'campaign' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-3xl font-bold text-app-text font-display uppercase tracking-tight">{result.campaign?.name || t('modules:session.chronicle_forge_module.untitled')}</h3>
                    <p className="text-xl text-accent/80 italic font-display">{result.campaign?.description || ''}</p>
                    <div className="prose prose-invert max-w-none">
                      <div className="bg-app-surface/60 p-6 rounded-2xl border border-app-border/10">
                        <h4 className="text-[10px] font-black uppercase text-app-text/40 mb-4 tracking-widest font-display">{t('modules:session.chronicle_forge_module.synopsis_title')}</h4>
                        <p className="text-app-text/80 leading-relaxed text-lg font-sans">{result.campaign?.synopsis || ''}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'entities' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
                    {(result.entities || []).map((ent, idx) => (
                      <div key={idx} className="bg-app-text/5 rounded-2xl p-5 border border-app-border/10 hover:border-accent/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl">
                              {ent.role === 'boss' ? '💀' : '👤'}
                            </div>
                            <div>
                              <p className="font-bold text-lg font-display">{ent.name}</p>
                              <p className="text-xs text-accent font-mono uppercase tracking-tighter">{ent.type} • {ent.role}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 font-mono">
                            <span className="text-xs text-app-text/40 font-bold">HP {ent.hp}</span>
                            <span className="text-xs text-app-text/40 font-bold">AC {ent.ac}</span>
                          </div>
                        </div>
                        <p className="text-sm text-app-text/60 italic mb-3 font-sans leading-relaxed">"{ent.description}"</p>
                        <div className="space-y-2">
                          <div className="p-3 bg-app-surface/40 rounded-lg border border-app-border/10 text-xs text-app-text/80">
                            <p className="font-bold text-accent mb-1 flex items-center gap-1 font-display"><Dna className="w-3 h-3" /> {t('modules:session.chronicle_forge_module.roleplaying_notes')}</p>
                            <p className="line-clamp-3 opacity-80">{ent.roleplayingNotes}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewTab === 'locations' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    {(result.locations || []).map((loc, idx) => (
                      <div key={idx} className="bg-app-text/5 rounded-2xl p-6 border border-app-border/10 hover:border-accent/30 transition-all flex gap-6">
                        <div className="w-48 h-32 rounded-xl bg-app-surface/60 flex items-center justify-center border border-app-border/10 overflow-hidden">
                           <MapPin className="w-12 h-12 text-app-text/10" />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-xl font-bold text-app-text/90 mb-2 font-display">{loc.name}</h4>
                           <p className="text-sm text-app-text/60 line-clamp-2 mb-4 leading-relaxed font-sans">{loc.narrativeDescription}</p>
                           <div className="flex items-center gap-4 text-xs font-mono text-app-text/30">
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Placeholder Map</span>
                              <span className="flex items-center gap-1 hover:text-accent cursor-help transition-colors">
                                <Shield className="w-3 h-3" /> {t('modules:session.chronicle_forge_module.gm_secrets')}
                              </span>
                           </div>
                        </div>
                        <ChevronRight className="w-6 h-6 self-center text-app-text/20" />
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewTab === 'lore' && (
                  <div className="columns-2 gap-4 animate-in fade-in slide-in-from-right-4">
                    {(result.lore || []).map((l, idx) => (
                      <div key={idx} className="break-inside-avoid bg-app-text/5 rounded-2xl p-5 border border-app-border/10 mb-4 hover:border-accent/30 transition-all group">
                        <div className="flex items-center gap-2 mb-3">
                           <span className={`w-2 h-2 rounded-full ${l.category === 'clue' ? 'bg-amber-400' : 'bg-accent'}`} />
                           <span className="text-[10px] uppercase font-bold tracking-widest text-app-text/30 font-display">{l.category}</span>
                        </div>
                        <h4 className="text-lg font-bold mb-2 group-hover:text-accent transition-colors font-display">{l.title}</h4>
                        <div className="text-sm text-app-text/60 line-clamp-4 leading-relaxed bg-app-surface/40 p-3 rounded-lg border border-app-border/10 font-sans">
                           {l.content}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {l.tags?.map(t => (
                            <span key={t} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20 font-mono tracking-tighter uppercase font-bold">#{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-app-surface/40 border-t border-app-border/10 flex items-center justify-center">
                 <button
                  onClick={handleCommit}
                  className="flex items-center gap-3 px-12 py-4 bg-accent rounded-2xl font-black text-xl shadow-glow-accent/40 hover:scale-105 active:scale-95 transition-all text-white font-display"
                  title={t('modules:session.chronicle_forge_module.deploy_button')}
                 >
                   {t('modules:session.chronicle_forge_module.deploy_button')}
                   <Rocket className="w-6 h-6" />
                 </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-full h-full rounded-full border-2 border-accent/30 flex items-center justify-center overflow-hidden bg-app-surface/40">
                   <Users className="w-16 h-16 text-accent animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 font-display text-app-text">{t('modules:session.forge_module.awaiting_transmutation')}</h3>
                <p className="text-app-text/40 max-w-md mx-auto font-sans leading-relaxed">
                  {t('modules:session.chronicle_forge_module.preview_desc')}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-app-text/20 uppercase tracking-widest font-bold">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> IA SECURE PROMPT</span>
                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> PREVIEW AVANT IMPORT</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NotebookLM Modal Overlay */}
      {isNotebookModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-app-bg/80 backdrop-blur-sm animate-in fade-in">
           <div className="w-full max-w-4xl bg-app-bg border border-accent/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[70vh] text-app-text font-sans">
              <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-accent/5">
                 <h2 className="text-xl font-bold uppercase tracking-wider text-accent flex items-center gap-3 font-display">
                   <Globe className="w-6 h-6" /> {t('modules:session.forge_module.notebook.title')}
                 </h2>
                 <button onClick={() => setIsNotebookModalOpen(false)} className="p-2 hover:bg-app-text/5 rounded-full text-app-text/40 transition-colors" title="Fermer"><X /></button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <div className="w-1/3 border-r border-app-border/10 overflow-y-auto p-4 space-y-2 bg-app-surface/20">
                    {isLoadingNotebooks && notebooks.length === 0 ? (
                      <div className="flex items-center justify-center h-40">
                        <Zap className="w-8 h-8 text-accent animate-spin" />
                      </div>
                    ) : (
                      notebooks.map(nb => (
                        <button 
                          key={nb.id} 
                          onClick={() => handleNotebookSelect(nb.id)} 
                          className={`w-full text-left p-4 rounded-2xl transition-all border ${
                            selectedNotebook?.id === nb.id 
                              ? 'bg-accent/20 border-accent/40 text-accent shadow-lg' 
                              : 'border-transparent hover:bg-app-text/5 text-app-text/40'
                          }`}
                          title={`Sélectionner le carnet ${nb.title}`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest font-display">{nb.title}</div>
                        </button>
                      ))
                    )}
                 </div>
                 <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {isLoadingNotebooks && selectedNotebook ? (
                      <div className="flex items-center justify-center h-full">
                        <Zap className="w-12 h-12 text-accent animate-spin" />
                      </div>
                    ) : selectedNotebook ? (
                      <div className="grid grid-cols-1 gap-3">
                        {notebookSources.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-app-surface/40 rounded-2xl border border-app-border/10 hover:border-accent/30 transition-all">
                            <span className="text-sm font-medium">{s.title}</span>
                            <button 
                              onClick={() => handleSourceImport(s.id, s.title)} 
                              disabled={importingSources.has(s.id)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all fex items-center gap-2 ${
                                importingSources.has(s.id)
                                  ? 'bg-app-surface/60 text-app-text/20 cursor-not-allowed'
                                  : contextItems.some(item => item.name === `[NB] ${s.title}`)
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                                    : 'bg-accent/20 text-accent hover:bg-accent hover:text-white font-bold'
                              }`}
                              title={`Importer la source ${s.title}`}
                            >
                              {importingSources.has(s.id) ? (
                                <>
                                  <Zap className="size-3 animate-spin" />
                                  Extraction...
                                </>
                              ) : contextItems.some(item => item.name === `[NB] ${s.title}`) ? (
                                <>
                                  <CheckCircle2 className="size-3" />
                                  Importé
                                </>
                              ) : (
                                'Import'
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20 italic">
                        <BookOpen className="w-16 h-16 mb-4 text-app-text" />
                        <p>{t('modules:session.forge_module.notebook.select_notebook_hint')}</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChronicleForge;
