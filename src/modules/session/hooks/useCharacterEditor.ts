import { useState, useEffect, useCallback } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { useMediaStore } from '../../../stores/useMediaStore';
import { resolveSheetTemplate } from '../logic/templateResolver';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { santeDeDepart, valeurDuChamp } from '../../combat/logic/SanteDuCombattant';
import type { Player, PlayerCharacter } from '../store/types';

export function useCharacterEditor() {
    const {
        players, selectedPlayerId, selectedCharacterId,
        customSheetTemplates, updateCharacterSheetData, updateCharacterVisuals, updateCharacterNarrative,
        generatePlayerPortrait, isGeneratingAIImage,
        updateCharacterHP, updateCharacterMaxHP,
        updateCharacterHubOptions,
        addInventoryItem, removeInventoryItem,
        campaigns, getActiveDriver
    } = useSessionOSStore();

    const { mediaList, getMediaBlob } = useMediaStore();

    const selectedPlayer = players.find((p: Player) => p.id === selectedPlayerId);
    const character = selectedPlayer?.characters.find((c: PlayerCharacter) => c.id === selectedCharacterId);

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const template = resolveSheetTemplate(character, campaigns, allTemplates);

    // Computes default data by reading from template schema and overlaying saved data
    const getInitialData = useCallback((): Record<string, string | number | boolean> => {
        if (!character || !template) return {};
        const out: Record<string, string | number | boolean> = {};
        for (const section of template.sections) {
            for (const field of section.fields) {
                const val = character.sheetData?.[field.id];
                out[field.id] = (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') ? val : field.defaultValue;
            }
        }
        return out;
    }, [character, template]);

    const [localData, setLocalData] = useState<Record<string, string | number | boolean>>(getInitialData);
    const [saved, setSaved] = useState(false);
    const [mediaBrowserTarget, setMediaBrowserTarget] = useState<'portrait' | 'token' | 'document' | null>(null);
    const [description, setDescription] = useState(character?.description ?? '');
    const [gmNotes, setGmNotes] = useState(character?.gmNotes ?? '');
    const [playerNotes, setPlayerNotes] = useState(character?.playerNotes ?? '');
    const [inventory, setInventory] = useState(character?.inventory ?? '');
    const [showAIPrompt, setShowAIPrompt] = useState(false);

    const portraitUrl = useMediaUrl(character?.portraitUrl);
    const tokenUrl = useMediaUrl(character?.tokenUrl);

    // Sync state when selected character changes
    useEffect(() => {
        setLocalData(getInitialData());
        setDescription(character?.description ?? '');
        setGmNotes(character?.gmNotes ?? '');
        setPlayerNotes(character?.playerNotes ?? '');
        setInventory(character?.inventory ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [character?.id, getInitialData]);

    const getValue = (fieldId: string, defaultValue: number | string | boolean) => {
        return localData[fieldId] ?? defaultValue;
    };

    const updateLocal = (fieldId: string, value: string | number | boolean) => {
        setSaved(false);
        setLocalData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = () => {
        if (!selectedPlayer || !character) return;
        for (const [fieldId, value] of Object.entries(localData)) {
            updateCharacterSheetData(selectedPlayer.id, character.id, fieldId, value);
        }
        updateCharacterNarrative(selectedPlayer.id, character.id, { description, gmNotes, playerNotes, inventory });

        /*
          **La santé maximale suit la fiche, parce qu'elle en découle.**

          Relevé par David le 2026-08-15 : un personnage d'Alien affichait
          « 1 / 1 » alors que sa Force valait 5. La santé de départ est calculée
          **à la création**, sur une fiche encore vide — Force à zéro, donc le
          plancher de un — et elle ne suivait plus quand le joueur remplissait
          ses attributs. Une valeur juste au moment où on la pose, fausse dès la
          minute suivante.

          On ne recalcule que si le pilote **déclare** où lire la santé : c'est
          alors son contrat, la fiche fait foi. Sans `santeDeDepart`, les points
          de vie restent ce que le meneur en a fait — on ne lui reprend pas un
          réglage manuel.
        */
        const pilote = getActiveDriver?.();
        const formule = pilote?.combat?.santeDeDepart;
        if (formule) {
            // Lecture unique : cet écran lisait AVEC la casse quand le combat
            // lisait sans, de sorte que « Taille » y valait undefined et la
            // santé de départ ne s'appliquait jamais depuis la fiche.
            const nouveauMax = santeDeDepart(formule, champ => valeurDuChamp(localData, champ));
            if (nouveauMax !== null && nouveauMax !== character.maxHp) {
                updateCharacterMaxHP(selectedPlayer.id, character.id, nouveauMax);
                // Les points courants suivent le plafond quand il monte, et ne
                // le dépassent jamais quand il descend.
                const courant = typeof character.hp === 'number' ? character.hp : nouveauMax;
                updateCharacterHP(selectedPlayer.id, character.id, Math.min(courant, nouveauMax));
            }
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleMediaSelect = (mediaId: string) => {
        if (!selectedPlayer || !character || !mediaBrowserTarget) return;
        if (mediaBrowserTarget === 'document') {
            const current = character.linkedDocumentIds ?? [];
            if (!current.includes(mediaId)) {
                updateCharacterNarrative(selectedPlayer.id, character.id, {
                    linkedDocumentIds: [...current, mediaId]
                });
            }
            setMediaBrowserTarget(null);
            return;
        }
        updateCharacterVisuals(selectedPlayer.id, character.id, {
            [mediaBrowserTarget === 'portrait' ? 'portraitUrl' : 'tokenUrl']: mediaId,
        });
        setMediaBrowserTarget(null);
    };

    const handleRemoveDocument = (docId: string) => {
        if (!selectedPlayer || !character) return;
        const current = character.linkedDocumentIds ?? [];
        updateCharacterNarrative(selectedPlayer.id, character.id, {
            linkedDocumentIds: current.filter(id => id !== docId)
        });
    };

    const openDocument = async (docId: string) => {
        const blob = await getMediaBlob(docId);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const handleGeneratePortrait = (instructions: string) => {
        if (selectedPlayer && character) {
            generatePlayerPortrait(selectedPlayer.id, character.id, instructions).then(() => setShowAIPrompt(false));
        }
    };

    return {
        character,
        template,
        selectedPlayer,
        
        // Form states
        localData,
        description,
        gmNotes,
        playerNotes,
        inventory,
        setDescription,
        setGmNotes,
        setPlayerNotes,
        setInventory,
        
        // Media URLs (React hooks)
        portraitUrl,
        tokenUrl,

        // Actions
        getValue,
        updateLocal,
        handleSave,
        saved,
        
        // Media Management
        mediaBrowserTarget,
        setMediaBrowserTarget,
        handleMediaSelect,
        handleRemoveDocument,
        openDocument,
        mediaList,

        // AI specific
        showAIPrompt,
        setShowAIPrompt,
        isGeneratingAIImage,
        handleGeneratePortrait,

        // Store direct actions
        updateCharacterHP: (hp: number) => { if(selectedPlayer && character) updateCharacterHP(selectedPlayer.id, character.id, hp); },
        updateCharacterMaxHP: (maxHp: number) => { if(selectedPlayer && character) updateCharacterMaxHP(selectedPlayer.id, character.id, maxHp); },
        updateCharacterHubOptions: (opts: Partial<NonNullable<PlayerCharacter['hubOptions']>>) => { if(selectedPlayer && character) updateCharacterHubOptions(selectedPlayer.id, character.id, opts); },
        addInventoryItem: (item: any) => { if(selectedPlayer && character) addInventoryItem(selectedPlayer.id, character.id, item); },
        removeInventoryItem: (itemId: string) => { if(selectedPlayer && character) removeInventoryItem(selectedPlayer.id, character.id, itemId); }
    };
}
