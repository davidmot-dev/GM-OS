import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, X, ExternalLink, RefreshCw, Send, MessageSquare, Book, Bot, User, Trash2 } from 'lucide-react';
import { useNotebookLM } from '../hooks/useNotebookLM';

interface OraclePanelProps {
    isOpen: boolean;
    onClose: () => void;
    campaignNotebookUrl?: string;
    templateNotebookUrl?: string;
}

const OraclePanel: React.FC<OraclePanelProps> = ({ isOpen, onClose, campaignNotebookUrl, templateNotebookUrl }) => {
    const { messages, isQuerying, queryNotebook, extractNotebookId, clearChat } = useNotebookLM();
    const [viewMode, setViewMode] = useState<'chat' | 'iframe'>('chat');
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Synchronize selection with props
    const [selectedUrlType, setSelectedUrlType] = useState<'campaign' | 'template'>(
        campaignNotebookUrl ? 'campaign' : 'template'
    );

    // Update selection type when URLs change, but outside of render if possible
    // Using a simple effect but with guard
    useEffect(() => {
        if (!campaignNotebookUrl && templateNotebookUrl && selectedUrlType !== 'template') {
            setSelectedUrlType('template');
        } else if (campaignNotebookUrl && !templateNotebookUrl && selectedUrlType !== 'campaign') {
            setSelectedUrlType('campaign');
        }
    }, [campaignNotebookUrl, templateNotebookUrl]);

    const activeNotebookUrl = selectedUrlType === 'campaign' ? campaignNotebookUrl : templateNotebookUrl;
    
    // Memoize notebook ID to avoid recalculating unnecessarily
    const notebookId = useMemo(() => activeNotebookUrl ? extractNotebookId(activeNotebookUrl) : null, [activeNotebookUrl, extractNotebookId]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [key, setKey] = useState(0);

    const hasBoth = !!campaignNotebookUrl && !!templateNotebookUrl && campaignNotebookUrl !== templateNotebookUrl;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isQuerying]);

    // NotebookLM often blocks iframes via X-Frame-Options: DENY
    const isGoogleDomain = activeNotebookUrl?.includes('google.com');

    // Handle iframe loading state only in iframe mode to avoid cascading renders
    useEffect(() => {
        if (isOpen && activeNotebookUrl && viewMode === 'iframe') {
            setIsLoading(true);
            setLoadError(false);
            
            const timer = setTimeout(() => {
                setIsLoading(prev => {
                    if (prev) setLoadError(true);
                    return prev;
                });
            }, 7000);
            
            return () => clearTimeout(timer);
        }
    }, [isOpen, activeNotebookUrl, key, viewMode]);

    if (!isOpen) return null;

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !notebookId || isQuerying) return;

        const query = input;
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
        <aside 
            className={`fixed inset-y-0 right-0 w-[500px] bg-app-bg border-l border-accent/30 shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Header */}
            <header className="h-16 border-b border-app-border bg-app-bg/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-accent">
                    <Sparkles size={24} className="animate-pulse" />
                    <h2 className="text-app-text font-bold tracking-tight">AI Oracle <span className="text-accent/70 text-xs font-light ml-2">MCP Native</span></h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex bg-app-surface rounded-lg p-0.5 border border-white/5 mr-2">
                        <button
                            onClick={() => setViewMode('chat')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'chat' ? 'bg-accent text-app-bg shadow-lg' : 'text-app-text/40 hover:text-app-text/60'}`}
                            title="Chat Mode"
                        >
                            <MessageSquare size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('iframe')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'iframe' ? 'bg-accent text-app-bg shadow-lg' : 'text-app-text/40 hover:text-app-text/60'}`}
                            title="Source View"
                        >
                            <Book size={16} />
                        </button>
                    </div>

                    {viewMode === 'iframe' && (
                        <button 
                            onClick={handleReload}
                            className="p-2 text-app-text/40 hover:text-accent hover:bg-app-surface rounded-lg transition-all"
                            title="Reload"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    )}

                    {viewMode === 'chat' && (
                        <button 
                            onClick={clearChat}
                            className="p-2 text-app-text/40 hover:text-red-400 hover:bg-app-surface rounded-lg transition-all"
                            title="Clear History"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    {hasBoth && (
                        <div className="flex bg-app-surface rounded-lg p-0.5 border border-white/5">
                            <button
                                onClick={() => setSelectedUrlType('template')}
                                className={`px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${selectedUrlType === 'template' ? 'bg-accent text-app-bg shadow-lg' : 'text-app-text/40 hover:text-app-text/60'}`}
                            >
                                Système
                            </button>
                            <button
                                onClick={() => setSelectedUrlType('campaign')}
                                className={`px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${selectedUrlType === 'campaign' ? 'bg-blue-500 text-white shadow-lg' : 'text-app-text/40 hover:text-app-text/60'}`}
                            >
                                Campagne
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={handleOpenExternal}
                        className="p-2 text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg transition-all"
                        title="Open in Browser"
                    >
                        <ExternalLink size={18} />
                    </button>
                    <div className="w-px h-6 bg-app-border mx-1"></div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-app-text/40 hover:text-red-400 hover:bg-app-surface rounded-lg transition-all"
                    >
                        <X size={20} />
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
                        <h3 className="text-xl font-bold text-app-text mb-2">No Notebook Linked</h3>
                        <p className="text-app-text/40 text-sm max-w-xs leading-relaxed">
                            To use the Oracle, please add a NotebookLM URL in your campaign settings or system template.
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
                                        <Bot size={40} className="text-accent" />
                                    </div>
                                    <h4 className="text-lg font-bold mb-2">Consultation de l'Oracle</h4>
                                    <p className="text-sm max-w-xs">Posez vos questions sur les règles ou l'univers. Le Savoir de NotebookLM est prêt.</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 ${msg.role === 'assistant' ? 'bg-accent/5 -mx-6 px-6 py-6' : ''}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-accent text-app-bg' : 'bg-app-surface text-app-text/40'}`}>
                                            {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                                        </div>
                                        <div className="space-y-1 overflow-hidden">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'assistant' ? 'text-accent' : 'text-app-text/20'}`}>
                                                {msg.role === 'assistant' ? 'L\'Oracle' : 'Maître du Jeu'}
                                            </p>
                                            <div className="text-sm leading-relaxed text-app-text/80 whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
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

                        {/* Input Area */}
                        <div className="p-6 border-t border-app-border bg-app-surface/20 shrink-0">
                            <form 
                                onSubmit={handleSendMessage}
                                className="relative group"
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
                                    className="w-full bg-app-bg border border-app-border/40 rounded-2xl py-4 pl-4 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all resize-none font-medium custom-scrollbar"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isQuerying}
                                    className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all ${!input.trim() || isQuerying ? 'text-app-text/20 bg-app-surface' : 'bg-accent text-app-bg shadow-glow-accent/20 hover:scale-110 active:scale-95'}`}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <p className="mt-3 text-[9px] text-app-text/30 font-mono text-center uppercase tracking-widest">
                                {isQuerying ? 'Neural Stream: ACTIVE' : `Connected to Notebook: ${notebookId?.slice(0, 8) || 'NONE'}...`}
                            </p>
                        </div>
                    </>
                ) : (
                    /* IFRAME MODE UI */
                    <div className="flex-1 relative">
                        {isLoading && !loadError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-app-bg z-10">
                                <RefreshCw className="animate-spin text-accent mb-4" size={32} />
                                <p className="text-accent/50 text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">Establishing Neural Link...</p>
                            </div>
                        )}
                        
                        {(loadError || isGoogleDomain) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-app-bg/90 z-20 backdrop-blur-sm">
                                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                    <ExternalLink size={36} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-app-text mb-4">Security Restriction</h3>
                                <p className="text-app-text/80 text-sm leading-relaxed mb-8 max-w-sm">
                                    Google prohibits embedding NotebookLM for security reasons. The Oracle source must be viewed in a dedicated window.
                                </p>
                                <button 
                                    onClick={handleOpenExternal}
                                    className="px-8 py-3 bg-accent text-app-bg rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-glow-accent/20 flex items-center gap-3"
                                >
                                    OPEN SOURCE WINDOW <ExternalLink size={18} />
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
                <span>Integrated AI Node</span>
                <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${activeNotebookUrl ? 'bg-emerald-500' : 'bg-app-surface'}`}></span>
                    {activeNotebookUrl ? 'MCP Bridge: ONLINE' : 'Awaiting Connection'}
                </span>
            </footer>
        </aside>
    );
};

export default OraclePanel;
