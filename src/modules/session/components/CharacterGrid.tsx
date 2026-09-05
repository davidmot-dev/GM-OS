import React from 'react';
import { useTranslation } from 'react-i18next';
import { fractionDeVie, pointsDeVieApres, decrireLaSante } from '../../combat/logic/SanteDuCombattant';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmCustom } from '../../../stores/useModalStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { PlayerCharacter, Campaign } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { Heart, UserPlus, ChevronDown, Mail, Swords, Eye, Trash2 } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';

const CharacterGrid: React.FC<{ ignoreCampaignFilter?: boolean }> = ({ ignoreCampaignFilter = false }) => {
    const { t } = useTranslation(['modules']);
    const { players, selectedPlayerId, selectedCharacterId, campaigns, linkCharacterToCampaign, updateCharacterHP, setSelectedCharacter, sessions, activeCampaignId, addEntityToSession, removeEntityFromSession } = useSessionOSStore();
    
    const activeSession = sessions.find(s => s.status === 'active' && String(s.campaignId) === String(activeCampaignId));

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    const resolvedPlayerAvatar = useMediaUrl(selectedPlayer?.avatarUrl);

    if (!selectedPlayer) {
        return (
            <div className="flex-1 flex items-center justify-center text-app-text/20 bg-app-bg/20">
                <p className="italic text-sm">{t('modules:session.characters.select_hint')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-app-bg/20 overflow-y-auto custom-scrollbar border-r border-app-border/50">
            {/* Player Header */}
            <div className="p-6 border-b border-app-border flex items-center gap-5 bg-app-surface/60 backdrop-blur-sm sticky top-0 z-10">
                <div className="relative">
                    <img
                        src={resolvedPlayerAvatar || undefined}
                        alt={selectedPlayer.realName}
                        className="w-16 h-16 rounded-full bg-app-surface object-cover ring-2 ring-accent/40"
                    />
                    <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-app-bg ${selectedPlayer.isOnline ? 'bg-emerald-400' : 'bg-app-text/20'}`}></span>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-app-text">{selectedPlayer.realName}</h2>
                    {selectedPlayer.email && (
                        <div className="flex items-center gap-1.5 text-app-text/40 text-sm mt-0.5">
                            <Mail size={13} />
                            <span>{selectedPlayer.email}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${selectedPlayer.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-app-surface text-app-text/40'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedPlayer.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-app-text/20'}`}></span>
                            {selectedPlayer.isOnline ? t('modules:session.players.status_online') : t('modules:session.players.status_offline')}
                        </span>
                        <span className="text-xs text-app-text/20">
                            {t('modules:session.players.character_count', { count: selectedPlayer.characters.length })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Characters Section */}
            <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-app-text/60 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <span className="text-accent">⚔</span>
                        {ignoreCampaignFilter ? t('modules:session.characters.title_all') : t('modules:session.characters.title')}
                    </h3>
                    <span className="text-xs text-app-text/20">{t('modules:session.characters.total_suffix', { count: selectedPlayer.characters.length })}</span>
                </div>

                {selectedPlayer.characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-app-text/20 gap-3">
                        <p className="text-sm">{t('modules:session.characters.no_characters')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-6">
                        {selectedPlayer.characters
                            .filter(c => ignoreCampaignFilter || !activeCampaignId || c.campaignId === activeCampaignId)
                            .map(character => (
                            <CharacterCard
                                key={character.id}
                                character={character}
                                campaigns={campaigns}
                                playerId={selectedPlayer.id}
                                isSelected={selectedCharacterId === character.id}
                                onSelect={() => setSelectedCharacter(character.id)}
                                onLink={(campaignId) => linkCharacterToCampaign(selectedPlayer.id, character.id, campaignId)}
                                onHPChange={(delta) => { const n = pointsDeVieApres(character, delta); if (n !== null) updateCharacterHP(selectedPlayer.id, character.id, n); }}
                                onDelete={() => {
                                    if (window.confirm(t('modules:session.characters.delete_confirm', { name: character.name }))) {
                                        useSessionOSStore.getState().deleteCharacter(selectedPlayer.id, character.id);
                                    }
                                }}
                                activeSession={activeSession}
                                isProjectedInSession={activeSession?.sessionEntityIds?.includes(character.id)}
                                onToggleSession={(project) => {
                                    if (!activeSession) {
                                        gmToast(t('modules:session.characters.hub_no_session_error'), "error");
                                        return;
                                    }
                                    if (project) {
                                        addEntityToSession(activeSession.id, character.id);
                                        gmToast(t('modules:session.characters.hub_added', { name: character.name }));
                                    } else {
                                        removeEntityFromSession(activeSession.id, character.id);
                                        gmToast(t('modules:session.characters.hub_removed', { name: character.name }));
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-app-border flex justify-end">
                <button
                    onClick={() => gmCustom('character-add')}
                    className="flex items-center gap-2 bg-accent hover:brightness-110 text-app-bg font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-glow-accent/20 active:scale-95"
                >
                    <UserPlus size={16} />
                    {t('modules:session.characters.add_button')}
                </button>
            </div>
        </div>
    );
};

const CharacterCard: React.FC<{
    character: PlayerCharacter;
    campaigns: Campaign[];
    playerId: string;
    isSelected: boolean;
    onSelect: () => void;
    onLink: (campaignId: string | null) => void;
    onHPChange: (delta: number) => void;
    onDelete: () => void;
    activeSession?: import('../store/types').GameSession | null;
    isProjectedInSession?: boolean;
    onToggleSession: (project: boolean) => void;
}> = ({ character, campaigns, isSelected, onSelect, onLink, onHPChange, onDelete, activeSession, isProjectedInSession, onToggleSession }) => {
    const { t } = useTranslation(['modules']);
    const linkedCampaign = campaigns.find(c => c.id === character.campaignId);
    /*
      **`null` sans jauge, et la barre ne se dessine pas.** Ce calcul rendait
      `NaN` pour un personnage d'Alien, dont la santé n'est pas comptée en
      points — et une barre vide se lit comme un mourant.
    */
    const fraction = fractionDeVie(character);
    const hpPercent = fraction === null ? null : fraction * 100;
    const hpColor = hpPercent === null ? 'bg-app-border'
        : hpPercent > 60 ? 'bg-emerald-500' : hpPercent > 30 ? 'bg-amber-500' : 'bg-red-600';
    const resolvedPortrait = useMediaUrl(character.portraitUrl);

    return (
        <div className={`bg-app-surface/50 border rounded-xl overflow-hidden flex flex-col hover:border-app-border/80 transition-all group ${isSelected ? 'border-accent shadow-glow-accent/10' : 'border-app-border'}`}>
            {/* Portrait */}
            <div className="h-64 overflow-hidden relative bg-app-bg">
                {/* Blurred background for full appearance */}
                <img
                    src={resolvedPortrait || undefined}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110"
                />
                {/* Main image - centered and contained */}
                <img
                    src={resolvedPortrait || undefined}
                    alt={character.name}
                    className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/80 via-transparent to-transparent z-20"></div>
                {linkedCampaign && (
                    <span className="absolute top-2 right-2 bg-accent/90 text-app-bg text-ui-10 font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-30">
                        {linkedCampaign.name.length > 12 ? linkedCampaign.name.slice(0, 12) + '…' : linkedCampaign.name}
                    </span>
                )}
                {/* Delete Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 left-2 p-1.5 bg-black/40 hover:bg-red-600/80 text-white/40 hover:text-white rounded-lg backdrop-blur-md transition-all z-30 opacity-0 group-hover:opacity-100 shadow-xl"
                    title={t('modules:session.characters.delete_tooltip')}
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                    <h4 className="font-bold text-app-text text-sm leading-tight">{character.name}</h4>
                    <p className="text-app-text/40 text-xs mt-0.5">{character.classRace}</p>
                </div>

                {/* La barre de vie n'existe que si le jeu compte des points de vie.
                    Sans jauge, on montre l'état que le système décrit — « Brisé »,
                    « horloge 2/6 » — plutôt qu'une barre vide qui se lit comme un
                    mourant. */}
                {hpPercent === null ? (
                    <div className="flex items-center gap-1 text-app-text/40 text-xs">
                        <Heart size={11} className="text-app-text/20" />
                        <span>{decrireLaSante(character) ?? 'santé non chiffrée'}</span>
                    </div>
                ) : (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-app-text/40 text-xs">
                            <Heart size={11} className="text-rose-500" />
                            <span>{t('modules:session.characters.hp_label')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onHPChange(-1)} className="w-4 h-4 rounded bg-app-surface text-app-text/40 hover:text-red-400 hover:bg-app-border text-xs flex items-center justify-center transition-colors">−</button>
                            <span className="font-mono text-xs text-app-text/60">{character.hp}/{character.maxHp}</span>
                            <button onClick={() => onHPChange(1)} className="w-4 h-4 rounded bg-app-surface text-app-text/40 hover:text-emerald-400 hover:bg-app-border text-xs flex items-center justify-center transition-colors">+</button>
                        </div>
                    </div>
                    <div className="w-full bg-app-surface h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${hpColor}`} style={{ width: `${hpPercent}%` }}></div>
                    </div>
                </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-app-border/50">
                    <button 
                        onClick={onSelect}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${isSelected ? 'bg-accent text-app-bg border-accent' : 'border-accent/30 text-accent hover:bg-accent/10'}`}>
                        {t('modules:session.characters.sheet_btn')}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            useCombatStore.getState().addCombatant({
                                name: character.name,
                                init: 0,
                                hp: character.hp,
                                hpMax: character.maxHp,
                                avatar: character.tokenUrl || character.portraitUrl,
                                isPlayer: true,
                                faction: 'ally',
                                sourcePlayerId: character.id,
                                statuses: []
                            });
                            gmToast(t('modules:session.characters.combat_add_success', { name: character.name }));
                        }}
                        className="p-1.5 px-2.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
                        title={t('modules:session.characters.combat_btn')}
                    >
                        <Swords size={14} />
                        <span className="text-ui-10 font-bold uppercase">{t('modules:session.characters.combat_btn')}</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const projectedPJ = {
                                id: character.id,
                                name: character.name,
                                subtitle: character.classRace,
                                portraitUrl: character.portraitUrl,
                                avatar: character.tokenUrl || character.portraitUrl,
                                stats: {
                                    // Sans jauge, on ne projette pas de statistique
                                    // de santé plutôt que d'en projeter une fausse.
                                    ...(fractionDeVie(character) !== null
                                        ? { 'Santé': fractionDeVie(character)! * 100 }
                                        : {}),
                                }
                            };
                            useImageStore.getState().projectEntity(projectedPJ);
                            gmToast(t('modules:session.characters.project_success', { name: character.name }));
                        }}
                        className="p-1.5 rounded-lg border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-all flex items-center justify-center"
                        title={t('modules:session.characters.project_tooltip')}
                    >
                        <Eye size={14} />
                    </button>
                    {activeSession && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSession(!isProjectedInSession);
                            }}
                            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                                isProjectedInSession 
                                ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-glow-amber/20' 
                                : 'border-amber-500/30 text-amber-500/60 hover:bg-amber-500/10'
                            }`}
                            title={isProjectedInSession ? t('modules:session.characters.hub_remove') : t('modules:session.characters.hub_send')}
                        >
                            <UserPlus size={14} />
                        </button>
                    )}
                    <div className="relative flex-1">
                        <select
                            title="Lier à une campagne"
                            value={character.campaignId || ''}
                            onChange={e => onLink(e.target.value || null)}
                            className="w-full py-1.5 text-xs rounded-lg bg-app-surface border border-app-border text-app-text/40 hover:border-app-border/80 focus:ring-1 focus:ring-accent/50 focus:outline-none appearance-none pl-2 pr-6 transition-all cursor-pointer"
                        >
                            <option value="" className="bg-app-bg">{t('modules:session.characters.no_campaign')}</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id} className="bg-app-bg">{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-app-text/20 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterGrid;
