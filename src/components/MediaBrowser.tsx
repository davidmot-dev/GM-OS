import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMediaStore } from '../stores/useMediaStore';
import type { MediaType, MediaItem } from '../stores/useMediaStore';
import { Search, Image as ImageIcon, Music, Film, UploadCloud, Trash2, X, Check, FileText, Tag, Plus, Edit2, Users, Clock, ShieldAlert, ArrowDownAZ, ChevronDown, ListFilter, Folder, Lock } from 'lucide-react';
import { gmPrompt } from '../stores/useModalStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';

const TYPE_ICONS: Record<string, React.ReactNode> = {
    'image': <ImageIcon size={14} className="text-blue-400" />,
    'audio': <Music size={14} className="text-amber-400" />,
    'video': <Film size={14} className="text-purple-400" />,
    'document': <FileText size={14} className="text-emerald-400" />,
};

interface MediaBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mediaId: string) => void;
    allowedTypes?: MediaType[]; 
    title?: string;
}

import { MediaItemThumbnail } from '../modules/image/components/MediaItemThumbnail';
import { FullScreenPreview } from '../modules/image/components/FullScreenPreview';
import { TacticalDetailPanel } from '../modules/image/components/TacticalDetailPanel';


export const MediaBrowser: React.FC<MediaBrowserProps> = ({
    isOpen,
    onClose,
    onSelect,
    allowedTypes,
}) => {
    // 1. All Hooks (State & Stores)
    const { 
        mediaList, 
        isLoading, 
        isInitialized, 
        initDB, 
        addMedia, 
        deleteMedia, 
        clearDB, 
        renameMedia,
        updateMediaTags,
        updateMediaCampaigns,
        collections, 
        addCollection, 
        deleteCollection, 
        renameCollection, 
        toggleMediaInCollection,
        toggleMediaPersistence, 
    } = useMediaStore();

    const { activeCampaignId, campaigns } = useSessionOSStore();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('OR');
    const [smartFilter, setSmartFilter] = useState<'none' | 'recent' | 'untagged'>('none');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'name-asc'>('date-desc');
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
    const [campaignFilterEnabled, setCampaignFilterEnabled] = useState(true);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2. Lifecycle & Effects
    useEffect(() => {
        if (isOpen && !isInitialized && !isLoading) {
            initDB();
        }
    }, [isOpen, isInitialized, isLoading, initDB]);

    // 3. Logic Handlers
    const handleCreateCollection = () => {
        gmPrompt("Nom du dossier tactique", "", (name) => {
            if (name.trim()) addCollection(name.trim());
        });
    };

    const handleRenameCollection = (id: string, currentName: string) => {
        gmPrompt("Renommer le dossier", currentName, (newName) => {
            if (newName.trim()) renameCollection(id, newName.trim());
        });
    };

    const handleDeleteCollection = (id: string) => {
        if (confirm("Supprimer ce dossier ? Les assets ne seront pas effacés.")) {
            deleteCollection(id);
            if (selectedCollectionId === id) setSelectedCollectionId(null);
        }
    };

    const handleRenameMedia = (id: string, currentName: string) => {
        gmPrompt("Connecter nouveau alias", currentName, (newName) => {
            if (newName.trim()) renameMedia(id, newName.trim());
        });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const campaignIds = activeCampaignId ? [activeCampaignId] : [];
            await addMedia(file, [], campaignIds);
        } catch (err) {
            alert("Erreur lors de l'import : " + err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 4. Filtering Logic
    const filteredMedia = mediaList.filter(m => {
        if (allowedTypes && !allowedTypes.includes(m.type)) return false;
        if (typeFilter !== 'all' && m.type !== typeFilter) return false;
        
        if (smartFilter === 'untagged') {
            if (m.tags.length > 0) return false;
        }

        if (smartFilter !== 'untagged' && selectedTags.length > 0) {
            const mediaTagsLower = m.tags.map(t => t.toLowerCase());
            if (tagLogic === 'OR') {
                if (!selectedTags.some(tag => mediaTagsLower.includes(tag.toLowerCase()))) return false;
            } else { // AND
                if (!selectedTags.every(tag => mediaTagsLower.includes(tag.toLowerCase()))) return false;
            }
        }

        if (search) {
            const searchLower = search.toLowerCase();
            const nameMatch = m.name.toLowerCase().includes(searchLower);
            const tagMatch = m.tags.some(t => t.toLowerCase().includes(searchLower));
            const typeMatch = m.type.toLowerCase().includes(searchLower);
            if (!nameMatch && !tagMatch && !typeMatch) return false;
        }
        
        if (campaignFilterEnabled && activeCampaignId) {
            if (!m.campaignIds?.includes(activeCampaignId)) return false;
        }

        if (selectedCollectionId) {
            const coll = collections.find(c => c.id === selectedCollectionId);
            if (!coll || !coll.mediaIds.includes(m.id)) return false;
        }
        
        return true;
    });

    const sortedAndFilteredMedia = [...filteredMedia].sort((a, b) => {
        if (sortBy === 'date-desc') return b.createdAt - a.createdAt;
        if (sortBy === 'date-asc') return a.createdAt - b.createdAt;
        if (sortBy === 'size-desc') return b.size - a.size;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return b.createdAt - a.createdAt;
    });

    const displayMedia = smartFilter === 'recent' ? sortedAndFilteredMedia.slice(0, 50) : sortedAndFilteredMedia;
    const allTags = Array.from(new Set(mediaList.flatMap(m => m.tags))).sort();

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (!isOpen) return null;

    // 5. Render Obsidian Edition
    return createPortal(
        <div className="fixed inset-0 z-[100] flex bg-[#060e20] text-[#dee5ff] font-['Space_Grotesk'] overflow-hidden animate-in fade-in duration-500 select-none">
            {/* Full preview overlay */}
            {previewItem && (
                <FullScreenPreview 
                    media={previewItem} 
                    onClose={() => setPreviewItem(null)} 
                />
            )}
            
            <div className="flex-1 flex flex-row overflow-hidden relative">
                
                {/* Visual Background Decoration */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden">
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[150px] rounded-full" />
                    <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-[#53ddfc]/10 blur-[150px] rounded-full" />
                </div>

                {/* SideNavBar Glassmorphic */}
                <aside className="w-80 h-full bg-[#091328]/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20 relative">
                    <div className="p-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#53ddfc]/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(83,221,252,0.1)] border border-[#53ddfc]/20 group transition-all duration-500 hover:scale-105 active:scale-95">
                                <UploadCloud className="text-[#53ddfc] group-hover:drop-shadow-[0_0_8px_rgba(83,221,252,0.8)] transition-all" size={24} />
                            </div>
                            <div>
                                <h1 className="text-base font-black uppercase tracking-[0.25em] text-[#dee5ff] drop-shadow-[0_0_10px_rgba(222,229,255,0.3)]">Media Hub</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_#06b6d4]" />
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">Nexus Protocol</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-8">
                        {/* Virtual Directories */}
                        <section>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#53ddfc] flex items-center gap-2 opacity-60">
                                    <Folder size={14} />
                                    Dossiers de Collection
                                </h3>
                                <button 
                                    onClick={handleCreateCollection}
                                    className="p-1 px-3 rounded-xl bg-[#53ddfc]/10 text-[#53ddfc] hover:bg-[#53ddfc]/20 transition-all border border-[#53ddfc]/20 text-[10px] font-black uppercase tracking-widest"
                                    title="Initialize New Unit"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            
                            <div className="space-y-1.5">
                                <button
                                    onClick={() => {
                                        setSelectedCollectionId(null);
                                        setSelectedTags([]);
                                        setSmartFilter('none');
                                    }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${(!selectedCollectionId && selectedTags.length === 0 && smartFilter === 'none') ? 'bg-[#53ddfc]/10 text-[#53ddfc] border border-[#53ddfc]/30 shadow-[0_0_30px_rgba(83,221,252,0.15)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                >
                                    <Search size={18} className="opacity-50" />
                                    Global Archive
                                </button>

                                <div className="pt-3 space-y-1.5">
                                    <h4 className="px-5 text-[9px] font-black text-white/15 uppercase tracking-[0.3em] mb-2">Smart Matrix</h4>
                                    <button
                                        onClick={() => {
                                            setSmartFilter('recent');
                                            setSelectedCollectionId(null);
                                            setSelectedTags([]);
                                        }}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${smartFilter === 'recent' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                    >
                                        <Clock size={18} className="opacity-50" />
                                        Latest Frequency
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSmartFilter('untagged');
                                            setSelectedCollectionId(null);
                                            setSelectedTags([]);
                                        }}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${smartFilter === 'untagged' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                    >
                                        <ShieldAlert size={18} className="opacity-50" />
                                        Unalias Content
                                    </button>
                                </div>
                                
                                <div className="pt-6 space-y-1.5">
                                    <h4 className="px-5 text-[9px] font-black text-white/15 uppercase tracking-[0.3em] mb-2">User Domains</h4>
                                    {collections.map(coll => (
                                        <div key={coll.id} className="group flex items-center gap-1 pr-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCollectionId(coll.id);
                                                    setSelectedTags([]);
                                                    setSmartFilter('none');
                                                }}
                                                className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-bold transition-all duration-300 ${selectedCollectionId === coll.id ? 'bg-blue-600/10 text-blue-400 border border-blue-400/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                                            >
                                                <Folder size={18} className={`opacity-50 ${selectedCollectionId === coll.id ? 'text-blue-400' : ''}`} />
                                                <span className="truncate">{coll.name}</span>
                                            </button>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-300">
                                                <button 
                                                    onClick={() => handleRenameCollection(coll.id, coll.name)} 
                                                    className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                    title="Renommer le dossier"
                                                    aria-label="Renommer le dossier"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCollection(coll.id)} 
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Supprimer le dossier"
                                                    aria-label="Supprimer le dossier"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {collections.length === 0 && (
                                        <div className="px-5 py-8 text-center border border-dashed border-white/5 rounded-2xl">
                                            <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">No units detected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Tactical Metadata Tags */}
                        <section className="pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between mb-5 px-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#53ddfc] flex items-center gap-2 opacity-60">
                                    <Tag size={14} />
                                    Tactical Tags
                                </h3>
                                <button 
                                    onClick={() => setTagLogic(tagLogic === 'AND' ? 'OR' : 'AND')}
                                    className={`px-3 py-1 rounded-xl text-[9px] font-black tracking-widest transition-all border ${tagLogic === 'AND' ? 'bg-[#53ddfc]/10 border-[#53ddfc]/40 text-[#53ddfc] shadow-[0_0_10px_rgba(83,221,252,0.1)]' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'}`}
                                    title={`Current Matrix Logic: ${tagLogic}`}
                                >
                                    {tagLogic}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 px-1">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setSelectedTags(prev => 
                                                prev.includes(tag) 
                                                    ? prev.filter(t => t !== tag)
                                                    : [...prev, tag]
                                            );
                                            setSelectedCollectionId(null);
                                            setSmartFilter('none');
                                        }}
                                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all duration-300 ${selectedTags.includes(tag) ? 'bg-[#53ddfc]/10 border-[#53ddfc]/40 text-[#53ddfc] shadow-[0_0_15px_rgba(83,221,252,0.1)]' : 'bg-white/5 border-white/5 text-white/20 hover:border-white/20 hover:text-white/60 hover:bg-white/10'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                                {allTags.length === 0 && (
                                    <div className="text-[10px] font-bold text-white/5 uppercase tracking-widest text-center w-full py-4 italic">No tag traces found</div>
                                )}
                            </div>
                        </section>
                    </div>
                    
                    {/* Bottom Status & Actions */}
                    <div className="p-6 border-t border-white/5 bg-black/20">
                        <button
                            onClick={() => {
                                if (confirm("INITIATE HUB PURGE? This operation is irreversible and will delete all assets and unit directories.")) {
                                    clearDB();
                                }
                            }}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/5 text-red-500/40 hover:bg-red-500/20 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] border border-red-500/10 hover:border-red-500/40 transition-all duration-500 group"
                        >
                            <Trash2 size={16} className="group-hover:rotate-12 transition-transform duration-500" />
                            Purge Global Hub
                        </button>
                    </div>
                </aside>

                {/* Main View Port Area */}
                <main className="flex-1 h-full flex flex-col relative z-20">
                    
                    {/* Integrated HUD Toolbar */}
                    <header className="h-24 border-b border-white/5 flex items-center px-10 bg-[#0f1930]/40 backdrop-blur-3xl justify-between relative">
                        {/* Decorative HUD line */}
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#53ddfc]/30 to-transparent shadow-[0_0_10px_rgba(83,221,252,0.5)]" />
                        
                        <div className="flex items-center gap-8 flex-1 max-w-5xl">
                            {/* Search Tactical HUD */}
                            <div className="relative flex-1 group max-w-xl">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#53ddfc] group-focus-within:drop-shadow-[0_0_8px_rgba(83,221,252,0.4)] transition-all duration-500" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search Tactical Assets..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[#060e20]/80 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold tracking-wide focus:outline-none focus:border-[#53ddfc]/40 focus:ring-1 focus:ring-[#53ddfc]/20 transition-all duration-500 placeholder:text-white/5 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] text-[#dee5ff]"
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none">
                                    <div className="px-1.5 py-0.5 border border-[#53ddfc]/20 rounded text-[8px] font-black text-[#53ddfc]/50">SCAN MODE</div>
                                </div>
                            </div>

                            {/* Matrix Type Tabs */}
                            <div className="flex bg-[#060e20]/90 p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                                {[
                                    { id: 'all', label: 'ALL', icon: null },
                                    { id: 'image', label: 'IMAGE', icon: <ImageIcon size={14} /> },
                                    { id: 'audio', label: 'AUDIO', icon: <Music size={14} /> },
                                    { id: 'video', label: 'VIDEO', icon: <Film size={14} /> },
                                    { id: 'document', label: 'DOC', icon: <FileText size={14} /> }
                                ].map(btn => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setTypeFilter(btn.id as MediaType | 'all')}
                                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${typeFilter === btn.id ? 'bg-[#53ddfc] text-slate-950 shadow-[0_0_25px_rgba(83,221,252,0.4)] translate-y-[-1px]' : 'text-white/20 hover:text-white/70 hover:bg-white/5'}`}
                                    >
                                        {btn.icon}
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            {/* Campaign Context Filter */}
                            {activeCampaignId && (
                                <button
                                    onClick={() => setCampaignFilterEnabled(!campaignFilterEnabled)}
                                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border group ${campaignFilterEnabled ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'bg-[#060e20]/80 border-white/5 text-white/20 hover:border-white/20 hover:text-white/60'}`}
                                >
                                    <Users size={16} className={`transition-transform duration-500 ${campaignFilterEnabled ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    {campaignFilterEnabled ? "Focus Operational" : "Global Matrix"}
                                </button>
                            )}

                            {/* Custom HUD Sort Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                                    className={`flex items-center gap-3 px-6 py-3.5 bg-[#060e20]/80 border ${isSortMenuOpen ? 'border-[#53ddfc]/40 text-[#53ddfc] shadow-[0_0_20px_rgba(83,221,252,0.1)]' : 'border-white/5 text-white/30'} rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 group`}
                                >
                                    <ListFilter size={18} className={`transition-colors duration-500 ${isSortMenuOpen ? 'text-[#53ddfc]' : 'group-hover:text-white/60 text-white/20'}`} />
                                    <span>{sortBy === 'date-desc' ? 'Plus récents' : sortBy === 'date-asc' ? 'Plus anciens' : sortBy === 'size-desc' ? 'Taille' : 'Nom (A-Z)'}</span>
                                    <ChevronDown size={16} className={`transition-transform duration-500 ${isSortMenuOpen ? 'rotate-180 text-[#53ddfc]' : 'text-white/10 group-hover:text-white/30'}`} />
                                </button>

                                {isSortMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSortMenuOpen(false)} />
                                        <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-[#091328]/95 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-500 p-2 border-[#53ddfc]/10">
                                            <div className="space-y-1">
                                                {[
                                                    { id: 'date-desc', label: 'Plus récents', icon: <Clock size={16} />, desc: 'Les derniers imports' },
                                                    { id: 'date-asc', label: 'Plus anciens', icon: <Clock size={16} />, desc: 'Depuis le début' },
                                                    { id: 'size-desc', label: 'Taille', icon: <UploadCloud size={16} />, desc: 'Poids du fichier' },
                                                    { id: 'name-asc', label: 'Nom (A-Z)', icon: <ArrowDownAZ size={16} />, desc: 'Ordre alphabétique' }
                                                ].map(option => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setSortBy(option.id as 'date-desc' | 'date-asc' | 'size-desc' | 'name-asc');
                                                            setIsSortMenuOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 group/opt ${sortBy === option.id ? 'bg-[#53ddfc] text-slate-950 shadow-[0_8px_20px_rgba(83,221,252,0.3)]' : 'hover:bg-white/5'}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className={sortBy === option.id ? 'text-slate-950' : 'text-[#53ddfc]/40'}>{option.icon}</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{option.label}</span>
                                                            </div>
                                                            {sortBy === option.id && <Check size={14} className="text-slate-950" />}
                                                        </div>
                                                        <p className={`text-[9px] font-bold uppercase tracking-widest opacity-40 group-hover/opt:opacity-60 transition-opacity ${sortBy === option.id ? 'text-slate-950' : 'text-white'}`}>{option.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Main Import Interface */}
                            <label className="bg-[#53ddfc] hover:bg-cyan-400 text-slate-950 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer transition-all duration-500 shadow-[0_0_30px_rgba(83,221,252,0.25)] hover:shadow-[0_0_40px_rgba(83,221,252,0.4)] hover:scale-[1.02] active:scale-95 flex items-center gap-3 group">
                                <UploadCloud size={18} className="group-hover:translate-y-[-2px] transition-transform duration-500" />
                                {isUploading ? "Uploading Data..." : "Import Tactical Asset"}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleUpload} 
                                    className="hidden" 
                                    accept={allowedTypes ? allowedTypes.map(t => `${t}/*`).join(',') : "*/*"} 
                                />
                            </label>

                            <button 
                                onClick={onClose} 
                                className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white/20 hover:text-white hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/20 active:scale-90 group duration-500"
                                title="Deactivate Interface"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>
                    </header>

                    {/* Operational Content Area */}
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#060e20]">
                        
                        {displayMedia.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-[#091328]/50 flex items-center justify-center border border-white/5 mb-10 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] relative">
                                    <div className="absolute inset-0 rounded-[2.5rem] border border-[#53ddfc]/10 animate-ping opacity-20" />
                                    <UploadCloud size={48} className="text-white/5 animate-pulse" />
                                </div>
                                <h4 className="text-2xl font-black uppercase tracking-[0.4em] text-white/10 mb-4">No Data Detected</h4>
                                <p className="text-[10px] font-bold text-white/5 uppercase tracking-[0.3em] leading-loose mb-10">
                                    Archive empty or restricted by matrix filters. Please initialize new data sets or reset frequency.
                                </p>
                                <button 
                                    onClick={() => {
                                        setSearch('');
                                        setTypeFilter('all');
                                        setSelectedTags([]);
                                        setSelectedCollectionId(null);
                                        setCampaignFilterEnabled(false);
                                        setSmartFilter('none');
                                    }}
                                    className="px-10 py-4 rounded-2xl bg-white/5 hover:bg-[#53ddfc]/10 text-white/20 hover:text-[#53ddfc] text-[10px] font-black uppercase tracking-[0.25em] border border-white/10 hover:border-[#53ddfc]/30 transition-all duration-500"
                                >
                                    Reset Frequency
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10 pb-20 auto-rows-max">
                                {displayMedia.map(media => (
                                    <div 
                                        key={media.id} 
                                        className="group relative bg-[#091328]/40 border border-white/5 hover:border-[#53ddfc]/30 rounded-[2.5rem] overflow-hidden transition-all duration-700 hover:shadow-[0_0_60px_rgba(83,221,252,0.08)] hover:translate-y-[-12px] flex flex-col h-full shadow-2xl backdrop-blur-sm"
                                    >
                                        {/* Visual Tactical Scan Lines */}
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-[#53ddfc]/20 opacity-0 group-hover:opacity-100 group-hover:animate-scan z-10 pointer-events-none" />

                                        {/* Premium Thumbnail Container */}
                                        <div 
                                            className="aspect-[4/5] relative overflow-hidden bg-black/40 cursor-pointer"
                                            onClick={() => setPreviewItem(media)}
                                        >
                                            <MediaItemThumbnail media={media} />
                                            
                                            {/* Data Overlay Logic */}
                                            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-[#060e20] via-[#060e20]/80 to-transparent translate-y-[20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-[#53ddfc] tracking-tighter drop-shadow-[0_0_8px_rgba(83,221,252,0.6)]">{formatSize(media.size)}</span>
                                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1.5 opacity-60">
                                                            SYNCHRONIZED: {new Date(media.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(`INITIATE DELETION: "${media.name}"?`)) {
                                                                    deleteMedia(media.id);
                                                                }
                                                            }}
                                                            className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500/60 hover:bg-red-500/20 hover:text-red-500 rounded-2xl transition-all border border-red-500/10 hover:border-red-500/40"
                                                            title="Delete Asset"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onSelect(media.id); }}
                                                            className="w-12 h-12 flex items-center justify-center bg-[#53ddfc] text-slate-950 rounded-full transition-all shadow-[0_0_30px_rgba(83,221,252,0.5)] hover:scale-110 active:scale-90"
                                                            title="Select for Transmission"
                                                        >
                                                            <Check size={20} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* HUD Type Icon Badge */}
                                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/40 opacity-60 group-hover:opacity-100 group-hover:text-[#53ddfc] group-hover:border-[#53ddfc]/20 transition-all duration-500">
                                                    {TYPE_ICONS[media.type] || <FileText size={18} />}
                                                </div>
                                                {media.isPersistent && (
                                                    <div className="w-10 h-10 rounded-2xl bg-[#53ddfc]/10 backdrop-blur-md border border-[#53ddfc]/20 flex items-center justify-center text-[#53ddfc] shadow-[0_0_15px_rgba(83,221,252,0.2)]">
                                                        <Lock size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Metadata Footer */}
                                        <div className="p-7 flex flex-col flex-1 relative">
                                            {/* Micro HUD decoration */}
                                            <div className="absolute -right-4 -bottom-4 w-12 h-12 border border-white/5 rotate-45 pointer-events-none opacity-20" />
                                            
                                            <div className="flex items-start justify-between mb-4 gap-4">
                                                <h3 className="text-sm font-black uppercase tracking-wider text-[#dee5ff] group-hover:text-[#53ddfc] transition-colors leading-tight truncate flex-1" title={media.name}>
                                                    {media.name}
                                                </h3>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRenameMedia(media.id, media.name); }}
                                                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-all text-white/50 hover:text-[#53ddfc]"
                                                    title="Modifier l'identifiant"
                                                    aria-label="Modifier l'identifiant"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </div>

                                            {/* Domain Tags Row */}
                                            <div className="flex flex-wrap gap-2 mb-6 min-h-[22px]">
                                                {collections.filter(c => c.mediaIds.includes(media.id)).map(coll => (
                                                    <span key={coll.id} className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-blue-400/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                                        <FileText size={10} className="opacity-50" />
                                                        {coll.name}
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleMediaInCollection(coll.id, media.id);
                                                            }}
                                                            className="hover:text-red-400 opacity-30 hover:opacity-100 transition-all ml-1"
                                                            title="Retirer du dossier"
                                                            aria-label="Retirer du dossier"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </span>
                                                ))}
                                                {media.campaignIds.map(cid => {
                                                    const campaignName = campaigns.find(c => c.id === cid)?.name || `Unit_${cid.substring(0, 4)}`;
                                                    return (
                                                        <span key={cid} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                                                            {campaignName}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            {/* Tactical Neural Tags */}
                                            <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex flex-wrap gap-2 items-center max-w-[75%] overflow-hidden">
                                                    {media.tags.map(t => (
                                                        <span key={t} className="text-[9px] font-bold text-white/10 group-hover:text-[#53ddfc]/40 transition-colors uppercase tracking-widest">#{t}</span>
                                                    ))}
                                                    {media.tags.length === 0 && <span className="text-[8px] font-bold text-white/5 uppercase italic tracking-[0.2em]">NO_METADATA_LINK</span>}
                                                </div>
                                                
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingMediaId(editingMediaId === media.id ? null : media.id);
                                                        }}
                                                        className={`w-10 h-10 flex items-center justify-center rounded-2xl border transition-all duration-500 ${editingMediaId === media.id ? 'bg-[#53ddfc]/20 border-[#53ddfc]/40 text-[#53ddfc] shadow-[0_0_20px_rgba(83,221,252,0.1)]' : 'bg-white/5 border-transparent text-white/10 hover:text-[#53ddfc] hover:bg-[#53ddfc]/10'}`}
                                                        title="ÉDITION DÉTAILLÉE"
                                                    >
                                                        <Plus size={18} className={`transition-transform duration-500 ${editingMediaId === media.id ? 'rotate-45' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            {/* Tactical Detail Panel Overlay Backdrop */}
            {editingMediaId && (
                <div 
                    className="absolute inset-0 z-[115] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setEditingMediaId(null)}
                />
            )}

            {/* Tactical Detail Panel Component */}
            {editingMediaId && (
                <TacticalDetailPanel 
                    media={mediaList.find(m => m.id === editingMediaId)!}
                    onClose={() => setEditingMediaId(null)}
                    collections={collections}
                    toggleMediaInCollection={toggleMediaInCollection}
                    updateMediaTags={updateMediaTags}
                    updateMediaCampaigns={updateMediaCampaigns}
                    toggleMediaPersistence={toggleMediaPersistence}
                    deleteMedia={deleteMedia}
                    campaigns={campaigns}
                    onSelect={onSelect}
                />
            )}
        </div>,
        document.body
    );
};
