import React, { useState } from 'react';
import { useNPCStore } from '../useNPCStore';
import { Save, Sword, FileText, Share2, User, MapPin, Package, Zap, Quote, Star, Eye, Sparkles } from 'lucide-react';
import { useCombatStore } from '../../combat/useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { gmAlert } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { useFavoriteStore, type FavoriteType } from '../../favorite/useFavoriteStore';
import { useImageStore } from '../../image/useImageStore';
import { useVoiceStore } from '../../voice/useVoiceStore';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { RecipientSelector } from '../../session/components/RecipientSelector';

const NPCCard: React.FC = () => {
    const { currentEntity, saveToMemo, isGenerating, selectAvatar, generateAvatar, isGeneratingAIAvatar } = useNPCStore();
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const { addCombatant } = useCombatStore();
    const { sessions, selectedSessionId, addWikiEntry, addLootToCharacter } = useSessionOSStore();
    const [showRecipientSelector, setShowRecipientSelector] = useState(false);
    const { addToken } = useMapStore();
    const { addFavorite } = useFavoriteStore();
    const { inputLevel, isSyncNPC, isActive } = useVoiceStore();
    
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
            <div className="text-center p-12 border-2 border-dashed border-app-border rounded-3xl text-slate-500 max-w-lg">
                <Share2 size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xl font-display uppercase tracking-widest italic">En attente de génération</p>
                <p className="text-sm mt-2 opacity-60">Sélectionnez un univers et cliquez sur le bouton de tirage</p>
            </div>
        );
    }

    // Ensure we handle local file paths for <img> src
    const avatarSrc = currentEntity.avatar
        ? (currentEntity.avatar.startsWith('http') || currentEntity.avatar.startsWith('blob:') || currentEntity.avatar.startsWith('file://') || currentEntity.avatar.startsWith('data:')
            ? currentEntity.avatar
            : `file:///${currentEntity.avatar.replace(/\\/g, '/')}`)
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
            gmToast(`${currentEntity.name} ajouté au Combat OS !`);
        } else {
            gmAlert("Seuls les PNJ peuvent être ajoutés au Combat OS");
        }
    };

    const handleAddToMap = () => {
        addToken({
            name: currentEntity!.name,
            avatar: avatarSrc || '',
            x: 200,
            y: 200,
            size: 1
        });
        gmToast(`${currentEntity!.name} ajouté à la Map`);
    };

    const handleAddToJournal = () => {
        if (!isSessionActive || !activeSession) {
            gmAlert("Aucune session active. Lancez une session dans le Cockpit pour exporter vers le Wiki.");
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

        gmToast(`${currentEntity.name} ajouté au Wiki de la session !`);
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
        gmToast(`${currentEntity.name} ajouté au Panthéon !`);
    };
    
    const handleGiveToPC = (playerId: string, characterId: string) => {
        if (!currentEntity) return;
        
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
        
        addLootToCharacter(playerId, characterId, lootString);
        setShowRecipientSelector(false);
    };

    const getIcon = () => {
        switch (currentEntity.category) {
            case 'npcs': return <User className="text-accent" />;
            case 'places': return <MapPin className="text-emerald-400" />;
            case 'items': return <Package className="text-amber-400" />;
            case 'events': return <Zap className="text-purple-400" />;
            case 'rumors': return <Quote className="text-rose-400" />;
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
                    className={`w-40 h-40 rounded-2xl bg-app-bg/50 border-2 border-accent/30 flex items-center justify-center text-accent shadow-glow-accent z-10 transition-all duration-75 hover:border-accent overflow-hidden group/avatar relative`}
                >
                    {avatarSrc ? (
                        <>
                            <img 
                                src={avatarSrc} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" 
                            />
                            <img 
                                src={avatarSrc} 
                                alt={currentEntity.name} 
                                className="relative z-10 w-full h-full object-contain" 
                            />
                        </>
                    ) : (
                        React.cloneElement(getIcon() as React.ReactElement<{ size?: number }>, { size: 64 })
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20 gap-4">
                        <div
                            onClick={(e) => { e.stopPropagation(); selectAvatar(); }}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
                            title="Importer un fichier"
                        >
                            <Share2 size={24} className="text-white" />
                        </div>
                        <div
                            onClick={(e) => { e.stopPropagation(); setShowAIPrompt(true); }}
                            className="p-2 bg-accent text-slate-950 rounded-full hover:scale-110 transition-all shadow-glow-accent cursor-pointer"
                            title="Générer par IA"
                        >
                            <Sparkles size={24} />
                        </div>
                    </div>
                    {isGeneratingAIAvatar && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                            <Sparkles size={32} className="text-accent animate-spin" />
                        </div>
                    )}
                </button>

                <div className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest text-accent/50 px-2 py-1 border border-accent/20 rounded bg-accent/5">
                    {currentEntity.category}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 flex-1">
                <h1 className="text-4xl font-display font-black text-white mb-6 tracking-tight border-b border-app-border pb-4">
                    {currentEntity.name}
                </h1>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                    {Object.entries(currentEntity.fields).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">{key}</span>
                            <span className="text-slate-200 font-medium leading-tight">{value}</span>
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
                                gmToast(`${currentEntity.name} projeté sur le Player Hub !`);
                            }
                        }}
                        className="p-2 bg-app-surface hover:bg-accent/20 text-slate-400 hover:text-accent transition-colors"
                        title="Projeter sur le Hub"
                    >
                        <Eye size={20} />
                    </button>
                    <button
                        onClick={handleAddToFavorite}
                        className="p-2 bg-app-surface hover:bg-amber-500/20 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                        title="Ajouter aux Favoris"
                    >
                        <Star size={20} />
                    </button>
                    <button
                        onClick={saveToMemo}
                        className="p-2 bg-app-surface hover:bg-app-bg/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title="Sauvegarder en Mémo"
                    >
                        <Save size={20} />
                    </button>
                    <button
                        onClick={handleAddToJournal}
                        className={`p-2 rounded-lg transition-all ${isSessionActive ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-app-surface text-slate-400 hover:text-white hover:bg-app-bg/50'}`}
                        title={isSessionActive ? "Exporter vers le Wiki de la Session" : "Ajouter au Wiki (Session requise)"}
                    >
                        <FileText size={20} />
                    </button>
                </div>

                <div className="flex gap-3">
                    {(currentEntity.category === 'npcs' || currentEntity.category === 'places') && (
                        <button
                            onClick={handleAddToMap}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                        >
                            <MapPin size={18} />
                            <span className="text-xs uppercase tracking-wider">Map</span>
                        </button>
                    )}

                    {currentEntity.category === 'npcs' && (
                        <button
                            onClick={handleAddToCombat}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Sword size={18} />
                        <span className="text-xs uppercase tracking-wider">Combat</span>
                    </button>
                    )}

                    <button
                        onClick={() => setShowRecipientSelector(true)}
                        className={`flex items-center gap-2 px-4 py-2 border font-bold rounded-xl transition-all hover:scale-105 active:scale-95 ${
                            currentEntity.category === 'items'
                            ? 'bg-amber-500 text-app-bg border-amber-400 shadow-glow-amber/20'
                            : 'bg-app-surface text-app-text/60 border-app-border/40 hover:text-accent hover:border-accent/40'
                        }`}
                        title="Donner cet objet à un personnage joueur"
                    >
                        <Package size={18} />
                        <span className="text-xs uppercase tracking-wider">Donner à...</span>
                    </button>
                </div>
            </div>

            {/* Recipient Selector Overlay */}
            {showRecipientSelector && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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
                title={`Illustration IA : ${currentEntity.name}`}
                placeholder="Ex: portrait cyberpunk, éclairage néon, cicatrices..."
                onGenerate={(instructions) => {
                    generateAvatar(instructions).then(() => setShowAIPrompt(false));
                }}
            />
        </div>
    );
};

export default NPCCard;
