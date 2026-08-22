import React, { useState, useRef, useEffect } from 'react';
import { 
  Book, 
  PenTool, 
  Eye, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Cpu,
  Clock,
  type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAIStore } from '../../../stores/useAIStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useGemStore } from '../../../stores/useGemStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { marquerCommeRelue } from '../../forge/rules/marqueDeRelecture';
import { aiService } from '../AIService';
import { useFileDAttente, depuisQuand } from '../useFileDAttente';
import { attenteAnnoncee, budgetDuMoment } from '../budgetsDeTemps';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  gemId?: string;
}

const AIChatPanel: React.FC = () => {
  const { t } = useTranslation(['settings', 'modules', 'common']);
  const { isAIPanelOpen, toggleAIPanel } = useSessionStore();
  const { activeProvider, setProvider } = useAIStore();
  const [input, setInput] = useState('');
  const { gems: storeGems } = useGemStore();
  const [activeGem, setActiveGem] = useState<string>(storeGems[0]?.id || 'sage');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('modules:ai.welcome_bot', 'Bonjour David. Je suis prêt à vous assister pour votre session. Quel Gem souhaitez-vous solliciter ?'),
      gemId: storeGems[0]?.id || 'sage'
    }
  ]);
  const [loading, setLoading] = useState(false);
  // Ce qui occupe le modèle pendant qu'on regarde ce panneau — axe D.3.
  const { requetes: enAttente, abandonner } = useFileDAttente();
  // Le moment de jeu decide du plafond, et le plafond s'affiche — axe D.5.
  const sessions = useSessionOSStore(s => s.sessions);
  const [aiStatus, setAiStatus] = useState<string>('');
  /**
   * Les fiches qui ont fourni le contexte de la dernière réponse.
   *
   * **L'Oracle citait une fiche jamais relue exactement comme une fiche
   * vérifiée.** Le journal des lacunes attrape ce qui manque ; rien n'attrapait
   * ce qui est faux — une fiche erronée produit une recherche réussie, une
   * citation confiante, et aucun signal.
   */
  const [sources, setSources] = useState<{ path: string; relu?: boolean }[]>([]);

  /**
   * Déclarer une fiche relue, depuis la réponse qu'elle vient de fournir.
   *
   * **On relit à l'usage.** Relire vraiment une fiche prend trois à cinq
   * minutes : dix fiches forgées créeraient trois quarts d'heure de lecture qui
   * ne seront pas faits. Ici, la fiche vient de répondre et la question est
   * sous les yeux — *le seul moment où l'on peut juger.*
   */
  const marquerRelue = async (chemin: string) => {
    const contenu = await window.appBridge?.ai?.readDoc?.(chemin).catch(() => null);
    const corrige = contenu ? marquerCommeRelue(contenu) : null;
    if (!corrige) return;

    const ecrit = await window.appBridge?.ai?.writeDoc?.(chemin, corrige).catch(() => false);
    if (ecrit) setSources(liste => liste.map(s => (s.path === chemin ? { ...s, relu: true } : s)));
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiStatus]);

  if (!isAIPanelOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const assistantMsgId = (Date.now() + 1).toString();
    
    setMessages(prev => [...prev, userMsg, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      gemId: activeGem
    }]);
    
    setInput('');
    setSources([]);
    setLoading(true);
    setAiStatus('Gathering intelligence...');

    try {
      await aiService.generateTextStream(
        input,
        (token) => {
          setLoading(false); // First token received, stop bounce animation
          setAiStatus('');   // Hide status
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: msg.content + token } 
              : msg
          ));
        },
        (status) => {
          setAiStatus(status);
        },
        activeGem,
        {},
        setSources,
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: `Erreur: ${errorMessage}` } 
          : msg
      ));
    } finally {
      setLoading(false);
      setAiStatus('');
    }
  }

  return (
    <aside className="w-[380px] h-screen bg-app-surface/40 backdrop-blur-2xl border-l border-app-border/30 flex flex-col shadow-2xl relative z-30 overflow-hidden font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <div className="p-4 border-b border-app-border/20 bg-app-surface/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight uppercase">AI Companion</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-app-text/40 uppercase tracking-widest leading-none">Contextual Oracle Active</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => toggleAIPanel(false)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-app-text/40 hover:text-app-text transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 p-1 bg-app-bg/50 rounded-xl border border-app-border/20">
          {storeGems.map((gem) => {
             const IconMapExt: Record<string, LucideIcon> = { 'BookOpen': Book, 'PenTool': PenTool, 'Music': Sparkles, 'Beaker': Sparkles, 'User': Eye, 'Sparkles': Sparkles, 'Brain': Cpu, 'Eye': Eye, 'Book': Book };
             const Icon = IconMapExt[gem.icon] || Cpu;
             
             return (
               <button
                 key={gem.id}
                 onClick={() => setActiveGem(gem.id)}
                 className={`flex-1 min-w-[30%] flex flex-col items-center gap-1.5 py-2.5 rounded-lg transition-all duration-300 ${
                   activeGem === gem.id 
                     ? 'bg-accent/10 border border-accent/30 text-accent shadow-glow-accent/10' 
                     : 'text-app-text/40 hover:text-app-text/60 hover:bg-white/5 border border-transparent'
                 }`}
               >
                 <Icon size={18} />
                 <span className="text-[9px] font-black uppercase tracking-widest">{t(gem.name)}</span>
               </button>
             );
          })}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/10"
      >
        {/*
          **D'où l'Oracle tient sa réponse, et si quelqu'un l'a relue.**

          Le journal des lacunes attrape ce qui manque ; RIEN N'ATTRAPAIT CE QUI
          EST FAUX. Une fiche erronée produit une recherche réussie, une citation
          confiante, et aucun signal — pire, la citation renforce la confiance.

          La mention est DISCRÈTE ET TOUJOURS VISIBLE (arbitrage du 2026-08-07) :
          honnête sans être alarmiste, et présente à chaque citation, donc les
          fiches qui reviennent souvent finissent par être relues d'elles-mêmes.

          Une source SANS marque ne dit rien — un extrait brut n'a jamais
          prétendu être une fiche, et le montrer « non relu » ferait crier
          l'écran sur ce qui n'a rien à se reprocher.
        */}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1 pb-2">
            {sources.map(source => {
              const nom = source.path.split('/').pop() ?? source.path;
              return (
                <span
                  key={source.path}
                  title={source.path}
                  className="inline-flex items-center gap-1.5 rounded-full border border-app-border/30 bg-app-text/5 px-2 py-0.5 text-[9px] font-mono text-app-text/40"
                >
                  {nom}
                  {source.relu === false && (
                    <button
                      onClick={() => void marquerRelue(source.path)}
                      title="Cette fiche n'a jamais été relue. Cliquer pour la déclarer relue."
                      className="rounded-full bg-amber-500/15 px-1.5 text-amber-300/80 hover:bg-amber-500/30 transition-colors"
                    >
                      non relue
                    </button>
                  )}
                  {source.relu === true && <span className="text-emerald-400/60">relue</span>}
                </span>
              );
            })}
          </div>
        )}


        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-accent/10 border border-accent/20 text-app-text rounded-tr-none shadow-lg shadow-accent/5' 
                  : 'bg-app-surface/60 border border-app-border/30 text-app-text/80 rounded-tl-none backdrop-blur-md'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-app-border/10">
                  <div className="p-1 rounded bg-accent/10 text-accent">
                    {msg.gemId === 'sage' && <Book size={10} />}
                    {msg.gemId === 'scribe' && <PenTool size={10} />}
                    {msg.gemId === 'oracle' && <Eye size={10} />}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                    {t(storeGems.find(g => g.id === msg.gemId)?.name || 'AI')}
                  </span>
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {/*
          **Ce qui occupe Ollama, dit plutôt que subi — axe D.3 du plan du
          2026-08-07.**

          David, le 2026-08-21 : « je n'ai pas la main sur le Cortex quand je
          forge ». Il pouvait pourtant envoyer — `loading` est local à ce
          panneau — mais sa question faisait la queue sous
          `OLLAMA_NUM_PARALLEL: 1`, et l'écran affichait « réception de la
          vision… » indéfiniment sans rien expliquer.

          **On ne grise pas le champ**, et c'est la position du plan : *savoir
          qu'une opération tourne vaut mieux que l'empêcher*. Le meneur garde le
          droit d'envoyer et d'attendre ; on lui dit ce qu'il attend, depuis
          quand, et on lui laisse la main pour trancher.
        */}
        {enAttente.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-amber-500/[0.06] border border-amber-500/25 rounded-2xl p-3 space-y-2 w-full">
              {enAttente.map(r => (
                <div key={r.id} className="flex items-center gap-3 flex-wrap">
                  <Clock size={12} className="text-amber-400 shrink-0" />
                  <span className="text-[11px] text-amber-200/80 leading-relaxed flex-1 min-w-0">
                    <b>{r.libelle}</b> occupe le modèle depuis {depuisQuand(r.depuis)} — votre
                    question partira à la suite.
                  </span>
                  <button
                    onClick={() => void abandonner(r.id)}
                    className="shrink-0 px-2.5 py-1 rounded-lg border border-amber-500/30 text-[9px] font-black uppercase tracking-widest text-amber-300/80 hover:bg-amber-500/15 hover:text-amber-200 transition-all"
                  >
                    Abandonner
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {(loading || aiStatus) && (
          <div className="flex justify-start">
            <div className="bg-app-surface/40 p-3.5 rounded-2xl rounded-tl-none border border-app-border/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
                </div>
                {aiStatus && (
                  <span className="text-[10px] font-mono text-accent/80 uppercase tracking-widest animate-pulse ml-1">
                    {aiStatus}
                  </span>
                )}
                {/*
                  **L'attente annonce sa borne — axe D.5 du plan du 2026-08-07.**

                  « Réception de la vision… » ne disait rien de sa fin : trois
                  points qui rebondissent ne distinguent pas une réponse qui
                  arrive d'une requête perdue, et *une attente qu'on ne peut pas
                  borner se ressent plus longue qu'elle n'est*.

                  **On annonce le PLAFOND, pas une prédiction.** Prédire la durée
                  demanderait de connaître la machine, le modèle et la longueur de
                  la réponse ; annoncer « 20 s » et se tromper ferait plus de mal
                  que de se taire. Le plafond, lui, est une promesse tenue : au
                  pire, ça s'arrête là — et depuis l'axe D.1, ça s'arrête vraiment.
                */}
                <span className="text-[10px] font-mono text-app-text/25 tracking-widest ml-1">
                  {attenteAnnoncee(budgetDuMoment(sessions))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-app-surface/40 border-t border-app-border/20 backdrop-blur-xl">
        {/* Model Selector Dock */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {(['gemini', 'openai', 'anthropic'] as const).map(p => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all border ${
                  activeProvider === p 
                    ? 'bg-accent/20 border-accent/40 text-accent ring-1 ring-accent/20' 
                    : 'bg-black/20 border-white/5 text-app-text/30 hover:text-app-text/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/20 border border-white/5">
            <Cpu size={10} className={loading ? 'text-accent animate-spin' : 'text-app-text/20'} />
            <div className="w-6 h-3 rounded-full bg-slate-800 relative cursor-not-allowed opacity-50">
               <div className="absolute left-0.5 top-0.5 w-2 h-2 rounded-full bg-slate-600" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-app-text/20">Vocal Shaping</span>
          </div>
        </div>

        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            rows={3}
            className="w-full bg-black/30 border border-app-border/30 rounded-xl p-4 pr-12 text-sm text-app-text/80 placeholder:text-app-text/20 focus:ring-1 focus:ring-accent/50 focus:border-accent/40 outline-none resize-none transition-all duration-300 group-hover:border-app-border/50"
            placeholder={t('modules:ai.input_placeholder', { 
              gem: t(storeGems.find(g => g.id === activeGem)?.name || ''),
              defaultValue: `Demandez à ${activeGem === 'sage' ? 'votre Sage des règles' : activeGem === 'scribe' ? 'votre Scribe de notes' : 'votre Oracle créatif'}...`
            })}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`absolute right-3 bottom-3 p-2.5 rounded-lg transition-all duration-300 ${
              input.trim() && !loading 
                ? 'bg-accent text-white shadow-glow-accent/40 scale-100' 
                : 'text-app-text/20 scale-90 grayscale opacity-50'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AIChatPanel;
