import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Hammer, FileUp, Globe, X, Rocket, Zap, Sparkles, ChevronRight, Shield } from 'lucide-react';
import { forgeService } from '../ForgeService';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm } from '../../../stores/useModalStore';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import ChronicleForge from './ChronicleForge';
import { useAIStore } from '../../../stores/useAIStore';
import { useBrainstormStore } from '../rules/store/useBrainstormStore';
import { useForgeStore } from '../store/useForgeStore';

interface NotebookSource {
  id: string;
  title: string;
  source_type: string;
}

interface Notebook {
  id: string;
  title: string;
  sources?: NotebookSource[];
  source_count?: number;
  sources_count?: number;
}

interface ForgeDashboardProps {
  mode?: 'system' | 'chronicle';
}

const ForgeDashboard: React.FC<ForgeDashboardProps> = ({ mode = 'system' }) => {
  const { t } = useTranslation(['modules']);
  const { saveGameDriver, addSheetTemplate, customGameDrivers, activeCampaignId, campaigns, updateCampaign } = useSessionOSStore();
  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
  
  // ... tabs state etc ...

  const allDrivers = [...DEFAULT_GAME_DRIVERS, ...customGameDrivers];
  const [activeTab, setActiveTab] = useState<'structure' | 'rules'>('structure');

  // Stores
  const forgeStore = useForgeStore();
  const brainstormStore = useBrainstormStore();

  // Logs & UI Local State
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // NotebookLM Integration State
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [notebookSources, setNotebookSources] = useState<NotebookSource[]>([]);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
  const [importingSources, setImportingSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-10), `> ${msg}`]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf');
        const isMarkdown = f.name.endsWith('.md') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.json');
        
        let content = '';
        if (isMarkdown) {
          const reader = new FileReader();
          const textPromise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
          });
          reader.readAsText(f);
          content = await textPromise;
        } else {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
          });
          reader.readAsDataURL(f);
          content = await base64Promise;
        }

        forgeStore.addContextItem({
          name: f.name,
          type: isPdf ? 'pdf' : isMarkdown ? 'text' : 'image',
          content,
          mimeType: f.type
        });
        addLog(`LOADED: ${f.name}`);
      }
    }
  };

  const handleOpenNotebookLM = async () => {
    setIsNotebookModalOpen(true);
    setIsLoadingNotebooks(true);
    addLog(t('modules:session.forge_module.notebook.connecting'));
    try {
      const result = await forgeService.callMcpTool<{ notebooks?: Notebook[], data?: { notebooks: Notebook[] }, content?: string }>('notebooklm-mcp-server', 'notebook_list', { max_results: 100 });
      
      const rawData = result.notebooks || result.data?.notebooks || result.content;
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
      addLog(t('modules:session.forge_module.notebook.linked_count', { count: notebooksToSet.length || 0 }));
    } catch (err) {
      addLog(t('modules:session.forge_module.notebook.fetch_error'));
      console.error(err);
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleNotebookSelect = async (notebookId: string) => {
    setIsLoadingNotebooks(true);
    addLog(t('modules:session.forge_module.notebook.browsing', { id: notebookId }));
    try {
      const result = await forgeService.callMcpTool<{ notebook?: unknown, sources?: unknown, content?: unknown }>('notebooklm-mcp-server', 'notebook_get', { notebook_id: notebookId });

      // Le client Gemini Notebook renvoie les sources **à côté** du carnet et
      // non dedans : `{ notebook: {...}, sources: [...] }`. Lire `.sources` sur
      // le seul objet `notebook` donnait une liste vide, sans erreur.
      const siblingSources = Array.isArray(result.sources)
        ? (result.sources as Array<{ id?: string; title?: string; source_type?: string }>).map(s => ({
            id: s.id || 'unknown',
            title: s.title || 'Untitled Source',
            source_type: s.source_type || 'archive',
          }))
        : null;

      let notebookData = result.notebook || result.content;
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
        addLog(t('modules:session.forge_module.notebook.sources_extracted', { count: mappedSources.length }));
      } else if (notebookData && typeof notebookData === 'object') {
        const data = notebookData as Notebook & { sources?: NotebookSource[] };
        const sources = siblingSources ?? data.sources ?? [];
        setSelectedNotebook({ ...data, sources });
        setNotebookSources(sources);
        addLog(t('modules:session.forge_module.notebook.sources_extracted', { count: sources.length }));
      } else {
        throw new Error("Notebook data not found in response");
      }
    } catch (err) {
      addLog(t('modules:session.forge_module.notebook.sources_fetch_error'));
      console.error(err);
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleSourceImport = async (sourceId: string, title: string) => {
    if (importingSources.has(sourceId)) return;
    
    gmConfirm(
      t('modules:session.forge_module.notebook.import_confirm', { title }),
      async () => {
        addLog(t('modules:session.forge_module.notebook.importing', { title }));
        setImportingSources(prev => new Set(prev).add(sourceId));
        
        try {
          const result = await forgeService.callMcpTool<{ content: unknown }>('notebooklm-mcp-server', 'source_get_content', { source_id: sourceId });
          
          let content = result.content;
          if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
            try {
              const parsed = JSON.parse(content);
              content = parsed.content || parsed;
            } catch { /* use as is */ }
          }

          forgeStore.addContextItem({
            name: `[NB] ${title}`,
            type: 'text',
            content: typeof content === 'string' ? content : JSON.stringify(content),
            mimeType: 'text/plain'
          });
          addLog(t('modules:session.forge_module.notebook.import_success', { title }));
          gmToast(t('modules:session.forge_module.notebook.import_success', { title }), "success");
          
          setImportingSources(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
          });

        } catch (err: any) {
          addLog(t('modules:session.forge_module.notebook.import_error'));
          console.error(err);
          
          if (err.message?.includes('MCP_AUTH_EXPIRED')) {
            gmToast("Authentification NotebookLM expirée. Tentative de reconnexion forcée...", "warning");
            handleReconnect();
          } else {
            gmToast(t('modules:session.forge_module.notebook.import_error'), "error");
          }

          setImportingSources(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
          });
        }
      }
    );
  };

  const handleReconnect = async () => {
    addLog("REBOOTING MCP NEURAL BRIDGE...");
    try {
      await forgeService.callMcpTool('notebooklm-mcp-server', 'refresh_auth', {});
      addLog("BRIDGE RESTORED. PLEASE TRY AGAIN.");
      gmToast("Connexion rétablie. Vous pouvez réessayer l'import.", "success");
    } catch (err) {
      addLog("RECONNECTION FAILED. CHECK BROWSER LOGIN.");
      gmToast("Échec de la reconnexion. Vérifiez votre session Google.", "error");
    }
  };

  const removeContextItem = (index: number) => {
    forgeStore.removeContextItem(index);
    addLog("ITEM DISCARDED FROM CONTEXT.");
  };

  const startAnalysis = async () => {
    if (forgeStore.contextItems.length === 0) {
      console.warn("No context items!");
      return;
    }

    const { activeProvider } = useAIStore.getState();
    console.error(`[Forge] Provider: ${activeProvider}, Items: ${forgeStore.contextItems.length}`);

    forgeStore.startAnalysis();
    setLogs([]);
    addLog("IGNITING FORGE CORE...");
    
    try {
      console.error("[Forge] Calling forgeService.forgeSystem...");
      const result = await forgeService.forgeSystem(forgeStore.contextItems, forgeStore.userInstructions, forgeStore.targetSystemName);
      forgeStore.completeAnalysis(result);
      addLog("SUCCESS: UNIFIED SYSTEM CORE CONSTRUCTED.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "FORGING FAILED.";
      addLog(`ERROR: ${errorMsg}`);
      forgeStore.setError(errorMsg);
      console.error(err);
    }
  };

  const handleForgeSave = () => {
    if (!forgeStore.analysisResult || !forgeStore.analysisResult.driver.name || !forgeStore.analysisResult.template.name) return;

    const driverId = `custom-${Date.now()}`;
    const templateId = `custom-template-${Date.now()}`;

    const driver: GameDriver = {
      ...forgeStore.analysisResult.driver as GameDriver,
      id: driverId,
      templateId,
      author: 'User',
      version: '1.0.0',
      name: forgeStore.analysisResult.driver.name
    };
    
    const template: SheetTemplate = {
      ...forgeStore.analysisResult.template as SheetTemplate,
      id: templateId,
      isBuiltin: false,
      name: forgeStore.analysisResult.template.name
    };

    saveGameDriver(driver);
    addSheetTemplate(template);
    
    addLog(t('modules:session.forge_module.sync_success'));
    forgeStore.reset();
  };

  if (mode === 'chronicle') {
    return <ChronicleForge />;
  }

  return (
    <div className="h-full overflow-y-auto p-8 pt-20 flex flex-col gap-8 animate-in fade-in duration-500 custom-scrollbar bg-app-bg text-app-text font-sans">
      {/* Header Section */}
      {/* Navigation Tabs */}
      <div className="flex gap-4 p-1 bg-app-surface/40 rounded-2xl border border-app-border/10 w-fit self-center">
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'structure' 
              ? 'bg-accent text-app-text shadow-glow-accent/20' 
              : 'text-app-text/40 hover:bg-app-text/5'
          }`}
        >
          {t('modules:session.forge_module.tabs.structure') || 'Structure Système'}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'rules' 
              ? 'bg-purple-600 text-app-text shadow-glow-purple/20' 
              : 'text-app-text/40 hover:bg-app-text/5'
          }`}
        >
          {t('modules:session.forge_module.tabs.rules') || 'Atelier de Règles'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 pb-20 flex-1 min-h-0">
        {/* Left Column: Context & Discovery */}
        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {activeTab === 'structure' ? (
            <>
              {/* Metadata / Output Target */}
              <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
                   <Rocket size={14} className="animate-pulse" /> {t('modules:session.forge_module.destination_label')}
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="relative group">
                    <select 
                      value={allDrivers.find(d => d.name === forgeStore.targetSystemName)?.id || ''} 
                      onChange={(e) => {
                        const driver = allDrivers.find(d => d.id === e.target.value);
                        if (driver) forgeStore.setTargetName(driver.name);
                        else if (e.target.value === 'NEW') forgeStore.setTargetName('');
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white/80 focus:outline-none focus:border-accent/50 appearance-none cursor-pointer transition-all hover:bg-white/10"
                    >
                      <option value="" disabled className="bg-app-bg text-white/40">-- Choisir un Driver --</option>
                      {allDrivers.map(d => (
                        <option key={d.id} value={d.id} className="bg-app-bg text-white">
                          {d.emoji} {d.name}
                        </option>
                      ))}
                      <option value="NEW" className="bg-app-bg text-accent font-black">+ CRÉER UN NOUVEAU SYSTÈME</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-accent transition-colors">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>

                  <div className="relative">
                    <input 
                      type="text"
                      value={forgeStore.targetSystemName} 
                      onChange={(e) => forgeStore.setTargetName(e.target.value)} 
                      placeholder={t('modules:session.forge_module.destination_placeholder')} 
                      className="w-full bg-white/2 border-b border-white/10 p-2 text-sm text-white/80 focus:outline-none focus:border-accent/50 transition-all placeholder:text-white/10 font-sans italic" 
                    />
                    {!allDrivers.find(d => d.name === forgeStore.targetSystemName) && forgeStore.targetSystemName && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[8px] font-black text-accent uppercase tracking-widest animate-pulse">
                        <Sparkles size={10} /> Nouveau
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Instructions Extension */}
              <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
                   <Sparkles size={14} className="text-amber-500" /> {t('modules:session.forge_module.intentions_label')}
                </h2>
                <textarea 
                  value={forgeStore.userInstructions} 
                  onChange={(e) => forgeStore.setInstructions(e.target.value)} 
                  placeholder={t('modules:session.forge_module.intentions_placeholder')} 
                  className="w-full bg-transparent text-xs text-app-text/60 focus:outline-none placeholder:text-app-text/20 font-sans border border-app-border/10 rounded-xl p-3 focus:border-accent/50 transition-all min-h-[100px] resize-none" 
                />
              </div>
            </>
          ) : (
            <>
              {/* Rules Atelier Settings */}
              <div className="bg-purple-500/10 rounded-2xl border border-purple-500/20 p-5 flex flex-col gap-4 animate-in slide-in-from-left-4">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-display">
                   <Shield size={14} /> {t('session.campaign_form.identity.system_label') || 'Système de Jeu'}
                </h2>
                
                <div className="relative group">
                  <select 
                    value={activeCampaign?.system || ''} 
                    onChange={(e) => {
                      if (activeCampaignId) updateCampaign(activeCampaignId, { system: e.target.value });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white/80 focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer transition-all hover:bg-white/10"
                  >
                    <option value="" disabled className="bg-app-bg text-white/40">-- Choisir un Système --</option>
                    {allDrivers.map(d => (
                      <option key={d.id} value={d.id} className="bg-app-bg text-white">
                        {d.emoji} {d.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-purple-400 transition-colors">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>

                <div className="h-px bg-white/5 my-1" />

                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-display">
                   <Sparkles size={14} /> {t('modules:session.forge_module.atelier.custom_subject_label')}
                </h2>
                <textarea 
                  value={brainstormStore.customSubject} 
                  onChange={(e) => brainstormStore.setCustomSubject(e.target.value)} 
                  placeholder={t('modules:session.forge_module.atelier.custom_subject_placeholder')} 
                  className="w-full bg-white/5 text-xs text-app-text/80 focus:outline-none placeholder:text-white/10 font-sans border border-white/10 rounded-xl p-4 focus:border-purple-500/50 transition-all min-h-[120px] resize-none" 
                />
                <button
                  disabled={!selectedNotebook}
                  onClick={() => {
                    brainstormStore.setNotebook(selectedNotebook?.id || '');
                    brainstormStore.startDiscovery();
                  }}
                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    !selectedNotebook ? 'bg-white/5 text-white/10 cursor-not-allowed' : 'bg-purple-600 text-white shadow-glow-purple/30 hover:scale-105 active:scale-95'
                  }`}
                >
                  {t('modules:session.forge_module.atelier.analyze_button')}
                </button>
              </div>
            </>
          )}


          {/* Context Bin (Common to both tabs) */}
          <div className="flex-1 bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-accent font-display">
                <FileUp className="w-6 h-6" /> {t('modules:session.forge_module.context_title')}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenNotebookLM}
                  className="p-2.5 hover:bg-accent/10 rounded-xl text-accent transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-accent/20"
                >
                  <Globe className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => (document.getElementById('forge-file-input') as HTMLInputElement)?.click()}
                  className="p-2.5 hover:bg-app-text/5 rounded-xl text-app-text/40 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-app-border/10"
                >
                  <FileUp className="w-6 h-6" />
                </button>
              </div>
              <input 
                id="forge-file-input"
                type="file" 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {(activeTab === 'structure' ? forgeStore.contextItems : notebookSources.filter(s => brainstormStore.selectedSourceIds.includes(s.id))).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-app-border/20 flex items-center justify-center mb-4 text-app-text">
                    <Rocket className="w-8 h-8" />
                  </div>
                  <p className="text-sm">{t('modules:session.forge_module.atelier.empty_sources')}</p>
                </div>
              )}
              
              {activeTab === 'structure' ? forgeStore.contextItems.map((item, idx) => (
                <div key={idx} className="group relative bg-app-text/5 p-4 rounded-xl border border-app-border/10 hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg"><FileUp className="w-5 h-5 text-accent" /></div>
                    <div className="flex-1 min-w-0 text-app-text">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                    </div>
                    <button onClick={() => removeContextItem(idx)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              )) : notebookSources.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => {
                    const current = brainstormStore.selectedSourceIds;
                    if (current.includes(s.id)) {
                      brainstormStore.setSources(current.filter(id => id !== s.id));
                    } else {
                      brainstormStore.setSources([...current, s.id]);
                    }
                  }}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                    brainstormStore.selectedSourceIds.includes(s.id) ? 'bg-purple-600/20 border-purple-500/50 shadow-glow-purple/10' : 'bg-app-text/5 border-app-border/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${brainstormStore.selectedSourceIds.includes(s.id) ? 'bg-purple-500 text-white' : 'bg-white/5 text-app-text/40'}`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold truncate flex-1">{s.title}</p>
                    {brainstormStore.selectedSourceIds.includes(s.id) && <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Forge Action Button */}
            {activeTab === 'structure' && (
              <div className="flex flex-col gap-2 mt-4">
                <button 
                  onClick={startAnalysis}
                  disabled={forgeStore.contextItems.length === 0 || forgeStore.isProcessing}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    forgeStore.contextItems.length === 0 || forgeStore.isProcessing
                      ? 'bg-app-text/5 text-app-text/20 cursor-not-allowed' 
                      : 'bg-accent text-white shadow-glow-accent/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {forgeStore.isProcessing ? (
                    <>
                      <Zap className="w-5 h-5 animate-spin" />
                      {t('modules:session.forge_module.atelier.transmuting')}
                    </>
                  ) : (
                    <>
                      <Hammer className="w-5 h-5" />
                      {t('modules:session.forge_module.atelier.forge_button')}
                    </>
                  )}
                </button>
                
                {forgeStore.isProcessing && (
                  <button 
                    onClick={() => {
                      forgeStore.stopAnalysis();
                      addLog("TRANSMUTATION ABORTED MANUALLY.");
                      gmToast("Transmutation annulée", "info");
                    }}
                    className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    {t('modules:session.forge_module.atelier.abort_forge')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Content */}
        <div className="col-span-8 bg-app-surface/40 rounded-2xl border border-app-border/10 flex flex-col overflow-hidden shadow-2xl min-h-[600px] text-app-text relative">
          
          {activeTab === 'structure' ? (
            forgeStore.analysisResult ? (
              <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
                <h3 className="text-3xl font-black uppercase tracking-tighter font-display">{t('modules:session.forge_module.atelier.adn_built')}</h3>
                <div className="h-1 w-20 bg-accent rounded-full" />
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-app-text/5 p-6 rounded-2xl border border-app-border/10 space-y-4">
                    <p className="text-[10px] uppercase font-bold text-accent tracking-widest">{t('modules:session.forge_module.atelier.configuration')}</p>
                    <p className="text-xl font-bold font-display">{forgeStore.analysisResult.driver.name}</p>
                    <p className="text-xs opacity-60">{forgeStore.analysisResult.driver.dice?.defaultDice} engine</p>
                  </div>
                  <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 space-y-4">
                    <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">{t('modules:session.forge_module.atelier.mechanics')}</p>
                    <ul className="space-y-2">
                      {forgeStore.analysisResult.driver.combat?.statsToTrack?.map((s, i) => (
                        <li key={i} className="text-xs font-bold flex items-center gap-2"><Zap size={12} /> {s.label}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-8 bg-accent rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-xl">{t('modules:session.forge_module.atelier.ready_title')}</p>
                    <p className="text-white/60 text-xs">{t('modules:session.forge_module.atelier.ready_desc')}</p>
                  </div>
                  <button 
                    onClick={handleForgeSave}
                    className="px-8 py-4 bg-white text-accent rounded-xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    {t('modules:session.forge_module.atelier.btn_save')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                 <Rocket size={64} className="text-accent/20 animate-bounce" />
                 <h3 className="text-2xl font-bold font-display uppercase">{t('modules:session.forge_module.atelier.waiting_transmutation')}</h3>
                 <p className="text-app-text/40 max-w-md mx-auto">{t('modules:session.forge_module.atelier.transmutation_waiting_desc')}</p>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
               <Sparkles size={64} className="text-purple-400/20 animate-pulse" />
               <h3 className="text-2xl font-bold font-display uppercase text-purple-400">{t('modules:session.forge_module.atelier.brainstorm_title')}</h3>
               <p className="text-app-text/40 max-w-md mx-auto">{t('modules:session.forge_module.atelier.brainstorm_desc')}</p>

               {/*
                 L'atelier est monte une seule fois, globalement, par App.tsx.
                 Le monter aussi ici en creait une SECONDE instance : deux effets
                 identiques partaient de front vers le carnet, qui n'en honorait
                 qu'une partie. Il est en `fixed inset-0`, il n'a aucun besoin de
                 vivre dans cet arbre.
               */}
            </div>
          )}
        </div>
      </div>

      {/* NotebookLM Modal Overlay (Keep same logic) */}
      {isNotebookModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-app-bg/80 backdrop-blur-sm animate-in fade-in">
           <div className="w-full max-w-4xl bg-app-bg border border-accent/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[70vh] text-app-text font-sans">
              <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-accent/5">
                 <h2 className="text-xl font-bold uppercase tracking-wider text-accent flex items-center gap-3 font-display">
                   <Globe className="w-6 h-6" /> {t('modules:session.forge_module.notebook.title')}
                 </h2>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={handleReconnect}
                      title="Forcer la reconnexion"
                      className="p-2 hover:bg-accent/10 rounded-full text-accent transition-all hover:rotate-180 duration-500"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsNotebookModalOpen(false)} className="p-2 hover:bg-app-text/5 rounded-full text-app-text/40 transition-colors"><X /></button>
                 </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <div className="w-1/3 border-r border-app-border/10 overflow-y-auto p-4 space-y-2 bg-app-surface/20">
                    {isLoadingNotebooks && notebooks.length === 0 ? (
                      <div className="flex items-center justify-center h-40"><Zap className="w-8 h-8 text-accent animate-spin" /></div>
                    ) : (
                      notebooks.map(nb => (
                        <button 
                          key={nb.id} 
                          onClick={() => handleNotebookSelect(nb.id)} 
                          className={`w-full text-left p-4 rounded-2xl transition-all border ${
                            selectedNotebook?.id === nb.id 
                              ? 'bg-accent/20 border-accent/40 text-accent' 
                              : 'border-transparent hover:bg-app-text/5 text-app-text/40'
                          }`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest font-display">{nb.title}</div>
                        </button>
                      ))
                    )}
                 </div>
                 <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {selectedNotebook ? (
                      <div className="flex flex-col h-full gap-4">
                         <div className="grid grid-cols-1 gap-3">
                            {notebookSources.map(s => (
                              <div key={s.id} className="flex items-center justify-between p-4 bg-app-surface/40 rounded-2xl border border-app-border/10 hover:border-accent/30 transition-all">
                                <span className="text-sm font-medium">{s.title}</span>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleSourceImport(s.id, s.title)} 
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                      forgeStore.contextItems.some(item => item.name === `[NB] ${s.title}`)
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-accent/20 text-accent hover:bg-accent hover:text-white'
                                    }`}
                                  >
                                    {t('modules:session.forge_module.atelier.source_adn_btn')}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const current = brainstormStore.selectedSourceIds;
                                      if (current.includes(s.id)) {
                                        brainstormStore.setSources(current.filter(id => id !== s.id));
                                      } else {
                                        brainstormStore.setSources([...current, s.id]);
                                      }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                      brainstormStore.selectedSourceIds.includes(s.id)
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    }`}
                                  >
                                    {t('modules:session.forge_module.atelier.source_atelier_btn')}
                                  </button>
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20 italic">
                        <Rocket className="w-16 h-16 mb-4 text-app-text" />
                        <p>Sélectionnez un carnet</p>
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

export default ForgeDashboard;
