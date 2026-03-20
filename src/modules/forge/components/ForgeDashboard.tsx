import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useDebugStore } from '../../../stores/useDebugStore';
import { Hammer, FileUp, Globe, X, Rocket, Zap, Sparkles } from 'lucide-react';
import { forgeService, type ForgeContextItem, type ForgeSystemResult } from '../ForgeService';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import ChronicleForge from './ChronicleForge';

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
  const forgeMode = mode;
  const { saveGameDriver, addSheetTemplate } = useSessionOSStore();
  const [contextItems, setContextItems] = useState<ForgeContextItem[]>([]);
  const [userInstructions, setUserInstructions] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ForgeSystemResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  useLayoutEffect(() => {
    const renderTime = Date.now() - startTimeRef.current;
    if (renderTime > 16) { // Only log if it's potentially skipping a frame
       useDebugStore.getState().addLog('debug', `[PERF:FORGE] ForgeDashboard render took ${renderTime}ms`, { renderTime });
    }
    // Reset for next potential render cycle if needed, though usually we want mounting time
  });

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
    const bridge = (window as { appBridge?: any }).appBridge; // Still need any for window.appBridge unless we have a full type
    if (!bridge?.mcp?.callTool) {
      throw new Error("Bridge MCP not available");
    }
    
    // Explicit bridge type for internal usage
    const mcpBridge = bridge.mcp as { 
      callTool: (server: string, tool: string, args: Record<string, unknown>) => Promise<any> 
    };

    const checkError = (res: unknown): boolean => {
      const str = typeof res === 'string' ? res : JSON.stringify(res);
      return str.includes("Authentication expired") || str.includes("RPC Error 16") || str.includes("expired");
    };

    try {
      const result = await mcpBridge.callTool(serverName, toolName, args);
      
      if (checkError(result)) {
        addLog("AETHER EXPIRED. RE-IGNITING HEARTBEAT...");
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        addLog("RE-LINKED. RETRYING OPERATION...");
        const retryResult = await mcpBridge.callTool(serverName, toolName, args);
        if (checkError(retryResult)) {
          throw new Error("RETRY FAILED: STILL EXPIRED.");
        }
        return retryResult as T;
      }
      
      return result as T;
    } catch (err: unknown) {
      if (checkError(err)) {
        addLog("AETHER EXPIRED (CATCH). RE-IGNITING...");
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        addLog("RE-LINKED. RETRYING...");
        return await mcpBridge.callTool(serverName, toolName, args) as T;
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
    addLog("CONNECTING TO NOTEBOOKLM AETHER...");
    try {
      const result = await callMcpToolWithRetry<{ notebooks?: Notebook[], data?: any, content?: any }>('notebooklm-mcp-server', 'notebook_list', { max_results: 100 });
      
      const rawData = result.notebooks || result.data || result.content;
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
        notebooksToSet = (rawData.notebooks || rawData.data || []) as Notebook[];
      }

      setNotebooks(notebooksToSet);
      addLog(`LINKED: ${notebooksToSet.length || 0} NOTEBOOKS DISCOVERED.`);
    } catch (err) {
      addLog("ERROR: COULD NOT RETRIEVE NOTEBOOKS.");
      console.error(err);
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleNotebookSelect = async (notebookId: string) => {
    setIsLoadingNotebooks(true);
    addLog(`BROWSING ARCHIVES: ${notebookId}`);
    try {
      const result = await callMcpToolWithRetry<{ notebook?: any, content?: any }>('notebooklm-mcp-server', 'notebook_get', { notebook_id: notebookId });
      
      let notebookData = result.notebook || result.content;
      if (typeof notebookData === 'string') {
        try {
          const parsed = JSON.parse(notebookData);
          notebookData = parsed.notebook || parsed;
        } catch { /* use as is */ }
      }

      if (Array.isArray(notebookData) && notebookData[0]) {
        const raw = notebookData[0];
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
        addLog(`SUCCESS: ${mappedSources.length} SOURCES EXTRACTED.`);
      } else if (notebookData && typeof notebookData === 'object') {
        const data = notebookData as Notebook & { sources?: NotebookSource[] };
        setSelectedNotebook(data);
        setNotebookSources(data.sources || []);
        addLog(`SUCCESS: ${data.sources?.length || 0} SOURCES EXTRACTED.`);
      } else {
        throw new Error("Notebook data not found in response");
      }
    } catch (err) {
      addLog("ERROR: FAILED TO FETCH SOURCES.");
      console.error(err);
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleSourceImport = async (sourceId: string, title: string) => {
    if (importingSources.has(sourceId)) return;
    
    addLog(`IMPORTING SCROLL: ${title}...`);
    setImportingSources(prev => new Set(prev).add(sourceId));
    
    try {
      const result = await callMcpToolWithRetry<{ content: any }>('notebooklm-mcp-server', 'source_get_content', { source_id: sourceId });
      
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
      addLog(`SUCCESS: ${title} ADDED TO BUCKET.`);
      
      setTimeout(() => {
        setImportingSources(prev => {
          const next = new Set(prev);
          next.delete(sourceId);
          return next;
        });
      }, 3000);

    } catch (err) {
      addLog("ERROR: IMPORT FAILED.");
      console.error(err);
      setImportingSources(prev => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }
  };

  const removeContextItem = (index: number) => {
    setContextItems(prev => prev.filter((_, i) => i !== index));
    addLog("ITEM DISCARDED FROM CONTEXT.");
  };

  const startAnalysis = async () => {
    if (contextItems.length === 0) return;

    setIsAnalyzing(true);
    setLogs([]);
    addLog("IGNITING SYSTEM FORGE v5.1...");
    addLog("AGGREGATING MULTIMODAL CONTEXT...");

    try {
      const result = await forgeService.forgeSystem(contextItems, userInstructions);
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
    if (!analysisResult) return;

    const driver: GameDriver = {
      ...analysisResult.driver,
      id: `custom-${Date.now()}`,
      author: 'User',
      version: '1.0.0'
    } as GameDriver;
    saveGameDriver(driver);

    const template: SheetTemplate = {
      ...analysisResult.template,
      id: `custom-template-${Date.now()}`,
      isBuiltin: false
    } as SheetTemplate;
    addSheetTemplate(template);

    driver.templateId = template.id;
    saveGameDriver(driver);

    addLog("SYSTEM QUENCHED: BRAIN & BODY SAVED TO LIBRARY.");
    setAnalysisResult(null);
    setContextItems([]);
  };

  return (
    <div className="flex flex-col h-full bg-background-dark/30 text-white relative overflow-hidden font-inter">

      {forgeMode === 'chronicle' ? (
        <ChronicleForge />
      ) : (
        <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-y-auto bg-slate-900/10 font-display text-slate-100 p-8 custom-scrollbar pt-20">
          
          <header className="flex items-center justify-between mb-8 pb-6 border-b border-primary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 text-primary animate-pulse shadow-glow-primary/20 border border-primary/20">
                <Hammer size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-primary glow-text-primary">System Forge IA</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Protocol V.5.10 // Engine</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-6 pb-32">
            <div className="col-span-4 flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                 <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Context Bin</h2>
                 <div className={`relative min-h-[300px] rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col p-4 bg-background-dark/40 ${
                   contextItems.length > 0 ? 'border-primary' : 'border-primary/20 hover:border-primary/50'
                 }`}>
                    <div className={`flex flex-col gap-2 ${contextItems.length === 0 ? 'flex-1 justify-center' : ''}`}>
                      {contextItems.length === 0 ? (
                        <label htmlFor="ritual-upload" className="cursor-pointer flex flex-col items-center justify-center text-center p-8 opacity-40">
                          <FileUp size={48} className="text-primary mb-2" />
                          <p className="text-[10px] text-slate-500 uppercase">Drop Sources Here</p>
                        </label>
                      ) : (
                        contextItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                            <span className="text-xs font-bold truncate">{item.name}</span>
                            <button onClick={() => removeContextItem(idx)} className="opacity-0 group-hover:opacity-100 hover:text-red-400">
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-white/5">
                      <label htmlFor="ritual-upload" className="cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase">
                         <FileUp size={14} /> Add
                      </label>
                      <button onClick={handleOpenNotebookLM} className="flex flex-col items-center justify-center p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-[10px] uppercase">
                         <Globe size={14} /> NotebookLM
                      </button>
                    </div>
                    <input type="file" id="ritual-upload" className="hidden" onChange={handleFileUpload} multiple />
                 </div>
              </div>
              {/* Terminal Logs */}
              <div className="bg-black/60 rounded-2xl p-4 border border-primary/10 h-32 font-mono text-[10px] overflow-y-auto custom-scrollbar">
                 {logs.map((log, i) => (
                   <div key={i} className={log.startsWith('> ERROR') ? 'text-red-400' : 'text-primary/70'}>{log}</div>
                 ))}
                 <div ref={logEndRef} />
              </div>

              {/* MJ Instructions Area */}
              <div className="bg-black/40 rounded-2xl border border-accent/20 p-5 flex flex-col gap-3 min-h-[160px] hover:border-accent/40 transition-all">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                   <Sparkles size={14} className="animate-pulse" /> Intentions du MJ
                </h2>
                <textarea 
                  value={userInstructions} 
                  onChange={(e) => setUserInstructions(e.target.value)} 
                  placeholder="Ex: Concentre-toi sur un système de blessures localisées complexe et une magie corruptrice..." 
                  className="w-full flex-1 bg-transparent text-xs text-slate-300 resize-none focus:outline-none placeholder:text-slate-600 leading-relaxed font-inter" 
                />
              </div>
            </div>

            <div className="col-span-8 flex flex-col gap-6">
              <div className="flex-1 grid grid-cols-2 gap-4">
                 <div className="flex flex-col bg-black/40 border border-primary/20 rounded-2xl overflow-hidden min-h-[400px]">
                    <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 text-[10px] font-bold text-primary uppercase">Brain Core</div>
                    <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                       {analysisResult?.driver ? (
                          <div className="space-y-4">
                             <h3 className="text-xl font-bold uppercase">{analysisResult.driver.name}</h3>
                             <p className="text-xs text-slate-500">{analysisResult.driver.description}</p>
                             <div className="space-y-2">
                               {analysisResult.driver.combat?.statsToTrack?.map((s, idx) => (
                                 <div key={idx} className="flex justify-between p-2 bg-black/20 rounded border border-white/5 text-xs">
                                   <span>{s.label}</span>
                                   <span className="text-accent">{s.fieldId}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                       ) : <div className="h-full flex items-center justify-center opacity-20">Awaiting Analysis</div>}
                    </div>
                 </div>
                 <div className="flex flex-col bg-black/40 border border-accent/20 rounded-2xl overflow-hidden min-h-[400px]">
                    <div className="bg-accent/10 px-4 py-2 border-b border-accent/20 text-[10px] font-bold text-accent uppercase">Body Forge</div>
                    <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                       {analysisResult?.template ? (
                          <div className="space-y-4">
                             <h3 className="text-xl font-bold uppercase">{analysisResult.template.name}</h3>
                             {analysisResult.template.sections?.map((s, i) => (
                               <div key={i} className="space-y-2">
                                  <div className="text-[10px] font-bold text-accent border-l-2 border-accent pl-2 uppercase">{s.label}</div>
                                  <div className="grid grid-cols-2 gap-2">
                                     {s.fields?.map((f, j) => (
                                       <div key={j} className="p-2 bg-white/5 rounded text-[10px]">
                                         <div className="font-bold">{f.label}</div>
                                         <div className="text-slate-500 italic">{f.id}</div>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                             ))}
                          </div>
                       ) : <div className="h-full flex items-center justify-center opacity-20">Awaiting Forge</div>}
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <footer className="fixed bottom-0 left-20 right-0 h-24 bg-background-dark/95 backdrop-blur-xl border-t border-primary/20 flex items-center justify-between px-12 z-50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase">System Forge Protocol</span>
              <span className="text-xs text-slate-400 uppercase">{isAnalyzing ? 'ANALYSE...' : 'READY'}</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => { setContextItems([]); setAnalysisResult(null); }} className="px-6 py-2 text-slate-400 hover:text-red-400 text-[10px] uppercase font-bold">Purge</button>
              <button 
                onClick={analysisResult ? handleForgeSave : startAnalysis} 
                disabled={!analysisResult && (contextItems.length === 0 || isAnalyzing)} 
                className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-sm uppercase transition-all ${
                  analysisResult 
                    ? 'bg-accent shadow-glow-accent/40 hover:scale-105 active:scale-95' 
                    : 'bg-primary shadow-glow-primary/40 hover:rotate-1 active:scale-95'
                } text-white`}
              >
                {analysisResult ? (
                  <>
                    <Rocket className="w-5 h-5" /> Quench & Save
                  </>
                ) : (
                  <>
                    {isAnalyzing ? <Zap className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />} Ignite Forge
                  </>
                )}
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* NotebookLM Modal Overlay */}
      {isNotebookModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="w-full max-w-4xl bg-slate-900 border border-primary/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[70vh]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                 <h2 className="text-xl font-bold uppercase tracking-wider">NotebookLM Browser</h2>
                 <button onClick={() => setIsNotebookModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <div className="w-1/3 border-r border-white/5 overflow-y-auto p-4 space-y-2">
                    {isLoadingNotebooks && notebooks.length === 0 ? (
                      <div className="flex items-center justify-center p-4">
                        <Zap size={24} className="animate-spin text-primary" />
                      </div>
                    ) : (
                      notebooks.map(nb => (
                         <button key={nb.id} onClick={() => handleNotebookSelect(nb.id)} className={`w-full text-left p-3 rounded-xl transition-all ${selectedNotebook?.id === nb.id ? 'bg-primary/20 border-primary/40' : 'hover:bg-white/5'}`}>
                            <div className="text-xs font-bold uppercase">{nb.title}</div>
                         </button>
                      ))
                    )}
                 </div>
                 <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {selectedNotebook ? (
                      <div className="grid grid-cols-1 gap-2">
                        {notebookSources.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <span className="text-xs font-bold">{s.title}</span>
                            <button onClick={() => handleSourceImport(s.id, s.title)} className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold uppercase rounded-lg hover:bg-primary hover:text-white transition-all">Import</button>
                          </div>
                        ))}
                      </div>
                    ) : <div className="h-full flex items-center justify-center opacity-20 italic">Select a notebook</div>}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ForgeDashboard;
