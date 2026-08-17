import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCharacterEditor } from './useCharacterEditor';
import { useSessionOSStore } from '../useSessionOSStore';

// Mock the store
vi.mock('../useSessionOSStore', () => ({
    useSessionOSStore: vi.fn()
}));

// Mock media store
vi.mock('../../../stores/useMediaStore', () => ({
    useMediaStore: () => ({
        mediaList: [],
        getMediaBlob: vi.fn()
    })
}));

// Mock media url hook
vi.mock('../../../hooks/useMediaUrl', () => ({
    useMediaUrl: (url: string) => url
}));

describe('useCharacterEditor', () => {
    const mockCharacter = {
        id: 'char-1',
        name: 'Test Character',
        hp: 10,
        maxHp: 20,
        description: 'Initial text',
        sheetData: {
            str: 15,
            dex: 12
        }
    };

    const mockPlayer = {
        id: 'player-1',
        characters: [mockCharacter]
    };

    const mockStore = {
        players: [mockPlayer],
        selectedPlayerId: 'player-1',
        selectedCharacterId: 'char-1',
        customSheetTemplates: [],
        campaigns: [],
        updateCharacterSheetData: vi.fn(),
        updateCharacterNarrative: vi.fn(),
        updateCharacterHP: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
    });

    it('initializes localData from character matching template schema', () => {
        const { result } = renderHook(() => useCharacterEditor());
        expect(result.current.character).toEqual(mockCharacter);
        expect(result.current.description).toBe('Initial text');
        
        // Since we don't mock the template resolver deeply, it might not have all default fields,
        // but it should at least merge sheetData when fields match
    });

    it('updates localData but does not save immediately', () => {
        const { result } = renderHook(() => useCharacterEditor());
        act(() => {
            result.current.updateLocal('str', 18);
        });
        expect(result.current.localData['str']).toBe(18);
        expect(result.current.saved).toBe(false);
        expect(mockStore.updateCharacterSheetData).not.toHaveBeenCalled();
    });

    it('saves localData and narrative to the store on handleSave', () => {
        const { result } = renderHook(() => useCharacterEditor());
        
        act(() => {
            result.current.setDescription('New description');
            result.current.updateLocal('str', 20);
        });

        act(() => {
            result.current.handleSave();
        });

        expect(mockStore.updateCharacterSheetData).toHaveBeenCalledWith('player-1', 'char-1', 'str', 20);
        expect(mockStore.updateCharacterNarrative).toHaveBeenCalledWith('player-1', 'char-1', expect.objectContaining({
            description: 'New description'
        }));
        expect(result.current.saved).toBe(true);
    });

    /**
     * Ce que ces deux tests protègent : **la fiche est la source de la santé
     * quand le pilote dit où la lire, et elle ne l'est jamais sinon.**
     *
     * Relevé par David le 2026-08-17 sur Cthulhu Hack : sa fiche portait
     * « Points de vie 12 » dans ses Ressources et « 10 / 10 » dans le bloc de
     * gauche. Deux nombres pour une seule chose, et **rien ne les reliait** —
     * `combat.santeDeDepart` était vide, donc chaque écran gardait le sien. Le
     * combat serait parti sur dix points pour un personnage qui en a douze.
     *
     * Le fil existait depuis le 2026-08-15 ; il n'était simplement pas branché.
     * Ces tests vérifient les deux côtés du contrat, car **le second est aussi
     * important que le premier** : sans formule, on ne reprend pas au meneur un
     * réglage qu'il a posé à la main.
     */
    it('la santé maximale suit le champ de la fiche que le pilote désigne', () => {
        const updateCharacterMaxHP = vi.fn();
        const updateCharacterHP = vi.fn();
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            ...mockStore,
            updateCharacterHP,
            updateCharacterMaxHP,
            getActiveDriver: () => ({ combat: { santeDeDepart: 'points_de_vie' } }),
        });

        const { result } = renderHook(() => useCharacterEditor());

        act(() => { result.current.updateLocal('points_de_vie', 12); });
        act(() => { result.current.handleSave(); });

        expect(updateCharacterMaxHP).toHaveBeenCalledWith('player-1', 'char-1', 12);
        // Les points courants ne dépassent jamais le plafond, et ne montent pas
        // tout seuls : le personnage était à 10, il y reste.
        expect(updateCharacterHP).toHaveBeenCalledWith('player-1', 'char-1', 10);
    });

    it('mais sans formule, on ne touche pas au réglage du meneur', () => {
        const updateCharacterMaxHP = vi.fn();
        (useSessionOSStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            ...mockStore,
            updateCharacterMaxHP,
            getActiveDriver: () => ({ combat: {} }),
        });

        const { result } = renderHook(() => useCharacterEditor());

        act(() => { result.current.updateLocal('points_de_vie', 12); });
        act(() => { result.current.handleSave(); });

        expect(updateCharacterMaxHP).not.toHaveBeenCalled();
    });

    it('exposes direct update helpers safely', () => {
        const { result } = renderHook(() => useCharacterEditor());
        
        act(() => {
            result.current.updateCharacterHP(15);
        });

        expect(mockStore.updateCharacterHP).toHaveBeenCalledWith('player-1', 'char-1', 15);
    });
});
