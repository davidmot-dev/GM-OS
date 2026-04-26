import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmCustom } from '../../../stores/useModalStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { Player } from '../useSessionOSStore';
import { Search, UserPlus, Trash2, Camera } from 'lucide-react';
import { MediaBrowser } from '../../../components/MediaBrowser';

const PlayerRoster: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { players, selectedPlayerId, setSelectedPlayer, togglePlayerOnline, activeCampaignId, updatePlayer } = useSessionOSStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [mediaBrowserOpen, setMediaBrowserOpen] = useState(false);
    const [activePlayerIdForAvatar, setActivePlayerIdForAvatar] = useState<string | null>(null);

    const handleAvatarClick = (e: React.MouseEvent, playerId: string) => {
        e.stopPropagation();
        setActivePlayerIdForAvatar(playerId);
        setMediaBrowserOpen(true);
    };

    const handleMediaSelect = (url: string) => {
        if (activePlayerIdForAvatar) {
            updatePlayer(activePlayerIdForAvatar, { avatarUrl: url });
        }
        setMediaBrowserOpen(false);
    };

    const filtered = players.filter(p =>
        p.realName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-72 h-full bg-app-bg border-r border-app-border flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-5 border-b border-app-border">
                <h3 className="text-app-text font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    {t('modules:session.players.title')}
                </h3>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/40" />
                    <input
                        type="text"
                        placeholder={t('modules:session.players.search_placeholder')}
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
                        activeCampaignId={activeCampaignId}
                        onClick={() => setSelectedPlayer(player.id)}
                        onToggleOnline={(e) => {
                            e.stopPropagation();
                            togglePlayerOnline(player.id);
                        }}
                        onDelete={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t('modules:session.players.delete_confirm', { name: player.realName }))) {
                                useSessionOSStore.getState().deletePlayer(player.id);
                            }
                        }}
                        onAvatarClick={(e) => handleAvatarClick(e, player.id)}
                    />
                ))}
                {filtered.length === 0 && (
                    <p className="text-app-text/20 text-sm text-center p-4">{t('modules:session.players.no_results')}</p>
                )}
            </div>

            {/* Media Browser for Player Avatars */}
            <MediaBrowser
                isOpen={mediaBrowserOpen}
                onClose={() => setMediaBrowserOpen(false)}
                onSelect={handleMediaSelect}
                allowedTypes={['image']}
                title={t('modules:session.players.avatar_change_title')}
            />

            {/* Footer */}
            <div className="p-4 border-t border-app-border">
                <button
                    onClick={() => gmCustom('player-add')}
                    className="w-full flex items-center justify-center gap-2 border border-accent/40 text-accent hover:bg-accent/10 py-2.5 rounded-lg text-sm font-bold transition-all"
                >
                    <UserPlus size={16} />
                    {t('modules:session.players.add_button')}
                </button>
            </div>
        </div>
    );
};

const PlayerCard: React.FC<{ 
    player: Player; 
    isSelected: boolean; 
    activeCampaignId: string | null;
    onClick: () => void;
    onToggleOnline: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onAvatarClick: (e: React.MouseEvent) => void;
}> = ({ player, isSelected, activeCampaignId, onClick, onToggleOnline, onDelete, onAvatarClick }) => {
    const { t } = useTranslation(['modules']);
    const resolvedAvatar = useMediaUrl(player.avatarUrl);
    return (
        <div
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${isSelected
                ? 'bg-accent/10 border border-accent/30 shadow-glow-accent/5'
                : 'hover:bg-app-surface/60 border border-transparent'
                }`}
        >
            <div className="relative flex-shrink-0 group/avatar" onClick={onAvatarClick}>
                <img
                    src={resolvedAvatar || undefined}
                    alt={player.realName}
                    className="w-10 h-10 rounded-full bg-app-surface object-cover border border-app-border group-hover/avatar:opacity-40 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-accent">
                    <Camera size={16} />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-app-bg ${player.isOnline ? 'bg-emerald-400' : 'bg-app-text/20'}`}></span>
            </div>
            <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm truncate ${isSelected ? 'text-accent' : 'text-app-text/90'}`}>
                    {player.realName}
                </p>
                <p className="text-xs text-app-text/40 truncate">
                    {t('modules:session.players.character_count', { count: player.characters.filter(c => c.campaignId === activeCampaignId).length })}
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
                    title={player.isOnline ? t('modules:session.players.set_offline') : t('modules:session.players.set_online')}
                >
                    {player.isOnline ? t('modules:session.players.status_online') : t('modules:session.players.status_offline')}
                </button>
                <button
                    onClick={onDelete}
                    className="p-1 px-2 rounded-md border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title={t('modules:session.players.delete_tooltip')}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

export default PlayerRoster;
