import React, { useState, useEffect, useRef } from 'react';
import { Hammer, Save, Trash2, Rocket, FileUp, Terminal, Eye, Code, Zap, Globe, CheckCircle2 } from 'lucide-react';
import { forgeService } from '../ForgeService';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate, SheetField } from '../../../data/defaultSheetTemplates';

interface ForgeDriverData {
  name?: string;
  combat?: {
    statsToTrack?: Array<{ label: string; fieldId: string }>;
  };
}

interface ForgeTemplateData {
  name?: string;
  sections?: Array<{ label: string; fields?: SheetField[] }>;
}

interface DocItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: DocItem[];
}

const ForgeDashboard: React.FC = () => {
  const { saveGameDriver, addSheetTemplate } = useSessionOSStore();
  const [file, setFile] = useState<File | null>(null);
  const [localFile, setLocalFile] = useState<{ name: string, path: string, extension: string } | null>(null);
  const [localDocs, setLocalDocs] = useState<DocItem[]>([]);
  const [userInstructions, setUserInstructions] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ type: 'driver' | 'template', data: unknown } | null>(null);
  const [forgeTarget, setForgeTarget] = useState<'brain' | 'body'>('brain');
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLocalDocs();
  }, []);

  const fetchLocalDocs = async () => {
    if (window.appBridge?.ai?.listDocs) {
      const docs = await window.appBridge.ai.listDocs() as DocItem[];
      // Filter for 'systems' directory
      const systemsDir = docs.find((d: DocItem) => d.name === 'systems' && d.type === 'directory');
      if (systemsDir) {
        setLocalDocs(systemsDir.children || []);
      }
    }
  };

  const handleLocalFileSelect = (doc: DocItem) => {
    setFile(null);
    setLocalFile({
      name: doc.name,
      path: doc.path,
      extension: doc.extension || ''
    });
    setAnalysisResult(null);
    addLog(`LOCAL TOME SELECTED: ${doc.name}`);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-10), `> ${msg}`]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      addLog(`LOADED: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
    }
  };

  const startAnalysis = async () => {
    if (!file && !localFile) return;

    setIsAnalyzing(true);
    setLogs([]);
    addLog("INITIALIZING FORGE INTERFACE...");
    addLog("SYNCING WITH NEURAL NETWORKS...");

    try {
      addLog("READING ANCIENT SCROLLS...");
      
      let isPdf = false;
      let isImage = false;
      let isMarkdown = false;
      let textContent = "";
      let base64Content = "";
      let mimeType = "";

      if (file) {
        isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        isImage = file.type.startsWith('image/');
        isMarkdown = file.name.endsWith('.md') || file.type === 'text/markdown';
        mimeType = file.type;

        if (isMarkdown) {
          addLog("DECRYPTING MARKDOWN SCRIPTURE...");
          const reader = new FileReader();
          const textPromise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
          });
          reader.readAsText(file);
          textContent = await textPromise;
        } else if (file.name.endsWith('.txt')) {
          addLog("READING TEXT BUFFER...");
          const reader = new FileReader();
          const textPromise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
          });
          reader.readAsText(file);
          textContent = await textPromise;
          isMarkdown = true; 
        } else if (file.name.endsWith('.json') || file.name.endsWith('.jsonl')) {
          addLog(file.name.endsWith('.json') ? "PARSING JSON STRUCTURE..." : "PARSING JSONL STREAM...");
          const reader = new FileReader();
          const textPromise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
          });
          reader.readAsText(file);
          textContent = await textPromise;
          isMarkdown = true;
        } else {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
          });
          reader.readAsDataURL(file);
          base64Content = await base64Promise;
        }
      } else if (localFile) {
        isPdf = localFile.extension === '.pdf';
        isMarkdown = localFile.extension === '.md' || 
                     localFile.extension === '.txt' || 
                     localFile.extension === '.json' || 
                     localFile.extension === '.jsonl';
        
        if (isMarkdown) {
          if (localFile.extension === '.json') addLog("DECODING LOCAL JSON DATA...");
          else if (localFile.extension === '.jsonl') addLog("STREAMING LOCAL JSONL DATA...");
          else addLog("FETCHING LOCAL TEXT CONTENT...");
          textContent = await window.appBridge?.ai?.readDoc(localFile.path) || "";
        } else if (isPdf) {
          addLog("EXTRACTING LOCAL PDF TEXT (RAG BYPASS)...");
          textContent = await window.appBridge?.ai?.extractPDF(localFile.path) || "";
          isMarkdown = true; // Treat as text for Forge
        }
      }

      if (forgeTarget === 'brain') {
        addLog("ENGAGING BRAIN EXTRACTION (RULE ENGINE)...");
        if (isMarkdown || (localFile && isPdf)) {
          const result = await forgeService.analyzeRulebookText(textContent, userInstructions);
          setAnalysisResult({ type: 'driver', data: result });
        } else if (isPdf) {
          const result = await forgeService.analyzeRulebook(base64Content, mimeType, userInstructions);
          setAnalysisResult({ type: 'driver', data: result });
        } else {
          throw new Error("BRAIN EXTRACTION REQUIRES TEXT OR PDF MATERIAL.");
        }
        addLog("MAPPING SUCCESSFUL: GAME DRIVER CONSTRUCTED.");
      } else {
        addLog("ENGAGING BODY EXTRACTION (CHARACTER SHEET)...");
        if (isMarkdown || (localFile && isPdf)) {
          const result = await forgeService.analyzeCharacterSheetText(textContent, userInstructions);
          setAnalysisResult({ type: 'template', data: result });
        } else if (isPdf || isImage) {
          const result = await forgeService.analyzeCharacterSheet(base64Content, mimeType, userInstructions);
          setAnalysisResult({ type: 'template', data: result });
        } else {
          throw new Error("BODY EXTRACTION REQUIRES PDF, IMAGE OR TEXT MATERIAL.");
        }
        addLog("MAPPING SUCCESSFUL: SHEET TEMPLATE FORGED.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "FORGING FAILED.";
      addLog(`ERROR: ${errorMsg}`);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleForge = () => {
    if (!analysisResult) return;

    if (analysisResult.type === 'driver') {
      const driverData = analysisResult.data as Partial<GameDriver>;
      const driver: GameDriver = {
        ...driverData,
        id: `custom-${Date.now()}`,
        author: 'User',
        version: '1.0.0'
      } as GameDriver;
      saveGameDriver(driver);
      addLog("DRIVER QUENCHED AND SAVED TO LIBRARY.");
    } else {
      const template = analysisResult.data as SheetTemplate;
      addSheetTemplate(template);
      addLog("TEMPLATE QUENCHED AND SAVED TO LIBRARY.");
    }

    setAnalysisResult(null);
    setFile(null);
  };

  const driverData = analysisResult?.data as ForgeDriverData | undefined;
  const templateData = analysisResult?.data as ForgeTemplateData | undefined;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-900/10 font-display text-slate-100 p-8 custom-scrollbar">
      
      {/* Header Section */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-primary/10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20 text-primary animate-pulse shadow-glow-primary/20 border border-primary/20">
            <Hammer size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-primary glow-text-primary">System Forge</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Protocol V.2.04 // AI Multimodal</p>
          </div>
        </div>
        <div className="flex items-center gap-6 pr-40">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Core Synchronized</span>
            <span className="text-xs font-mono text-emerald-400">STATUS: READY</span>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
             <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 pb-32">
        
        {/* Left Col: Extraction Chamber & Logs */}
        <div className="col-span-4 flex flex-col gap-6">
          
          {/* Forge Target Selector */}
          <div className="flex flex-col gap-3">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Forge Targeting</h2>
             <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setForgeTarget('brain')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                    forgeTarget === 'brain' 
                    ? 'bg-primary border border-primary/50 shadow-glow-primary/20 text-white' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                   <Zap size={14} />
                   <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-black uppercase tracking-tighter">Brain Mode</span>
                      <span className="text-[8px] opacity-60 uppercase font-bold">Logic & Rules</span>
                   </div>
                </button>
                <button 
                  onClick={() => setForgeTarget('body')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                    forgeTarget === 'body' 
                    ? 'bg-accent border border-accent/50 shadow-glow-accent/20 text-white' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                   <Hammer size={14} />
                   <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-black uppercase tracking-tighter">Body Mode</span>
                      <span className="text-[8px] opacity-60 uppercase font-bold">Layout & Fields</span>
                   </div>
                </button>
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Chamber of Extraction</h2>
             <div className={`relative aspect-square rounded-3xl border-2 border-dashed transition-all duration-500 overflow-hidden group flex flex-col items-center justify-center p-8 ${
               file ? 'border-primary bg-primary/5' : 'border-primary/20 bg-background-dark/40 hover:border-primary/50'
             }`}>
               {/* Background Ritual Circle Decor */}
               <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border border-primary rounded-full animate-spin-slow" />
                  <div className="absolute w-48 h-48 border border-accent rounded-full animate-reverse-spin" />
               </div>

               <input 
                 type="file" 
                 id="ritual-upload" 
                 className="hidden" 
                 onChange={handleFileUpload}
                 accept="application/pdf,image/*,.md,text/markdown,.txt,.json,.jsonl"
               />
               <label htmlFor="ritual-upload" className="relative z-10 cursor-pointer flex flex-col items-center text-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border transition-all duration-500 ${
                    file ? 'bg-primary border-primary shadow-glow-primary' : 'bg-primary/10 border-primary/20 group-hover:scale-110'
                  }`}>
                    {file ? <CheckCircle2 size={48} className="text-white" /> : <FileUp size={48} className="text-primary" />}
                  </div>
                   <h3 className="font-bold text-lg mb-2">{file ? file.name : localFile ? localFile.name : 'Select Scrolls'}</h3>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest px-4">Feed PDF, MD or Image into the machine for extraction</p>
               </label>
               
               {/* Scanning Line Animation */}
               {isAnalyzing && (
                 <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-glow-primary animate-scan z-20" />
               )}
             </div>
          </div>

          {localDocs.length > 0 && (
             <div className="flex flex-col gap-3">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Local Tomes (Scan)</h2>
               <div className="bg-black/40 rounded-2xl p-4 border border-primary/10 max-h-48 overflow-auto custom-scrollbar flex flex-col gap-2">
                  {localDocs.map((dir, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2 opacity-60">
                         <Globe size={10} /> {dir.name}
                      </div>
                      <div className="flex flex-col gap-1 pl-3 border-l border-white/5">
                        {dir.children?.filter(child => child.type === 'file' && (
                          child.extension === '.pdf' || 
                          child.extension === '.md' || 
                          child.extension === '.txt' || 
                          child.extension === '.json' || 
                          child.extension === '.jsonl'
                        )).map((child, j) => (
                          <button
                            key={j}
                            onClick={() => handleLocalFileSelect(child)}
                            className={`text-[10px] text-left px-2 py-1 rounded transition-all flex items-center justify-between group ${
                              localFile?.path === child.path ? 'bg-primary/20 text-primary border border-primary/20' : 'hover:bg-white/5 text-slate-400'
                            }`}
                          >
                            <span className="truncate">{child.name}</span>
                            <span className="text-[8px] opacity-0 group-hover:opacity-100 uppercase font-black text-accent ml-2">LOAD</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
               </div>
             </div>
           )}

          <div className="flex flex-col gap-3">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Forge Progress</h2>
             <div className="bg-black/60 rounded-2xl p-4 border border-primary/10 h-48 font-mono text-[10px] relative overflow-hidden">
                <div className="flex flex-col gap-1">
                   {logs.map((log, i) => (
                     <div key={i} className={`${log.startsWith('> ERROR') ? 'text-red-400' : log.startsWith('> SUCCESS') ? 'text-emerald-400' : 'text-primary/70'}`}>
                        {log}
                     </div>
                   ))}
                   <div ref={logEndRef} />
                </div>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 to-transparent" />
             </div>
          </div>

          {/* User Instructions Field */}
          <div className="flex flex-col gap-3">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-accent/60 px-1">Aetheric Guidance (Instructions)</h2>
             <div className="relative group">
                <textarea
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  placeholder="Ex: 'Priorise le combat spatial', 'Inclus les jauges de Santé Mentale'..."
                  className="w-full bg-black/40 border border-accent/20 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all placeholder-accent/20 h-32 resize-none custom-scrollbar"
                />
                <div className="absolute bottom-3 right-3 opacity-20 group-focus-within:opacity-60 transition-opacity">
                   <Code size={16} className="text-accent" />
                </div>
             </div>
             <p className="text-[9px] text-slate-500 uppercase tracking-widest px-1 italic">L'IA suivra ces directives lors de la forge.</p>
          </div>
        </div>

        {/* Right Col: Construct Preview */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="flex flex-col gap-3 h-full">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Construct Preview & Mapping</h2>
            <div className="flex-1 grid grid-cols-2 gap-4">
               
               {/* JSON Pane */}
               <div className="flex flex-col bg-black/40 border border-accent/20 rounded-2xl overflow-hidden glass">
                  <div className="bg-accent/10 px-4 py-2 border-b border-accent/20 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-accent uppercase tracking-tighter flex items-center gap-2">
                        <Code size={12} /> Data_Stream.json
                     </span>
                     {analysisResult && <Zap size={12} className="text-accent animate-pulse" />}
                  </div>
                  <div className="flex-1 p-6 font-mono text-[11px] leading-relaxed text-slate-300 overflow-auto custom-scrollbar bg-slate-950/20">
                     {analysisResult ? (
                        <pre>{JSON.stringify(analysisResult.data, null, 2)}</pre>
                     ) : (
                        <div className="h-full flex items-center justify-center opacity-20 italic">
                           Awaiting forge material...
                        </div>
                     )}
                  </div>
               </div>

               {/* Visual Preview Pane */}
               <div className="flex flex-col bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden glass">
                  <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-primary uppercase tracking-tighter flex items-center gap-2">
                        <Eye size={12} /> Visual_Schematic
                     </span>
                  </div>
                  <div className="flex-1 p-6 space-y-6 overflow-auto custom-scrollbar">
                     {analysisResult ? (
                        <div className="space-y-4">
                           <div className="p-3 rounded-lg bg-black/40 border border-primary/10">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">System Name</label>
                              <div className="text-sm font-black text-primary uppercase">
                                {analysisResult.type === 'driver' ? driverData?.name : templateData?.name}
                              </div>
                           </div>
                           
                           {analysisResult.type === 'driver' && driverData?.combat?.statsToTrack && (
                              <div className="grid grid-cols-2 gap-3">
                                 {driverData.combat.statsToTrack.map((s, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-black/20 border border-primary/10 text-center">
                                       <div className="text-[8px] font-bold text-slate-500 uppercase">{s.label}</div>
                                       <div className="text-xs font-bold text-accent">{s.fieldId.toUpperCase()}</div>
                                    </div>
                                 ))}
                              </div>
                           )}

                           {analysisResult.type === 'template' && templateData?.sections && (
                              <div className="space-y-3">
                                 {templateData.sections.slice(0, 3).map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5">
                                       <span className="text-[10px] font-bold">{s.label}</span>
                                       <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase">{s.fields?.length} Fields</span>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="h-full flex items-center justify-center opacity-20 italic">
                           Awaiting forge material...
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Aetheric Mapping Table (Mockup) */}
            <div className="bg-black/20 border border-primary/10 rounded-2xl p-4 flex flex-col gap-3">
               <h3 className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Globe size={14} className="text-primary" /> Aetheric Mapping Topology
               </h3>
               <div className="grid grid-cols-3 gap-2 px-2">
                  <div className="text-[8px] font-bold text-primary/40 uppercase">Extracted Ref</div>
                  <div className="text-[8px] font-bold text-primary/40 uppercase text-center">Sync Status</div>
                  <div className="text-[8px] font-bold text-primary/40 uppercase text-right">Core Mapping</div>
                  
                  {[
                    { from: 'Armor Class', to: 'def_score' },
                    { from: 'Hit Points', to: 'vitality' },
                    { from: 'Wisdom', to: 'will_save' }
                  ].map((m, idx) => (
                    <React.Fragment key={idx}>
                      <div className="text-[10px] font-mono opacity-60 italic">{m.from}</div>
                      <div className="flex items-center justify-center">
                         <div className="h-px flex-1 bg-primary/20 mx-2" />
                         <Zap size={8} className="text-accent" />
                         <div className="h-px flex-1 bg-primary/20 mx-2" />
                      </div>
                      <div className="text-[10px] font-mono text-accent text-right">{m.to}</div>
                    </React.Fragment>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-20 right-0 h-24 bg-background-dark/95 backdrop-blur-xl border-t border-primary/20 flex items-center justify-between px-12 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Forge Ignition Sequence</span>
          <div className="flex items-center gap-3">
             <div className={`size-3 rounded-full ${isAnalyzing ? 'bg-primary animate-ping' : file ? 'bg-emerald-400' : 'bg-slate-700'}`} />
             <span className="text-xs font-medium text-slate-400">
               {isAnalyzing ? 'HYPERSPACE ANALYTICS ENGAGED' : file ? 'MATERIAL LOADED AND STABLE' : 'WAITING FOR FORGE MATERIAL'}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => { setFile(null); setLocalFile(null); setAnalysisResult(null); addLog("CONSTRUCT DISCARDED."); }}
            className="flex items-center gap-2 px-6 py-2 text-slate-400 hover:text-red-400 transition-all font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 rounded-xl"
          >
            <Trash2 size={16} /> Discard Remains
          </button>

          {!analysisResult ? (
            <button 
              disabled={(!file && !localFile) || isAnalyzing}
              onClick={startAnalysis}
              className={`px-10 py-4 rounded-2xl font-black text-sm tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95 ${
                (!file && !localFile) || isAnalyzing 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                : 'bg-primary text-white shadow-glow-primary/40 hover:shadow-glow-primary/60 hover:scale-[1.02]'
              }`}
            >
              {isAnalyzing ? <Terminal size={18} className="animate-spin" /> : <Rocket size={18} />}
              IGNITE FORGE
            </button>
          ) : (
            <button 
              onClick={handleForge}
              className="px-10 py-4 rounded-2xl bg-accent text-white font-black text-sm tracking-widest shadow-glow-accent/40 shadow-2xl hover:shadow-glow-accent/60 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 animate-in zoom-in-95 duration-300"
            >
              <Save size={18} />
              QUENCH & SAVE
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ForgeDashboard;
