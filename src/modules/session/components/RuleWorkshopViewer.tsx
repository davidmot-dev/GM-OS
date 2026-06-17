import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { 
    Search, BookOpen, Brain, History, Scroll, 
    Zap, Sparkles, FileText, X, ChevronRight,
    SearchX, Loader2, Plus, Globe, Edit2, Hammer, CheckCircle2, Layers
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';

import type { DocEntry } from '../../ai/RAGService';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { gmToast } from '../../../stores/useToastStore';
import { obsidianExportService } from '../ObsidianExportService';

interface RuleCard {
    id: string;
    title: string;
    category: 'rule' | 'memory' | 'scenario' | 'decision';
    summary: string;
    content: string;
    path: string;
    tags: string[];
}

export const RuleWorkshopViewer: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { activeCampaignId, campaigns, customGameDrivers } = useSessionOSStore();
    
    const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
    const systemId = activeCampaign?.system || 'generic';
    const allDrivers = [...DEFAULT_GAME_DRIVERS, ...customGameDrivers];
    const driver = allDrivers.find(d => d.id === systemId);
    let baseDir = driver?.ragPath?.trim().replace(/\\/g, '/') || `systems/${systemId}/rules`;
    // Remove leading and trailing slashes for consistency
    const ragPath = baseDir.replace(/^\/+|\/+$/g, '');

    const [allDocs, setAllDocs] = useState<DocEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'rule' | 'memory' | 'scenario'>('all');
    const [selectedCard, setSelectedCard] = useState<RuleCard | null>(null);
    const [readingContent, setReadingContent] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);
    
    // Editor States
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editPath, setEditPath] = useState<string | null>(null);

    // Initial load of documents
    const loadDocs = React.useCallback(async () => {
        if (!window.appBridge?.ai?.listDocs) {
            console.error("Bridge listDocs not available");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const docs = await window.appBridge.ai.listDocs();
            
            // Helper to normalize path separators for comparison
            const normalizePath = (p: string) => p.replace(/\\/g, '/').toLowerCase().trim().replace(/^\/+|\/+$/g, '');

            const findTargetDir = (items: DocEntry[], targetPath: string): DocEntry[] => {
                const normalizedSearch = normalizePath(targetPath);
                if (!normalizedSearch || normalizedSearch === '.' || normalizedSearch === './') return items;

                // 1. Exact path match
                for (const item of items) {
                    if (item.type === 'directory') {
                        const normalizedItemPath = normalizePath(item.path);
                        if (normalizedItemPath === normalizedSearch) {
                            console.log(`[RuleWorkshop] Exact directory match found: ${item.path}`);
                            return item.children || [];
                        }
                    }
                }

                // 2. Segment-by-segment recursive search
                const segments = normalizedSearch.split('/').filter(s => s.length > 0);
                const findRecursive = (entries: DocEntry[], searchSegments: string[]): DocEntry[] => {
                    if (searchSegments.length === 0) return entries;
                    
                    const [current, ...remaining] = searchSegments;
                    const match = entries.find(e => e.name.toLowerCase() === current && e.type === 'directory');
                    
                    if (match) {
                        if (remaining.length === 0) return match.children || [];
                        return findRecursive(match.children || [], remaining);
                    }
                    return [];
                };

                return findRecursive(items, segments);
            };

            const rulesDocs = findTargetDir(docs, baseDir);
            console.log(`[RuleWorkshop] Path resolution for "${baseDir}": found ${rulesDocs.length} items.`);
            setAllDocs(rulesDocs);
        } catch (err) {
            console.error("Error loading rule documents:", err);
        } finally {
            setLoading(false);
        }
    }, [baseDir]);

    useEffect(() => {
        loadDocs();
    }, [loadDocs, isEditing]); // Trigger on path change or when closing editor

    // Parse files to extract metadata (mocking extraction since we don't have frontmatter parsing yet)
    // In a real app, we'd read the first few lines to get the title/category
    const filteredDocs = useMemo(() => {
        return allDocs.filter(doc => {
            if (doc.type !== 'file') return false;
            
            const name = doc.name.toLowerCase();
            const matchesSearch = name.includes(searchTerm.toLowerCase());
            
            // Implement category filtering based on filename or content patterns
            // In GM-OS, Forge-generated rules often have specific prefixes or keywords
            let matchesFilter = true;
            if (activeFilter !== 'all') {
                if (activeFilter === 'rule') {
                    // For example, Forge rules often contain 'rule' or specific markers
                    matchesFilter = name.includes('rule') || name.includes('regle') || true; // Fallback to true if we don't have metadata yet
                } else if (activeFilter === 'memory') {
                    matchesFilter = name.includes('memory') || name.includes('souvenir') || name.includes('lore');
                } else if (activeFilter === 'scenario') {
                    matchesFilter = name.includes('scenario') || name.includes('intrigue');
                }
            }
            
            return matchesSearch && matchesFilter;
        });
    }, [allDocs, searchTerm, activeFilter]);

    const handleReadCard = async (doc: DocEntry) => {
        setIsReading(true);
        try {
            const content = await window.appBridge?.ai?.readDoc?.(doc.path);
            if (content) {
                setReadingContent(content);
                // Extract title (first # header)
                const titleMatch = content.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : doc.name.replace('.md', '');
                
                setSelectedCard({
                    id: doc.name,
                    title,
                    category: 'rule', // Fallback
                    summary: '',
                    content,
                    path: doc.path,
                    tags: []
                });
            }
        } catch (err) {
            console.error("Error reading doc:", err);
        }
    };
    
    const handleShareRule = () => {
        if (!selectedCard) return;
        
        const payload = {
            title: selectedCard.title,
            content: selectedCard.content,
            category: selectedCard.category || 'rule'
        };

        if (window.appBridge?.send) {
            // Diffusion via le bridge pour l'affichage en Popup (Tablettes, Joueurs)
            window.appBridge.send('remote:broadcast-ui-action', { 
                type: 'session:display-rule', 
                payload: payload 
            });

            // Envoi également d'un message court pour l'historique du chat
            const msg = {
                id: `rule-msg-${Date.now()}`,
                fromId: 'GM',
                fromName: 'MJ',
                toId: 'all',
                toName: 'Tous',
                content: `📜 **RÈGLE PARTAGÉE : ${selectedCard.title}** (Affichée sur votre écran)`,
                timestamp: Date.now(),
                isRead: false
            };

            window.appBridge.send('remote:broadcast-ui-action', { 
                type: 'session:receive-message', 
                payload: msg 
            });
        }
        
        // Notification locale
        gmToast(`Règle "${selectedCard.title}" partagée aux joueurs.`, 'success');
    };

    const handleExportToObsidian = async () => {
        if (!selectedCard || !readingContent) return;
        
        try {
            const result = await obsidianExportService.exportRule(
                selectedCard.title,
                readingContent,
                selectedCard.category,
                selectedCard.tags
            );
            
            if (result.success) {
                gmToast(result.message, 'success');
            } else {
                gmToast(result.message, 'error');
            }
        } catch (err) {
            console.error("Obsidian Export Error:", err);
            gmToast("Erreur lors de l'export vers Obsidian.", 'error');
        }
    };

    const handleCreateNew = () => {
        setEditTitle('Nouvelle Règle');
        setEditContent('# Nouvelle Règle\n\nÉcrivez votre contenu ici...');
        setEditPath(null);
        setIsEditing(true);
        setIsReading(false);
    };

    const handleEditCurrent = () => {
        if (!selectedCard || !readingContent) return;
        setEditTitle(selectedCard.title);
        setEditContent(readingContent);
        setEditPath(selectedCard.path);
        setIsEditing(true);
        setIsReading(false);
    };

    const handleSaveRule = async () => {
        if (!editTitle.trim()) {
            gmToast("Le titre est obligatoire.", 'error');
            return;
        }

        try {
            // If path is null, it's a new file. Use baseDir + title.md
            const fileName = `${editTitle.replace(/[<>:"/\\|?*]/g, '')}.md`;
            const finalPath = editPath || `${ragPath}/${fileName}`;
            
            const success = await window.appBridge?.ai?.writeDoc?.(finalPath, editContent);
            
            if (success) {
                gmToast(t('modules:session.forge_module.workshop_viewer.save_success'), 'success');
                setIsEditing(false);
                loadDocs(); // Refresh list
            } else {
                gmToast(t('modules:session.forge_module.workshop_viewer.save_error'), 'error');
            }
        } catch (err) {
            console.error("Save Error:", err);
            gmToast(t('modules:session.forge_module.workshop_viewer.critical_save_error'), 'error');
        }
    };

    const filters = [
        { id: 'all', label: t('modules:session.forge_module.workshop_viewer.filter_all'), icon: BookOpen },
        { id: 'rule', label: t('modules:session.forge_module.workshop_viewer.filter_rules'), icon: Zap },
        { id: 'memory', label: t('modules:session.forge_module.workshop_viewer.filter_memories'), icon: Brain },
        { id: 'scenario', label: t('modules:session.forge_module.workshop_viewer.filter_scenarios'), icon: Scroll },
    ];

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-app-text/40">
                <Loader2 size={48} className="animate-spin mb-4 text-accent" />
                <p className="font-black uppercase tracking-[0.2em]">{t('modules:session.forge_module.workshop_viewer.syncing')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within:text-accent transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder={t('modules:session.forge_module.workshop_viewer.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-app-bg/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold w-80 focus:ring-2 focus:ring-accent/20 focus:border-accent/40 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl border border-white/5">
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id as any)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                    activeFilter === f.id 
                                        ? 'bg-accent text-white shadow-glow-accent/20' 
                                        : 'text-app-text/40 hover:text-app-text/60 hover:bg-white/5'
                                }`}
                            >
                                <f.icon size={14} />
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleCreateNew}
                        className="px-6 py-3 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Plus size={16} />
                        {t('modules:session.forge_module.workshop_viewer.create_button')}
                    </button>
                    <div className="h-8 w-[1px] bg-white/10 mx-2" />
                    <span className="text-[10px] font-black text-app-text/20 uppercase tracking-widest">
                        {t('modules:session.forge_module.workshop_viewer.available_files', { count: filteredDocs.length })}
                    </span>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {filteredDocs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-app-text/20 border-2 border-dashed border-white/5 rounded-[3rem]">
                        <SearchX size={64} className="mb-6 opacity-20" />
                        <h3 className="text-xl font-black uppercase tracking-widest">{t('modules:session.forge_module.workshop_viewer.no_results_title')}</h3>
                        <p className="text-sm font-bold mt-2">{t('modules:session.forge_module.workshop_viewer.no_results_desc')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredDocs.map((doc) => (
                            <div 
                                key={doc.path}
                                onClick={() => handleReadCard(doc)}
                                className="group glass-bento p-8 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all flex flex-col gap-4 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <FileText size={48} />
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-accent/10 rounded-lg text-accent">
                                        <Scroll size={16} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent/60">
                                        {t('modules:session.forge_module.workshop_viewer.rule_forged')}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold font-display text-white group-hover:text-accent transition-colors truncate">
                                    {doc.name.replace('.md', '')}
                                </h3>
                                
                                <div className="flex-1">
                                    <p className="text-xs text-app-text/40 leading-relaxed line-clamp-3 italic">
                                        {t('modules:session.forge_module.workshop_viewer.ai_generated_desc')}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-app-text/20">
                                    <span>{t('modules:session.forge_module.workshop_viewer.md_version')}</span>
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform group-hover:text-accent" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reading View Overlay */}
            {isReading && selectedCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl h-[90vh] overflow-hidden rounded-[3rem] border border-white/10 bg-[#0c0c14]/95 shadow-2xl flex flex-col">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent rounded-xl shadow-glow-accent/20">
                                    <Zap size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white font-display">
                                        {selectedCard.title}
                                    </h2>
                                    <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                        <Sparkles size={10} /> {t('modules:session.forge_module.workshop_viewer.dynamic_grimoire')} — {systemId}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleExportToObsidian}
                                    className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:border-white/20 transition-all group/obs"
                                    title={t('modules:session.forge_module.workshop_viewer.export_obsidian')}
                                >
                                    <Globe size={24} className="group-hover/obs:scale-110 transition-transform" />
                                </button>
                                <button 
                                    onClick={handleEditCurrent}
                                    className="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-accent hover:border-accent/40 transition-all group/edit"
                                    title={t('modules:session.forge_module.workshop_viewer.edit_rule')}
                                >
                                    <Edit2 size={24} className="group-hover/edit:scale-110 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => setIsReading(false)}
                                    className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"
                                >
                                    <X size={28} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-black/20">
                            <div className="max-w-4xl mx-auto prose prose-invert prose-emerald prose-headings:font-display prose-headings:tracking-tighter prose-p:text-lg prose-p:leading-relaxed prose-strong:text-accent prose-li:text-app-text/80">
                                <ReactMarkdown>
                                    {readingContent || ''}
                                </ReactMarkdown>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 flex justify-end gap-4 bg-white/2">
                            <button 
                                onClick={() => setIsReading(false)}
                                className="px-10 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
                            >
                                {t('modules:session.forge_module.workshop_viewer.close_grimoire')}
                            </button>
                            <button 
                                onClick={handleShareRule}
                                className="px-10 py-3 bg-accent hover:bg-accent/80 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
                            >
                                {t('modules:session.forge_module.workshop_viewer.share_players')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor View Overlay */}
            {isEditing && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/60 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
                    <div className="relative w-full h-[95vh] overflow-hidden rounded-[3rem] border border-white/10 bg-[#08080c] shadow-2xl flex flex-col">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-accent/20 text-accent rounded-2xl border border-accent/20">
                                    <Hammer size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <input 
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="bg-transparent text-2xl font-black uppercase tracking-tight text-white font-display border-none outline-none focus:ring-0 placeholder:text-white/10"
                                        placeholder={t('modules:session.forge_module.workshop_viewer.rule_title_placeholder')}
                                    />
                                    <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-1">
                                        {t('modules:session.forge_module.workshop_viewer.grimoire_edition')} — {systemId}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="px-8 py-3 text-app-text/40 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
                                >
                                    {t('modules:session.forge_module.workshop_viewer.cancel')}
                                </button>
                                <button 
                                    onClick={handleSaveRule}
                                    className="px-10 py-3 bg-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-glow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <CheckCircle2 size={18} />
                                    {t('modules:session.forge_module.workshop_viewer.save')}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Editor Pane */}
                            <div className="flex-1 border-r border-white/5 flex flex-col">
                                <div className="px-8 py-3 bg-white/2 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{t('modules:session.forge_module.workshop_viewer.markdown_editor')}</span>
                                    <div className="flex gap-4 opacity-20">
                                        <History size={14} />
                                        <Layers size={14} />
                                    </div>
                                </div>
                                <textarea 
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="flex-1 bg-transparent p-12 text-lg font-mono text-app-text/80 leading-relaxed outline-none border-none focus:ring-0 resize-none custom-scrollbar"
                                    placeholder={t('modules:session.forge_module.workshop_viewer.editor_placeholder')}
                                />
                            </div>

                            {/* Preview Pane */}
                            <div className="flex-1 bg-black/40 flex flex-col">
                                <div className="px-8 py-3 bg-white/2 border-b border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">{t('modules:session.forge_module.workshop_viewer.dynamic_render')}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                                    <div className="max-w-3xl mx-auto prose prose-invert prose-emerald prose-p:text-lg prose-headings:font-display prose-headings:tracking-tighter">
                                        <ReactMarkdown>
                                            {editContent}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RuleWorkshopViewer;
