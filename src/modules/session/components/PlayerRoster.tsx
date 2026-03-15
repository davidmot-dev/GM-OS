import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmCustom } from '../../../stores/useModalStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { Player } from '../useSessionOSStore';
import { Search, UserPlus, Trash2 } from 'lucide-react';

const PlayerRoster: React.FC = () => {
    const { players, selectedPlayerId, setSelectedPlayer, togglePlayerOnline } = useSessionOSStore();
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = players.filter(p =>
        p.realName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-72 h-full bg-app-bg border-r border-app-border flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-5 border-b border-app-border">
                <h3 className="text-app-text font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    Roster des Joueurs
                </h3>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/40" />
                    <input
                        type="text"
                        placeholder="Rechercher un joueur..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-app-surface border border-app-border rounded-lg pl-9 pr-3 py-2 text-sm text-app-text/80 placeholder-app-text/20 focus:ring-1 focus:ring-accent/50 focus:outline-none"
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
                        onDelete={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer le joueur ${player.realName} et TOUS ses personnages ? Cette action est irréversible.`)) {
                                useSessionOSStore.getState().deletePlayer(player.id);
                            }
                        }}
                    />
                ))}
                {filtered.length === 0 && (
                    <p className="text-app-text/20 text-sm text-center p-4">Aucun joueur trouvé</p>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-app-border">
                <button
                    onClick={() => gmCustom('player-add')}
                    className="w-full flex items-center justify-center gap-2 border border-accent/40 text-accent hover:bg-accent/10 py-2.5 rounded-lg text-sm font-bold transition-all"
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
    onDelete: (e: React.MouseEvent) => void;
}> = ({ player, isSelected, onClick, onToggleOnline, onDelete }) => {
    const resolvedAvatar = useMediaUrl(player.avatarUrl);
    return (
        <div
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${isSelected
                ? 'bg-accent/10 border border-accent/30 shadow-glow-accent/5'
                : 'hover:bg-app-surface/60 border border-transparent'
                }`}
        >
            <div className="relative flex-shrink-0">
                <img
                    src={resolvedAvatar || undefined}
                    alt={player.realName}
                    className="w-10 h-10 rounded-full bg-app-surface object-cover border border-app-border"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-app-bg ${player.isOnline ? 'bg-emerald-400' : 'bg-app-text/20'}`}></span>
            </div>
            <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm truncate ${isSelected ? 'text-accent' : 'text-app-text/90'}`}>
                    {player.realName}
                </p>
                <p className="text-xs text-app-text/40 truncate">
                    {player.characters.length} personnage{player.characters.length > 1 ? 's' : ''}
                </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
                <button
                    onClick={onToggleOnline}
                    className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all border z-10 ${
                        player.isOnline 
                        ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20' 
                        : 'text-app-text/40 border-app-border bg-app-surface/50 hover:bg-app-surface hover:text-app-text/60'
                    }`}
                    title={player.isOnline ? "Passer Hors Ligne" : "Passer En Ligne"}
                >
                    {player.isOnline ? 'En ligne' : 'Hors ligne'}
                </button>
                <button
                    onClick={onDelete}
                    className="p-1 px-2 rounded-md border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Supprimer le joueur"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

export default PlayerRoster;
