import React, { useState, useEffect } from 'react';
import { Brain, Key, Cpu, ShieldCheck, Eye, EyeOff, Sparkles, RefreshCw, BookOpen, PenTool, Music, Beaker, User, Settings2, Save, ExternalLink, Map, type LucideIcon } from 'lucide-react';
import { useAIStore } from '../../../stores/useAIStore';
import { useGemStore } from '../../../stores/useGemStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { gmToast } from '../../../stores/useToastStore';
import type { AIProvider } from '../types';
import { aiService } from '../AIService';

const AISettings: React.FC = () => {
  const { configs, updateConfig, activeProvider, setProvider } = useAIStore();
  const { gems, updateGem, syncGemsWithDefaults } = useGemStore();
  const activeCampaign = useSessionOSStore(state => state.campaigns.find(c => c.id === state.activeCampaignId));
  const systemId = activeCampaign?.system?.toLowerCase() || 'generic';
  
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [selectedGemId, setSelectedGemId] = useState<string>('sage');
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, { status: 'success' | 'error' | 'loading' | 'idle', message?: string }>>({
    gemini: { status: 'idle' },
    openai: { status: 'idle' },
    anthropic: { status: 'idle' },
    ollama: { status: 'idle' },
    oracle: { status: 'idle' }
  });

  const iconMap: Record<string, LucideIcon> = {
    BookOpen, PenTool, Music, Beaker, Map, User, Sparkles, Brain
  };

  useEffect(() => {
    syncGemsWithDefaults();
  }, [syncGemsWithDefaults]);

  useEffect(() => {
    const fetchModels = async () => {
      if (activeProvider === 'gemini' && configs.gemini.apiKey) {
        setIsLoadingModels(true);
        try {
          const data = await aiService.listModels(configs.gemini.apiKey);
          setDiscoveredModels(data);
        } catch (err) {
          console.error("Failed to discover Gemini models:", err);
        } finally {
          setIsLoadingModels(false);
        }
      } else if (activeProvider === 'ollama' && window.appBridge?.ai?.ollamaListModels) {
        setIsLoadingModels(true);
        try {
          const models = await window.appBridge.ai.ollamaListModels();
          setDiscoveredModels(models);
        } catch (err) {
          console.error("Failed to discover Ollama models:", err);
        } finally {
          setIsLoadingModels(false);
        }
      } else {
        setDiscoveredModels([]);
      }
    };

    fetchModels();
  }, [activeProvider, configs.gemini.apiKey]);

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const runGlobalDiagnostic = async () => {
    const providersToTest = ['gemini', 'openai', 'anthropic', 'ollama', 'oracle'];
    
    // Reset results
    const newResults = { ...diagnosticResults };
    providersToTest.forEach(p => newResults[p] = { status: 'loading' });
    setDiagnosticResults(newResults);

    // 1. Test Gemini
    try {
      if (configs.gemini.apiKey) {
        await aiService.listModels(configs.gemini.apiKey);
        setDiagnosticResults(prev => ({ ...prev, gemini: { status: 'success', message: 'Connexion établie' } }));
      } else {
        setDiagnosticResults(prev => ({ ...prev, gemini: { status: 'error', message: 'Clé manquante' } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, gemini: { status: 'error', message: 'Erreur API' } }));
    }

    // 2. Test OpenAI (Mock or Ping)
    try {
      if (configs.openai.apiKey) {
        setDiagnosticResults(prev => ({ ...prev, openai: { status: 'success', message: 'Configuré' } }));
      } else {
        setDiagnosticResults(prev => ({ ...prev, openai: { status: 'error', message: 'Clé manquante' } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, openai: { status: 'error', message: 'Erreur' } }));
    }

    // 3. Test Anthropic
    try {
      if (configs.anthropic.apiKey) {
        setDiagnosticResults(prev => ({ ...prev, anthropic: { status: 'success', message: 'Configuré' } }));
      } else {
        setDiagnosticResults(prev => ({ ...prev, anthropic: { status: 'error', message: 'Clé manquante' } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, anthropic: { status: 'error', message: 'Erreur' } }));
    }

    // 4. Test Ollama
    try {
      if (window.appBridge?.ai?.ollamaListModels) {
        await window.appBridge.ai.ollamaListModels();
        setDiagnosticResults(prev => ({ ...prev, ollama: { status: 'success', message: 'Serveur actif' } }));
      } else {
        setDiagnosticResults(prev => ({ ...prev, ollama: { status: 'error', message: 'Bridge inexistant' } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, ollama: { status: 'error', message: 'Serveur injoignable' } }));
    }

    // 5. Test Oracle (NotebookLM)
    try {
      if (window.appBridge?.mcp?.callTool) {
        // notebook_list is a standard tool for notebooklm-mcp-server
        const res = await window.appBridge.mcp.callTool('notebooklm', 'notebook_list', { max_results: 1 });
        if (res && res.content) {
          setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'success', message: 'Oracle en ligne' } }));
        } else {
          setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'error', message: 'Réponse vide' } }));
        }
      } else {
        setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'error', message: 'Bridge MCP Absent' } }));
      }
    } catch (err: unknown) {
      const errorMsg = String(err instanceof Error ? err.message : err);
      setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'error', message: errorMsg.includes('16') ? 'Session expirée' : 'Erreur' } }));
    }
  };

  const providers: { id: AIProvider; name: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { 
      id: 'gemini', 
      name: 'Google Gemini', 
      icon: <Sparkles size={24} />,
      color: 'text-blue-400',
      desc: 'Modèles Flash ou Pro. Idéal pour le RAG et les prompts longs.'
    },
    { 
      id: 'openai', 
      name: 'OpenAI (ChatGPT)', 
      icon: <Cpu size={24} />,
      color: 'text-emerald-500',
      desc: 'GPT-4o ou o1. Standard de l\'industrie, équilibré et précis.'
    },
    { 
      id: 'anthropic', 
      name: 'Anthropic (Claude)', 
      icon: <Brain size={24} />,
      color: 'text-gm-violet',
      desc: 'Claude 3.5 Sonnet. Excellent pour l\'écriture créative et le RP.'
    },
    { 
      id: 'ollama', 
      name: 'Ollama (Local)', 
      icon: <Cpu size={24} />,
      color: 'text-orange-400',
      desc: 'Modèles locaux (Phi-3, Gemma 2). 100% privé, sans abonnement.'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/5 border border-accent/20">
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-accent/10 text-accent">
            <Brain size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">Configuration de l'IA Cloud</h4>
            <p className="text-xs text-app-text/60 mt-1">
              Connectez vos comptes pour activer les GEMS. Vos clés sont stockées localement.
            </p>
          </div>
        </div>
        
        <button
          onClick={runGlobalDiagnostic}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-app-text transition-all"
        >
          <Beaker size={14} className={Object.values(diagnosticResults).some(r => r.status === 'loading') ? 'animate-pulse' : ''} />
          Diagnostic Global
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {providers.map((p) => (
          <div 
            key={p.id}
            className={`p-6 rounded-2xl border transition-all duration-300 ${
              activeProvider === p.id 
                ? 'bg-app-surface border-accent shadow-glow-accent/10 ring-1 ring-accent/20' 
                : 'bg-app-surface/40 border-app-border/20 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center p-2 border border-white/5 ${p.color}`}>
                  {p.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-black uppercase tracking-tighter text-app-text">{p.name}</h5>
                    {diagnosticResults[p.id].status !== 'idle' && (
                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        diagnosticResults[p.id].status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                        diagnosticResults[p.id].status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'
                      }`}>
                        {diagnosticResults[p.id].message}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">{p.desc}</p>
                </div>
              </div>
              
              <button
                onClick={() => setProvider(p.id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeProvider === p.id 
                    ? 'bg-accent text-white shadow-glow-accent/40' 
                    : 'bg-white/5 text-app-text/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                {activeProvider === p.id ? 'Actif' : 'Sélectionner'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {p.id !== 'ollama' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                    <Key size={12} className="text-accent" />
                    Clé API
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys[p.id] ? 'text' : 'password'}
                      value={configs[p.id]?.apiKey || ''}
                      onChange={(e) => updateConfig(p.id, { apiKey: e.target.value })}
                      placeholder={`Saisissez votre clé ${p.name}...`}
                      className="w-full bg-black/40 border border-app-border/40 rounded-xl px-4 py-3 text-xs text-app-text focus:border-accent/50 outline-none transition-all font-mono"
                    />
                    <button 
                      onClick={() => toggleKeyVisibility(p.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text/20 hover:text-app-text transition-colors"
                    >
                      {showKeys[p.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {p.id === 'ollama' && (
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Statut Local
                  </label>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Serveur Ollama Prêt
                    </div>
                    <button
                      onClick={async () => {
                        const ok = await window.appBridge?.ai?.ollamaPull?.('phi3');
                        if (ok) {
                          updateConfig('ollama', { apiKey: '' });
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20 hover:bg-accent/20 transition-all"
                      title="Télécharger le modèle recommandé (phi3)"
                    >
                      Pull phi3
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                    <Cpu size={12} className="text-accent" />
                    Modèle
                  </label>
                  {p.id === 'gemini' && (
                    <button 
                      onClick={() => {
                        updateConfig('gemini', { apiKey: configs.gemini.apiKey }); 
                      }}
                      className={`text-accent/60 hover:text-accent transition-all ${isLoadingModels ? 'animate-spin' : ''}`}
                      title="Rafraîchir la liste des modèles"
                    >
                      <RefreshCw size={10} />
                    </button>
                  )}
                </div>
                <select
                  title="Sélectionner le modèle d'IA"
                  value={configs[p.id]?.modelId || ''}
                  onChange={(e) => updateConfig(p.id, { modelId: e.target.value })}
                  className="w-full bg-black/40 border border-app-border/40 rounded-xl px-4 py-3 text-xs text-app-text focus:border-accent/50 outline-none transition-all appearance-none cursor-pointer"
                >
                  {(p.id === 'gemini' || p.id === 'ollama') && discoveredModels.length > 0 ? (
                    <>
                      {discoveredModels.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value="custom">-- Saisie Manuelle --</option>
                    </>
                  ) : (
                    <>
                      {p.id === 'gemini' && (
                        <>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                          <option value="imagen-3.0-generate-001">Imagen 3 (Portrait)</option>
                          <option value="imagen-3.0-fast-generate-001">Imagen 3 Fast (Portrait)</option>
                        </>
                      )}
                      {p.id === 'openai' && (
                        <>
                          <option value="gpt-4o">GPT-4o (Expert)</option>
                          <option value="gpt-4o-mini">GPT-4o Mini (Rapide)</option>
                          <option value="o1-preview">OpenAI o1 (Raisonnement)</option>
                        </>
                      )}
                      {p.id === 'anthropic' && (
                        <>
                          <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Recommandé)</option>
                          <option value="claude-3-opus-20240229">Claude 3 Opus (Créatif)</option>
                          <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku (Vitesse)</option>
                        </>
                      )}
                      {p.id === 'ollama' && (
                        <>
                          <option value="gemma4:26b">Gemma 4 26B (Optimal Text)</option>
                          <option value="phi3">Phi-3 (Léger & Rapide)</option>
                          <option value="gemma2:2b">Gemma 2 2B (Efficace)</option>
                          <option value="mistral">Mistral (Polyvalent)</option>
                          <option value="x/flux2-klein:latest">Flux.2 Klein (Image)</option>
                          <option value="flux">Flux (Image)</option>
                        </>
                      )}
                      <option value="custom">-- Saisie Manuelle --</option>
                    </>
                  )}
                </select>
                
                {(configs[p.id]?.modelId === 'custom' || (p.id === 'gemini' && discoveredModels.length === 0)) && (
                  <div className="mt-2 text-app-text/60 italic text-[9px] uppercase tracking-widest pl-1">
                    Modèle sélectionné: <span className="text-accent font-bold">{configs[p.id]?.modelId}</span>
                  </div>
                )}
              </div>
            </div>

            {p.id === 'ollama' && !discoveredModels.includes('gemma4:26b') && (
              <button
                onClick={async () => {
                  try {
                    gmToast("Téléchargement de Gemma 4 lancé (Vérifiez votre terminal Ollama)...");
                    await window.appBridge?.ai?.ollamaPull?.('gemma4:26b');
                    gmToast("Gemma 4 est prêt !", "success");
                    // Refresh models
                    const models = await window.appBridge?.ai?.ollamaListModels?.();
                    if (models) setDiscoveredModels(models);
                   } catch (error) {
                    console.error("Gemma 4 Pull error:", error);
                    gmToast("Erreur lors du téléchargement.", "error");
                  }
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/20 border border-accent/40 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all shadow-lg shadow-accent/10"
              >
                <Cpu size={14} className="animate-pulse" />
                Télécharger Gemma 4 (26B MoE)
              </button>
            )}

            {configs[p.id]?.apiKey && (
              <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-emerald-500/60 bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
                <ShieldCheck size={12} />
                Clé configurée localement
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Oracle (NotebookLM) Section */}
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-4">
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-accent/10 text-accent">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-black uppercase tracking-tight text-app-text">AI Oracle (NotebookLM)</h4>
              {diagnosticResults.oracle.status !== 'idle' && (
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  diagnosticResults.oracle.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
                  diagnosticResults.oracle.status === 'error' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white/40'
                }`}>
                  {diagnosticResults.oracle.message}
                </div>
              )}
            </div>
            <p className="text-xs text-app-text/60 mt-1">
              Connectez votre compte Google pour permettre à l'Oracle d'accéder à vos carnets de notes personnels.
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Statut de la connexion</p>
            <p className="text-xs text-app-text/80">
              {diagnosticResults.oracle.status === 'error' 
                ? "L'authentification semble expirée ou corrompue." 
                : "Si l'Oracle ne répond plus, une reconnexion peut être nécessaire."}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={async (e) => {
                const btn = e.currentTarget;
                btn.classList.add('animate-spin-once');
                try {
                  await window.appBridge?.mcp?.restart?.();
                  gmToast("Serveur Oracle redémarré.");
                  runGlobalDiagnostic();
                } catch (e) {
                  console.error(e);
                } finally {
                  setTimeout(() => btn.classList.remove('animate-spin-once'), 1000);
                }
              }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-app-text/60 hover:text-white hover:bg-white/10 hover:border-accent/40 transition-all group"
              title="Réinitialiser le serveur MCP (Oracle)"
            >
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
            
            <button
              onClick={async () => {
                try {
                  const result = await window.appBridge?.mcp?.reauthenticate();
                  if (result?.success) {
                    gmToast("La fenêtre de connexion a été lancée dans votre navigateur.");
                  }
                } catch (error) {
                  console.error("Re-authentication failed:", error);
                  gmToast("Erreur lors du lancement de l'authentification.", "error");
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white border border-accent shadow-glow-accent/20 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-[10px]"
            >
              <ExternalLink size={16} />
              {diagnosticResults.oracle.status === 'error' ? 'Forcer la Reconnexion' : "Reconnecter l'Oracle"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gm-emerald/5 border border-gm-emerald/20 flex items-center justify-between gap-4 mt-8">
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-gm-emerald/10 text-gm-emerald">
            <BookOpen size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">Base de Connaissance (RAG)</h4>
            <p className="text-xs text-app-text/60 mt-1">
              Les fichiers PDF et Markdown dans votre dossier <code className="text-gm-emerald">/docs</code> sont analysés.
            </p>
          </div>
        </div>
        
        <button
          onClick={async () => {
            if (isReindexing || !window.appBridge?.ai) return;
            setIsReindexing(true);
            try {
              await window.appBridge.ai.reindex();
              await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
              console.error("Reindexing failed:", error);
            } finally {
              setIsReindexing(false);
            }
          }}
          disabled={isReindexing}
          className={`group flex items-center gap-3 px-6 py-3 rounded-xl border transition-all font-black uppercase tracking-widest text-[10px] ${
            isReindexing 
              ? 'bg-gm-emerald/10 border-gm-emerald/40 text-gm-emerald cursor-wait' 
              : 'bg-gm-emerald text-white border-gm-emerald shadow-glow-emerald/20 hover:scale-105 active:scale-95'
          }`}
        >
          <RefreshCw size={16} className={isReindexing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          {isReindexing ? 'Indexation...' : 'Actualiser les documents'}
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex gap-4 mt-8">
        <div className="p-3 rounded-xl bg-accent/10 text-accent">
          <Settings2 size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-app-text">Personnalisation des GEMS</h4>
          <p className="text-xs text-app-text/60 mt-1">
            Définissez le comportement précis de vos assistants.
          </p>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
          <div className="border-r border-app-border/10 bg-black/20 p-4 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 mb-4 block px-2">Assistant (GEM)</label>
            {gems.map((gem) => {
              const Icon = iconMap[gem.icon] || Brain;
              return (
                <button
                  key={gem.id}
                  onClick={() => setSelectedGemId(gem.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                    selectedGemId === gem.id 
                      ? 'bg-accent text-white shadow-glow-accent/20' 
                      : 'hover:bg-white/5 text-app-text/60 hover:text-app-text'
                  }`}
                >
                  <Icon size={18} className={selectedGemId === gem.id ? 'text-white' : 'text-accent opacity-60 group-hover:opacity-100'} />
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-tight">{gem.name}</div>
                    <div className={`text-[9px] font-medium opacity-60 truncate max-w-[120px]`}>{gem.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2 p-6 space-y-6 bg-app-surface/60">
            {(() => {
              const gem = gems.find(g => g.id === selectedGemId);
              if (!gem) return null;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-black uppercase tracking-tight text-lg text-app-text">{gem.name}</h5>
                      <p className="text-xs text-app-text/40">{gem.description}</p>
                    </div>
                    <button 
                       onClick={() => {
                          const instructions = isEditingOverride ? (gem.systemOverrides?.[systemId] || gem.baseInstructions) : gem.baseInstructions;
                          if (isEditingOverride) {
                            updateGem(gem.id, { systemOverrides: { ...gem.systemOverrides, [systemId]: instructions } });
                          } else {
                            updateGem(gem.id, { baseInstructions: instructions });
                          }
                       }}
                       className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                     >
                       <Save size={14} /> Enregistrer
                     </button>
                  </div>

                  <div className="flex p-1 bg-black/40 rounded-xl w-fit">
                    <button onClick={() => setIsEditingOverride(false)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isEditingOverride ? 'bg-white/10 text-white' : 'text-app-text/40'}`}>Base</button>
                    <button onClick={() => setIsEditingOverride(true)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isEditingOverride ? 'bg-accent/20 text-accent' : 'text-app-text/40'}`}>Override: {systemId}</button>
                  </div>

                  <div className="space-y-2">
                    <textarea 
                      value={isEditingOverride ? (gem.systemOverrides?.[systemId] || gem.baseInstructions) : gem.baseInstructions}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        if (isEditingOverride) {
                          updateGem(gem.id, { systemOverrides: { ...gem.systemOverrides, [systemId]: newVal } });
                        } else {
                          updateGem(gem.id, { baseInstructions: newVal });
                        }
                      }}
                      className="w-full h-48 bg-black/40 border border-app-border/40 rounded-xl p-4 text-xs text-app-text/80 outline-none font-mono"
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
