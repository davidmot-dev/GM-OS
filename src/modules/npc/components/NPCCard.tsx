import React, { useState } from 'react';
import { useNPCStore } from '../useNPCStore';
import { AudioLines, Save, Sword, FileText, Share2, User, MapPin, Package, Zap, Quote, Star, Eye, Sparkles, Skull, Database } from 'lucide-react';
import { useCombatStore } from '../../combat/useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { gmAlert } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { useFavoriteStore, type FavoriteType } from '../../favorite/useFavoriteStore';
import { useImageStore } from '../../image/useImageStore';
import { useVoiceStore } from '../../voice/useVoiceStore';
import { depuisUnPnjDeNpcOs } from '../../voice/logic/personnageAVoix';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { useJournalStore } from '../../journal/useJournalStore';
import { RecipientSelector } from '../../session/components/RecipientSelector';
import { useTranslation } from 'react-i18next';

const NPCCard: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { currentEntity, saveToMemo, isGenerating, selectAvatar, generateAvatar, isGeneratingAIAvatar, toggleDeadStatus, setVoiceProfile } = useNPCStore();
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const { addCombatant } = useCombatStore();
    const { 
        sessions, 
        selectedSessionId, 
        addWikiEntry, 
        addLootToCharacter, 
        players, 
        entities, 
        addEntity, 
        addAtlasMap, 
        activeCampaignId 
    } = useSessionOSStore();
    const [showRecipientSelector, setShowRecipientSelector] = useState(false);
    const { addToken } = useMapStore();
    const { addFavorite } = useFavoriteStore();
    const { inputLevel, isSyncNPC, isActive, generateVoiceProfile, appliquerProfil } = useVoiceStore();
    
    // Check if session is active
    const activeSession = sessions.find(s => s.id === selectedSessionId);
    const isSessionActive = activeSession?.status === 'active';
    
    // Voice Sync Animation values
    const syncActive = isSyncNPC && isActive && inputLevel > 0.05;
    const voiceScale = syncActive ? 1 + (inputLevel * 0.1) : 1;
    const voiceGlow = syncActive ? `0 0 ${inputLevel * 30}px rgba(6, 182, 212, ${inputLevel})` : 'none';

    if (isGenerating) {
        return (
            <div className="w-full max-w-2xl aspect-[3/4] rounded-3xl border-2 border-app-border bg-app-bg/50 flex flex-col items-center justify-center gap-6 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-app-surface" />
                <div className="h-8 w-64 bg-app-surface rounded-lg" />
                <div className="h-32 w-full max-w-md bg-app-surface rounded-lg mx-8" />
            </div>
        );
    }

    if (!currentEntity) {
        return (
            <div className="text-center p-12 border-2 border-dashed border-app-border rounded-3xl text-app-subtle max-w-lg">
                <Share2 size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl font-display uppercase tracking-widest italic">{t('npc.card.waiting_title')}</p>
                <p className="text-sm mt-2 opacity-60">{t('npc.card.waiting_desc')}</p>
            </div>
        );
    }

    // Ensure we handle local file paths via gmos:// protocol for Electron security
    const avatarSrc = currentEntity.avatar
        ? (currentEntity.avatar.startsWith('http') || currentEntity.avatar.startsWith('blob:') || currentEntity.avatar.startsWith('gmos://') || currentEntity.avatar.startsWith('data:')
            ? currentEntity.avatar
            : `gmos://media/${currentEntity.avatar.replace(/^file:\/\/\//, '').replace(/\\/g, '/')}`)
        : null;

    const handleAddToCombat = () => {
        if (currentEntity.category === 'npcs') {
            addCombatant({
                name: currentEntity.name,
                hp: 10,
                hpMax: 10,
                init: Math.floor(Math.random() * 20) + 1,
                isPlayer: false,
                avatar: avatarSrc || undefined,
                statuses: [],
                faction: 'enemy' // Default to enemy for Combat OS addition
            });
            gmToast(t('npc.card.combat_success', { name: currentEntity.name }));
        } else {
            gmAlert(t('npc.card.combat_error_npcs'));
        }
    };

    const handleAddToMap = () => {
        addToken({
            sourceEntityId: currentEntity!.id,
            name: currentEntity!.name,
            avatar: avatarSrc || '',
            x: 200,
            y: 200,
            size: 1
        });
        gmToast(t('npc.card.map_success', { name: currentEntity!.name }));
    };

    const handleAddToJournal = () => {
        if (!isSessionActive || !activeSession) {
            gmAlert(t('npc.card.wiki_error_session'));
            return;
        }

        const wikiContent = Object.entries(currentEntity.fields)
            .map(([k, v]) => `**${k}**: ${v}`)
            .join('\n\n');

        addWikiEntry({
            campaignId: activeSession.campaignId,
            title: currentEntity.name,
            content: `## Détails du PNJ\n\n${wikiContent}\n\n---\n*Généré via NPC OS*`,
            category: currentEntity.category === 'npcs' ? 'npc' : 'other',
            tags: [currentEntity.category, 'npc-os', 'journal'],
            imageUrls: avatarSrc ? [avatarSrc] : [],
            linkedEntityIds: []
        });

        gmToast(t('npc.card.wiki_export_success', { name: currentEntity.name }));
    };

    const handleAddToFavorite = () => {
        if (!currentEntity) return;

        let favType: FavoriteType = 'lore';
        if (currentEntity.category === 'npcs') favType = 'npc';
        else if (currentEntity.category === 'places') favType = 'place';
        else if (currentEntity.category === 'items') favType = 'item';

        addFavorite({
            type: favType,
            name: currentEntity.name,
            subtitle: currentEntity.category,
            imageUrl: avatarSrc || undefined,
            attributes: currentEntity.fields,
            lore: `Generated from NPC OS on ${new Date().toLocaleDateString()}`,
            isStarred: false
        });
        gmToast(t('npc.card.favorite_success', { name: currentEntity.name }));
    };
    
    const handleGiveToPC = (playerId: string, characterId: string) => {
        if (!currentEntity) return;
        
        // Find recipient name for Journal
        const player = players.find(p => p.id === playerId);
        const character = entities.find(e => e.id === characterId);
        const recipientName = character?.name || player?.realName || "un PJ";

        let lootString = "";
        
        // If it's an item, format it with markdown for better readability
        if (currentEntity.category === 'items') {
            lootString = `**${currentEntity.name}**\n`;
            
            // Try to find a description or effect in fields or gmNotes
            const desc = currentEntity.fields['Description'] || currentEntity.fields['Effet'] || currentEntity.fields['Effect'] || currentEntity.gmNotes;
            if (desc) lootString += `_${desc}_\n`;
            
            // Add other technical fields
            const details = Object.entries(currentEntity.fields)
                .filter(([k]) => !['Description', 'Effet', 'Effect'].includes(k))
                .map(([k, v]) => `**${k}**: ${v}`)
                .join(' | ');
            if (details) lootString += details;
        } else {
            // Default formatting for other categories
            const itemDetails = Object.entries(currentEntity.fields)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' | ');
            lootString = `${currentEntity.name} (${itemDetails})`;
        }

        /*
          **`SYSTEM`, donc `trace` : le don s'écrit au fil, jamais au résumé.**

          La question était ouverte depuis la revue des émetteurs du 2026-08-20 —
          donner un objet est une `trace` pendant que révéler un indice est de la
          `chronique`, et l'asymétrie sautait aux yeux. **Tranché par David le
          2026-08-21** : on peut écrire les dons d'objets dans le journal, mais
          ils n'entrent pas dans le résumé. Le type reste donc tel quel, et il
          n'y a rien à déclarer — `natureParDefaut('SYSTEM')` rend déjà `trace`.

          Les deux autres portes du même geste s'alignent dessus :
          `approveItemTransfer` d'un PJ à l'autre, et `assignLootToCharacter`
          depuis le butin de séance, qui n'écrivait rien du tout avant ce jour.
        */
        useJournalStore.getState().addEvent({
            type: 'SYSTEM',
            title: t('npc.card.give_journal_title', { name: currentEntity.name }),
            content: t('npc.card.give_journal_content', { 
                name: currentEntity.name, 
                category: currentEntity.category, 
                recipient: recipientName,
                details: lootString
            })
        });
        
        addLootToCharacter(playerId, characterId, lootString);
        setShowRecipientSelector(false);
    };

    const handleSaveToGallery = () => {
        if (!activeCampaignId) {
            gmAlert(t('npc.card.gallery_error_session'));
            return;
        }

        if (currentEntity!.category === 'npcs') {
            // Map NPC-OS to Session-OS Entity
            const description = Object.entries(currentEntity!.fields)
                .map(([k, v]) => `**${k}**: ${v}`)
                .join('\n');

            const hpStr = currentEntity!.fields['PV'] || currentEntity!.fields['HP'] || '10';
            const acStr = currentEntity!.fields['CA'] || currentEntity!.fields['AC'] || '10';
            const hp = parseInt(hpStr.toString());
            const ac = parseInt(acStr.toString());

            addEntity({
                name: currentEntity!.name,
                type: 'npc',
                role: 'neutral',
                status: currentEntity!.isDead ? 'dead' : 'alive',
                avatar: avatarSrc || '',
                hp: isNaN(hp) ? 10 : hp,
                maxHp: isNaN(hp) ? 10 : hp,
                /* Ni classe d'armure ni vitesse inventees : aucun pilote ne
                   declare l'une, personne ne lit l'autre. Le mecanisme de sante
                   est pose par `addEntity`, qui seul connait le pilote. */
                ac: isNaN(ac) ? 0 : ac,
                speed: 0,
                initiative: 0,
                description: description,
                roleplayingNotes: currentEntity!.gmNotes || '',
                gmSecretInfo: `Generated from NPC-OS (${currentEntity!.category})`,
                linkedMapIds: [],
                campaignId: activeCampaignId,
                isVisibleByPlayers: false,
                sheetData: currentEntity!.fields
            });
            gmToast(t('npc.card.gallery_export_success', { name: currentEntity!.name }));
        } else if (currentEntity!.category === 'places') {
            // Map NPC-OS to AtlasMap
            addAtlasMap({
                name: currentEntity!.name,
                fileUrl: avatarSrc || '',
                isVideo: false,
                type: 'region',
                narrativeDescription: Object.entries(currentEntity!.fields)
                    .map(([k, v]) => `**${k}**: ${v}`)
                    .join('\n'),
                gmNotes: currentEntity!.gmNotes || '',
                linkedEntities: [],
                campaignId: activeCampaignId,
                isVisited: false
            });
            gmToast(t('npc.card.gallery_export_success', { name: currentEntity!.name }));
        }
    };

    const getIcon = () => {
        switch (currentEntity.category) {
            case 'npcs': return <User className="text-accent" />;
            case 'places': return <MapPin className="text-gm-emerald" />;
            case 'items': return <Package className="text-gm-gold" />;
            case 'events': return <Zap className="text-gm-violet" />;
            case 'rumors': return <Quote className="text-gm-crimson" />;
            default: return <User />;
        }
    };

    return (
        <div className="w-full max-w-2xl bg-app-surface/80 border border-app-border/50 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col backdrop-blur-md group animate-in fade-in zoom-in duration-500 font-sans">
            {/* Header / Avatar Area */}
            <div className="h-48 bg-gradient-to-br from-accent/20 to-app-bg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-corrugation opacity-10" />

                <button
                    style={{ 
                        transform: `scale(${voiceScale})`,
                        boxShadow: voiceGlow,
                    }}
                    className={`w-40 h-40 rounded-2xl bg-app-bg/50 border-2 ${currentEntity?.isDead ? 'border-etat-danger/50' : 'border-accent/30'} flex items-center justify-center text-accent shadow-glow-accent z-10 transition-all duration-75 hover:border-accent overflow-hidden group/avatar relative`}
                >
                    {avatarSrc ? (
                        <>
                            <img 
                                src={avatarSrc} 
                                alt="" 
                                className={`absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 ${currentEntity?.isDead ? 'grayscale brightness-50' : ''}`} 
                            />
                            <img 
                                src={avatarSrc} 
                                alt={currentEntity.name} 
                                className={`relative z-10 w-full h-full object-contain ${currentEntity?.isDead ? 'grayscale contrast-125 brightness-75' : ''}`} 
                            />
                        </>
                    ) : (
                        React.cloneElement(getIcon() as React.ReactElement<{ size?: number; className?: string }>, { size: 64, className: currentEntity?.isDead ? 'grayscale opacity-50' : '' })
                    )}

                    {currentEntity?.isDead && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-etat-danger/20 backdrop-grayscale-[0.5]">
                            <div className="bg-etat-danger text-app-on-accent text-ui-10 font-black px-2 py-0.5 rounded shadow-lg shadow-etat-danger/50 uppercase tracking-tighter rotate-[-10deg] border border-etat-danger/50">
                                {t('npc.card.dead')}
                            </div>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-app-bg/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20 gap-4">
                        <div
                            onClick={(e) => { e.stopPropagation(); selectAvatar(); }}
                            className="p-2 bg-app-text/10 hover:bg-app-text/20 rounded-full transition-all cursor-pointer"
                            title={t('npc.card.ai_import_file')}
                        >
                            <Share2 size={24} className="text-app-text" />
                        </div>
                        <div
                            onClick={(e) => { e.stopPropagation(); setShowAIPrompt(true); }}
                            className="p-2 bg-accent text-app-on-accent rounded-full hover:scale-110 transition-all shadow-glow-accent cursor-pointer"
                            title={t('npc.card.ai_generate')}
                        >
                            <Sparkles size={24} />
                        </div>
                    </div>
                    {isGeneratingAIAvatar && (
                        <div className="absolute inset-0 bg-app-bg/60 backdrop-blur-sm flex items-center justify-center z-30">
                            <Sparkles size={32} className="text-accent animate-spin" />
                        </div>
                    )}
                </button>

                <div className="absolute top-4 right-4 flex gap-2 z-30">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleDeadStatus(currentEntity.id); }}
                        className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center shadow-lg ${
                            currentEntity.isDead 
                            ? 'bg-etat-danger border-etat-danger text-app-bg shadow-glow-rose scale-110' 
                            : 'bg-app-surface/90 border-app-border text-app-muted hover:text-etat-danger hover:border-etat-danger/50 hover:bg-app-surface'
                        }`}
                        title={currentEntity.isDead ? t('npc.card.revive') : t('npc.card.mark_dead')}
                    >
                        <Skull size={18} />
                    </button>
                    {/*
                        **Le profil se range sur la fiche.** Il n'écrivait que
                        dans l'état global du rack : générer une voix pour un
                        second PNJ écrasait la première, sans moyen d'y revenir.
                        Une voix qu'on doit refabriquer à chaque bascule n'est
                        pas un profil, c'est un réglage.
                    */}
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            const profil = await generateVoiceProfile(depuisUnPnjDeNpcOs(currentEntity));
                            if (profil) setVoiceProfile(currentEntity.id, profil);
                        }}
                        className="text-ui-10 uppercase font-bold tracking-widest text-etat-succes/80 px-2 py-1 border border-etat-succes/20 rounded bg-etat-succes/10 flex items-center gap-1 backdrop-blur-sm hover:bg-etat-succes/20 transition-colors"
                        title={t('npc.card.voice_gen_tooltip')}
                    >
                        <Sparkles size={10} />
                        {t('npc.card.voice_gen')}
                    </button>
                    {/* Le rappel n'apparaît que s'il y a quelque chose à
                        rappeler : un bouton qui reposerait un profil inexistant
                        remettrait le rack à des valeurs que personne n'a
                        choisies. */}
                    {currentEntity.voiceProfile && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                appliquerProfil(currentEntity.voiceProfile!);
                                gmToast(`Voix de ${currentEntity.name} rappelée.`, 'info');
                            }}
                            className="text-ui-10 uppercase font-bold tracking-widest text-gm-cyan/80 px-2 py-1 border border-gm-cyan/20 rounded bg-gm-cyan/10 flex items-center gap-1 backdrop-blur-sm hover:bg-gm-cyan/20 transition-colors"
                            title="Reposer ce profil vocal sur le rack"
                        >
                            <AudioLines size={10} />
                            Sa voix
                        </button>
                    )}
                    <div className="text-ui-10 uppercase font-bold tracking-widest text-accent/50 px-2 py-1 border border-accent/20 rounded bg-accent/5 flex items-center backdrop-blur-sm">
                        {t(`npc.categories.${currentEntity.category}`)}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 flex-1">
                <h1 className={`text-4xl font-display font-black mb-6 tracking-tight border-b border-app-border pb-4 transition-colors ${currentEntity.isDead ? 'text-app-subtle line-through decoration-etat-danger/50' : 'text-app-text'}`}>
                    {currentEntity.name}
                </h1>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                    {Object.entries(currentEntity.fields).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                            <span className="text-ui-10 uppercase font-bold text-app-subtle tracking-tighter">{key}</span>
                            <span className="text-app-text font-medium leading-tight">{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-app-bg/50 border-t border-app-border flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (currentEntity) {
                                // Convert NPCEntity to ProjectedEntity (already matches mostly)
                                const projected = {
                                    ...currentEntity,
                                    subtitle: currentEntity.category,
                                    // ensure fields are present
                                };
                                useImageStore.getState().projectEntity(projected);
                                gmToast(t('npc.card.project_success', { name: currentEntity.name }));
                            }
                        }}
                        className="p-2 bg-app-surface hover:bg-accent/20 text-app-muted hover:text-accent transition-colors"
                        title={t('npc.card.project')}
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        onClick={handleAddToFavorite}
                        className="p-2 bg-app-surface hover:bg-etat-alerte/20 rounded-lg text-app-muted hover:text-etat-alerte transition-colors"
                        title={t('npc.card.favorite_add')}
                    >
                        <Star size={20} />
                    </button>
                    <button
                        onClick={saveToMemo}
                        className="p-2 bg-app-surface hover:bg-app-bg/50 rounded-lg text-app-muted hover:text-app-text transition-colors"
                        title={t('npc.card.save_memo')}
                    >
                        <Save size={20} />
                    </button>
                    <button
                        onClick={handleAddToJournal}
                        className={`p-2 rounded-lg transition-all ${isSessionActive ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-app-surface text-app-muted hover:text-app-text hover:bg-app-bg/50'}`}
                        title={isSessionActive ? t('npc.card.wiki_export') : t('npc.card.wiki_export_hint')}
                    >
                        <FileText size={20} />
                    </button>
                    {(currentEntity.category === 'npcs' || currentEntity.category === 'places') && (
                        <button
                            onClick={handleSaveToGallery}
                            className={`p-2 rounded-lg transition-all ${activeCampaignId ? 'bg-etat-info/20 text-etat-info border border-etat-info/30 hover:bg-etat-info/30' : 'bg-app-surface text-app-muted hover:text-app-text hover:bg-app-bg/50'}`}
                            title={activeCampaignId ? t('npc.card.gallery_export', { name: currentEntity.name }) : t('npc.card.gallery_error_session')}
                        >
                            <Database size={20} />
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    {(currentEntity.category === 'npcs' || currentEntity.category === 'places') && (
                        <button
                            onClick={handleAddToMap}
                            className="flex items-center gap-2 px-4 py-2 bg-etat-succes/20 hover:bg-etat-succes/30 text-etat-succes border border-etat-succes/30 font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <MapPin size={18} />
                            <span className="text-xs uppercase tracking-wider">{t('npc.card.map_add')}</span>
                        </button>
                    )}

                    {currentEntity.category === 'npcs' && (
                        <button
                            onClick={handleAddToCombat}
                            className="flex items-center gap-2 px-4 py-2 bg-etat-danger hover:bg-etat-danger text-app-bg font-bold rounded-xl shadow-lg shadow-etat-danger/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Sword size={18} />
                        <span className="text-xs uppercase tracking-wider">{t('npc.card.combat_add')}</span>
                    </button>
                    )}

                    <button
                        onClick={() => setShowRecipientSelector(true)}
                        className={`flex items-center gap-2 px-4 py-2 border font-bold rounded-xl transition-all hover:scale-105 active:scale-95 ${
                            currentEntity.category === 'items'
                            ? 'bg-etat-alerte text-app-bg border-etat-alerte shadow-glow-amber/20'
                            : 'bg-app-surface text-app-text/60 border-app-border/40 hover:text-accent hover:border-accent/40'
                        }`}
                        title={t('npc.card.give_tooltip')}
                    >
                        <Package size={18} />
                        <span className="text-xs uppercase tracking-wider">{t('npc.card.give_to')}</span>
                    </button>
                </div>
            </div>

            {/* Recipient Selector Overlay */}
            {showRecipientSelector && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-app-bg/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <RecipientSelector 
                        onSelect={handleGiveToPC}
                        onCancel={() => setShowRecipientSelector(false)}
                    />
                </div>
            )}

            <AIPromptOverlay
                isOpen={showAIPrompt}
                onClose={() => setShowAIPrompt(false)}
                isGenerating={isGeneratingAIAvatar}
                title={t('npc.card.ai_illustration_title', { name: currentEntity.name })}
                placeholder={t('npc.card.ai_illustration_placeholder')}
                initialPrompt={currentEntity.suggestedPrompt}
                onGenerate={(instructions: string) => {
                    generateAvatar(instructions).then(() => setShowAIPrompt(false));
                }}
            />
        </div>
    );
};

export default NPCCard;

