import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCharacterEditor } from './useCharacterEditor';
import { fiche } from '../logic/ficheDeVoyageur.fixtures';
import { reprendreFicheDeVoyageur } from '../logic/ficheDeVoyageur';
const {utiliserMagasin} = vi.hoisted(() => ({utiliserMagasin: vi.fn()}));
vi.mock('../useSessionOSStore', () => ({useSessionOSStore: utiliserMagasin}));
vi.mock('../../../stores/useMediaStore', () => ({useMediaStore: () => ({mediaList:[],getMediaBlob:vi.fn()})}));
vi.mock('../../../hooks/useMediaUrl', () => ({useMediaUrl: () => null}));

describe('la saisie du Voyageur R1', () => {
    it('une dérivée projetée n’est pas une saisie ; une vraie perte est visible puis sauvegardée une seule fois', () => {
        const updateCharacter = vi.fn(), updateCharacterSheetData = vi.fn();
        const donnees = reprendreFicheDeVoyageur(fiche,{fatigue:11,endurance:23,__rddFatigue231:1});
        donnees.melee = 0; // Un ancien calcul enregistré ne rend pas le formulaire « modifié » à l'ouverture.
        donnees.__rddAvantFatigue231 = {note:'copie à conserver'};
        utiliserMagasin.mockReturnValue({players:[{id:'j',characters:[{id:'pj',name:'Fictif',templateId:fiche.id,sheetData:donnees,hp:7,maxHp:12}]}],
            selectedPlayerId:'j',selectedCharacterId:'pj',campaigns:[],customSheetTemplates:[fiche],
            updateCharacter,updateCharacterSheetData,updateCharacterNarrative:vi.fn()});
        const {result} = renderHook(() => useCharacterEditor());
        expect(result.current.aDesChangements).toBe(false);
        act(() => result.current.updateLocal('endurance',20));
        expect(result.current.localData).toMatchObject({endurance:20,fatigue:14});
        expect(result.current.aDesChangements).toBe(true);
        act(() => result.current.handleSave());
        expect(updateCharacter).toHaveBeenCalledTimes(1);expect(updateCharacterSheetData).not.toHaveBeenCalled();
        expect(updateCharacter.mock.calls[0][2].sheetData).toMatchObject({endurance:20,fatigue:14,__rddAvantFatigue231:{note:'copie à conserver'}});
    });
});
