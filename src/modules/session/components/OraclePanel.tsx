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
            className={`fixed inset-y-0 right-0 w-[500px] bg-slate-900 border-l border-gm-gold/30 shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Header */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-gm-gold">
                    <Sparkles size={24} className="animate-pulse" />
                    <h2 className="text-slate-100 font-bold tracking-tight">AI Oracle <span className="text-gm-gold/70 text-xs font-light ml-2">NotebookLM</span></h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleReload}
                        className="p-2 text-slate-400 hover:text-gm-gold hover:bg-slate-800 rounded-lg transition-all"
                        title="Reload"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {hasBoth && (
                        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-white/5">
                            <button
                                onClick={() => setSelectedUrlType('template')}
                                className={`px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${selectedUrlType === 'template' ? 'bg-gm-gold text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Système
                            </button>
                            <button
                                onClick={() => setSelectedUrlType('campaign')}
                                className={`px-2 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${selectedUrlType === 'campaign' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Campagne
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={handleOpenExternal}
                        className="p-2 text-gm-gold bg-gm-gold/10 hover:bg-gm-gold/20 border border-gm-gold/30 rounded-lg transition-all"
                        title="Open in Browser"
                    >
                        <ExternalLink size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-800 mx-1"></div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 relative bg-slate-950 overflow-hidden">
                {!activeNotebookUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/40">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                            <Sparkles size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-100 mb-2">No Notebook Linked</h3>
                        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                            To use the Oracle, please add a NotebookLM URL in your campaign settings or system template.
                        </p>
                    </div>
                ) : (
                    <>
                        {isLoading && !loadError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                                <RefreshCw className="animate-spin text-gm-gold mb-4" size={32} />
                                <p className="text-gm-gold/50 text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">Establishing Neural Link...</p>
                            </div>
                        )}
                        
                        {(loadError || isGoogleDomain) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-900/90 z-20 backdrop-blur-sm">
                                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                                    <ExternalLink size={36} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-100 mb-4">Security Restriction</h3>
                                <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-sm">
                                    Google prohibits embedding NotebookLM for security reasons. The Oracle must be consulted in a dedicated window.
                                </p>
                                <button 
                                    onClick={handleOpenExternal}
                                    className="px-8 py-3 bg-gm-gold text-slate-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_-5px_rgba(234,179,8,0.4)] flex items-center gap-3"
                                >
                                    OPEN CONJURATION WINDOW <ExternalLink size={18} />
                                </button>
                                <p className="mt-8 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
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
            <footer className="h-10 border-t border-slate-800 bg-slate-900 px-4 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <span>Integrated AI Node</span>
                <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${activeNotebookUrl ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                    {activeNotebookUrl ? 'Session Linked' : 'Awaiting Connection'}
                </span>
            </footer>
        </aside>
    );
};

export default OraclePanel;
