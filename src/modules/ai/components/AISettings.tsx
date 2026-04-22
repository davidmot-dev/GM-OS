import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Key, Cpu, ShieldCheck, Eye, EyeOff, Sparkles, RefreshCw, BookOpen, PenTool, Music, Beaker, User, Settings2, Save, ExternalLink, Map, type LucideIcon } from 'lucide-react';
import { useAIStore } from '../../../stores/useAIStore';
import { useGemStore } from '../../../stores/useGemStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { gmToast } from '../../../stores/useToastStore';
import { Select } from '../../../components/common/Select';
import type { AIProvider } from '../types';
import { aiService } from '../AIService';

const AISettings: React.FC = () => {
  const { t } = useTranslation(['settings', 'modules']);
  const { configs, updateConfig, activeProvider, setProvider, syncWithKeychain } = useAIStore();
  const { gems, updateGem, syncGemsWithDefaults } = useGemStore();
  const activeCampaign = useSessionOSStore(state => state.campaigns.find(c => c.id === state.activeCampaignId));
  const systemId = activeCampaign?.system?.toLowerCase() || 'generic';
  
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, string[]>>({
    gemini: [],
    ollama: [],
    openai: [],
    anthropic: [],
    oracle: []
  });
  const [isLoadingModels, setIsLoadingModels] = useState<Record<string, boolean>>({
    gemini: false,
    ollama: false
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [selectedGemId, setSelectedGemId] = useState<string>('sage');
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  
  const [isObsidianActive, setIsObsidianActive] = useState(false);
  
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, { status: 'success' | 'error' | 'loading' | 'idle', message?: string }>>({
    gemini: { status: 'idle' },
    openai: { status: 'idle' },
    anthropic: { status: 'idle' },
    ollama: { status: 'idle' },
    ollama_cloud: { status: 'idle' },
    custom: { status: 'idle' },
    oracle: { status: 'idle' }
  });

  const iconMap: Record<string, LucideIcon> = {
    BookOpen, PenTool, Music, Beaker, Map, User, Sparkles, Brain
  };

  useEffect(() => {
    syncGemsWithDefaults();
    
    // Check Obsidian status via bridge
    if (window.appBridge?.mcp?.checkStatus) {
      window.appBridge.mcp.checkStatus('obsidian').then((active: boolean) => setIsObsidianActive(active));
    }
    
    syncWithKeychain();
  }, [syncGemsWithDefaults, syncWithKeychain]);

  useEffect(() => {
    const fetchModels = async () => {
      if (activeProvider === 'gemini' && configs.gemini.apiKey) {
        setIsLoadingModels(prev => ({ ...prev, gemini: true }));
        try {
          const data = await aiService.listModels(configs.gemini.apiKey);
          setDiscoveredModels(prev => ({ ...prev, gemini: data }));
        } catch (err) {
          console.error("Failed to discover Gemini models:", err);
        } finally {
          setIsLoadingModels(prev => ({ ...prev, gemini: false }));
        }
      } else if ((activeProvider === 'ollama' || activeProvider === 'ollama_cloud') && window.appBridge?.ai?.ollamaListModels) {
        setIsLoadingModels(prev => ({ ...prev, [activeProvider]: true }));
        try {
          const endpoint = configs[activeProvider].endpoint;
          const models = await window.appBridge.ai.ollamaListModels(endpoint);
          setDiscoveredModels(prev => ({ ...prev, [activeProvider]: models }));
        } catch (err) {
          console.error(`Failed to discover ${activeProvider} models:`, err);
          setDiscoveredModels(prev => ({ ...prev, [activeProvider]: [] }));
        } finally {
          setIsLoadingModels(prev => ({ ...prev, [activeProvider]: false }));
        }
      }
    };

    fetchModels();
  }, [activeProvider, configs.gemini.apiKey, configs.ollama.endpoint, configs.ollama_cloud.endpoint]);

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const runGlobalDiagnostic = async () => {
    const providersToTest = ['gemini', 'openai', 'anthropic', 'ollama', 'ollama_cloud', 'custom', 'oracle'];
    
    const newResults = { ...diagnosticResults };
    providersToTest.forEach(p => newResults[p] = { status: 'loading' });
    setDiagnosticResults(newResults);

    // 1. Test Gemini
    try {
      if (configs.gemini.apiKey) {
        await aiService.listModels(configs.gemini.apiKey);
        setDiagnosticResults(prev => ({ ...prev, gemini: { status: 'success', message: t('ai.actions.diagnostic_active') } }));
      } else {
        setDiagnosticResults(prev => ({ ...prev, gemini: { status: 'error', message: t('ai.actions.diagnostic_missing') } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, gemini: { status: 'error', message: t('ai.actions.diagnostic_error') } }));
    }

    // 2. Test OpenAI
    try {
      if (configs.openai.apiKey) {
        setDiagnosticResults(prev => ({ ...prev, openai: { status: 'success', message: t('ai.actions.diagnostic_active') } }));
      } else {
        setDiagnosticResults(prev => ({ ...prev, openai: { status: 'error', message: t('ai.actions.diagnostic_missing') } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, openai: { status: 'error', message: t('ai.actions.diagnostic_error') } }));
    }

    // 3. Test Anthropic
    try {
      if (configs.anthropic.apiKey) {
        setDiagnosticResults(prev => ({ ...prev, anthropic: { status: 'success', message: t('ai.actions.diagnostic_active') } }));
      } else {
        setDiagnosticResults(prev => ({ ...prev, anthropic: { status: 'error', message: t('ai.actions.diagnostic_missing') } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, anthropic: { status: 'error', message: t('ai.actions.diagnostic_error') } }));
    }

    // 4. Test Ollama Local
    try {
      if (window.appBridge?.ai?.ollamaStatus) {
        const online = await window.appBridge.ai.ollamaStatus(configs.ollama.endpoint);
        setDiagnosticResults(prev => ({ ...prev, ollama: { status: online ? 'success' : 'error', message: online ? t('ai.actions.diagnostic_server_active') : t('ai.actions.diagnostic_unreachable') } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, ollama: { status: 'error', message: t('ai.actions.diagnostic_unreachable') } }));
    }

    // 4b. Test Ollama Cloud
    try {
      if (configs.ollama_cloud.endpoint) {
        if (window.appBridge?.ai?.ollamaStatus) {
          const online = await window.appBridge.ai.ollamaStatus(configs.ollama_cloud.endpoint);
          setDiagnosticResults(prev => ({ ...prev, ollama_cloud: { status: online ? 'success' : 'error', message: online ? t('ai.actions.diagnostic_server_active') : t('ai.actions.diagnostic_unreachable') } }));
        }
      } else {
        setDiagnosticResults(prev => ({ ...prev, ollama_cloud: { status: 'idle' } }));
      }
    } catch {
      setDiagnosticResults(prev => ({ ...prev, ollama_cloud: { status: 'error', message: t('ai.actions.diagnostic_unreachable') } }));
    }

    // 4c. Test Custom API (Check if endpoint and key are set)
    if (configs.custom.endpoint) {
      setDiagnosticResults(prev => ({ ...prev, custom: { status: 'success', message: t('ai.actions.diagnostic_configured', 'Configuré') } }));
    } else {
      setDiagnosticResults(prev => ({ ...prev, custom: { status: 'error', message: t('ai.actions.diagnostic_missing') } }));
    }

    // 5. Test Oracle
    try {
      if (window.appBridge?.mcp?.callTool) {
        const res = await window.appBridge.mcp.callTool('notebooklm', 'notebook_list', { max_results: 1 });
        if (res && res.content) {
          setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'success', message: t('ai.actions.diagnostic_oracle_online') } }));
        } else {
          setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'error', message: t('ai.actions.diagnostic_empty_res') } }));
        }
      } else {
        setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'error', message: t('ai.actions.diagnostic_mcp_absent') } }));
      }
    } catch (err: unknown) {
      const errorMsg = String(err instanceof Error ? err.message : err);
      setDiagnosticResults(prev => ({ ...prev, oracle: { status: 'error', message: errorMsg.includes('16') ? t('ai.actions.diagnostic_expired') : t('ai.actions.diagnostic_error') } }));
    }
  };

  const providers: { id: AIProvider; name: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { 
      id: 'gemini', 
      name: t('ai.providers.gemini_label'), 
      icon: <Sparkles size={24} />,
      color: 'text-blue-400',
      desc: t('ai.providers.gemini_desc')
    },
    { 
      id: 'openai', 
      name: t('ai.providers.openai_label'), 
      icon: <Cpu size={24} />,
      color: 'text-emerald-500',
      desc: t('ai.providers.openai_desc')
    },
    { 
      id: 'anthropic', 
      name: t('ai.providers.anthropic_label'), 
      icon: <Brain size={24} />,
      color: 'text-gm-violet',
      desc: t('ai.providers.anthropic_desc')
    },
    { 
      id: 'ollama', 
      name: t('ai.providers.ollama_label'), 
      icon: <Cpu size={24} />,
      color: 'text-orange-400',
      desc: t('ai.providers.ollama_desc')
    },
    { 
      id: 'ollama_cloud', 
      name: t('ai.providers.ollama_cloud_label', 'Ollama Cloud'), 
      icon: <Sparkles size={24} />,
      color: 'text-sky-400',
      desc: t('ai.providers.ollama_cloud_desc', 'Ollama distant via HTTPS')
    },
    { 
      id: 'custom', 
      name: t('ai.providers.custom_label', 'Custom API'), 
      icon: <Settings2 size={24} />,
      color: 'text-slate-400',
      desc: t('ai.providers.custom_desc', 'API compatible OpenAI/Custom')
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
            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('ai.cloud_config_title')}</h4>
            <p className="text-xs text-app-text/60 mt-1">
              {t('ai.cloud_config_desc')}
            </p>
          </div>
        </div>
        
        <button
          onClick={runGlobalDiagnostic}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-app-text transition-all"
        >
          <Beaker size={14} className={Object.values(diagnosticResults).some(r => r.status === 'loading') ? 'animate-pulse' : ''} />
          {t('ai.global_diagnostic')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-visible relative">
        {providers.map((p) => (
          <div 
            key={p.id}
            className={`p-6 rounded-2xl border transition-all duration-300 relative ${
              activeProvider === p.id 
                ? 'bg-app-surface border-accent shadow-glow-accent/10 ring-1 ring-accent/20 z-50' 
                : 'bg-app-surface/40 border-app-border/20 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 z-0'
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
                {activeProvider === p.id ? t('ai.status.active') : t('ai.status.select')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(p.id !== 'ollama') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                    <Key size={12} className="text-accent" />
                    {t('ai.status.api_key')}
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys[p.id] ? 'text' : 'password'}
                      value={configs[p.id]?.apiKey || ''}
                      onChange={(e) => updateConfig(p.id, { apiKey: e.target.value })}
                      placeholder={t('ai.status.api_key_placeholder', { name: p.name })}
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

              {(p.id === 'ollama' || p.id === 'ollama_cloud' || p.id === 'custom') && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                      <ExternalLink size={12} className="text-accent" />
                      {t('ai.labels.endpoint_url', 'Endpoint URL')}
                    </label>
                    <input
                      type="text"
                      value={configs[p.id]?.endpoint || ''}
                      onChange={(e) => updateConfig(p.id, { endpoint: e.target.value.trim() })}
                      placeholder={p.id === 'ollama' ? "http://127.0.0.1:11434" : "https://api.provider.com/v1"}
                      className="w-full bg-black/40 border border-app-border/40 rounded-xl px-4 py-3 text-xs text-app-text focus:border-accent/50 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              {p.id === 'ollama' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                    <ShieldCheck size={12} className={diagnosticResults.ollama.status === 'success' ? "text-emerald-500" : "text-app-text/20"} />
                    {t('ai.status.local_status')}
                  </label>
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    diagnosticResults.ollama.status === 'success' 
                      ? 'bg-emerald-500/5 border-emerald-500/10' 
                      : 'bg-red-500/5 border-red-500/10'
                  }`}>
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                      diagnosticResults.ollama.status === 'success' ? 'text-emerald-500' : 'text-red-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        diagnosticResults.ollama.status === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                      }`} />
                      {diagnosticResults.ollama.status === 'success' ? t('ai.status.ollama_ready') : t('ai.status.ollama_offline', 'Ollama Offline')}
                    </div>
                    <button
                      onClick={async () => {
                        const ok = await window.appBridge?.ai?.ollamaPull?.('phi3', configs.ollama.endpoint);
                        if (ok) {
                          gmToast(t('ai.actions.pull_phi3_success', 'Phi-3 downloaded!'));
                          const models = await window.appBridge?.ai?.ollamaListModels?.(configs.ollama.endpoint);
                          if (models) setDiscoveredModels(prev => ({ ...prev, ollama: models }));
                        } else {
                          gmToast(t('ai.actions.pull_phi3_error', 'Failed to start download'), 'error');
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20 hover:bg-accent/20 transition-all"
                      title={t('ai.actions.pull_phi3_tooltip')}
                    >
                      {t('ai.actions.pull_phi3')}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 flex items-center gap-2">
                    <Cpu size={12} className="text-accent" />
                    {t('ai.labels.model')}
                  </label>
                  {(p.id === 'gemini' || p.id === 'ollama' || p.id === 'ollama_cloud') && (
                    <button 
                      onClick={async () => {
                        setIsLoadingModels(prev => ({ ...prev, [p.id]: true }));
                        try {
                          let models = [];
                          if (p.id === 'gemini') {
                             models = await aiService.listModels(configs.gemini.apiKey);
                          } else {
                             models = await window.appBridge?.ai?.ollamaListModels?.(configs[p.id].endpoint);
                          }
                          setDiscoveredModels(prev => ({ ...prev, [p.id]: models }));
                        } finally {
                          setIsLoadingModels(prev => ({ ...prev, [p.id]: false }));
                        }
                      }}
                      className={`text-accent/60 hover:text-accent transition-all ${isLoadingModels[p.id] ? 'animate-spin' : ''}`}
                      title={t('ai.actions.refresh_models')}
                    >
                      <RefreshCw size={10} />
                    </button>
                  )}
                </div>
                
                <Select
                  value={configs[p.id]?.modelId || ''}
                  onChange={(val) => updateConfig(p.id, { modelId: val })}
                  options={[
                    ...((p.id === 'gemini' || p.id === 'ollama' || p.id === 'ollama_cloud') && (discoveredModels[p.id]?.length || 0) > 0 
                      ? discoveredModels[p.id].map(name => ({ value: name, label: name }))
                      : [
                          ...(p.id === 'gemini' ? [
                            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
                            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
                          ] : []),
                          ...(p.id === 'openai' ? [
                            { value: 'gpt-4o', label: 'GPT-4o' },
                            { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                            { value: 'o1-preview', label: 'OpenAI o1' }
                          ] : []),
                          ...(p.id === 'anthropic' ? [
                            { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
                            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                            { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' }
                          ] : []),
                          ...(p.id === 'ollama' || p.id === 'ollama_cloud' ? [
                            { value: 'phi3', label: 'Phi-3 (Mini)' },
                            { value: 'llama3', label: 'Llama 3' },
                            { value: 'mistral', label: 'Mistral' },
                            { value: 'gemma', label: 'Gemma' }
                          ] : []),
                          ...(p.id === 'custom' ? [
                            { value: 'custom-model', label: 'Custom Model' }
                          ] : [])
                        ]
                    ),
                    { value: 'custom', label: t('ai.labels.manual_input') }
                  ]}
                  title={t('ai.labels.model_select_tooltip')}
                />
                
                {(configs[p.id]?.modelId === 'custom' || (p.id === 'gemini' && (discoveredModels.gemini?.length || 0) === 0)) && (
                  <div className="mt-2 text-app-text/60 italic text-[9px] uppercase tracking-widest pl-1">
                    {t('ai.labels.selected_model')} <span className="text-accent font-bold">{configs[p.id]?.modelId}</span>
                  </div>
                )}
              </div>
            </div>

            {p.id === 'ollama' && !discoveredModels.ollama.includes('gemma4:26b') && (
              <button
                onClick={async () => {
                  try {
                    gmToast(t('ai.actions.pull_gemma_start'));
                    await window.appBridge?.ai?.ollamaPull?.('gemma4:26b', configs.ollama.endpoint);
                    gmToast(t('ai.actions.pull_gemma_success'), "success");
                    const models = await window.appBridge?.ai?.ollamaListModels?.(configs.ollama.endpoint);
                    if (models) setDiscoveredModels(prev => ({ ...prev, ollama: models }));
                   } catch (error) {
                    console.error("Gemma 4 Pull error:", error);
                    gmToast(t('ai.actions.pull_gemma_error'), "error");
                  }
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/20 border border-accent/40 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all shadow-lg shadow-accent/10"
              >
                <Cpu size={14} className="animate-pulse" />
                {t('ai.actions.pull_gemma')}
              </button>
            )}

            {configs[p.id]?.apiKey && (
              <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-emerald-500/60 bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
                <ShieldCheck size={12} />
                {t('ai.status.key_configured')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Obsidian Section */}
        <div className="p-4 rounded-2xl bg-gm-emerald/5 border border-gm-emerald/20 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-gm-emerald/10 text-gm-emerald">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest leading-none">{t('ai.obsidian.title')}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-tight mt-1">{t('ai.obsidian.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gm-emerald text-[10px] font-bold uppercase tracking-widest">
              <div className={`w-2 h-2 rounded-full ${isObsidianActive ? 'bg-gm-emerald animate-pulse' : 'bg-slate-800'}`} />
              {isObsidianActive ? t('ai.obsidian.status_active') : t('ai.obsidian.status_offline')}
            </div>
            <div className="flex gap-2">
              <button className="text-[10px] font-black uppercase tracking-widest text-gm-emerald bg-gm-emerald/10 px-3 py-1.5 rounded-lg border border-gm-emerald/20 hover:bg-gm-emerald/20 transition-all">
                {t('ai.obsidian.sync_button')}
              </button>
              <button className="text-[10px] font-black uppercase tracking-widest text-gm-emerald bg-gm-emerald/10 px-3 py-1.5 rounded-lg border border-gm-emerald/20 hover:bg-gm-emerald/20 transition-all">
                {t('ai.obsidian.open_vault')}
              </button>
            </div>
          </div>
          <p className="text-[10px] font-medium text-slate-500 italic">{t('ai.obsidian.config_hint')}</p>
        </div>

        {/* Audio Section */}
        <div className="p-4 rounded-2xl bg-gm-cyan/5 border border-gm-cyan/20 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-gm-cyan/10 text-gm-cyan">
              <Music size={24} />
            </div>
            <div>
              <p className="text-white text-xs font-black uppercase tracking-widest leading-none">{t('ai.audio.title')}</p>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-tight mt-1">{t('ai.audio.subtitle')}</p>
            </div>
          </div>
          
          <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">{t('ai.audio.input_source')}</span>
               <span className="text-[9px] font-bold text-gm-cyan">{t('ai.audio.no_device')}</span>
             </div>
             <div className="h-1 bg-black/40 rounded-full overflow-hidden">
               <div className="h-full bg-gm-cyan w-0 transition-all duration-300" />
             </div>
          </div>
        </div>
      </div>

      {/* Oracle Section */}
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-4">
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-accent/10 text-accent">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('ai.oracle.title')}</h4>
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
              {t('ai.oracle.desc')}
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{t('ai.oracle.status_label')}</p>
            <p className="text-xs text-app-text/80">
              {diagnosticResults.oracle.status === 'error' 
                ? t('ai.oracle.status_expired') 
                : t('ai.oracle.status_hint')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={async (e) => {
                const btn = e.currentTarget;
                btn.classList.add('animate-spin-once');
                try {
                  await window.appBridge?.mcp?.restart?.();
                  gmToast(t('common:success_operation'));
                  runGlobalDiagnostic();
                } catch (e) {
                  console.error(e);
                } finally {
                  setTimeout(() => btn.classList.remove('animate-spin-once'), 1000);
                }
              }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-app-text/60 hover:text-white hover:bg-white/10 hover:border-accent/40 transition-all group"
              title={t('ai.oracle.restart_tooltip')}
            >
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
            
            <button
              onClick={async () => {
                try {
                  const result = await window.appBridge?.mcp?.reauthenticate();
                  if (result?.success) {
                    gmToast(t('common:check_browser'));
                  }
                } catch (error) {
                  console.error("Re-authentication failed:", error);
                  gmToast(t('common:error_generic'), "error");
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white border border-accent shadow-glow-accent/20 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-[10px]"
            >
              <ExternalLink size={16} />
              {diagnosticResults.oracle.status === 'error' ? t('ai.oracle.reconnect_force') : t('ai.oracle.reconnect')}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gm-emerald/5 border border-gm-emerald/20 flex items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-gm-emerald/10 text-gm-emerald">
            <BookOpen size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('ai.rag.title')}</h4>
            <p className="text-xs text-app-text/60 mt-1">
              {t('ai.rag.desc')}
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
          {isReindexing ? t('ai.actions.reindexing') : t('ai.actions.reindex_docs')}
        </button>
      </div>

      {/* Performance & Streaming Section */}
      <div className="p-4 rounded-2xl bg-gm-violet/5 border border-gm-violet/20 space-y-4 shadow-lg shadow-gm-violet/5">
        <div className="flex gap-4">
          <div className="p-3 rounded-xl bg-gm-violet/10 text-gm-violet">
            <RefreshCw size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('ai.perf.title')}</h4>
            <p className="text-xs text-app-text/60 mt-1">
              {t('ai.perf.desc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${useAIStore.getState().streamEnabled ? 'bg-gm-violet/10 border-gm-violet/30 shadow-glow-gm-violet/10' : 'bg-black/20 border-white/5 opacity-60'}`}
               onClick={() => useAIStore.getState().setStreamEnabled(!useAIStore.getState().streamEnabled)}>
            <div className="flex gap-3 items-center">
              <div className={`p-2 rounded-lg ${useAIStore.getState().streamEnabled ? 'bg-gm-violet/20 text-gm-violet' : 'bg-white/5 text-white/20'}`}>
                <RefreshCw size={16} className={useAIStore.getState().streamEnabled ? 'animate-spin-slow' : ''} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest leading-none">{t('ai.perf.stream_label')}</div>
                <div className="text-[9px] text-app-text/40 mt-1 uppercase tracking-tight whitespace-nowrap">{t('ai.perf.stream_desc')}</div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${useAIStore.getState().liteContext ? 'bg-emerald-500/10 border-emerald-500/30 shadow-glow-emerald/10' : 'bg-black/20 border-white/5 opacity-60'}`}
               onClick={() => useAIStore.getState().setLiteContext(!useAIStore.getState().liteContext)}>
            <div className="flex gap-3 items-center">
              <div className={`p-2 rounded-lg ${useAIStore.getState().liteContext ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                <Cpu size={16} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest leading-none">{t('ai.perf.lite_label')}</div>
                <div className="text-[9px] text-app-text/40 mt-1 uppercase tracking-tight whitespace-nowrap">{t('ai.perf.lite_desc')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="p-3 rounded-xl bg-accent/10 text-accent">
          <Settings2 size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight text-app-text">{t('ai.gems.title')}</h4>
          <p className="text-xs text-app-text/60 mt-1">
            {t('ai.gems.desc')}
          </p>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
          <div className="border-r border-app-border/10 bg-black/20 p-4 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 mb-4 block px-2">{t('ai.gems.label')}</label>
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
                    <div className="text-xs font-black uppercase tracking-tight">{t(gem.name)}</div>
                    <div className={`text-[9px] font-medium opacity-60 truncate max-w-[120px]`}>{t(gem.description)}</div>
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
                      <h5 className="font-black uppercase tracking-tight text-lg text-app-text">{t(gem.name)}</h5>
                      <p className="text-xs text-app-text/40">{t(gem.description)}</p>
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
                       <Save size={14} /> {t('ai.gems.save_gem')}
                     </button>
                  </div>

                  <div className="flex p-1 bg-black/40 rounded-xl w-fit">
                    <button onClick={() => setIsEditingOverride(false)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isEditingOverride ? 'bg-white/10 text-white' : 'text-app-text/40'}`}>{t('ai.gems.base')}</button>
                    <button onClick={() => setIsEditingOverride(true)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isEditingOverride ? 'bg-accent/20 text-accent' : 'text-app-text/40'}`}>{t('ai.gems.override', { systemId })}</button>
                  </div>

                    <textarea 
                      value={t(isEditingOverride ? (gem.systemOverrides?.[systemId] || gem.baseInstructions) : gem.baseInstructions)}
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
