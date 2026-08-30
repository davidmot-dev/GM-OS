import { useState, useMemo } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import type { CardFormat, CardOrientation, DeckManifest } from '../store/types';

export const useDeckLibrary = () => {
    const { 
        decks, addDeck, updateDeck, deleteDeck,
        activeCampaignId, campaigns,
        customSheetTemplates, customGameDrivers,
        selectDeck
    } = useSessionOSStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
    const [showAllDecks, setShowAllDecks] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [systemId, setSystemId] = useState('generic');
    const [folderPath, setFolderPath] = useState('assets/decks/generic/test-deck');
    const [cardCount, setCardCount] = useState(54);
    const [format, setFormat] = useState<CardFormat>('poker');
    const [orientation, setOrientation] = useState<CardOrientation>('portrait');
    const [useDiscard, setUseDiscard] = useState(true);
    const [extension, setExtension] = useState('.png');
    const [filenamePattern, setFilenamePattern] = useState('card_{n}');
    const [startAtZero, setStartAtZero] = useState(false);
    const [padding, setPadding] = useState(0);

    const availableSystems = useMemo(() => {
        const systems = [
            ...DEFAULT_SHEET_TEMPLATES,
            ...customSheetTemplates,
            ...DEFAULT_GAME_DRIVERS,
            ...customGameDrivers
        ];
        return systems.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [customSheetTemplates, customGameDrivers]);

    const activeCampaign = useMemo(() => 
        campaigns.find(c => c.id === activeCampaignId),
        [campaigns, activeCampaignId]
    );
    
    const currentSystemId = activeCampaign?.system || 'generic';

    const filteredDecks = useMemo(() => {
        if (showAllDecks) return decks;
        return decks.filter(d => d.systemId === 'generic' || d.systemId === currentSystemId);
    }, [decks, currentSystemId, showAllDecks]);

    const resetForm = () => {
        setName('');
        setSystemId('generic');
        setFolderPath('assets/decks/generic/test-deck');
        setCardCount(54);
        setFormat('poker');
        setOrientation('portrait');
        setUseDiscard(true);
        setExtension('.png');
        setFilenamePattern('card_{n}');
        setStartAtZero(false);
        setPadding(0);
        setIsAdding(false);
        setEditingDeckId(null);
    };

    const handleEdit = (deck: DeckManifest) => {
        setName(deck.name);
        setSystemId(deck.systemId);
        setFolderPath(deck.folderPath);
        setCardCount(deck.cardCount);
        setFormat(deck.format);
        setOrientation(deck.orientation);
        setUseDiscard(deck.useDiscard);
        setExtension(deck.extension ?? '.png');
        setFilenamePattern(deck.filenamePattern ?? 'card_{n}');
        setStartAtZero(deck.startAtZero ?? false);
        setPadding(deck.padding ?? 0);
        setEditingDeckId(deck.id);
        setIsAdding(false);
    };

    const handleSave = () => {
        if (!name || !folderPath) return;

        const deckData = {
            name,
            systemId,
            folderPath,
            cardCount,
            format,
            orientation,
            useDiscard,
            extension,
            filenamePattern,
            startAtZero,
            padding
        };

        if (editingDeckId) {
            updateDeck(editingDeckId, deckData);
        } else {
            addDeck(deckData);
        }
        
        resetForm();
    };

    /**
     * **Ouvrir ou fermer un paquet aux joueurs.**
     *
     * Le geste vit sur la carte du paquet, pas dans le formulaire d'édition :
     * David a demandé *« peut-être dire les paquets qui sont accessibles ou non
     * aux joueurs »*, et un réglage qu'il faut ouvrir un formulaire pour lire ne
     * dit rien. Ici, l'état se voit dans la grille et se change d'un clic.
     *
     * `updateDeck` fusionne : le reste du manifeste — métadonnées de cartes
     * comprises — n'est pas touché.
     */
    const handleToggleOuverture = (deck: DeckManifest) => {
        updateDeck(deck.id, { ouvertAuxJoueurs: !deck.ouvertAuxJoueurs });
    };

    return {
        // State
        isAdding,
        editingDeckId,
        filteredDecks,
        showAllDecks,
        setShowAllDecks,
        availableSystems,
        currentSystemId,
        
        // Form Fields
        form: {
            name, setName,
            systemId, setSystemId,
            folderPath, setFolderPath,
            cardCount, setCardCount,
            format, setFormat,
            orientation, setOrientation,
            useDiscard, setUseDiscard,
            extension, setExtension,
            filenamePattern, setFilenamePattern,
            startAtZero, setStartAtZero,
            padding, setPadding
        },

        // Actions
        setIsAdding,
        handleEdit,
        handleSave,
        handleDelete: deleteDeck,
        handleSelect: selectDeck,
        handleToggleOuverture,
        resetForm
    };
};
