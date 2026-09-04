import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useObsidianStore } from '../useObsidianStore';
import type { NoteEntry } from '../useObsidianStore';
import { 
    Folder, 
    FileText, 
    ChevronRight, 
    ChevronDown, 
    Search, 
    RefreshCw, 
    Share2, 
    ExternalLink,
    AlertCircle,
    Info,
    Sparkles
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';

const ObsidianPanel: React.FC = () => {
    const { 
        notes, 
        fetchNotes, 
        selectNote, 
        activeNotePath, 
        activeNoteContent, 
        isLoading, 
        error, 
        syncActiveNoteToOracle 
    } = useObsidianStore();

    const { campaigns, activeCampaignId } = useSessionOSStore();
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    // Try to find a notebook URL in the active campaign
    const notebookUrl = activeCampaign?.notebookUrl;

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const toggleFolder = (path: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        setExpandedFolders(newSet);
    };

    const handleSync = async () => {
        if (!notebookUrl || !activeNotePath) return;
        
        // Extract notebook ID from URL
        const match = notebookUrl.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
        const notebookId = match ? match[0] : null;

        if (!notebookId) {
            setSyncStatus('error');
            return;
        }

        setSyncStatus('syncing');
        const success = await syncActiveNoteToOracle(notebookId);
        setSyncStatus(success ? 'success' : 'error');
        
        if (success) {
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    const renderTree = (items: NoteEntry[], level = 0) => {
        return items
            .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (item.type === 'directory' && item.children))
            .map(item => {
                const isExpanded = expandedFolders.has(item.path);
                const isActive = activeNotePath === item.path;

                if (item.type === 'directory') {
                    return (
                        <div key={item.path} style={{ paddingLeft: `${level * 12}px` }}>
                            <button 
                                onClick={() => toggleFolder(item.path)}
                                className="w-full flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg text-app-text/60 transition-all text-xs"
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <Folder size={14} className="text-yellow-500/60" />
                                <span className="truncate">{item.name}</span>
                            </button>
                            {isExpanded && item.children && renderTree(item.children, level + 1)}
                        </div>
                    );
                }

                return (
                    <div key={item.path} style={{ paddingLeft: `${level * 12 + 20}px` }}>
                        <button 
                            onClick={() => selectNote(item.path)}
                            className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-all text-xs ${
                                isActive 
                                ? 'bg-accent/20 text-accent border border-accent/30' 
                                : 'text-app-text/40 hover:bg-white/5 hover:text-app-text/80'
                            }`}
                        >
                            <FileText size={14} className={isActive ? 'text-accent' : 'text-app-text/20'} />
                            <span className="truncate">{item.name.replace('.md', '')}</span>
                        </button>
                    </div>
                );
            });
    };

    return (
        <div className="flex h-full bg-app-bg/20 overflow-hidden">
            {/* Sidebar: Explorer */}
            <div className="w-72 border-r border-app-border flex flex-col bg-app-surface/10">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 border border-purple-500/30">
                                <Sparkles size={14} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-app-text/60">Obsidian vault</span>
                        </div>
                        <button 
                            onClick={() => fetchNotes()}
                            className="p-1.5 text-app-text/20 hover:text-app-text/60 hover:bg-white/5 rounded-lg transition-all"
                            title="Actualiser"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20" />
                        <input
                            type="text"
                            placeholder="Chercher une note..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-app-bg/40 border border-app-border rounded-xl pl-9 pr-4 py-2 text-xs text-app-text focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
                    {error ? (
                        <div className="p-4 text-center space-y-2">
                            <AlertCircle size={24} className="mx-auto text-rose-500/40" />
                            <p className="text-[10px] text-rose-500/60 uppercase font-bold">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {renderTree(notes)}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-app-bg/10">
                {activeNotePath ? (
                    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-app-border/40">
                            <div>
                                <h1 className="text-3xl font-black text-app-text tracking-tight flex items-center gap-3">
                                    {activeNotePath.split('\\').pop()?.replace('.md', '')}
                                </h1>
                                <p className="text-[10px] font-bold text-app-text/20 uppercase tracking-widest mt-1">
                                    {activeNotePath.replace(/\\/g, ' > ')}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleSync}
                                    disabled={!notebookUrl || syncStatus === 'syncing'}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        syncStatus === 'success' 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                        : syncStatus === 'error'
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        : 'bg-accent text-app-bg shadow-glow-accent/20 hover:opacity-90 disabled:opacity-30'
                                    }`}
                                >
                                    {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <Share2 size={14} />}
                                    {syncStatus === 'success' ? 'Envoyée' : syncStatus === 'error' ? 'Échec' : 'Envoyer au carnet'}
                                </button>
                                <button 
                                    onClick={() => window.appBridge?.web?.openExternal?.(`obsidian://open?vault=${encodeURIComponent('Obsidian Vault')}&file=${encodeURIComponent(activeNotePath)}`)}
                                    className="p-2.5 bg-app-surface border border-app-border rounded-xl text-app-text/40 hover:text-accent transition-all"
                                    title="Ouvrir dans Obsidian"
                                >
                                    <ExternalLink size={18} />
                                </button>
                            </div>
                        </div>

                        {isLoading && !activeNoteContent ? (
                            <div className="flex items-center justify-center h-64">
                                <RefreshCw size={32} className="animate-spin text-accent/20" />
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-emerald max-w-none prose-p:text-app-text/80 prose-p:leading-relaxed prose-p:text-base prose-p:font-sans">
                                <ReactMarkdown>
                                    {activeNoteContent || "Cette note semble vide."}
                                </ReactMarkdown>
                            </div>
                        )}

                        <div className="mt-12 p-4 bg-app-surface/40 border border-app-border rounded-2xl flex gap-4 items-start">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Info size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-app-text">Note en lecture seule</h4>
                                <p className="text-[10px] text-app-text/40 mt-1 leading-relaxed">
                                    GM-OS affiche vos notes Obsidian en temps réel. Pour modifier ce contenu, utilisez l'application Obsidian. 
                                    Envoie cette note comme source dans votre carnet NotebookLM, pour la Forge de campagne. Pour que l'Oracle lise vos notes en séance, branchez le coffre dans les réglages IA.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-app-text/10 gap-6">
                        <div className="w-24 h-24 bg-purple-500/5 rounded-3xl border border-purple-500/10 flex items-center justify-center">
                            <Sparkles size={48} strokeWidth={1} className="text-purple-500/20" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-sm tracking-[0.2em] uppercase text-app-text/30">Select a note to begin</p>
                            <p className="text-[10px] opacity-20 mt-2 uppercase tracking-[0.3em]">Votre savoir d'Obsidian, au service de vos parties</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ObsidianPanel;
