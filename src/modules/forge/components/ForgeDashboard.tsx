import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebugStore } from '../../../stores/useDebugStore';
import { Hammer, FileUp, Globe, X, Rocket, Zap, Sparkles } from 'lucide-react';
import { forgeService, type ForgeContextItem, type ForgeSystemResult } from '../ForgeService';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm } from '../../../stores/useModalStore';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import ChronicleForge from './ChronicleForge';
import { useAIStore } from '../../../stores/useAIStore';

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
  const { activeProvider } = useAIStore();
  const { saveGameDriver, addSheetTemplate } = useSessionOSStore();
  const [contextItems, setContextItems] = useState<ForgeContextItem[]>([]);
  const [existingSystemName, setExistingSystemName] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ForgeSystemResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  useLayoutEffect(() => {
    const renderTime = Date.now() - startTimeRef.current;
    if (renderTime > 16) { 
       useDebugStore.getState().addLog('debug', `[PERF:FORGE] ForgeDashboard render took ${renderTime}ms`, { renderTime });
    }
  }, []);

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
      const result = await mcpBridge.callTool(serverName, toolName, args);
      
      if (checkError(result)) {
        addLog(t('modules:session.forge_module.notebook.connecting'));
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        addLog(t('modules:session.forge_module.notebook.browsing', { id: 'RETRY' }));
        const retryResult = await mcpBridge.callTool(serverName, toolName, args);
        if (checkError(retryResult)) {
          throw new Error("RETRY FAILED: STILL EXPIRED.");
        }
        return retryResult as unknown as T;
      }
      
      return result as unknown as T;
    } catch (err: unknown) {
      if (checkError(err)) {
        addLog(t('modules:session.forge_module.notebook.connecting'));
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        addLog(t('modules:session.forge_module.notebook.browsing', { id: 'RETRY' }));
        return await mcpBridge.callTool(serverName, toolName, args) as unknown as T;
      }
      throw err;
    }
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

        setContextItems(prev => [...prev, {
          name: f.name,
          type: isPdf ? 'pdf' : isMarkdown ? 'text' : 'image',
          content,
          mimeType: f.type
        }]);
        addLog(`LOADED: ${f.name}`);
      }
    }
  };

  const handleOpenNotebookLM = async () => {
    setIsNotebookModalOpen(true);
    setIsLoadingNotebooks(true);
    addLog(t('modules:session.forge_module.notebook.connecting'));
    try {
      const result = await callMcpToolWithRetry<{ notebooks?: Notebook[], data?: { notebooks: Notebook[] }, content?: string }>('notebooklm-mcp-server', 'notebook_list', { max_results: 100 });
      
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
      const result = await callMcpToolWithRetry<{ notebook?: unknown, content?: unknown }>('notebooklm-mcp-server', 'notebook_get', { notebook_id: notebookId });
      
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
        setSelectedNotebook(data);
        setNotebookSources(data.sources || []);
        addLog(t('modules:session.forge_module.notebook.sources_extracted', { count: data.sources?.length || 0 }));
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
          const result = await callMcpToolWithRetry<{ content: unknown }>('notebooklm-mcp-server', 'source_get_content', { source_id: sourceId });
          
          let content = result.content;
          if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
            try {
              const parsed = JSON.parse(content);
              content = parsed.content || parsed;
            } catch { /* use as is */ }
          }

          setContextItems(prev => [...prev, {
            name: `[NB] ${title}`,
            type: 'text',
            content: typeof content === 'string' ? content : JSON.stringify(content),
            mimeType: 'text/plain'
          }]);
          addLog(t('modules:session.forge_module.notebook.import_success', { title }));
          gmToast(t('modules:session.forge_module.notebook.import_success', { title }), "success");
          
          setImportingSources(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
          });

        } catch (err) {
          addLog(t('modules:session.forge_module.notebook.import_error'));
          console.error(err);
          gmToast(t('modules:session.forge_module.notebook.import_error'), "error");
          setImportingSources(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
          });
        }
      }
    );
  };

  const removeContextItem = (index: number) => {
    setContextItems(prev => prev.filter((_, i) => i !== index));
    addLog("ITEM DISCARDED FROM CONTEXT.");
  };

  const startAnalysis = async () => {
    if (contextItems.length === 0) return;

    setIsAnalyzing(true);
    setLogs([]);
    addLog(t('modules:session.forge_module.igniting'));
    addLog("AGGREGATING MULTIMODAL CONTEXT...");

    try {
      const result = await forgeService.forgeSystem(contextItems, userInstructions, existingSystemName);
      setAnalysisResult(result);
      addLog("SUCCESS: UNIFIED SYSTEM CORE CONSTRUCTED.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "FORGING FAILED.";
      addLog(`ERROR: ${errorMsg}`);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleForgeSave = () => {
    if (!analysisResult || !analysisResult.driver.name || !analysisResult.template.name) return;

    const driverId = `custom-${Date.now()}`;
    const templateId = `custom-template-${Date.now()}`;

    const driver: GameDriver = {
      ...analysisResult.driver as GameDriver,
      id: driverId,
      templateId,
      author: 'User',
      version: '1.0.0',
      name: analysisResult.driver.name // Ensure it's passed explicitly if needed by some TS versions
    };
    
    const template: SheetTemplate = {
      ...analysisResult.template as SheetTemplate,
      id: templateId,
      isBuiltin: false,
      name: analysisResult.template.name
    };

    saveGameDriver(driver);
    addSheetTemplate(template);
    
    addLog(t('modules:session.forge_module.sync_success'));
    setAnalysisResult(null);
    setContextItems([]);
  };

  if (mode === 'chronicle') {
    return <ChronicleForge />;
  }

  return (
    <div className="h-full overflow-y-auto p-8 pt-20 flex flex-col gap-8 animate-in fade-in duration-500 custom-scrollbar bg-app-bg text-app-text font-sans">
      {/* Header Section */}
      <header className="flex items-center justify-between mb-0 pb-6 border-b border-app-border/10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent/20 text-accent animate-pulse shadow-glow-accent/20 border border-accent/20">
            <Hammer size={24} />
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black uppercase tracking-widest text-app-text font-display">
              {t('modules:session.forge_module.title').toUpperCase()} <span className="text-accent/50 text-xs font-mono tracking-widest ml-2">v6.3.0</span>
            </h1>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
               activeProvider === 'gemini' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow-emerald/20'
             }`}>
               <Sparkles size={12} className={activeProvider === 'gemini' ? '' : 'animate-pulse'} />
               {t('modules:session.forge_module.engine_label')} : {activeProvider === 'gemini' ? 'Gemini 1.5' : 'Gemma 4' }
             </div>
          </div>
          <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.3em]">{t('modules:session.forge_module.subtitle')}</p>
        </div>

        <div className="flex items-center gap-4">
           {analysisResult && (
             <button
               onClick={() => setAnalysisResult(null)}
               className="px-6 py-3 rounded-xl bg-app-surface/40 hover:bg-app-surface border border-app-border text-[10px] font-black uppercase tracking-widest text-app-text/40 hover:text-app-text transition-all"
               title={t('modules:session.forge_module.reset_button')}
             >
               {t('modules:session.forge_module.reset_button')}
             </button>
           )}
           {!analysisResult && (
             <button
              onClick={startAnalysis}
              disabled={isAnalyzing || contextItems.length === 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all shadow-glow-accent/20 ${
                isAnalyzing || contextItems.length === 0 
                  ? 'bg-app-surface/20 text-app-text/20 opacity-50 cursor-not-allowed border border-app-border/10' 
                  : 'bg-accent text-app-text hover:scale-105 active:scale-95'
              }`}
              title={t('modules:session.forge_module.ignite_button')}
             >
               {isAnalyzing ? <Zap className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
               {t('modules:session.forge_module.ignite_button')}
             </button>
           )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 pb-20">
        {/* Left Column: Context Inputs */}
        <div className="col-span-4 flex flex-col gap-6">
          {/* Metadata / Output Target */}
          <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
            <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
               <Rocket size={14} className="animate-pulse" /> {t('modules:session.forge_module.destination_label')}
            </h2>
            <input 
              type="text"
              list="existing-systems"
              value={existingSystemName} 
              onChange={(e) => setExistingSystemName(e.target.value)} 
              placeholder={t('modules:session.forge_module.destination_placeholder')} 
              className="w-full bg-transparent text-sm text-app-text/80 focus:outline-none placeholder:text-app-text/30 font-sans border-b border-app-border/10 pb-1 focus:border-accent/50 transition-all" 
              title={t('modules:session.forge_module.destination_label')}
            />
            <datalist id="existing-systems">
              {DEFAULT_GAME_DRIVERS.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
          </div>

          {/* User Instructions Extension */}
          <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
            <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
               <Sparkles size={14} className="text-amber-500" /> {t('modules:session.forge_module.intentions_label')}
            </h2>
            <textarea 
              value={userInstructions} 
              onChange={(e) => setUserInstructions(e.target.value)} 
              placeholder={t('modules:session.forge_module.intentions_placeholder')} 
              className="w-full bg-transparent text-xs text-app-text/60 focus:outline-none placeholder:text-app-text/20 font-sans border border-app-border/10 rounded-xl p-3 focus:border-accent/50 transition-all min-h-[100px] resize-none" 
              title={t('modules:session.forge_module.intentions_label')}
            />
          </div>


          {/* Context Bin */}
          <div className="flex-1 bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-accent font-display">
                <FileUp className="w-6 h-6" /> {t('modules:session.forge_module.context_title')}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenNotebookLM}
                  className="p-2.5 hover:bg-accent/10 rounded-xl text-accent transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-accent/20"
                  title={t('modules:session.forge_module.notebook_browser_tooltip')}
                >
                  <Globe className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => (document.getElementById('forge-file-input') as HTMLInputElement)?.click()}
                  className="p-2.5 hover:bg-app-text/5 rounded-xl text-app-text/40 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-app-border/10"
                  title={t('modules:session.forge_module.load_files_tooltip')}
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
                title="Sélecteur de fichiers"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {contextItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-app-border/20 flex items-center justify-center mb-4 text-app-text">
                    <Rocket className="w-8 h-8" />
                  </div>
                  <p className="text-sm">{t('modules:session.forge_module.context_empty')}</p>
                </div>
              )}
              {contextItems.map((item, idx) => (
                <div key={idx} className="group relative bg-app-text/5 p-4 rounded-xl border border-app-border/10 hover:border-accent/30 transition-all animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg">
                      <FileUp className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0 text-app-text">
                      <p className="text-base font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-app-text/40 uppercase tracking-widest leading-none mt-1">{item.type}</p>
                    </div>
                    <button 
                      onClick={() => removeContextItem(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                      title="Supprimer l'item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Console Log Area */}
          <div className="h-48 bg-black/40 rounded-2xl border border-app-border/10 p-4 font-mono text-[10px] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="text-accent/80 animate-in slide-in-from-bottom-1">{log}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Blueprint Preview */}
        <div className="col-span-8 bg-app-surface/40 rounded-2xl border border-app-border/10 flex flex-col overflow-hidden shadow-2xl min-h-[600px] text-app-text font-sans">
          {analysisResult ? (
            <>
              <div className="flex-1 p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-white/5">
                <div className="animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-app-text mb-2 font-display">{t('modules:session.forge_module.status_constructed')}</h3>
                  <div className="h-1 w-20 bg-accent rounded-full mb-8" />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h4 className="text-xs font-black text-accent uppercase tracking-widest">{t('modules:session.forge_module.metadata_label')}</h4>
                    <div className="bg-app-text/5 p-6 rounded-2xl border border-app-border/10 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-app-text/30 tracking-widest">System Name</label>
                        <p className="text-xl font-bold font-display">{analysisResult.driver.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-app-text/30 tracking-widest">Dice Engine</label>
                          <p className="font-bold">{analysisResult.driver.dice?.defaultDice} ({analysisResult.driver.dice?.logic})</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-app-text/30 tracking-widest">Theme</label>
                          <p className="font-bold text-accent">{analysisResult.driver.ui_config?.themeColor || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-xs font-black text-accent uppercase tracking-widest">{t('modules:session.forge_module.mechanics_label')}</h4>
                    <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 h-full">
                       <ul className="space-y-3">
                         {analysisResult.driver.combat?.statsToTrack?.map((d, i) => (
                           <li key={i} className="flex items-center gap-3 text-sm">
                              <Zap size={14} className="text-emerald-400" />
                              <span className="font-bold opacity-80">{d.label} ({d.fieldId})</span>
                           </li>
                         ))}
                       </ul>
                    </div>
                  </section>
                </div>

                <section className="space-y-4">
                   <h4 className="text-xs font-black text-accent uppercase tracking-widest">{t('modules:session.forge_module.blueprints_label')}</h4>
                   <div className="grid grid-cols-3 gap-4">
                     {analysisResult.template.sections?.map((section, idx) => (
                        <div key={idx} className="bg-app-text/5 p-4 rounded-xl border border-app-border/10">
                           <p className="text-xs font-black uppercase text-accent mb-2 truncate">{section.label}</p>
                           <p className="text-[10px] opacity-40">{t('modules:session.forge_module.functional_fields', { count: section.fields.length })}</p>
                        </div>
                     ))}
                   </div>
                </section>
                
                <div className="bg-accent p-6 rounded-2xl border border-accent/20 flex items-center justify-between shadow-glow-accent/20">
                   <div>
                     <p className="text-white font-black text-lg">{t('modules:session.forge_module.ready_label')}</p>
                     <p className="text-white/60 text-xs font-medium italic">{t('modules:session.forge_module.sync_success')}</p>
                   </div>
                   <button 
                    onClick={handleForgeSave}
                    className="px-8 py-3 bg-white text-accent rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                    title={t('modules:session.forge_module.save_button')}
                   >
                     {t('modules:session.forge_module.save_button')}
                   </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-full h-full rounded-full border-2 border-accent/30 flex items-center justify-center overflow-hidden bg-app-surface/40">
                   </div>
               </div>
               <div>
                <h3 className="text-2xl font-bold mb-2 font-display text-app-text uppercase">{t('modules:session.forge_module.awaiting_transmutation')}</h3>
                <p className="text-app-text/40 max-w-md mx-auto font-sans leading-relaxed">
                  {t('modules:session.forge_module.transmutation_desc')}
                </p>
               </div>
              <div className="flex items-center gap-6 text-[9px] font-bold border border-white/5 bg-white/5 px-6 py-2 rounded-full text-app-text/40 uppercase tracking-widest font-mono">
                <span className="flex items-center gap-1.5"><Rocket className="w-3.5 h-3.5" /> AI {activeProvider === 'gemini' ? 'Gemini 1.5 Cloud' : 'Gemma 4 Local'}</span>
                <span className="flex items-center gap-1.5 border-l border-white/10 pl-6"><Globe className="w-3.5 h-3.5" /> Multimodal Extraction</span>
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
                              title={t('modules:session.forge_module.notebook.browsing', { id: s.title })}
                            >
                              {importingSources.has(s.id) ? (
                                <>
                                  <Zap className="size-3 animate-spin" />
                                  {t('modules:session.forge_module.igniting')}
                                </>
                              ) : contextItems.some(item => item.name === `[NB] ${s.title}`) ? (
                                <>
                                  <Sparkles className="size-3" />
                                  {t('modules:session.forge_module.notebook.import_success', { title: '' }).split(' ')[1]}
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
                        <Rocket className="w-16 h-16 mb-4 text-app-text" />
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

export default ForgeDashboard;
