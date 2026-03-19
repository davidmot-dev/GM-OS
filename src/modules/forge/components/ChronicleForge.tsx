import React, { useState, useRef } from 'react';
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
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { type ForgeContextItem } from '../ForgeService';
import { chronicleForgeService, type ChronicleForgeResult } from '../ChronicleService';
import { gmToast } from '../../../stores/useToastStore';
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
  const { customGameDrivers, addChronicle } = useSessionOSStore();
  
  const [contextItems, setContextItems] = useState<ForgeContextItem[]>([]);
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
    const bridge = (window as { appBridge?: any }).appBridge;
    if (!bridge?.mcp?.callTool) {
      throw new Error("Bridge MCP not available");
    }
    
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
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        return await mcpBridge.callTool(serverName, toolName, args) as T;
      }
      
      return result as T;
    } catch (err: unknown) {
      if (checkError(err)) {
        await mcpBridge.callTool('notebooklm-mcp-server', 'refresh_auth', {});
        return await mcpBridge.callTool(serverName, toolName, args) as T;
      }
      throw err;
    }
  };

  const handleOpenNotebookLM = async () => {
    setIsNotebookModalOpen(true);
    setIsLoadingNotebooks(true);
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
    } catch (err) {
      console.error(err);
      gmToast("Impossible de récupérer les notebooks.", "error");
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleNotebookSelect = async (notebookId: string) => {
    setIsLoadingNotebooks(true);
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
      } else if (notebookData && typeof notebookData === 'object') {
        const data = notebookData as Notebook & { sources?: NotebookSource[] };
        setSelectedNotebook(data);
        setNotebookSources(data.sources || []);
      }
    } catch (err) {
      console.error(err);
      gmToast("Échec de la récupération des sources.", "error");
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleSourceImport = async (sourceId: string, title: string) => {
    if (importingSources.has(sourceId)) return;
    
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

      const newItem: ForgeContextItem = {
        id: crypto.randomUUID(),
        name: `[NB] ${title}`,
        type: 'text',
        content: typeof content === 'string' ? content : JSON.stringify(content),
        timestamp: Date.now()
      };
      setContextItems(prev => [...prev, newItem]);
      gmToast(`${title} importé avec succès.`, "success");
      
    } catch (err) {
      console.error(err);
      gmToast("Échec de l'importation.", "error");
    } finally {
      setImportingSources(prev => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }
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
      gmToast("Aucune source de savoir détectée.", "error");
      return;
    }

    const driver = customGameDrivers.find(d => d.id === selectedDriverId);
    if (!driver) {
      gmToast("Veuillez sélectionner un système de jeu.", "error");
      return;
    }

    setIsForging(true);
    setResult(null);
    try {
      // Find the driver (custom or default)
      const driver = customGameDrivers.find(d => d.id === selectedDriverId) || 
                     DEFAULT_GAME_DRIVERS.find(d => d.id === selectedDriverId);
                     
      if (!driver) {
        gmToast("Système introuvable.", "error");
        setIsForging(false);
        return;
      }

      const forgeResult = await chronicleForgeService.forgeChronicle(contextItems, driver, userInstructions);

      setResult(forgeResult);
      gmToast("Chronique forgée avec succès.", "success");
    } catch (err) {
      console.error(err);
      gmToast("Échec de la forge.", "error");
    } finally {
      setIsForging(false);
    }
  };

  const handleCommit = () => {
    if (!result) return;
    
    // Get the templateId from the selected driver
    const driver = customGameDrivers.find(d => d.id === selectedDriverId) || 
                   DEFAULT_GAME_DRIVERS.find(d => d.id === selectedDriverId);
    const templateId = driver?.templateId || 'generic';

    addChronicle({
      campaign: {
        name: result.campaign.name || 'Sans titre',
        description: result.campaign.description || '',
        synopsis: result.campaign.synopsis || '',
        system: selectedDriverId,
      } as any,
      entities: (result.entities || []).map(e => ({
        ...e,
        name: e.name || 'NPC Inconnu',
        templateId: templateId,
        linkedMapIds: (e as any).linkedMapIds || [], // Ensure initialized
      })) as any,
      atlasMaps: (result.locations || []).map(l => ({
        ...l,
        name: l.name || 'Lieu sans nom',
        type: l.type || 'battlemap', 
        linkedEntities: (l as any).linkedEntities || [], 
      })) as any,
      wikiEntries: (result.lore || []).map(l => ({
        ...l,
        title: l.title || 'Entrée sans titre',
        tags: (l as any).tags || [],
        imageUrls: (l as any).imageUrls || [],
        linkedEntityIds: (l as any).linkedEntityIds || [],
      })) as any,
    });


    gmToast("Chronique déployée dans le Codex.", "success");
    setResult(null);
    setContextItems([]);
  };

  return (
    <div className="h-full flex flex-col p-8 gap-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white flex items-center gap-4">
            <Hammer className="w-10 h-10 text-fuchsia-500 animate-pulse" />
            CHRONICLE FORGE <span className="text-fuchsia-500/50 text-xl font-mono not-italic tracking-widest ml-4">v5.2</span>
          </h1>
          <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Génération de scénarios par extraction de savoir</p>
        </div>

        <div className="flex items-center gap-4">
           {!result && (
             <button
              onClick={startForge}
              disabled={isForging || contextItems.length === 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all shadow-glow-fuchsia/20 ${
                isForging || contextItems.length === 0 
                  ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed border border-white/5' 
                  : 'bg-fuchsia-600 text-white hover:scale-105 active:scale-95'
              }`}
             >
               {isForging ? <Zap className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
               Enflammer la Forge
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Context Inputs */}
        <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
          {/* Context Bin */}
          <div className="flex-1 bg-[#151520] rounded-2xl border border-slate-800/50 p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-fuchsia-300">
                <FileText className="w-5 h-5" /> Source de Savoir
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleOpenNotebookLM}
                  className="p-2 hover:bg-white/5 rounded-lg text-fuchsia-400 transition-colors"
                  title="Ouvrir NotebookLM"
                >
                  <Globe className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                  title="Télécharger un fichier"
                >
                  <FileUp className="w-5 h-5" />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5">
              {contextItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-4">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <p className="text-sm">Glissez vos PDF ou notes ici</p>
                </div>
              )}
              {contextItems.map(item => (
                <div key={item.id} className="group relative bg-white/5 p-3 rounded-xl border border-white/5 hover:border-fuchsia-500/30 transition-all animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      {item.type === 'pdf' ? <Shield className="w-4 h-4 text-indigo-400" /> : <FileText className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{item.type}</p>
                    </div>
                    <button 
                      onClick={() => setContextItems(prev => prev.filter(i => i.id !== item.id))}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Area */}
          <div className="h-48 bg-[#151520] rounded-2xl border border-slate-800/50 p-5 flex flex-col">
            <h2 className="flex items-center gap-2 text-lg font-bold text-indigo-300 mb-3">
              <Lightbulb className="w-5 h-5" /> Intentions du MJ
            </h2>
            <textarea
              placeholder="Ex: Concentre-toi sur l'ambiance horrifique et souligne la rivalité entre les cultistes..."
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-slate-300 placeholder:text-slate-600"
            />
          </div>

          {/* Driver Selector */}
          <div className="bg-[#151520] rounded-2xl border border-slate-800/50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-fuchsia-300 mb-4 uppercase tracking-widest text-[10px]">
              <Shield className="w-4 h-4" /> Système de Destination
            </h2>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-fuchsia-100 outline-none focus:border-fuchsia-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">Sélectionner un système...</option>
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
        <div className="col-span-8 bg-[#151520] rounded-2xl border border-slate-800/50 flex flex-col min-h-0 overflow-hidden shadow-2xl">
          {result ? (
            <>
              <div className="flex border-b border-slate-800/50">
                {(['campaign', 'entities', 'locations', 'lore'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivePreviewTab(tab)}
                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all border-b-2 ${
                      activePreviewTab === tab 
                        ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/5' 
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {tab === 'campaign' && <BookOpen className="w-4 h-4" />}
                      {tab === 'entities' && <Users className="w-4 h-4" />}
                      {tab === 'locations' && <MapPin className="w-4 h-4" />}
                      {tab === 'lore' && <Lightbulb className="w-4 h-4" />}
                      {tab}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/5">
                {activePreviewTab === 'campaign' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <h3 className="text-3xl font-bold text-white">{result.campaign.name}</h3>
                    <p className="text-xl text-fuchsia-300/80 italic">{result.campaign.description}</p>
                    <div className="prose prose-invert max-w-none">
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <h4 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-widest">Synopsis de l'Intrigue</h4>
                        <p className="text-slate-300 leading-relaxed text-lg">{result.campaign.synopsis}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'entities' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
                    {result.entities.map((ent, idx) => (
                      <div key={idx} className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                              {ent.role === 'boss' ? '💀' : '👤'}
                            </div>
                            <div>
                              <p className="font-bold text-lg">{ent.name}</p>
                              <p className="text-xs text-indigo-400 font-mono uppercase tracking-tighter">{ent.type} • {ent.role}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 font-mono">
                            <span className="text-xs text-slate-500">HP {ent.hp}</span>
                            <span className="text-xs text-slate-500">AC {ent.ac}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 italic mb-3">"{ent.description}"</p>
                        <div className="space-y-2">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-300">
                            <p className="font-bold text-indigo-300 mb-1 flex items-center gap-1"><Dna className="w-3 h-3" /> Note d'Interprétation</p>
                            <p className="line-clamp-3">{ent.roleplayingNotes}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewTab === 'locations' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    {result.locations.map((loc, idx) => (
                      <div key={idx} className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-fuchsia-500/30 transition-all flex gap-6">
                        <div className="w-48 h-32 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden">
                           <MapPin className="w-12 h-12 text-slate-700" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white mb-2">{loc.name}</h4>
                          <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">{loc.narrativeDescription}</p>
                          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                             <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Placeholder Map</span>
                             <span className="flex items-center gap-1 hover:text-fuchsia-300 cursor-help transition-colors">
                               <Shield className="w-3 h-3" /> GM Secrets Extracted
                             </span>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 self-center text-slate-700" />
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewTab === 'lore' && (
                  <div className="columns-2 gap-4 animate-in fade-in slide-in-from-right-4">
                    {result.lore.map((l, idx) => (
                      <div key={idx} className="break-inside-avoid bg-white/5 rounded-2xl p-5 border border-white/5 mb-4 hover:border-fuchsia-400/30 transition-all group">
                        <div className="flex items-center gap-2 mb-3">
                           <span className={`w-2 h-2 rounded-full ${l.category === 'clue' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                           <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{l.category}</span>
                        </div>
                        <h4 className="text-lg font-bold mb-2 group-hover:text-fuchsia-300 transition-colors">{l.title}</h4>
                        <div className="text-sm text-slate-400 line-clamp-4 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                           {l.content}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {l.tags?.map(t => (
                            <span key={t} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">#{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-white/5 border-t border-slate-800/50 flex items-center justify-center">
                 <button
                  onClick={handleCommit}
                  className="flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:scale-105 active:scale-95 transition-all"
                 >
                   DÉPLOYER LA CHRONIQUE
                   <Rocket className="w-6 h-6" />
                 </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-full h-full rounded-full border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden">
                   <Users className="w-16 h-16 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">En attente de Transmutation</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Déposez vos sources de scénario et sélectionnez un système de jeu pour forger une nouvelle campagne structurée.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> IA SECURE PROMPT</span>
                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> PREVIEW AVANT IMPORT</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NotebookLM Modal Overlay */}
      {isNotebookModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="w-full max-w-4xl bg-[#151520] border border-fuchsia-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[70vh]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-fuchsia-500/5">
                 <h2 className="text-xl font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-3">
                   <Globe className="w-6 h-6" /> NotebookLM Browser
                 </h2>
                 <button onClick={() => setIsNotebookModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><X /></button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <div className="w-1/3 border-r border-white/5 overflow-y-auto p-4 space-y-2 bg-black/20">
                    {isLoadingNotebooks && notebooks.length === 0 ? (
                      <div className="flex items-center justify-center h-40">
                        <Zap className="w-8 h-8 text-fuchsia-500 animate-spin" />
                      </div>
                    ) : (
                      notebooks.map(nb => (
                        <button 
                          key={nb.id} 
                          onClick={() => handleNotebookSelect(nb.id)} 
                          className={`w-full text-left p-4 rounded-2xl transition-all border ${
                            selectedNotebook?.id === nb.id 
                              ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-100 shadow-lg' 
                              : 'border-transparent hover:bg-white/5 text-slate-400'
                          }`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest">{nb.title}</div>
                        </button>
                      ))
                    )}
                 </div>
                 <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {isLoadingNotebooks && selectedNotebook ? (
                      <div className="flex items-center justify-center h-full">
                        <Zap className="w-12 h-12 text-fuchsia-500 animate-spin" />
                      </div>
                    ) : selectedNotebook ? (
                      <div className="grid grid-cols-1 gap-3">
                        {notebookSources.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-fuchsia-500/30 transition-all">
                            <span className="text-sm font-medium">{s.title}</span>
                            <button 
                              onClick={() => handleSourceImport(s.id, s.title)} 
                              disabled={importingSources.has(s.id)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                importingSources.has(s.id)
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500 hover:text-white'
                              }`}
                            >
                              {importingSources.has(s.id) ? 'Extraction...' : 'Import'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20 italic">
                        <BookOpen className="w-16 h-16 mb-4" />
                        <p>Sélectionnez un carnet pour voir les parchemins</p>
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
