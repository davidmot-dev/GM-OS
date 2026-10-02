import React, { useState } from 'react';
import { useNPCStore } from '../useNPCStore';
import { AudioLines, Save, Sword, FileText, Share2, User, MapPin, Package, Zap, Quote, Star, Eye, Sparkles, Skull, Database, Lock } from 'lucide-react';
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
import { useRegimeDInterface } from '../../session/hooks/useRegimeDInterface';

const NPCCard: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { currentEntity, saveToMemo, isGenerating, selectAvatar, generateAvatar, isGeneratingAIAvatar, toggleDeadStatus, setVoiceProfile } = useNPCStore();
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const regime = useRegimeDInterface();
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

    /*
      **Le résultat de la maquette retenue — refonte, phase 4, L4, étape 2
      (2026-10-02).** Le portrait et le nom en tête ; **les champs du tirage en
      blocs titrés**, du nom même que leur donne la table ; **les notes privées
      du meneur à part**, marquées non projetées ; et **toutes les actions
      réelles avec leur libellé** — la moitié n'étaient que des icônes. Le
      panneau « Paramètres du tirage » de la maquette est inventé : il n'est
      pas repris.

      À la table, les textes grandissent : le résultat se lit de loin.
    */
    const grand = regime.aLaTable;
    const projeter = () => {
        const projected = { ...currentEntity, subtitle: currentEntity.category };
        useImageStore.getState().projectEntity(projected);
        gmToast(t('npc.card.project_success', { name: currentEntity.name }));
    };
    const action = 'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-ui-10 font-black uppercase tracking-wide leading-tight transition-all active:scale-[0.98] disabled:opacity-40';
    const neutre = `${action} border-app-border bg-app-surface/70 text-app-text hover:border-accent/50 hover:text-accent`;
    const estPersonneOuLieu = currentEntity.category === 'npcs' || currentEntity.category === 'places';

    return (
        <div className={`w-full ${grand ? 'max-w-6xl' : 'max-w-4xl'} bg-app-surface/80 border border-app-border/50 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col gap-5 p-6 backdrop-blur-md group animate-in fade-in zoom-in duration-500 font-sans`}>
            {/* L'en-tête : le portrait, la catégorie, le nom */}
            <div className="flex items-start gap-6">
                <button
                    style={{
                        transform: `scale(${voiceScale})`,
                        boxShadow: voiceGlow,
                    }}
                    className={`${grand ? 'w-52 h-60' : 'w-40 h-48'} shrink-0 rounded-2xl bg-app-bg/50 border-2 ${currentEntity?.isDead ? 'border-etat-danger/50' : 'border-accent/30'} flex items-center justify-center text-accent shadow-glow-accent transition-all duration-75 hover:border-accent overflow-hidden group/avatar relative`}
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
                                className={`relative z-10 w-full h-full object-cover ${currentEntity?.isDead ? 'grayscale contrast-125 brightness-75' : ''}`}
                            />
                        </>
                    ) : (
                        React.cloneElement(getIcon() as React.ReactElement<{ size?: number; className?: string }>, { size: 64, className: currentEntity?.isDead ? 'grayscale opacity-50' : '' })
                    )}

                    {currentEntity?.isDead && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-etat-danger/20 backdrop-grayscale-[0.5]">
                            <div className="bg-etat-danger text-app-bg text-ui-10 font-black px-2 py-0.5 rounded shadow-lg shadow-etat-danger/50 uppercase tracking-tighter rotate-[-10deg] border border-etat-danger/50">
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

                <div className="min-w-0 flex-1 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-ui-10 font-black uppercase tracking-widest text-accent">
                        {React.cloneElement(getIcon() as React.ReactElement<{ size?: number }>, { size: 12 })}
                        {t(`npc.categories.${currentEntity.category}`)}
                    </span>
                    <h1 className={`mt-3 ${grand ? 'text-6xl' : 'text-4xl'} font-display font-black tracking-tight leading-none break-words transition-colors ${currentEntity.isDead ? 'text-app-subtle line-through decoration-etat-danger/50' : 'text-app-text'}`}>
                        {currentEntity.name}
                    </h1>
                </div>
            </div>

            {/* Les champs du tirage, en blocs titrés venus de la table */}
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentEntity.fields).map(([key, value]) => (
                    <div
                        key={key}
                        className={`rounded-xl border border-app-border/60 bg-app-bg/40 p-4 ${String(value).length > 90 ? 'col-span-2' : ''}`}
                    >
                        <span className="text-ui-10 uppercase font-black tracking-widest text-accent">{key}</span>
                        <p className={`mt-1.5 ${grand ? 'text-lg' : 'text-sm'} text-app-text font-medium leading-relaxed`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Les notes privées du meneur, à part : elles ne partent jamais aux joueurs */}
            {currentEntity.gmNotes?.trim() && (
                <div className="rounded-xl border border-etat-danger/40 bg-etat-danger/5 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-ui-10 uppercase font-black tracking-widest text-etat-danger">
                            <Lock size={12} /> {t('npc.agencement.notes_privees')}
                        </span>
                        <span className="rounded border border-etat-danger/40 px-1.5 text-ui-9 font-black uppercase tracking-widest text-etat-danger/80">
                            {t('npc.agencement.non_projetees')}
                        </span>
                    </div>
                    <p className="mt-1.5 text-sm text-app-text/90 leading-relaxed">{currentEntity.gmNotes}</p>
                </div>
            )}

            {/* Les actions réelles du tirage, avec leur libellé */}
            <div className="flex flex-col gap-2 border-t border-app-border pt-4">
                <span className="text-ui-9 uppercase font-black tracking-widest text-app-subtle">{t('npc.agencement.actions')}</span>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-2">
                    <button onClick={projeter} className={`${action} border-accent bg-accent text-app-on-accent hover:brightness-110`}>
                        <Eye size={16} /> {t('npc.card.project')}
                    </button>
                    {currentEntity.category === 'npcs' && (
                        <button onClick={handleAddToCombat} className={`${action} border-etat-danger bg-etat-danger text-app-bg hover:bg-etat-danger/90`}>
                            <Sword size={16} /> {t('npc.card.combat_add')}
                        </button>
                    )}
                    {estPersonneOuLieu && (
                        <button onClick={handleAddToMap} className={neutre}>
                            <MapPin size={16} /> {t('npc.card.map_add')}
                        </button>
                    )}
                    <button
                        onClick={() => setShowRecipientSelector(true)}
                        title={t('npc.card.give_tooltip')}
                        className={currentEntity.category === 'items'
                            ? `${action} border-etat-alerte bg-etat-alerte text-app-bg hover:bg-etat-alerte/90`
                            : neutre}
                    >
                        <Package size={16} /> {t('npc.card.give_to')}
                    </button>
                    <button onClick={handleAddToFavorite} className={neutre}>
                        <Star size={16} /> {t('npc.card.favorite_add')}
                    </button>
                    <button onClick={saveToMemo} className={neutre}>
                        <Save size={16} /> {t('npc.card.save_memo')}
                    </button>
                    <button
                        onClick={handleAddToJournal}
                        title={isSessionActive ? t('npc.card.wiki_export') : t('npc.card.wiki_export_hint')}
                        className={neutre}
                    >
                        <FileText size={16} /> {t('npc.card.wiki_export')}
                    </button>
                    {estPersonneOuLieu && (
                        <button
                            onClick={handleSaveToGallery}
                            title={activeCampaignId ? t('npc.card.gallery_export', { name: currentEntity.name }) : t('npc.card.gallery_error_session')}
                            className={neutre}
                        >
                            <Database size={16} /> {t('npc.agencement.galerie')}
                        </button>
                    )}
                    {/*
                        **Le profil se range sur la fiche.** Il n'écrivait que
                        dans l'état global du rack : générer une voix pour un
                        second PNJ écrasait la première, sans moyen d'y revenir.
                    */}
                    <button
                        onClick={async () => {
                            const profil = await generateVoiceProfile(depuisUnPnjDeNpcOs(currentEntity));
                            if (profil) setVoiceProfile(currentEntity.id, profil);
                        }}
                        title={t('npc.card.voice_gen_tooltip')}
                        className={neutre}
                    >
                        <AudioLines size={16} /> {t('npc.card.voice_gen')}
                    </button>
                    {/* Le rappel n'apparaît que s'il y a quelque chose à rappeler. */}
                    {currentEntity.voiceProfile && (
                        <button
                            onClick={() => {
                                appliquerProfil(currentEntity.voiceProfile!);
                                gmToast(`Voix de ${currentEntity.name} rappelée.`, 'info');
                            }}
                            title="Reposer ce profil vocal sur le rack"
                            className={neutre}
                        >
                            <AudioLines size={16} /> {t('npc.agencement.sa_voix')}
                        </button>
                    )}
                    <button onClick={() => setShowAIPrompt(true)} title={t('npc.card.ai_generate')} className={neutre}>
                        <Sparkles size={16} /> {t('npc.agencement.illustration')}
                    </button>
                    <button
                        onClick={() => toggleDeadStatus(currentEntity.id)}
                        className={currentEntity.isDead
                            ? `${action} border-etat-danger bg-etat-danger/15 text-etat-danger`
                            : `${action} border-etat-danger/30 bg-etat-danger/5 text-etat-danger/80 hover:bg-etat-danger/15 hover:text-etat-danger`}
                    >
                        <Skull size={16} /> {currentEntity.isDead ? t('npc.card.revive') : t('npc.card.mark_dead')}
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
