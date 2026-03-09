import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { Entity } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { useImageStore } from '../../image/useImageStore';
import { Search, UserPlus, Swords, FileText, Eye, Pin } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';

const ROLE_COLORS = {
    ally: 'bg-emerald-500/80 text-white',
    neutral: 'bg-blue-500/80 text-white',
    hostile: 'bg-crimson-500/80 text-white',
    boss: 'bg-purple-600/90 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]',
};

const ROLE_LABELS = {
    ally: 'ALLIÉ',
    neutral: 'NEUTRE',
    hostile: 'HOSTILE',
    boss: 'BOSS',
};

const NpcGallery: React.FC = () => {
    const { entities, activeCampaignId, selectedEntityId, setSelectedEntity, sessions, addEntityToSession, removeEntityFromSession } = useSessionOSStore();

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
        <div className="w-1/3 flex-shrink-0 h-full bg-slate-900/50 border-r border-slate-800 flex flex-col overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 flex flex-col gap-4 border-b border-slate-800">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher un PNJ ou monstre..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-gm-gold/50 placeholder:text-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {(['all', 'npc', 'monster', 'ally', 'hostile'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f
                                ? 'bg-gm-gold text-slate-950 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                }`}
                        >
                            {f === 'all' ? 'Tous' : f === 'npc' ? 'PNJ' : f === 'monster' ? 'Monstre' : f === 'ally' ? 'Allié' : 'Hostile'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {filteredEntities.map((npc) => (
                        <NpcGalleryItem
                            key={npc.id}
                            npc={npc}
                            isSelected={selectedEntityId === npc.id}
                            isPinned={pinnedIds.includes(npc.id)}
                            onSelect={() => setSelectedEntity(npc.id)}
                            onTogglePin={() => {
                                if (!session) return;
                                if (pinnedIds.includes(npc.id)) {
                                    removeEntityFromSession(session.id, npc.id);
                                    gmToast(`${npc.name} retiré de la session`);
                                } else {
                                    addEntityToSession(session.id, npc.id);
                                    gmToast(`${npc.name} épinglé à la session`);
                                }
                            }}
                        />
                    ))}
                </div>

                {filteredEntities.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-600">
                        <UserPlus size={48} className="mb-4 opacity-10" />
                        <p className="text-sm italic">Aucun PNJ trouvé</p>
                    </div>
                )}
            </div>

            {/* Footer / Add NPC */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                <button 
                    onClick={() => useSessionOSStore.getState().setIsAddingEntity(true)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 hover:border-gm-gold/50 hover:bg-gm-gold/10 text-slate-300 hover:text-gm-gold py-2.5 rounded-xl text-xs font-bold transition-all group"
                >
                    <UserPlus size={14} className="group-hover:scale-110 transition-transform" />
                    Ajouter un PNJ / Monstre
                </button>
            </div>
        </div>
    );
};

const NpcGalleryItem: React.FC<{ 
    npc: Entity, 
    isSelected: boolean, 
    isPinned: boolean,
    onSelect: () => void,
    onTogglePin: () => void
}> = ({ npc, isSelected, isPinned, onSelect, onTogglePin }) => {
    
    return (
        <div
            onClick={onSelect}
            className={`group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${isSelected ? 'border-gm-gold shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-transparent hover:border-white/10'
                }`}
        >
            {/* Portrait */}
            <div className="absolute inset-0">
                <ResolvedImage
                    src={npc.avatar}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-40 transition-transform duration-500 group-hover:scale-125"
                />
                <ResolvedImage
                    src={npc.avatar}
                    alt={npc.name}
                    className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
            </div>

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />

            {/* Badge */}
            <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${ROLE_COLORS[npc.role as keyof typeof ROLE_COLORS] || 'bg-slate-500'}`}>
                {ROLE_LABELS[npc.role as keyof typeof ROLE_LABELS] || npc.role}
            </div>

            {isPinned && (
                <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-gm-gold text-slate-950 shadow-glow-gold">
                    <Pin size={10} fill="currentColor" />
                </div>
            )}

            {/* Info */}
            <div className="absolute bottom-3 left-3 right-3">
                <p className="font-bold text-white text-sm truncate drop-shadow-md">{npc.name}</p>
                <p className="text-[9px] text-slate-300 truncate opacity-80">{npc.description}</p>

                {/* HP Bar */}
                <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${npc.hp / npc.maxHp < 0.3 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(npc.hp / npc.maxHp) * 100}%` }}
                    />
                </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs transition-colors w-32 ${
                        isPinned 
                        ? 'bg-gm-gold text-slate-950 hover:bg-gm-gold/80' 
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                >
                    <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
                    {isPinned ? 'Détacher' : 'Épingler'}
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        className="flex items-center gap-2 bg-white text-slate-950 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-gm-gold transition-colors"
                    >
                        <FileText size={14} />
                        Fiche
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
                                sourceEntityId: npc.id,
                                statuses: []
                            });
                            gmToast(`${npc.name} ajouté au combat !`);
                        }}
                        className="flex items-center justify-center bg-red-600 text-white p-1.5 rounded-lg font-bold text-xs hover:bg-red-500 transition-colors"
                    >
                        <Swords size={14} />
                    </button>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        useImageStore.getState().projectEntity(npc);
                        gmToast(`Personnage ${npc.name} projeté !`);
                    }}
                    className="flex items-center gap-2 bg-gm-cyan text-obsidian px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-cyan-400 transition-colors"
                >
                    <Eye size={14} />
                    Image
                </button>
            </div>
        </div>
    );
};

export default NpcGallery;
