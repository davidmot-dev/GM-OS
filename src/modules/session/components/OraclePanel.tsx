import React, { useState } from 'react';
import { Sparkles, X, ExternalLink, RefreshCw } from 'lucide-react';

interface OraclePanelProps {
    isOpen: boolean;
    onClose: () => void;
    campaignNotebookUrl?: string;
    templateNotebookUrl?: string;
}

const OraclePanel: React.FC<OraclePanelProps> = ({ isOpen, onClose, campaignNotebookUrl, templateNotebookUrl }) => {
    // Effective URL selection logic
    const [selectedUrlType, setSelectedUrlType] = useState<'campaign' | 'template'>(
        campaignNotebookUrl ? 'campaign' : 'template'
    );

    const activeNotebookUrl = selectedUrlType === 'campaign' ? campaignNotebookUrl : templateNotebookUrl;
    
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [key, setKey] = useState(0);

    const hasBoth = !!campaignNotebookUrl && !!templateNotebookUrl && campaignNotebookUrl !== templateNotebookUrl;

    // Reset selection when props change if needed
    React.useEffect(() => {
        if (!campaignNotebookUrl && templateNotebookUrl) setSelectedUrlType('template');
        if (campaignNotebookUrl && !templateNotebookUrl) setSelectedUrlType('campaign');
    }, [campaignNotebookUrl, templateNotebookUrl]);

    // NotebookLM often blocks iframes via X-Frame-Options: DENY
    const isGoogleDomain = activeNotebookUrl?.includes('google.com');

    React.useEffect(() => {
        if (isOpen && activeNotebookUrl) {
            setIsLoading(true);
            setLoadError(false);
            
            // If it takes more than 7 seconds, it's probably blocked or slow
            const timer = setTimeout(() => {
                setIsLoading(prevLoading => {
                    if (prevLoading) {
                        setLoadError(true);
                    }
                    return prevLoading;
                });
            }, 7000);
            
            return () => clearTimeout(timer);
        }
    }, [isOpen, activeNotebookUrl, key]);

    if (!isOpen) return null;

    const handleReload = () => {
        setKey(prev => prev + 1);
        setIsLoading(true);
        setLoadError(false);
    };

    const handleOpenExternal = () => {
        if (activeNotebookUrl) {
            // Priority to appBridge if available (Electron/Tauri)
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
            <header className="h-16 border-b border-app-border bg-app-bg/90 backdrop-blur-md px-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-accent">
                    <Sparkles size={24} className="animate-pulse" />
                    <h2 className="text-app-text font-bold tracking-tight">AI Oracle <span className="text-accent/70 text-xs font-light ml-2">NotebookLM</span></h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleReload}
                        className="p-2 text-app-text/40 hover:text-accent hover:bg-app-surface rounded-lg transition-all"
                        title="Reload"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
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
            <div className="flex-1 relative bg-app-bg overflow-hidden">
                {!activeNotebookUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-app-bg/40">
                        <div className="w-16 h-16 rounded-full bg-app-surface flex items-center justify-center mb-6">
                            <Sparkles size={32} className="text-app-text/20" />
                        </div>
                        <h3 className="text-xl font-bold text-app-text mb-2">No Notebook Linked</h3>
                        <p className="text-app-text/40 text-sm max-w-xs leading-relaxed">
                            To use the Oracle, please add a NotebookLM URL in your campaign settings or system template.
                        </p>
                    </div>
                ) : (
                    <>
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
                                    Google prohibits embedding NotebookLM for security reasons. The Oracle must be consulted in a dedicated window.
                                </p>
                                <button 
                                    onClick={handleOpenExternal}
                                    className="px-8 py-3 bg-accent text-app-bg rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-glow-accent/20 flex items-center gap-3"
                                >
                                    OPEN CONJURATION WINDOW <ExternalLink size={18} />
                                </button>
                                <p className="mt-8 text-[10px] text-app-text/20 font-mono uppercase tracking-widest">
                                    Integration Node: ACTIVE (Bypassing IFrame)
                                </p>
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
                    </>
                )}
            </div>

            {/* Status Footer */}
            <footer className="h-10 border-t border-app-border bg-app-bg px-4 flex items-center justify-between text-[10px] font-mono text-app-text/40 uppercase tracking-widest">
                <span>Integrated AI Node</span>
                <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${activeNotebookUrl ? 'bg-emerald-500' : 'bg-app-surface'}`}></span>
                    {activeNotebookUrl ? 'Session Linked' : 'Awaiting Connection'}
                </span>
            </footer>
        </aside>
    );
};

export default OraclePanel;
