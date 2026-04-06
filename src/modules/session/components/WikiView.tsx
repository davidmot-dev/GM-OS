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
    BookOpen,
    Sparkles
} from 'lucide-react';
import { gmCustom } from '../../../stores/useModalStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { gmToast } from '../../../stores/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';

const WikiView: React.FC = () => {
    const {
        wikiEntries,
        activeCampaignId,
        deleteWikiEntry,
        entities,
        selectedWikiEntryId,
        setSelectedWikiEntryId,
        setPendingPreFill,
        setCurrentView,
        setActiveCampaignFormSection
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

    const handleBridgeAction = () => {
        if (!selectedEntry) return;

        // Pré-remplissage des données pour la création
        const preFillData = {
            title: selectedEntry.title,
            content: selectedEntry.content || '',
            imageUrl: selectedEntry.imageUrls?.[0] || '',
            mediaUrl: selectedEntry.imageUrls?.[0] || ''
        };

        if (selectedEntry.category === 'clue' || selectedEntry.category === 'rumor') {
            setPendingPreFill({ type: selectedEntry.category as 'clue' | 'rumor', data: preFillData });
            setCurrentView('campaign-editor');
            setActiveCampaignFormSection('clues');
        } else if (selectedEntry.category === 'location') {
            setPendingPreFill({ type: 'location', data: preFillData });
            setCurrentView('campaign-editor');
            setActiveCampaignFormSection('world');
        } else if (selectedEntry.category === 'npc') {
            setPendingPreFill({ type: 'npc', data: preFillData });
            setCurrentView('campaign-editor');
            setActiveCampaignFormSection('npc');
        } else if (selectedEntry.category === 'item' || selectedEntry.category === 'lore') {
            setPendingPreFill({ type: selectedEntry.category as 'item' | 'lore', data: preFillData });
            useSessionStore.getState().setActiveModule('favorite');
            setCurrentView('cockpit'); // Reset la vue interne du Session-OS
        } else {
            // Fallback générique
            setPendingPreFill({ type: 'lore', data: preFillData });
            setCurrentView('campaign-editor');
            setActiveCampaignFormSection('narrative');
        }
        
        gmToast(`Pont Magique activé : ${selectedEntry.title} prêt pour l'import 🪄`);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as const } }
    };

    return (
        <div className="flex h-full bg-app-bg text-app-text">
            {/* Sidebar: Navigation & Search (Bento Style) */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-xl">
                <div className="p-6 space-y-6">
                    <div className="relative group/search">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text/20 group-focus-within/search:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher dans les archives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-[11px] text-app-text focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-app-text/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all truncate ${
                                    selectedCategory === cat 
                                        ? 'bg-accent/20 border-accent/40 text-accent shadow-glow-accent/5' 
                                        : 'bg-white/5 border-white/5 text-app-text/30 hover:text-app-text/60 hover:bg-white/10'
                                  }`}
                                title={categoryLabels[cat] || cat}
                            >
                                {categoryLabels[cat] || cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-1.5"
                    >
                        {filteredEntries.map(entry => (
                            <motion.button
                                key={entry.id}
                                variants={itemVariants}
                                onClick={() => setSelectedWikiEntryId(entry.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${
                                    selectedWikiEntryId === entry.id
                                        ? 'bg-accent/10 border-accent/30 text-accent shadow-lg shadow-accent/5'
                                        : 'border-transparent text-app-text/40 hover:bg-white/5 hover:text-app-text/80'
                                }`}
                            >
                                <div className="flex flex-col items-start gap-1 overflow-hidden">
                                    <span className="text-[11px] font-black uppercase tracking-tight truncate pr-2 group-hover:translate-x-1 transition-transform">{entry.title}</span>
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-app-text/10 opacity-60">
                                        {entry.category}
                                    </span>
                                </div>
                                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 transition-all ${selectedWikiEntryId === entry.id ? 'opacity-40 translate-x-1' : ''}`} />
                            </motion.button>
                        ))}
                    </motion.div>
                </div>

                <div className="p-6 border-t border-white/5">
                    <button 
                        onClick={() => gmCustom('wiki-entry-add')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-app-bg rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-glow-accent/20 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={16} strokeWidth={3} />
                        Nouvel Article
                    </button>
                </div>
            </div>

            {/* Main Content: Article View (Bento Style) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-black/10">
                <AnimatePresence mode="wait">
                    {selectedEntry ? (
                        <motion.div 
                            key={selectedWikiEntryId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                            className="max-w-4xl mx-auto"
                        >
                            {/* Article Header */}
                            <div className="mb-12 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-accent/10 rounded-3xl border border-accent/20 text-accent flex items-center justify-center shadow-glow-accent/5">
                                            <BookOpen size={32} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-black text-app-text tracking-tighter uppercase leading-none">{selectedEntry.title}</h1>
                                            <div className="flex items-center gap-6 mt-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                                                    #{selectedEntry.category}
                                                </span>
                                                <div className="flex gap-1.5">
                                                    {(selectedEntry.tags || []).map(tag => (
                                                        <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-app-text/20 bg-white/5 border border-white/5 px-2 py-1 rounded-lg">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {/* Wiki Bridge Action Button (Premium Style) */}
                                        <button 
                                            onClick={handleBridgeAction}
                                            className="flex items-center gap-3 px-5 py-3 bg-accent/10 border border-accent/30 rounded-2xl text-accent hover:bg-accent hover:text-app-bg transition-all group/magic shadow-xl active:scale-95"
                                            title="Transformer en élément de jeu (PNJ, Indice, Lieu...)"
                                        >
                                            <Sparkles size={18} className="group-hover/magic:rotate-12 transition-transform" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden lg:inline">Pont Magique</span>
                                        </button>

                                        <button 
                                            onClick={() => gmCustom('wiki-entry-edit', selectedEntry)}
                                            className="p-3 bg-white/5 border border-white/5 rounded-2xl text-app-text/20 hover:text-accent hover:border-accent/40 transition-all shadow-xl active:scale-95"
                                            title="Modifier l'article"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                deleteWikiEntry(selectedEntry.id);
                                                setSelectedWikiEntryId(null);
                                            }}
                                            className="p-3 bg-white/5 border border-white/5 rounded-2xl text-app-text/20 hover:text-rose-500 hover:border-rose-500/40 transition-all shadow-xl active:scale-95"
                                            title="Supprimer l'article"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Article Content Grid */}
                            <div className="grid grid-cols-12 gap-12">
                                <div className="col-span-8 space-y-10">
                                    <div className="glass-bento rounded-[3rem] border border-white/5 p-10 shadow-2xl relative overflow-hidden group/content">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <BookOpen size={120} strokeWidth={1} />
                                        </div>
                                        <div className="prose prose-invert max-w-none relative z-10">
                                            <p className="text-app-text/80 leading-[1.8] text-lg font-medium whitespace-pre-wrap selection:bg-accent selection:text-app-bg">
                                                {selectedEntry.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Linked Stuff (Bento Style) */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-app-text/30 flex items-center gap-3 mb-6">
                                                <Users size={16} className="text-accent" />
                                                Entités Liées
                                            </h4>
                                            <div className="flex flex-col gap-3">
                                                {(selectedEntry.linkedEntityIds || []).length > 0 ? (
                                                    (selectedEntry.linkedEntityIds || []).map(id => (
                                                        <div key={id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/20 transition-colors">
                                                            <div className="w-2 h-2 rounded-full bg-accent/40" />
                                                            <span className="text-[11px] font-black uppercase tracking-tight text-app-text/60">{entities.find(e => e.id === id)?.name || "Entité inconnue"}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-app-text/10 italic p-4 text-center border border-dashed border-white/5 rounded-2xl">Aucun lien établi</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-xl flex flex-col items-center justify-center text-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
                                            <Layers size={32} strokeWidth={1} className="text-accent/40" />
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] leading-relaxed">Module de Connexion Étendu prochainement disponible</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar visual (Bento Style) */}
                                <div className="col-span-4 space-y-10">
                                    {(selectedEntry.imageUrls || []).length > 0 && (
                                        <div className="glass-bento rounded-[2.5rem] overflow-hidden border border-white/5 p-3 shadow-2xl group/img">
                                            <div className="rounded-[2rem] overflow-hidden border border-white/5 relative">
                                                <MediaImage 
                                                    source={(selectedEntry.imageUrls || [])[0]} 
                                                    alt={selectedEntry.title} 
                                                    className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="glass-bento rounded-[2.5rem] p-8 border border-accent/20 bg-accent/5 shadow-xl space-y-4">
                                        <div className="flex items-center gap-3 text-accent">
                                            <Shield size={18} strokeWidth={2.5} />
                                            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Censure MJ</span>
                                        </div>
                                        <p className="text-[11px] text-app-text/40 leading-relaxed font-black uppercase tracking-wider italic">
                                            Cet article est chiffré. Seules les données publiques sont projetées vers l'interface des joueurs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-app-text/10 gap-8"
                        >
                            <BookOpen size={120} strokeWidth={0.5} className="opacity-20" />
                            <div className="text-center space-y-3">
                                <p className="font-black text-sm tracking-[0.5em] uppercase">Bibliothèque d'Alexandrie</p>
                                <p className="text-[10px] opacity-40 uppercase tracking-[0.3em]">Choisissez un grimoire dans les archives latérales</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WikiView;
