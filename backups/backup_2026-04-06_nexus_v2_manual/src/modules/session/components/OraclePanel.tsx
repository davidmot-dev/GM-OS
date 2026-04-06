import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Sparkles, X, ExternalLink, RefreshCw, Send, MessageSquare, 
    Book, Bot, User, Trash2, BookOpen, PenTool, Music, Beaker, Map,
    ChevronDown, type LucideIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotebookLM } from '../hooks/useNotebookLM';
import { useGemStore } from '../../../stores/useGemStore';
import { useSessionOSStore } from '../useSessionOSStore';

interface OraclePanelProps {
    isOpen: boolean;
    onClose: () => void;
    campaignNotebookUrl?: string;
    templateNotebookUrl?: string;
    driverNotebookUrl?: string;
}

const OraclePanel: React.FC<OraclePanelProps> = ({ isOpen, onClose, campaignNotebookUrl, templateNotebookUrl, driverNotebookUrl }) => {
    const { messages, isQuerying, queryNotebook, extractNotebookId, clearChat } = useNotebookLM();
    const { activeGemId, gems, setActiveGemId, syncGemsWithDefaults } = useGemStore();
    const activeDriver = useSessionOSStore(state => state.getActiveDriver());
    
    // Resolve active GEM
    const activeGem = useMemo(() => gems.find(g => g.id === activeGemId), [gems, activeGemId]);
    
    // Icon map for all 6 Gems + default
    const iconMap: Record<string, LucideIcon> = {
        BookOpen,
        PenTool,
        Sparkles,
        Music,
        Beaker,
        Map,
        User,
        Bot
    };

    const GemIcon = activeGem ? (iconMap[activeGem.icon] || Sparkles) : Sparkles;
    const [viewMode, setViewMode] = useState<'chat' | 'iframe'>('chat');
    const [input, setInput] = useState('');
    const [isGemMenuOpen, setIsGemMenuOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const gemMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (gemMenuRef.current && !gemMenuRef.current.contains(event.target as Node)) {
                setIsGemMenuOpen(false);
            }
        };
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Sync gems with defaults when panel opens
    useEffect(() => {
        if (isOpen) {
            syncGemsWithDefaults?.();
        }
    }, [isOpen, syncGemsWithDefaults]);

    // Initial state based on props - but we'll use a local state that follows props
    const [userSelectedType, setUserSelectedType] = useState<'campaign' | 'driver' | 'template' | null>(null);

    // Derived state for the actual active type (Priority: Campaign > Driver > Template)
    const selectedUrlType = useMemo(() => {
        if (userSelectedType === 'campaign' && campaignNotebookUrl) return 'campaign';
        if (userSelectedType === 'driver' && driverNotebookUrl) return 'driver';
        if (userSelectedType === 'template' && templateNotebookUrl) return 'template';
        
        if (campaignNotebookUrl) return 'campaign';
        if (driverNotebookUrl) return 'driver';
        return 'template';
    }, [userSelectedType, campaignNotebookUrl, driverNotebookUrl, templateNotebookUrl]);

    const activeNotebookUrl = useMemo(() => {
        if (selectedUrlType === 'campaign') return campaignNotebookUrl;
        if (selectedUrlType === 'driver') return driverNotebookUrl;
        return templateNotebookUrl;
    }, [selectedUrlType, campaignNotebookUrl, driverNotebookUrl, templateNotebookUrl]);
    
    // Memoize notebook ID to avoid recalculating unnecessarily
    const notebookId = useMemo(() => activeNotebookUrl ? extractNotebookId(activeNotebookUrl) : null, [activeNotebookUrl, extractNotebookId]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [key, setKey] = useState(0);

    // Reset load error when key or URL changes - Handled via manual triggers to avoid cascading renders
    const handleSetViewMode = (mode: 'chat' | 'iframe') => {
        if (mode === 'iframe') setLoadError(false);
        setViewMode(mode);
    };

    const availableSources = [
        { type: 'campaign', url: campaignNotebookUrl },
        { type: 'driver', url: driverNotebookUrl },
        { type: 'template', url: templateNotebookUrl }
    ].filter(s => !!s.url);

    const hasMultipleSources = availableSources.length > 1;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isQuerying]);

    // NotebookLM often blocks iframes via X-Frame-Options: DENY
    const isGoogleDomain = activeNotebookUrl?.includes('google.com');

    // Handle iframe timeout with a separate effect
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => {
                setLoadError(true);
                setIsLoading(false);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!isOpen) return null;

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !notebookId || isQuerying) return;

        // Neural Liaison: Inject active clues context to help the AI "read" the session state
        const state = useSessionOSStore.getState();
        const activeCampaignId = state.activeCampaignId;
        const revealedClues = state.clues.filter(c => c.isRevealed && c.campaignId === activeCampaignId);
        const cluesContext = revealedClues.length > 0 
            ? `[LIAISON NEURALE : INDICES RÉVÉLÉS]\n${revealedClues.map(c => `- ${c.title} : ${c.content}`).join('\n')}\n\nMESSAGE DU MJ :\n`
            : '';

        const query = cluesContext + input;
        setInput('');
        try {
            await queryNotebook(notebookId, query);
        } catch (err) {
            console.error("Oracle Query Failed", err);
        }
    };

    const handleReload = () => {
        setKey(prev => prev + 1);
        setIsLoading(true);
        setLoadError(false);
    };

    const handleOpenExternal = () => {
        if (activeNotebookUrl) {
            if (window.appBridge?.openExternal) {
                window.appBridge.openExternal(activeNotebookUrl);
            } else {
                window.open(activeNotebookUrl, '_blank');
            }
        }
    };

    return (
        <>
            {/* Backdrop for easier closing */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[95] animate-in fade-in duration-300 cursor-pointer" 
                    onClick={onClose} 
                />
            )}

            <aside 
                className={`fixed inset-y-0 right-0 w-[650px] max-w-full glass-bento border-l border-cyan-500/20 shadow-2xl z-[100] transform transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
                {/* Header */}
                <header className="h-20 border-b border-app-border/40 bg-app-bg/95 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 relative shadow-lg z-10 transition-all gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-shrink">
                        {/* Compact Close Button */}
                        <button 
                            onClick={onClose}
                            className="group p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all shadow-lg active:scale-95 shrink-0"
                            title="Fermer l'Oracle (Echap)"
                        >
                            <X size={18} className="transition-transform group-hover:rotate-90" />
                        </button>

                        <div className="w-px h-6 bg-app-border/40 mx-1 shrink-0"></div>

                        {/* Persona Switcher - Clean Pill Design */}
                        <div className="relative group max-w-[240px] flex-1">
                            <button 
                                onClick={() => setIsGemMenuOpen(!isGemMenuOpen)}
                                className={`w-full flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all border ${
                                    isGemMenuOpen 
                                        ? 'bg-cyan-500/20 border-cyan-400/40 shadow-glow-accent/20' 
                                        : 'bg-white/5 border-white/5 hover:border-cyan-500/30 hover:bg-white/10'
                                }`}
                            >
                                <div className={`p-2 rounded-xl transition-colors shadow-inner ${
                                    isQuerying ? 'bg-accent/20 border-accent animate-pulse' : 'bg-app-bg border-white/5'
                                } border shrink-0`}>
                                    <GemIcon size={18} className={isQuerying ? 'text-accent' : 'text-accent/80'} />
                                </div>
                                
                                <div className="text-left flex-1 min-w-0">
                                    <div className="text-[9px] font-black text-accent/40 uppercase tracking-[0.15em] leading-none mb-1">
                                        Persona
                                    </div>
                                    <div className="flex items-center gap-1.5 leading-tight">
                                        <h2 className="text-app-text font-black text-xs tracking-tight truncate">
                                            {activeGem?.name || 'AI Oracle'}
                                        </h2>
                                        <ChevronDown size={11} className={`text-accent/30 transition-transform duration-300 ${isGemMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </button>

                            {/* Gem Selection Menu */}
                            {isGemMenuOpen && (
                                <div 
                                    ref={gemMenuRef}
                                    className="absolute top-[calc(100%+12px)] left-0 w-80 bg-app-surface/98 backdrop-blur-2xl border border-accent/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                >
                                    <div className="p-4 bg-accent/5 border-b border-accent/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Changer de Persona</span>
                                        <Sparkles size={12} className="text-accent/40" />
                                    </div>
                                    <div className="p-2 grid grid-cols-1 gap-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {gems.map((gem) => {
                                            const Icon = iconMap[gem.icon] || Sparkles;
                                            const isActive = gem.id === activeGemId;
                                            const hasDriverOverride = !!activeDriver?.aiPersonas?.[gem.id];

                                            return (
                                                <button
                                                    key={gem.id}
                                                    onClick={() => {
                                                        setActiveGemId(gem.id);
                                                        setIsGemMenuOpen(false);
                                                    }}
                                                    className={`flex items-start gap-3 p-3 rounded-xl transition-all group relative border ${
                                                        isActive 
                                                            ? 'bg-accent border-accent text-app-bg shadow-glow-accent/20' 
                                                            : 'bg-transparent border-transparent hover:bg-accent/10 text-app-text/60 hover:text-app-text hover:border-accent/20'
                                                    }`}
                                                >
                                                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-app-bg/20' : 'bg-app-bg border border-white/5'}`}>
                                                        <Icon size={16} className={isActive ? 'text-app-bg' : 'text-accent'} />
                                                    </div>
                                                    <div className="text-left pr-4 min-w-0 flex-1">
                                                        <div className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                                                            {gem.name}
                                                            {hasDriverOverride && (
                                                                <div 
                                                                    className={`px-1.5 py-0.5 rounded text-[7px] font-black border ${isActive ? 'bg-app-bg/20 border-white/20 text-white' : 'bg-accent/10 border-accent/20 text-accent'}`}
                                                                    title="Synchronisé avec le système"
                                                                >
                                                                    SYNC
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`text-[9px] font-medium leading-tight line-clamp-2 mt-0.5 ${isActive ? 'text-app-bg/80' : 'text-app-text/40'}`}>
                                                            {gem.description}
                                                        </div>
                                                    </div>
                                                    {isActive && (
                                                        <div className="absolute top-1/2 -translate-y-1/2 right-3 w-1.5 h-1.5 bg-app-bg rounded-full" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side Actions Group */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-4">
                        {/* View Controls Group */}
                        <div className="flex items-center bg-app-surface/60 rounded-xl p-1 border border-white/5">
                            <div className="flex p-0.5 gap-1">
                                <button
                                    onClick={() => handleSetViewMode('chat')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'chat' ? 'bg-accent text-app-bg shadow-lg' : 'text-app-text/40 hover:text-app-text/60 hover:bg-white/5'}`}
                                    title="Mode Discussion"
                                >
                                    <MessageSquare size={16} />
                                </button>
                                <button
                                    onClick={() => handleSetViewMode('iframe')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'iframe' ? 'bg-accent text-app-bg shadow-lg' : 'text-app-text/40 hover:text-app-text/60 hover:bg-white/5'}`}
                                    title="Voir la Source (NotebookLM)"
                                >
                                    <Book size={16} />
                                </button>
                            </div>
                            
                            <div className="w-px h-4 bg-app-border mx-1 opacity-50"></div>

                            {viewMode === 'iframe' && (
                                <button 
                                    onClick={handleReload}
                                    className="p-2 text-app-text/40 hover:text-accent transition-all animate-in fade-in duration-300"
                                    title="Actualiser la source"
                                >
                                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                </button>
                            )}

                            {viewMode === 'chat' && (
                                <button 
                                    onClick={clearChat}
                                    className="p-2 text-app-text/40 hover:text-red-400 transition-all animate-in fade-in duration-300"
                                    title="Vider la discussion"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        {/* Source Toggle Group */}
                        {hasMultipleSources && (
                            <div className="flex bg-app-surface/60 rounded-xl p-1 border border-white/5">
                                {availableSources.map(source => (
                                    <button
                                        key={source.type}
                                        onClick={() => setUserSelectedType(source.type as 'campaign' | 'driver' | 'template')}
                                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                            selectedUrlType === source.type 
                                                ? 'bg-accent text-app-bg shadow-glow-accent/20' 
                                                : 'text-app-text/40 hover:text-app-text/60'
                                        }`}
                                        title={`Source : ${source.type === 'campaign' ? 'Campagne' : source.type === 'driver' ? 'Système (Règles)' : 'Template UI'}`}
                                    >
                                        {source.type === 'campaign' ? 'CAMP' : 'SYS'}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="w-px h-6 bg-app-border mx-1 opacity-50 mr-1"></div>

                        <button 
                            onClick={handleOpenExternal}
                            className="p-2.5 text-accent bg-accent/5 hover:bg-accent text-accent hover:text-app-bg border border-accent/20 rounded-xl transition-all active:scale-95"
                            title="Ouvrir NotebookLM dans le navigateur"
                        >
                            <ExternalLink size={18} />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 relative bg-app-bg overflow-hidden flex flex-col">
                    {!activeNotebookUrl ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-app-bg/40">
                            <div className="w-16 h-16 rounded-full bg-app-surface flex items-center justify-center mb-6">
                                <Sparkles size={32} className="text-app-text/20" />
                            </div>
                            <h3 className="text-xl font-bold text-app-text mb-2">Aucun Notebook Lié</h3>
                            <p className="text-app-text/40 text-sm max-w-xs leading-relaxed">
                                Pour utiliser l'Oracle, veuillez ajouter une URL de NotebookLM dans les paramètres de votre campagne ou le template du système.
                            </p>
                        </div>
                    ) : viewMode === 'chat' ? (
                        /* CHAT MODE UI */
                        <>
                            <div 
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
                            >
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                                        <div className="w-20 h-20 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-center mb-6">
                                            <GemIcon size={40} className="text-accent" />
                                        </div>
                                        <h4 className="text-lg font-bold mb-2">Consultation : {activeGem?.name}</h4>
                                        <p className="text-sm max-w-xs">{activeGem?.description || "Posez vos questions sur les règles ou l'univers."}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                                    className={`glass-bento flex gap-4 p-4 transition-all !rounded-2xl ${
                                                        msg.role === 'assistant' 
                                                            ? 'bg-accent/5 border-accent/10' 
                                                            : 'bg-white/5 border-white/5'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'assistant' ? 'bg-accent text-app-bg' : 'bg-app-surface text-app-text/40'}`}>
                                                        {msg.role === 'assistant' ? <GemIcon size={18} /> : <User size={18} />}
                                                    </div>
                                                    <div className="space-y-1 overflow-hidden flex-1">
                                                        <p className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'assistant' ? 'text-accent' : 'text-app-text/20'}`}>
                                                            {msg.role === 'assistant' ? activeGem?.name : 'Maître du Jeu'}
                                                        </p>
                                                        <div className="text-sm leading-relaxed text-app-text/80 whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                                {isQuerying && (
                                    <div className="flex gap-4 animate-pulse">
                                        <div className="w-8 h-8 rounded-lg bg-accent text-app-bg flex items-center justify-center shrink-0">
                                            <RefreshCw size={18} className="animate-spin" />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-2 w-24 bg-accent/20 rounded"></div>
                                            <div className="h-4 bg-accent/10 rounded w-full"></div>
                                            <div className="h-4 bg-accent/10 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area (Bento Style) */}
                            <div className="p-6 border-t border-app-border/40 bg-app-surface/20 shrink-0">
                                <form 
                                    onSubmit={handleSendMessage}
                                    className="relative group glass-bento !rounded-3xl p-1"
                                >
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Écrivez votre question ici..."
                                        rows={3}
                                        className="w-full bg-app-bg/40 backdrop-blur-md border-none rounded-[1.4rem] py-4 pl-4 pr-14 text-sm focus:outline-none transition-all resize-none font-medium custom-scrollbar"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isQuerying}
                                        className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${!input.trim() || isQuerying ? 'text-app-text/20 bg-app-surface' : 'bg-accent text-app-bg shadow-glow-accent/20 hover:scale-105 active:scale-95'}`}
                                        title="Envoyer la question"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                                <p className="mt-3 text-[9px] text-app-text/30 font-mono text-center uppercase tracking-widest">
                                    {isQuerying ? 'Flux Neural : ACTIF' : `Connecté au Notebook : ${notebookId?.slice(0, 8) || 'AUCUN'}...`}
                                </p>
                            </div>
                        </>
                    ) : (
                        /* IFRAME MODE UI */
                        <div className="flex-1 relative">
                            {isLoading && !loadError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-app-bg z-10">
                                    <RefreshCw className="animate-spin text-accent mb-4" size={32} />
                                    <p className="text-accent/50 text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">Établissement de la Liaison Neurale...</p>
                                </div>
                            )}
                            
                            {(loadError || isGoogleDomain) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-app-bg/90 z-20 backdrop-blur-sm">
                                    <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                        <ExternalLink size={36} className="text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-app-text mb-4">Restriction de Sécurité</h3>
                                    <p className="text-app-text/80 text-sm leading-relaxed mb-8 max-w-sm">
                                        Google interdit l'intégration de NotebookLM pour des raisons de sécurité. La source de l'Oracle doit être consultée dans une fenêtre dédiée.
                                    </p>
                                    <button 
                                        onClick={handleOpenExternal}
                                        className="px-8 py-3 bg-accent text-app-bg rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-glow-accent/20 flex items-center gap-3"
                                    >
                                        OUVRIR LA FENÊTRE SOURCE <ExternalLink size={18} />
                                    </button>
                                    <div className="mt-8 flex flex-col items-center gap-2">
                                        <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">Projet Recommandé :</p>
                                        <button 
                                            onClick={() => setViewMode('chat')}
                                            className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                                        >
                                            Utiliser le Chat Intégré (MCP) <Sparkles size={10} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <iframe
                                key={`${key}-${activeNotebookUrl}`}
                                src={isGoogleDomain ? 'about:blank' : activeNotebookUrl}
                                className={`w-full h-full border-none transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={() => setIsLoading(false)}
                                title="NotebookLM Oracle"
                                allow="clipboard-read; clipboard-write; microphone"
                            />
                        </div>
                    )}
                </div>

                {/* Status Footer */}
                <footer className="h-10 border-t border-app-border bg-app-bg px-4 flex items-center justify-between text-[10px] font-mono text-app-text/40 uppercase tracking-widest shrink-0">
                    <span>Nœud d'IA Intégré</span>
                    <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${activeNotebookUrl ? 'bg-emerald-500' : 'bg-app-surface'}`}></span>
                        {activeNotebookUrl ? 'Pont MCP : EN LIGNE' : 'En attente de connexion'}
                    </span>
                </footer>
            </aside>
        </>
    );
};

export default OraclePanel;
