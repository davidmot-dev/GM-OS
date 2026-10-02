import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fractionDeVie, pointsDeVieApres, decrireLaSante } from '../../combat/logic/SanteDuCombattant';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmCustom } from '../../../stores/useModalStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { PlayerCharacter, Campaign, Player } from '../useSessionOSStore';
import { leVerrouDeLAncienJoueur } from '../logic/transfertDePersonnage';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { Heart, UserPlus, ChevronDown, Mail, Swords, Eye, Trash2, Camera } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';
import { MediaBrowser } from '../../../components/MediaBrowser';

const CharacterGrid: React.FC<{ ignoreCampaignFilter?: boolean }> = ({ ignoreCampaignFilter = false }) => {
    const { t } = useTranslation(['modules']);
    const { players, selectedPlayerId, selectedCharacterId, campaigns, linkCharacterToCampaign, updateCharacterHP, setSelectedCharacter, sessions, activeCampaignId, addEntityToSession, removeEntityFromSession, updatePlayer, transfererLePersonnage, connectedCharacters } = useSessionOSStore();
    
    const activeSession = sessions.find(s => s.status === 'active' && String(s.campaignId) === String(activeCampaignId));

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);

    /*
      **Le transfert d'un PJ vers un autre joueur** — demandé par David le
      2026-09-14. Il vit ici et non dans `CharacterCard` : une carte ne connaît
      qu'un joueur, et il en faut deux.

      ⚠️ **On prévient quand l'ancien joueur le tient encore.** `connectedCharacters`
      n'est pas un champ qu'on écrit : c'est le reflet des appareils connectés,
      recalculé à chaque changement de la liste des clients. Le transfert ne peut
      donc pas le défaire — *tranché avec David : on le dit, on ne l'arrache pas.*
    */
    const transferer = (personnageId: string, nom: string, versJoueurId: string) => {
        const source = players.find(p => p.id === selectedPlayerId);
        const cible = players.find(p => p.id === versJoueurId);
        if (!source || !cible) return;

        if (!window.confirm(t('modules:session.characters.transfer_confirm', {
            name: nom, de: source.realName, vers: cible.realName,
        }))) return;

        const tenuPar = leVerrouDeLAncienJoueur(connectedCharacters, personnageId);
        const refus = transfererLePersonnage(source.id, cible.id, personnageId);

        if (refus === 'meme-joueur' || refus === 'deja-present') {
            gmToast(t('modules:session.characters.transfer_refused_same'), 'error');
            return;
        }
        if (refus !== null) {
            gmToast(t('modules:session.characters.transfer_refused_missing'), 'error');
            return;
        }

        /*
          La sélection vise un personnage **chez le joueur ouvert**. Le
          personnage parti, la fiche de droite ne trouve plus rien et affiche son
          invite — un écran vide sans qu'on ait rien fermé. On relâche donc la
          sélection avec lui.
        */
        if (selectedCharacterId === personnageId) setSelectedCharacter(null);

        gmToast(t('modules:session.characters.transfer_done', { name: nom, vers: cible.realName }));
        if (tenuPar) {
            gmToast(t('modules:session.characters.transfer_still_connected', {
                name: nom, de: source.realName, vers: cible.realName,
            }), 'info');
        }
    };
    const resolvedPlayerAvatar = useMediaUrl(selectedPlayer?.avatarUrl);
    const [choixDuPortrait, setChoixDuPortrait] = useState(false);

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
                {/*
                  **Le grand portrait change l'image, comme la vignette du roster.**

                  Le geste existait depuis toujours — sur la vignette de 40 px de
                  la liste de gauche, derrière un survol. *Mais c'est ici qu'on
                  clique* : David a demandé la fonctionnalité en regardant cet
                  écran, où le seul portrait visible ne répondait pas.
                  (2026-09-09)

                  ⚠️ Deux portes vers le même geste, et c'est voulu : le magasin
                  reste le seul écrivain (`updatePlayer`), les deux écrans ne font
                  que le demander.
                */}
                <div
                    className="relative group/portrait cursor-pointer"
                    onClick={() => setChoixDuPortrait(true)}
                    title={t('modules:session.players.avatar_change_title')}
                >
                    {resolvedPlayerAvatar ? (
                        <img
                            src={resolvedPlayerAvatar}
                            alt={selectedPlayer.realName}
                            className="w-16 h-16 rounded-full bg-app-surface object-cover ring-2 ring-accent/40 group-hover/portrait:opacity-40 transition-opacity"
                        />
                    ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-app-surface-2 text-lg font-black text-app-muted ring-2 ring-accent/40 group-hover/portrait:opacity-40">
                            {selectedPlayer.realName.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]?.toUpperCase()).join('')}
                        </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/portrait:opacity-100 transition-opacity text-app-text pointer-events-none">
                        <Camera size={22} />
                    </div>
                    <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-app-bg ${selectedPlayer.isOnline ? 'bg-etat-succes' : 'bg-app-text/20'}`}></span>
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
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${selectedPlayer.isOnline ? 'bg-etat-succes/10 text-etat-succes' : 'bg-app-surface text-app-text/40'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedPlayer.isOnline ? 'bg-etat-succes animate-pulse' : 'bg-app-text/20'}`}></span>
                            {/* L'état en clair : « hors ligne » seul ne disait pas
                                que c'est la tablette qui manque. */}
                            {selectedPlayer.isOnline ? t('modules:session.players.agencement.en_ligne') : t('modules:session.players.agencement.hors_ligne')}
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
                                autresJoueurs={players.filter(p => p.id !== selectedPlayer.id)}
                                onTransferer={(versJoueurId) => transferer(character.id, character.name, versJoueurId)}
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
                    className="flex items-center gap-2 bg-accent hover:brightness-110 text-app-on-accent font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-glow-accent/20 active:scale-95"
                >
                    <UserPlus size={16} />
                    {t('modules:session.characters.add_button')}
                </button>
            </div>

            <MediaBrowser
                isOpen={choixDuPortrait}
                onClose={() => setChoixDuPortrait(false)}
                onSelect={(mediaId) => {
                    updatePlayer(selectedPlayer.id, { avatarUrl: mediaId });
                    setChoixDuPortrait(false);
                }}
                allowedTypes={['image']}
                title={t('modules:session.players.avatar_change_title')}
            />
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
    /** Ceux vers qui ce personnage peut partir — le porteur actuel en est retiré. */
    autresJoueurs: Player[];
    onTransferer: (versJoueurId: string) => void;
}> = ({ character, campaigns, isSelected, onSelect, onLink, onHPChange, onDelete, activeSession, isProjectedInSession, onToggleSession, autresJoueurs, onTransferer }) => {
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
        : hpPercent > 60 ? 'bg-etat-succes' : hpPercent > 30 ? 'bg-etat-alerte' : 'bg-etat-danger';
    const resolvedPortrait = useMediaUrl(character.portraitUrl);

    return (
        <div className={`bg-app-surface/50 border rounded-xl overflow-hidden flex flex-col hover:border-app-border/80 transition-all group ${isSelected ? 'border-accent shadow-glow-accent/10' : 'border-app-border'}`}>
            {/*
              **Le portrait et le nom en tête, la vie en gros** — refonte, L5,
              étape 2. Le portrait de 256 px poussait les gestes hors de vue.
            */}
            <div className="flex items-start gap-3 p-4 pb-0">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-app-border bg-app-surface-2">
                    {resolvedPortrait
                        ? <img src={resolvedPortrait} alt={character.name} className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center text-app-subtle"><UserPlus size={22} strokeWidth={1.5} /></span>}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="font-display text-base font-bold leading-tight text-app-text">{character.name}</h4>
                    {character.classRace && <p className="mt-0.5 text-xs text-app-muted">{character.classRace}</p>}
                    {linkedCampaign && (
                        <span className="mt-1.5 inline-block max-w-full truncate rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-ui-10 font-black uppercase tracking-wider text-accent">
                            {linkedCampaign.name}
                        </span>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-app-subtle transition-all hover:bg-etat-danger/10 hover:text-etat-danger"
                    title={t('modules:session.characters.delete_tooltip')}
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3 flex-1">

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
                <div className="flex flex-col gap-2 rounded-lg border border-app-border bg-app-bg/40 p-3">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                            <Heart size={13} className="text-etat-danger" />{t('modules:session.characters.hp_label')}
                        </span>
                        {/* − / + en gros : à la table, on vise un bouton de 16 px
                            sans le voir. */}
                        <div className="ml-auto flex items-center gap-2">
                            <button onClick={() => onHPChange(-1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-app-border bg-app-surface text-lg font-black text-app-text transition-colors hover:border-etat-danger/50 hover:text-etat-danger" title="−1">−</button>
                            <span className="min-w-[5rem] text-center font-display text-xl font-bold text-app-text">{character.hp} / {character.maxHp}</span>
                            <button onClick={() => onHPChange(1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-app-border bg-app-surface text-lg font-black text-app-text transition-colors hover:border-etat-succes/50 hover:text-etat-succes" title="+1">+</button>
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
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${isSelected ? 'bg-accent text-app-on-accent border-accent' : 'border-accent/30 text-accent hover:bg-accent/10'}`}>
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
                        className="p-1.5 px-2.5 rounded-lg border border-etat-danger/30 text-etat-danger hover:bg-etat-danger/10 transition-all flex items-center justify-center gap-1.5"
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
                        className="p-1.5 rounded-lg border border-etat-info/30 text-etat-info hover:bg-etat-info/10 transition-all flex items-center justify-center"
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
                                ? 'bg-etat-alerte/20 border-etat-alerte text-etat-alerte shadow-glow-amber/20' 
                                : 'border-etat-alerte/30 text-etat-alerte/60 hover:bg-etat-alerte/10'
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

                {/*
                  **Changer de joueur.** Même grammaire que le choix de campagne
                  juste au-dessus — mais sur sa propre ligne : les deux listes
                  côte à côte sur une carte de cette largeur ne laisseraient
                  lire ni l'une ni l'autre.

                  ⚠️ **C'est un geste, pas un état** : la liste revient sur son
                  intitulé après chaque usage (`value=""`). Une liste qui
                  garderait le nom choisi se lirait comme *« ce personnage
                  appartient à… »*, alors que le porteur, c'est la colonne de
                  gauche qui le dit.
                */}
                <div className="relative">
                    <select
                        title={t('modules:session.characters.transfer_title')}
                        value=""
                        disabled={autresJoueurs.length === 0}
                        onChange={e => { if (e.target.value) onTransferer(e.target.value); }}
                        className="w-full py-1.5 text-xs rounded-lg bg-app-surface border border-app-border text-app-text/40 hover:border-app-border/80 focus:ring-1 focus:ring-accent/50 focus:outline-none appearance-none pl-2 pr-6 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <option value="" className="bg-app-bg">
                            {autresJoueurs.length === 0
                                ? t('modules:session.characters.transfer_no_other_player')
                                : t('modules:session.characters.transfer_placeholder')}
                        </option>
                        {autresJoueurs.map(j => (
                            <option key={j.id} value={j.id} className="bg-app-bg">{j.realName}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-app-text/20 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

export default CharacterGrid;
