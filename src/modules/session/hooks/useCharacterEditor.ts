import { useState, useEffect, useCallback } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { useMediaStore } from '../../../stores/useMediaStore';
import { resolveSheetTemplate } from '../logic/templateResolver';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { santeDeDepart, valeurDuChamp } from '../../combat/logic/SanteDuCombattant';
import { estUneFicheDeVoyageur, lireFicheDeVoyageur, CLE_REPRISE } from '../logic/ficheDeVoyageur';
import { gmToast } from '../../../stores/useToastStore';
import type { Player, PlayerCharacter } from '../store/types';
import { suivrePerteDEndurance } from '../logic/fatigueDuVoyageur';

export function useCharacterEditor() {
    const {
        players, selectedPlayerId, selectedCharacterId,
        customSheetTemplates, updateCharacter, updateCharacterSheetData, updateCharacterVisuals, updateCharacterNarrative,
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
        const lues = estUneFicheDeVoyageur(template)
            ? lireFicheDeVoyageur(template, character.sheetData).valeurs : character.sheetData;
        const out: Record<string, string | number | boolean> = {};
        for (const section of template.sections) {
            for (const field of section.fields) {
                const val = lues?.[field.id];
                out[field.id] = (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') ? val : field.defaultValue;
            }
        }
        if (estUneFicheDeVoyageur(template)) for (const [cle, valeur] of Object.entries(character.sheetData ?? {})) {
            if (!(cle in out) && ['string', 'number', 'boolean'].includes(typeof valeur)) out[cle] = valeur as string | number | boolean;
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
        setLocalData(prev => {
            const suivant = { ...prev, [fieldId]: value };
            if (!template || !estUneFicheDeVoyageur(template)) return suivant;
            const lue = lireFicheDeVoyageur(template, suivrePerteDEndurance(prev, { ...suivant, [CLE_REPRISE]: 1 }));
            return { ...suivant, ...lue.valeurs } as typeof suivant;
        });
    };

    const handleSave = () => {
        if (!selectedPlayer || !character) return;
        if (template && estUneFicheDeVoyageur(template) && character.sheetData?.[CLE_REPRISE] !== 1) {
            gmToast('Appliquez d’abord la reprise du Voyageur : les anciennes saisies demandent une confirmation.', 'warning');
            return;
        }
        // R1 : une seule écriture pour endurance et fatigue, sinon le dernier
        // champ du formulaire écraserait la fatigue ajoutée par le premier.
        if (estUneFicheDeVoyageur(template)) updateCharacter(selectedPlayer.id, character.id, {
            sheetData: {...character.sheetData, ...localData},
        });
        else for (const [fieldId, value] of Object.entries(localData)) updateCharacterSheetData(selectedPlayer.id, character.id, fieldId, value);
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
        // Le Voyageur est déjà recalculé atomiquement par l'écriture du magasin,
        // avec le gabarit de CE personnage, même si une autre campagne est ouverte.
        const formule = estUneFicheDeVoyageur(template) ? undefined : pilote?.combat?.santeDeDepart;
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

    /*
      **Ce qui est saisi mais pas sauvegardé** (David, 2026-10-17 : « j'avais
      oublié de sauvegarder »). Le formulaire garde sa saisie à lui jusqu'à
      « Sauvegarder » : la fiche du jeu ne la voit pas avant. On compare donc ce
      qui est tapé à ce qui est enregistré, pour le dire au moment de passer à la
      fiche du jeu.
    */
    const enregistre = getInitialData();
    const aDesChangements = !!character && (
        Object.entries(localData).some(([cle, valeur]) => {
            // Les dérivées projetées à l'ouverture ne sont pas des saisies.
            // Sinon R1 réclame « Sauvegarder » alors que rien n'a été touché.
            if (estUneFicheDeVoyageur(template)) return valeur !== enregistre[cle];
            const fiche = (character.sheetData ?? {}) as Record<string, unknown>;
            return valeur !== (cle in fiche ? fiche[cle] : enregistre[cle]);
        })
        || description !== (character.description ?? '')
        || gmNotes !== (character.gmNotes ?? '')
        || playerNotes !== (character.playerNotes ?? '')
        || inventory !== (character.inventory ?? '')
    );

    return {
        character,
        template,
        selectedPlayer,
        aDesChangements,
        
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
        addInventoryItem: (item: Parameters<typeof addInventoryItem>[2]) => { if(selectedPlayer && character) addInventoryItem(selectedPlayer.id, character.id, item); },
        removeInventoryItem: (itemId: string) => { if(selectedPlayer && character) removeInventoryItem(selectedPlayer.id, character.id, itemId); }
    };
}
