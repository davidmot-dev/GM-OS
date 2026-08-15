import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import type { Entity } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { abregerLaSante, decrireLaSante, fractionDeVie } from '../../combat/logic/SanteDuCombattant';
import { gmToast } from '../../../stores/useToastStore';
import { useImageStore } from '../../image/useImageStore';
import { 
    Activity,
    Search, 
    UserPlus, 
    Swords, 
    FileText, 
    Eye, 
    Pin, 
    Sparkles, 
    Image as ImageIcon, 
    Plus,
    Users,
    Skull,
    Heart,
    Trash2
} from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { gmConfirm } from '../../../stores/useModalStore';
import { motion } from 'framer-motion';

const ROLE_COLORS = {
    ally: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    neutral: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30',
    hostile: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    boss: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
};

const NpcGallery: React.FC = () => {
    const { t } = useTranslation();
    const { 
        entities, 
        activeCampaignId, 
        selectedEntityId, 
        setSelectedEntity, 
        sessions, 
        addEntityToSession, 
        removeEntityFromSession,
        generateEntityPortrait,
        updateEntity,
        isGeneratingAIImage,
        setIsAddingEntity,
        deleteEntity
    } = useSessionOSStore();

    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [showMediaBrowser, setShowMediaBrowser] = useState(false);
    const [editingNpcId, setEditingNpcId] = useState<string | null>(null);

    const editingNpc = entities.find(e => e.id === editingNpcId);

    // Get active session
    const session = sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');
    const pinnedIds = session?.sessionEntityIds || [];
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'npc' | 'monster' | 'ally' | 'hostile'>('all');

    const filteredEntities = entities.filter(e => {
        if (e.campaignId !== activeCampaignId) return false;

        const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        if (filter === 'npc') return e.type === 'npc';
        if (filter === 'monster') return e.type === 'monster';
        if (filter === 'ally') return e.role === 'ally';
        if (filter === 'hostile') return e.role === 'hostile' || e.role === 'boss';

        return true;
    });

    return (
        <div className="flex w-full h-full bg-app-bg overflow-hidden transition-colors duration-500">
            {/* Left Sidebar - Controls */}
            <aside className="w-80 h-full bg-app-surface border-r border-app-border flex flex-col p-6 overflow-y-auto custom-scrollbar transition-colors">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-accent font-display tracking-tighter uppercase">{t('modules:session.npc_gallery.title')}</h2>
                    <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">{t('modules:session.npc_gallery.subtitle')}</p>
                </div>

                {/* Search */}
                <div className="mb-10 group">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-accent" />
                        <input
                            type="text"
                            placeholder={t('modules:session.npc_gallery.search_placeholder')}
                            className="w-full bg-app-bg/50 border-b-2 border-app-border py-3 pl-10 pr-4 text-sm text-app-text focus:outline-none focus:border-accent transition-all placeholder:text-slate-600/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters */}
                <nav className="flex-1 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">{t('modules:session.npc_gallery.filters_label')}</p>
                    <FilterButton 
                        active={filter === 'all'} 
                        onClick={() => setFilter('all')} 
                        icon={<Users size={18} />} 
                        label={t('modules:session.npc_gallery.filter_all')} 
                    />
                    <FilterButton 
                        active={filter === 'npc'} 
                        onClick={() => setFilter('npc')} 
                        icon={<UserPlus size={18} />} 
                        label={t('modules:session.npc_gallery.filter_npc')} 
                    />
                    <FilterButton 
                        active={filter === 'monster'} 
                        onClick={() => setFilter('monster')} 
                        icon={<Skull size={18} />} 
                        label={t('modules:session.npc_gallery.filter_monsters')} 
                    />
                    <FilterButton 
                        active={filter === 'ally'} 
                        onClick={() => setFilter('ally')} 
                        icon={<Heart size={18} />} 
                        label={t('modules:session.npc_gallery.filter_allies')} 
                    />
                    <FilterButton 
                        active={filter === 'hostile'} 
                        onClick={() => setFilter('hostile')} 
                        icon={<Swords size={18} />} 
                        label={t('modules:session.npc_gallery.filter_hostiles')} 
                    />
                </nav>

                {/* Footer Side */}
                <div className="mt-8 pt-6 border-t border-app-border">
                    <button
                        onClick={() => setIsAddingEntity(true)}
                        className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 font-display font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.25)] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        {t('modules:session.npc_gallery.new_npc')}
                    </button>
                </div>
            </aside>

            {/* Main Content - Grid */}
            <main className="flex-1 h-full overflow-y-auto bg-app-bg p-10 relative custom-scrollbar transition-colors">
                {/* Asymmetric Header */}
                <div className="flex justify-between items-end mb-10">
                    <div className="relative">
                        <h1 className="text-2xl md:text-3xl font-black font-display tracking-tighter text-app-text leading-tight uppercase">
                            {t('modules:session.npc_gallery.list_title')}<br/>
                            <span className="text-accent italic">{t('modules:session.npc_gallery.list_accent')}</span>
                        </h1>
                        <div className="absolute -left-3 top-0 w-1 h-8 bg-accent/30"></div>
                        <div className="h-1 w-16 bg-accent mt-3 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"></div>
                    </div>
                    
                    <div className="flex gap-3 text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-app-surface/50 rounded-full border border-app-border">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                            {t('modules:session.npc_gallery.status_active')}
                        </div>
                        <div className="px-4 py-2 bg-app-surface/50 rounded-full border border-app-border">
                            {t('modules:session.npc_gallery.count_label')}: {filteredEntities.length}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, staggerChildren: 0.05 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-8"
                >
                    {filteredEntities.map((npc) => (
                        <NpcGalleryItem
                            key={npc.id}
                            npc={npc}
                            isSelected={selectedEntityId === npc.id}
                            isPinned={pinnedIds.includes(npc.id)}
                            onSelect={() => setSelectedEntity(npc.id)}
                            onTogglePin={() => {
                                if (!session) return;
                                const isCurrentlyPinned = pinnedIds.includes(npc.id);
                                if (isCurrentlyPinned) {
                                    removeEntityFromSession(session.id, npc.id);
                                } else {
                                    addEntityToSession(session.id, npc.id);
                                }
                                const msg = isCurrentlyPinned 
                                    ? t('modules:session.toasts.entity_removed', { name: npc.name })
                                    : t('modules:session.toasts.entity_pinned', { name: npc.name });
                                gmToast(msg);
                            }}
                            onGenerateImage={() => {
                                setEditingNpcId(npc.id);
                                setShowAIPrompt(true);
                            }}
                            onPickImage={() => {
                                setEditingNpcId(npc.id);
                                setShowMediaBrowser(true);
                            }}
                            onDelete={() => {
                                gmConfirm(
                                    t('modules:session.npc_gallery.delete_confirm', { name: npc.name }),
                                    () => {
                                        deleteEntity(npc.id);
                                        gmToast(t('modules:session.toasts.entity_deleted', { name: npc.name }));
                                    }
                                );
                            }}
                            t={t}
                        />
                    ))}

                    {/* Empty State / Add Card */}
                    <button 
                        onClick={() => setIsAddingEntity(true)}
                        className="h-[28rem] rounded-2xl border-2 border-dashed border-app-border flex flex-col items-center justify-center gap-6 hover:border-accent/50 hover:bg-accent/5 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full border border-app-border flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-all">
                            <Plus size={32} className="text-slate-600 group-hover:text-accent group-hover:rotate-90 transition-all duration-300" />
                        </div>
                        <div className="text-center">
                            <span className="font-display font-black text-slate-500 uppercase tracking-widest text-xs group-hover:text-accent transition-colors">{t('modules:session.npc_gallery.empty_state_init')}</span>
                            <p className="text-[9px] text-slate-700 mt-1 font-mono group-hover:text-slate-500">{t('modules:session.npc_gallery.empty_state_slot')}</p>
                        </div>
                    </button>
                </motion.div>

                {filteredEntities.length === 0 && search && (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-700">
                        <Search size={64} className="mb-6 opacity-10" />
                        <p className="text-sm italic font-mono uppercase tracking-[0.3em]">{t('modules:session.npc_gallery.no_results', { query: search })}</p>
                    </div>
                )}
            </main>

            {/* Overlays */}
            <AIPromptOverlay
                isOpen={showAIPrompt}
                onClose={() => { setShowAIPrompt(false); setEditingNpcId(null); }}
                isGenerating={isGeneratingAIImage}
                title={t('modules:session.npc_gallery.ai_title', { name: editingNpc?.name })}
                placeholder={t('modules:session.npc_gallery.ai_placeholder')}
                onGenerate={(instructions) => {
                    if (editingNpcId) {
                        generateEntityPortrait(editingNpcId, instructions).then(() => {
                            setShowAIPrompt(false);
                            setEditingNpcId(null);
                        });
                    }
                }}
            />

            <MediaBrowser
                isOpen={showMediaBrowser}
                onClose={() => { setShowMediaBrowser(false); setEditingNpcId(null); }}
                onSelect={(mediaId) => {
                    if (editingNpcId) {
                        updateEntity(editingNpcId, { avatar: mediaId });
                        setShowMediaBrowser(false);
                        setEditingNpcId(null);
                    }
                }}
            />
        </div>
    );
};

const FilterButton: React.FC<{ 
    active: boolean, 
    onClick: () => void, 
    icon: React.ReactNode, 
    label: string 
}> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all active:translate-x-1 ${
            active 
                ? 'bg-accent/10 text-accent border-r-4 border-accent shadow-[10px_0_15px_-10px_rgba(var(--accent-rgb),0.5)]' 
                : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
    >
        {icon}
        {label}
    </button>
);

const NpcGalleryItem: React.FC<{ 
    npc: Entity, 
    isSelected: boolean, 
    isPinned: boolean,
    onSelect: () => void,
    onTogglePin: () => void,
    onGenerateImage: () => void,
    onPickImage: () => void,
    onDelete: () => void,
    t: any
}> = ({ npc, isSelected, isPinned, onSelect, onTogglePin, onGenerateImage, onPickImage, onDelete, t }) => {
    
    return (
        <motion.div
            onClick={onSelect}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`group relative h-[28rem] rounded-2xl overflow-hidden cursor-pointer transition-all border border-app-border glass-bento !bg-app-surface/40 backdrop-blur-md hover:border-accent/30 ${
                isSelected ? 'ring-2 ring-accent shadow-glow-accent/20 bg-app-surface/80' : ''
            }`}
        >
            {/* Header / Avatar Area */}
            <div className="relative h-56 overflow-hidden">
                <ResolvedImage
                    src={npc.avatar}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-app-surface to-transparent opacity-80" />
                
                {/* Hover Quick Actions */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                        className={`p-2.5 rounded-xl transition-all shadow-xl backdrop-blur-md ${
                            isPinned ? 'bg-accent text-white scale-110 shadow-accent/20' : 'bg-black/40 text-slate-300 hover:text-accent border border-white/10'
                        }`}
                        title={isPinned ? t('modules:session.npc_gallery.unpin_tooltip') : t('modules:session.npc_gallery.pin_tooltip')}
                    >
                        <Pin size={18} fill={isPinned ? 'currentColor' : 'none'} />
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-xl text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"
                            title={t('modules:session.npc_gallery.delete_tooltip')}
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onPickImage(); }}
                            className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-slate-300 hover:text-accent border border-white/10 transition-all"
                            title={t('modules:session.npc_gallery.browse_tooltip')}
                        >
                            <ImageIcon size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}
                            className="p-2.5 bg-accent text-white rounded-xl hover:scale-110 transition-all shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]"
                            title={t('modules:session.npc_gallery.ai_tooltip')}
                        >
                            <Sparkles size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 h-56 flex flex-col relative text-app-text">
                {/* Role Badge */}
                <div className={`absolute -top-3 right-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${ROLE_COLORS[npc.role as keyof typeof ROLE_COLORS] || 'bg-slate-500/20 text-slate-400 border-white/10'}`}>
                    {t(`modules:session.npc_gallery.roles.${npc.role}`, { defaultValue: npc.role })}
                </div>

                <div className="mb-auto">
                    <h3 className="font-display font-black text-xl text-app-text leading-tight mb-1 group-hover:text-accent transition-colors uppercase tracking-tighter">
                        {npc.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold italic tracking-wide truncate">
                        {npc.description || t('modules:session.npc_gallery.default_description')}
                    </p>
                </div>

                {/* Bottom Controls */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                    {/*
                        **La barre n'existe que si le jeu compte des points.**

                        Elle divisait `npc.hp` par `npc.maxHp` sans rien
                        demander : sur Dune, dont la défaite est une tâche
                        étendue, un adversaire affichait une barre de vie pleine
                        tirée de champs que rien n'utilise. Même correctif que
                        pour la grille des personnages joueurs — sans jauge, on
                        montre ce que le système décrit.
                    */}
                    {fractionDeVie(npc) === null ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 tracking-widest uppercase">
                            <Activity size={11} className="text-rose-400/60" />
                            <span>{abregerLaSante(npc) ?? decrireLaSante(npc) ?? 'santé non chiffrée'}</span>
                        </div>
                    ) : (<>
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-600 mb-1 tracking-widest uppercase">
                        <span>{t('modules:session.npc_gallery.hp_label')}</span>
                        <span className={fractionDeVie(npc)! < 0.3 ? 'text-red-400' : 'text-accent'}>{npc.hp} / {npc.maxHp} HP</span>
                    </div>
                    <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${
                                fractionDeVie(npc)! < 0.3 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]'
                            }`}
                            style={{ width: `${fractionDeVie(npc)! * 100}%` }}
                        />
                    </div>
                    </>)}

                    {/* Quick Access Buttons */}
                    <div className="flex gap-2 mt-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelect(); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-app-surface border border-app-border text-slate-500 hover:bg-app-bg hover:text-accent h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all"
                        >
                            <FileText size={12} />
                            {t('modules:session.npc_gallery.details_btn')}
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                useCombatStore.getState().addCombatant({
                                    name: npc.name,
                                    init: 0,
                                    hp: npc.hp,
                                    hpMax: npc.maxHp,
                                    avatar: npc.avatar,
                                    isPlayer: false,
                                    faction: npc.role === 'ally' ? 'ally' : 
                                             (npc.role === 'hostile' || npc.role === 'boss') ? 'enemy' : 'neutral',
                                    sourceEntityId: npc.id,
                                    statuses: [],
                                    roleplayingNotes: npc.roleplayingNotes,
                                    gmSecretInfo: npc.gmSecretInfo
                                });
                                gmToast(t('modules:session.toasts.entity_added_to_combat', { name: npc.name }));
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                            title={t('modules:session.npc_gallery.add_combat_tooltip')}
                        >
                            <Swords size={14} />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                useImageStore.getState().projectEntity(npc);
                                gmToast(t('modules:session.toasts.entity_projected', { name: npc.name }));
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white rounded-lg transition-all"
                            title={t('modules:session.npc_gallery.project_tooltip')}
                        >
                            <Eye size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default NpcGallery;
