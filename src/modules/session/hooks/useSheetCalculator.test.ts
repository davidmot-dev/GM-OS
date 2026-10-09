import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSheetCalculator } from './useSheetCalculator';
import { calculationEngine } from '../logic/CalculationEngine';
import type { PlayerCharacter } from '../../../types/player.types';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

const personnage: PlayerCharacter = {
    id: 'pj-calcul-1', name: 'Test', portraitUrl: '', campaignId: 'camp-test', templateId: 'fiche-test',
    hp: 10, maxHp: 20, sheetData: { energie: 8, acquis: 0, activite: true, bagage: [1, 2] },
};
const fiche: SheetTemplate = {
    id: 'fiche-test', name: 'Test', emoji: '', sections: [{ id: 's1', label: 'Valeurs', fields: [
        { id: 'energie', label: 'Énergie actuelle', type: 'number', defaultValue: 3 },
        { id: 'acquis', label: 'Acquis', type: 'number', defaultValue: 9 },
        { id: 'defaut', label: 'Valeur de départ', type: 'number', defaultValue: 5.5 },
    ] }],
};

beforeEach(() => calculationEngine.relancerLesDes());

describe('calculs depuis la vraie fiche', () => {
    it('prend la valeur locale, puis la valeur enregistrée et le défaut, en gardant les zéros', () => {
        const { result } = renderHook(() => useSheetCalculator(personnage, fiche, { energie: '12.5 points' }));
        expect(result.current.evaluateFormula('@Energieactuelle + @Acquis + @Valeurdedepart')).toBe(18);
        expect(result.current.context.energie).toBe(12.5);
        expect(result.current.context.acquis).toBe(0);
        expect(result.current.context.defaut).toBe(5.5);
    });

    it('un zéro local l’emporte sur une valeur enregistrée et une valeur locale indéfinie la conserve', () => {
        const initialProps: { locale: PlayerCharacter['sheetData'] } = { locale: { energie: 0 } };
        const { result, rerender } = renderHook(
            ({ locale }: { locale: PlayerCharacter['sheetData'] }) => useSheetCalculator(personnage, fiche, locale),
            { initialProps },
        );
        expect(result.current.evaluateFormula('@Energieactuelle')).toBe(0);
        rerender({ locale: { energie: undefined } });
        expect(result.current.evaluateFormula('@Energieactuelle')).toBe(8);
    });

    it('préserve les valeurs libres sans gabarit et les transmet au vrai parseur', () => {
        const { result } = renderHook(() => useSheetCalculator(personnage));
        expect(result.current.evaluateFormula('@hp + @maxHp')).toBe(30);
        expect(result.current.evaluateFormula('@activite ? length(@bagage) : 0')).toBe(2);
        expect(result.current.context.bagage).toBe(personnage.sheetData.bagage);
    });

    it('sans personnage, les calculs et les relances ne lancent aucun dé', () => {
        const hasard = vi.spyOn(Math, 'random');
        const { result } = renderHook(() => useSheetCalculator(null, fiche));
        expect(result.current.evaluateFormula('1d6')).toBe(0);
        expect(result.current.bulkEvaluate({ degats: '1d6' })).toEqual({});
        act(() => result.current.relancerLesDes('degats'));
        expect(hasard).not.toHaveBeenCalled();
    });

    it('retient un tirage par personnage et champ, puis relance uniquement le champ demandé', () => {
        const hasard = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5).mockReturnValue(0.9);
        const premier = renderHook(() => useSheetCalculator(personnage));
        const second = renderHook(() => useSheetCalculator({ ...personnage, id: 'pj-calcul-2' }));
        expect(premier.result.current.bulkEvaluate({ degats: '1d6' })).toEqual({ degats: 1 });
        expect(second.result.current.bulkEvaluate({ degats: '1d6' })).toEqual({ degats: 4 });
        expect(premier.result.current.evaluateFormula('1d6', 'degats')).toBe(1);
        act(() => premier.result.current.relancerLesDes('degats'));
        expect(premier.result.current.evaluateFormula('1d6', 'degats')).toBe(6);
        expect(second.result.current.evaluateFormula('1d6', 'degats')).toBe(4);
        expect(hasard).toHaveBeenCalledTimes(3);
    });
});
