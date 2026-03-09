import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmCustom } from '../../../stores/useModalStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { Player } from '../useSessionOSStore';
import { Search, UserPlus } from 'lucide-react';

const PlayerRoster: React.FC = () => {
    const { players, selectedPlayerId, setSelectedPlayer, togglePlayerOnline } = useSessionOSStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = players.filter(p =>
        p.realName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-5 border-b border-slate-800">
                <h3 className="text-slate-100 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gm-gold"></span>
                    Roster des Joueurs
                </h3>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher un joueur..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:ring-1 focus:ring-gm-gold/50 focus:outline-none"
                    />
                </div>
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1">
                {filtered.map(player => (
                    <PlayerCard
                        key={player.id}
                        player={player}
                        isSelected={selectedPlayerId === player.id}
                        onClick={() => setSelectedPlayer(player.id)}
                        onToggleOnline={(e) => {
                            e.stopPropagation();
                            togglePlayerOnline(player.id);
                        }}
                    />
                ))}
                {filtered.length === 0 && (
                    <p className="text-slate-600 text-sm text-center p-4">Aucun joueur trouvé</p>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => gmCustom('player-add')}
                    className="w-full flex items-center justify-center gap-2 border border-gm-gold/40 text-gm-gold hover:bg-gm-gold/10 py-2.5 rounded-lg text-sm font-bold transition-all"
                >
                    <UserPlus size={16} />
                    Ajouter un Joueur
                </button>
            </div>
        </div>
    );
};

const PlayerCard: React.FC<{ 
    player: Player; 
    isSelected: boolean; 
    onClick: () => void;
    onToggleOnline: (e: React.MouseEvent) => void;
}> = ({ player, isSelected, onClick, onToggleOnline }) => {
    const resolvedAvatar = useMediaUrl(player.avatarUrl);
    return (
        <div
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${isSelected
                ? 'bg-gm-gold/10 border border-gm-gold/30'
                : 'hover:bg-slate-800/60 border border-transparent'
                }`}
        >
            <div className="relative flex-shrink-0">
                <img
                    src={resolvedAvatar || undefined}
                    alt={player.realName}
                    className="w-10 h-10 rounded-full bg-slate-700 object-cover"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${player.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
            </div>
            <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm truncate ${isSelected ? 'text-gm-gold' : 'text-slate-200'}`}>
                    {player.realName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                    {player.characters.length} personnage{player.characters.length > 1 ? 's' : ''}
                </p>
            </div>
            <button
                onClick={onToggleOnline}
                className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all border z-10 ${
                    player.isOnline 
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20' 
                    : 'text-slate-600 border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:text-slate-400'
                }`}
                title={player.isOnline ? "Passer Hors Ligne" : "Passer En Ligne"}
            >
                {player.isOnline ? 'En ligne' : 'Hors ligne'}
            </button>
        </div>
    );
};

export default PlayerRoster;
