import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmCustom } from '../../../stores/useModalStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { PlayerCharacter, Campaign } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { Heart, UserPlus, ChevronDown, Mail, Swords, Eye } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';

const CharacterGrid: React.FC = () => {
    const { players, selectedPlayerId, selectedCharacterId, campaigns, linkCharacterToCampaign, updateCharacterHP, setSelectedCharacter } = useSessionOSStore();

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    const resolvedPlayerAvatar = useMediaUrl(selectedPlayer?.avatarUrl);

    if (!selectedPlayer) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-600 bg-slate-950/20">
                <p className="italic text-sm">Sélectionnez un joueur dans le roster</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-slate-950/20 overflow-y-auto custom-scrollbar border-r border-slate-800/50">
            {/* Player Header */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-5 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
                <div className="relative">
                    <img
                        src={resolvedPlayerAvatar || undefined}
                        alt={selectedPlayer.realName}
                        className="w-16 h-16 rounded-full bg-slate-700 object-cover ring-2 ring-gm-gold/40"
                    />
                    <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 ${selectedPlayer.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedPlayer.realName}</h2>
                    {selectedPlayer.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
                            <Mail size={13} />
                            <span>{selectedPlayer.email}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${selectedPlayer.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedPlayer.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                            {selectedPlayer.isOnline ? 'En ligne' : 'Hors ligne'}
                        </span>
                        <span className="text-xs text-slate-600">
                            {selectedPlayer.characters.length} personnage{selectedPlayer.characters.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Characters Section */}
            <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-300 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                        <span className="text-gm-gold">⚔</span>
                        Personnages Actifs
                    </h3>
                    <span className="text-xs text-slate-600">{selectedPlayer.characters.length} au total</span>
                </div>

                {selectedPlayer.characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-3">
                        <p className="text-sm">Ce joueur n'a pas encore de personnages</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-6">
                        {selectedPlayer.characters.map(character => (
                            <CharacterCard
                                key={character.id}
                                character={character}
                                campaigns={campaigns}
                                playerId={selectedPlayer.id}
                                isSelected={selectedCharacterId === character.id}
                                onSelect={() => setSelectedCharacter(character.id)}
                                onLink={(campaignId) => linkCharacterToCampaign(selectedPlayer.id, character.id, campaignId)}
                                onHPChange={(delta) => updateCharacterHP(selectedPlayer.id, character.id, character.hp + delta)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 flex justify-end">
                <button
                    onClick={() => gmCustom('character-add')}
                    className="flex items-center gap-2 bg-gm-gold hover:bg-yellow-400 text-slate-900 font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-[0_0_20px_-4px_rgba(234,179,8,0.5)]"
                >
                    <UserPlus size={16} />
                    Ajouter un Personnage
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
}> = ({ character, campaigns, isSelected, onSelect, onLink, onHPChange }) => {
    const linkedCampaign = campaigns.find(c => c.id === character.campaignId);
    const hpPercent = (character.hp / character.maxHp) * 100;
    const hpColor = hpPercent > 60 ? 'bg-emerald-500' : hpPercent > 30 ? 'bg-amber-500' : 'bg-red-600';
    const resolvedPortrait = useMediaUrl(character.portraitUrl);

    return (
        <div className={`bg-slate-900/50 border rounded-xl overflow-hidden flex flex-col hover:border-slate-700 transition-all group ${isSelected ? 'border-gm-gold shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'border-slate-800'}`}>
            {/* Portrait */}
            <div className="h-64 overflow-hidden relative bg-slate-950">
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-20"></div>
                {linkedCampaign && (
                    <span className="absolute top-2 right-2 bg-gm-gold/90 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-30">
                        {linkedCampaign.name.length > 12 ? linkedCampaign.name.slice(0, 12) + '…' : linkedCampaign.name}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                    <h4 className="font-bold text-slate-100 text-sm leading-tight">{character.name}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{character.classRace}</p>
                </div>

                {/* HP Bar */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                            <Heart size={11} className="text-rose-500" />
                            <span>Points de Vie</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => onHPChange(-1)} className="w-4 h-4 rounded bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 text-xs flex items-center justify-center transition-colors">−</button>
                            <span className="font-mono text-xs text-slate-300">{character.hp}/{character.maxHp}</span>
                            <button onClick={() => onHPChange(1)} className="w-4 h-4 rounded bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 text-xs flex items-center justify-center transition-colors">+</button>
                        </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${hpColor}`} style={{ width: `${hpPercent}%` }}></div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800/50">
                    <button 
                        onClick={onSelect}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${isSelected ? 'bg-gm-gold text-slate-950 border-gm-gold' : 'border-gm-gold/30 text-gm-gold hover:bg-gm-gold/10'}`}>
                        Fiche
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
                                sourcePlayerId: character.id,
                                statuses: []
                            });
                            gmToast(`${character.name} ajouté au combat !`);
                        }}
                        className="p-1.5 px-2.5 rounded-lg border border-gm-crimson/30 text-gm-crimson hover:bg-gm-crimson/10 transition-all flex items-center justify-center gap-1.5"
                        title="Ajouter au Combat"
                    >
                        <Swords size={14} />
                        <span className="text-[10px] font-bold uppercase">Combat</span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            useImageStore.getState().projectUrl(character.portraitUrl);
                            gmToast(`Image de ${character.name} projetée !`);
                        }}
                        className="p-1.5 rounded-lg border border-gm-cyan/30 text-gm-cyan hover:bg-gm-cyan/10 transition-all flex items-center justify-center"
                        title="Projeter l'image (Image-OS)"
                    >
                        <Eye size={14} />
                    </button>
                    <div className="relative flex-1">
                        <select
                            value={character.campaignId || ''}
                            onChange={e => onLink(e.target.value || null)}
                            className="w-full py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600 focus:ring-1 focus:ring-gm-gold/50 focus:outline-none appearance-none pl-2 pr-6 transition-all cursor-pointer"
                        >
                            <option value="">Aucune campagne</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterGrid;
