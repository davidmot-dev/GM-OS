import React, { useState, useRef, useEffect } from 'react';
import { 
  Book, 
  PenTool, 
  Eye, 
  Send, 
  Sparkles, 
  ChevronRight, 
  Cpu,
  type LucideIcon
} from 'lucide-react';
import { useAIStore } from '../../../stores/useAIStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useGemStore } from '../../../stores/useGemStore';
import { aiService } from '../AIService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  gemId?: string;
}

const AIChatPanel: React.FC = () => {
  const { isAIPanelOpen, toggleAIPanel } = useSessionStore();
  const { activeProvider, setProvider } = useAIStore();
  const [input, setInput] = useState('');
  const { gems: storeGems } = useGemStore();
  const [activeGem, setActiveGem] = useState<string>(storeGems[0]?.id || 'sage');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour David. Je suis prêt à vous assister pour votre session. Quel Gem souhaitez-vous solliciter ?",
      gemId: storeGems[0]?.id || 'sage'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isAIPanelOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Simulate context-aware prompt based on activeGem
      const response = await aiService.generateText(input, undefined, activeGem);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        gemId: activeGem
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Erreur: ${errorMessage}. Vérifiez vos clés API dans les paramètres.`,
        gemId: activeGem
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
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
                <span className="text-[10px] font-mono text-app-text/40 uppercase tracking-widest leading-none">Contextual RAG Active</span>
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
                 <span className="text-[9px] font-black uppercase tracking-widest">{gem.name}</span>
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
                    {msg.gemId?.toUpperCase()}
                  </span>
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-app-surface/40 p-3.5 rounded-2xl rounded-tl-none border border-app-border/30">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
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
            placeholder={`Demandez à ${activeGem === 'sage' ? 'votre Sage des règles' : activeGem === 'scribe' ? 'votre Scribe de notes' : 'votre Oracle créatif'}...`}
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
