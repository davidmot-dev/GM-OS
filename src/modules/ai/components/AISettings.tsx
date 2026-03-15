import React, { useState, useEffect } from 'react';
import { Brain, Key, Cpu, ShieldCheck, AlertTriangle, Eye, EyeOff, Sparkles, RefreshCw, BookOpen, PenTool, Music, Beaker, User, Settings2, ChevronRight, Save, ExternalLink, type LucideIcon } from 'lucide-react';
import { useAIStore } from '../../../stores/useAIStore';
import { useGemStore } from '../../../stores/useGemStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { AIProvider } from '../types';
import { aiService } from '../AIService';

const AISettings: React.FC = () => {
  const { configs, updateConfig, activeProvider, setProvider } = useAIStore();
  const { gems, updateGem } = useGemStore();
  const activeCampaign = useSessionOSStore(state => state.campaigns.find(c => c.id === state.activeCampaignId));
  const systemId = activeCampaign?.system?.toLowerCase() || 'generic';
  
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [selectedGemId, setSelectedGemId] = useState<string>('sage');
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  const iconMap: Record<string, LucideIcon> = {
    BookOpen, PenTool, Music, Beaker, User, Sparkles, Brain
  };

  useEffect(() => {
    const fetchModels = async () => {
      if (configs.gemini.apiKey) {
        setIsLoadingModels(true);
        try {
          const data = await aiService.listModels() as { models: Array<{ name: string, supportedGenerationMethods: string[] }> };
          if (data && data.models) {
            const names = data.models
              .filter(m => m.supportedGenerationMethods.includes('generateContent'))
              .map(m => m.name.replace('models/', ''));
            setDiscoveredModels(names);
          }
        } catch (err) {
          console.error("Failed to discover models:", err);
        } finally {
          setIsLoadingModels(false);
        }
      }
    };

    fetchModels();
  }, [configs.gemini.apiKey]);

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
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
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex gap-4">
        <div className="p-3 rounded-xl bg-accent/10 text-accent">
          <Brain size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-app-text">Configuration de l'IA Cloud</h4>
          <p className="text-xs text-app-text/60 mt-1">
            Connectez vos comptes pour activer les GEMS. Vos clés sont stockées localement et ne transitent jamais par nos serveurs.
          </p>
        </div>
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
                  <h5 className="font-black uppercase tracking-tighter text-app-text">{p.name}</h5>
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
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                  <Key size={12} className="text-accent" />
                  Clé API
                </label>
                <div className="relative">
                  <input
                    type={showKeys[p.id] ? 'text' : 'password'}
                    value={configs[p.id].apiKey || ''}
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
                  value={configs[p.id].modelId}
                  onChange={(e) => updateConfig(p.id, { modelId: e.target.value })}
                  className="w-full bg-black/40 border border-app-border/40 rounded-xl px-4 py-3 text-xs text-app-text focus:border-accent/50 outline-none transition-all appearance-none cursor-pointer"
                >
                  {p.id === 'gemini' && (
                    <>
                      {discoveredModels.length > 0 ? (
                        discoveredModels.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))
                      ) : (
                        <>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        </>
                      )}
                      <option value="custom">-- Saisie Manuelle --</option>
                    </>
                  )}

                  {p.id === 'openai' && (
                    <>
                      <option value="gpt-4o">GPT-4o (Expert)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Rapide)</option>
                      <option value="o1-preview">OpenAI o1 (Raisonnement)</option>
                      <option value="custom">-- Saisie Manuelle --</option>
                    </>
                  )}

                  {p.id === 'anthropic' && (
                    <>
                      <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Recommandé)</option>
                      <option value="claude-3-opus-20240229">Claude 3 Opus (Créatif)</option>
                      <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku (Vitesse)</option>
                      <option value="custom">-- Saisie Manuelle --</option>
                    </>
                  )}
                </select>
                
                {(configs[p.id].modelId === 'custom' || (p.id === 'gemini' && discoveredModels.length === 0)) && (
                  <div className="mt-2 text-app-text/60 italic text-[9px] uppercase tracking-widest pl-1">
                    Modèle sélectionné: <span className="text-accent font-bold">{configs[p.id].modelId}</span>
                  </div>
                )}
              </div>
            </div>

            {configs[p.id].apiKey && (
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
            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">AI Oracle (NotebookLM)</h4>
            <p className="text-xs text-app-text/60 mt-1">
              Connectez votre compte Google pour permettre à l'Oracle d'accéder à vos carnets de notes personnels.
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Statut de la connexion</p>
            <p className="text-xs text-app-text/80">Si l'Oracle ne répond plus, une reconnexion peut être nécessaire.</p>
          </div>
          
          <button
            onClick={async () => {
              try {
                const result = await window.appBridge?.mcp?.reauthenticate();
                if (result?.success) {
                  alert("La fenêtre de connexion a été lancée dans votre navigateur.");
                }
              } catch (error) {
                console.error("Re-authentication failed:", error);
                alert("Erreur lors du lancement de l'authentification.");
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white border border-accent shadow-glow-accent/20 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-[10px]"
          >
            <ExternalLink size={16} />
            Reconnecter l'Oracle
          </button>
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
              Les fichiers PDF et Markdown dans votre dossier <code className="text-gm-emerald">/docs</code> sont analysés pour enrichir les réponses de l'IA.
            </p>
          </div>
        </div>
        
        <button
          onClick={async () => {
            if (isReindexing || !window.appBridge?.ai) return;
            setIsReindexing(true);
            try {
              await window.appBridge.ai.reindex();
              // Small delay for effect and safety
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
            Définissez le comportement précis de vos assistants pour chaque système de jeu.
          </p>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
          {/* Gem Sidebar */}
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
                  {selectedGemId === gem.id && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </button>
              );
            })}
          </div>

          {/* Gem Content Editor */}
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
                    <div className="flex gap-2">
                       <button 
                         onClick={() => {
                            const instructions = isEditingOverride 
                              ? (gem.systemOverrides?.[systemId] || gem.baseInstructions)
                              : gem.baseInstructions;
                            
                            if (isEditingOverride) {
                              updateGem(gem.id, { 
                                systemOverrides: { ...gem.systemOverrides, [systemId]: instructions } 
                              });
                            } else {
                              updateGem(gem.id, { baseInstructions: instructions });
                            }
                         }}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                       >
                         <Save size={14} />
                         Enregistrer
                       </button>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex p-1 bg-black/40 rounded-xl w-fit">
                    <button 
                      onClick={() => setIsEditingOverride(false)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        !isEditingOverride ? 'bg-white/10 text-white shadow-inner' : 'text-app-text/40 hover:text-white'
                      }`}
                    >
                      Instructions de Base
                    </button>
                    <button 
                      onClick={() => setIsEditingOverride(true)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center ${
                        isEditingOverride ? 'bg-accent/20 text-accent shadow-inner border border-accent/20' : 'text-app-text/40 hover:text-white'
                      }`}
                    >
                      Override: <span className="uppercase">{systemId}</span>
                    </button>
                  </div>

                  {/* Editor Area */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40">
                      Prompt Système de l'Assistant
                    </label>
                    <textarea 
                      value={isEditingOverride 
                        ? (gem.systemOverrides?.[systemId] || gem.baseInstructions)
                        : gem.baseInstructions}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        if (isEditingOverride) {
                          updateGem(gem.id, { 
                            systemOverrides: { ...gem.systemOverrides, [systemId]: newVal } 
                          });
                        } else {
                          updateGem(gem.id, { baseInstructions: newVal });
                        }
                      }}
                      className="w-full h-48 bg-black/40 border border-app-border/40 rounded-xl p-4 text-xs text-app-text/80 focus:border-accent/50 outline-none transition-all font-mono leading-relaxed"
                      placeholder="Définissez comment l'IA doit se comporter..."
                    />
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-3 items-start">
                      <ShieldCheck size={14} className="text-accent mt-0.5" />
                      <p className="text-[10px] text-app-text/40 leading-normal italic">
                        Ce prompt sera combiné avec le contexte RAG (fichiers PDF/MD) pour générer les réponses.
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
        <AlertTriangle size={18} className="text-amber-500/60" />
        <p className="text-[10px] text-amber-500/60 font-medium uppercase tracking-widest">
          Assurez-vous d'avoir des crédits actifs sur vos comptes fournisseurs (Billing).
        </p>
      </div>
    </div>
  );
};

export default AISettings;
