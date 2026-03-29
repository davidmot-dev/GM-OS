import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { MediaImage } from '../../../components/MediaImage';
import { 
    Search, 
    Plus, 
    ChevronRight, 
    Layers, 
    Shield, 
    Users,
    Trash2,
    Edit2,
    BookOpen
} from 'lucide-react';
import { gmCustom } from '../../../stores/useModalStore';

const WikiView: React.FC = () => {
    const {
        wikiEntries,
        activeCampaignId,
        deleteWikiEntry,
        entities,
        selectedWikiEntryId,
        setSelectedWikiEntryId
    } = useSessionOSStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = ['all', 'npc', 'location', 'organization', 'lore', 'item', 'clue', 'rumor', 'other'];

    const categoryLabels: Record<string, string> = {
        all: 'Tout',
        npc: 'PNJ',
        location: 'Lieu',
        organization: 'Organisation',
        lore: 'Lore',
        item: 'Objet',
        clue: 'Indice',
        rumor: 'Rumeur',
        other: 'Autre'
    };

    const filteredEntries = wikiEntries
        .filter(e => e.campaignId === activeCampaignId)
        .filter(e => selectedCategory === 'all' || e.category === selectedCategory)
        .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     e.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const selectedEntry = wikiEntries.find(e => e.id === selectedWikiEntryId);

    return (
        <div className="flex h-full bg-app-bg/20">
            {/* Sidebar: Navigation & Search */}
            <div className="w-80 border-r border-app-border flex flex-col bg-app-surface/10">
                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-app-bg/40 border border-app-border rounded-xl pl-9 pr-4 py-2 text-xs text-app-text focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all truncate ${
                                    selectedCategory === cat 
                                        ? 'bg-accent/10 border-accent/40 text-accent' 
                                        : 'bg-app-bg/20 border-app-border text-app-text/40 hover:text-app-text'
                                  }`}
                                title={categoryLabels[cat] || cat}
                            >
                                {categoryLabels[cat] || cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
                    <div className="space-y-1">
                        {filteredEntries.map(entry => (
                            <button
                                key={entry.id}
                                onClick={() => setSelectedWikiEntryId(entry.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                                    selectedWikiEntryId === entry.id
                                        ? 'bg-accent/10 border-accent/40 text-accent'
                                        : 'border-transparent text-app-text/60 hover:bg-app-surface/40 hover:text-app-text'
                                }`}
                            >
                                <div className="flex flex-col items-start gap-1 overflow-hidden">
                                    <span className="text-xs font-bold truncate pr-2">{entry.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-app-text/20 opacity-60">
                                            {entry.category}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 ${selectedWikiEntryId === entry.id ? 'opacity-40' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-app-border">
                    <button 
                        onClick={() => gmCustom('wiki-entry-add')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-app-bg rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-accent/20 hover:opacity-90 transition-all"
                    >
                        <Plus size={14} />
                        Nouvel Article
                    </button>
                </div>
            </div>

            {/* Main Content: Article View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-app-bg/30">
                {selectedEntry ? (
                    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Article Header */}
                        <div className="mb-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-accent/10 rounded-xl border border-accent/20 text-accent">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-app-text tracking-tight">{selectedEntry.title}</h1>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-accent">#{selectedEntry.category}</span>
                                            <div className="flex gap-1">
                                                {(selectedEntry.tags || []).map(tag => (
                                                    <span key={tag} className="text-[9px] font-bold text-app-text/20 bg-app-bg border border-app-border px-1.5 py-0.5 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => gmCustom('wiki-entry-edit', selectedEntry)}
                                        className="p-2 bg-app-surface border border-app-border rounded-xl text-app-text/40 hover:text-accent transition-all"
                                        title="Modifier l'article"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            deleteWikiEntry(selectedEntry.id);
                                            setSelectedWikiEntryId(null);
                                        }}
                                        className="p-2 bg-app-surface border border-app-border rounded-xl text-app-text/40 hover:text-rose-400 transition-all"
                                        title="Supprimer l'article"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Article Content */}
                        <div className="grid grid-cols-12 gap-10">
                            <div className="col-span-8 space-y-6">
                                <div className="prose prose-invert max-w-none">
                                    {/* Simple Rendering (no react-markdown here yet, so we just show text) */}
                                    <p className="text-app-text/80 leading-relaxed text-base whitespace-pre-wrap">
                                        {selectedEntry.content}
                                    </p>
                                </div>

                                {/* Linked Stuff */}
                                <div className="pt-10 border-t border-app-border/40 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text/40 flex items-center gap-2">
                                                <Layers size={12} className="text-accent" />
                                                Entités Liées
                                            </h4>
                                            <div className="flex flex-col gap-2">
                                                {(selectedEntry.linkedEntityIds || []).length > 0 ? (
                                                    (selectedEntry.linkedEntityIds || []).map(id => (
                                                        <div key={id} className="flex items-center gap-2 p-2 rounded-lg bg-app-surface/40 border border-app-border">
                                                            <Users size={12} className="text-accent" />
                                                            <span className="text-[10px] font-bold text-app-text/60">{entities.find(e => e.id === id)?.name || "Entité inconnue"}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] italic text-app-text/20">Aucun lien</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* You could add more linked columns here */}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar visual */}
                            <div className="col-span-4 space-y-6">
                                {(selectedEntry.imageUrls || []).length > 0 && (
                                    <div className="rounded-2xl overflow-hidden border border-app-border bg-app-surface shadow-2xl">
                                        <MediaImage 
                                            source={(selectedEntry.imageUrls || [])[0]} 
                                            alt={selectedEntry.title} 
                                            className="w-full h-auto object-cover opacity-80"
                                        />
                                    </div>
                                )}
                                <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-accent">
                                        <Shield size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Informations MJ</span>
                                    </div>
                                    <p className="text-[10px] text-app-text/40 leading-relaxed italic">
                                        Cet article est visible par vos joueurs si vous le projetez. Les notes privées restent cachées.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-app-text/20 gap-4">
                        <BookOpen size={64} strokeWidth={1} />
                        <div className="text-center">
                            <p className="font-black text-sm tracking-widest uppercase">Choisissez un article ou créez-en un</p>
                            <p className="text-[10px] opacity-40 mt-1 uppercase tracking-[0.2em]">Explorez les archives de votre campagne</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WikiView;
