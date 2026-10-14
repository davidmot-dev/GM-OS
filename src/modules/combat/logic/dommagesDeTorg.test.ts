import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dommagesDeTorg, ajouterLeChoc, direLesDommages } from './dommagesDeTorg';
import { maximumDeLaJauge } from './SanteDuCombattant';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';
import type { GameDriver } from '../../../types/drivers';
import { useToastStore } from '../../../stores/useToastStore';

/**
 * La Table des Dommages de Torg Eternity — livre de base, transcrite depuis le
 * carnet NotebookLM « Torg » le 2026-10-13, avec ses exemples.
 */
describe('la Table des Dommages', () => {
    it.each([
        [3, 10, 0, 0],    // −7 : rien
        [4, 10, 0, 0],    // −6 : rien
        [5, 10, 0, 1],    // −5 : 1 Choc
        [9, 10, 0, 1],    // −1 : 1 Choc
        [11, 10, 0, 2],   // le livre : 11 contre l'edeinos (10) → 2 Choc
        [14, 10, 0, 2],   // +4
        [15, 10, 1, 2],   // +5 : 1 Blessure, 2 Choc
        [29, 17, 2, 4],   // le livre : 29 contre le géant (17) → 2 Blessures, 4 Choc
        [35, 17, 3, 6],   // +18
        [37, 17, 4, 8],   // +20
    ])('%i dommages contre Résistance %i → %i Blessure(s), %i Choc', (degats, resistance, blessures, choc) => {
        expect(dommagesDeTorg(degats, resistance)).toMatchObject({ blessures, choc });
    });
});

describe('le Choc et le KO', () => {
    it('plafonne au maximum ; à égalité, on reste debout', () => {
        expect(ajouterLeChoc(7, 2, 9)).toEqual({ valeur: 9, ko: false });
    });
    it('au-delà, le KO — et le surplus est ignoré', () => {
        expect(ajouterLeChoc(8, 4, 9)).toEqual({ valeur: 9, ko: true });
    });
    it('sans maximum déclaré, il monte simplement', () => {
        expect(ajouterLeChoc(8, 4, null)).toEqual({ valeur: 12, ko: false });
    });
    it('se dit en une phrase', () => {
        expect(direLesDommages(29, 17, dommagesDeTorg(29, 17), false)).toBe('29 dommages contre Résistance 17 : 2 Blessures, 4 Choc');
        expect(direLesDommages(3, 10, dommagesDeTorg(3, 10), false)).toBe('3 dommages contre Résistance 10 : aucun effet');
    });
});

describe('le maximum d’une jauge, lu sur la fiche', () => {
    it('la formule du pilote : le Choc plafonne à l’Esprit', () => {
        expect(maximumDeLaJauge('choc', [{ fieldId: 'choc', max: 'esprit' }], { esprit: 9 })).toBe(9);
    });
    it('rien de déclaré : null, l’écran garde son repli', () => {
        expect(maximumDeLaJauge('choc', [{ fieldId: 'choc' }], { esprit: 9 })).toBeNull();
        expect(maximumDeLaJauge('choc', undefined, { esprit: 9 })).toBeNull();
    });
});

describe('un coup sur un Chevalier des Tempêtes', () => {
    const TORG = {
        id: 'torg', name: 'Torg Eternity', templateId: 'tpl',
        combat: {
            statsToTrack: [{ fieldId: 'choc', label: 'Choc', isMainHP: false, isResource: true, max: 'esprit' }],
            initiativeFormula: 'dexterite', defaultHealthType: 'boxes',
            casesDeSante: { libelle: 'Blessures', nombre: 4, champ: 'blessures', seuils: [{ aPartirDe: 4, label: 'Vaincu', etat: 'dead' }] },
            dommages: { mecanique: 'torg', resistance: 'resistance', choc: 'choc' },
        },
    } as unknown as GameDriver;
    const initial = useSessionOSStore.getState();

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        useSessionOSStore.setState({
            activeCampaignId: 'c', customGameDrivers: [TORG],
            campaigns: [{ id: 'c', name: 'Torg', system: 'torg', activeLocationIds: [] }],
            players: [{ id: 'p', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [{
                id: 'mara', name: 'Mara', campaignId: 'c', templateId: 'tpl', systemId: 'torg',
                sheetData: { resistance: 17, esprit: 9, choc: 2, blessures: 0 },
                healthSystem: HealthInterpreter.createDefault('boxes', { cases: TORG.combat.casesDeSante }),
            }] }],
        } as never);
    });
    afterEach(() => { vi.restoreAllMocks(); useSessionOSStore.setState(initial, true); });

    const mara = () => useSessionOSStore.getState().players[0].characters[0];
    const cochees = () => (mara().healthSystem!.data.boxes as { filled: boolean }[]).filter(b => b.filled).length;

    it('29 dommages : la table coche 2 Blessures et ajoute 4 Choc', () => {
        useSessionOSStore.getState().handleApplyImpact('mara', 'pc', { value: 29, type: 'physique' });
        expect(cochees()).toBe(2);
        expect(mara().sheetData).toMatchObject({ choc: 6, blessures: 2 });
    });

    it('le Choc plafonne à l’Esprit', () => {
        useSessionOSStore.getState().handleApplyImpact('mara', 'pc', { value: 37, type: 'physique' });
        expect(mara().sheetData.choc).toBe(9);
    });

    /*
      Les Lois du Monde qui se disent au coup (2026-10-14) : la Ténacité au KO,
      la Souffrance quand une Blessure tombe — annoncées, pas appliquées.
    */
    const sousLaLoi = (mecanique: 'tenacite' | 'souffrance') => useSessionOSStore.setState({
        customGameDrivers: [{ ...TORG, cosms: [{ id: 'x', nom: 'Cosm', lois: [{ nom: 'Loi testée', texte: '…', mecanique }] }] }],
        campaigns: [{ id: 'c', name: 'Torg', system: 'torg', activeLocationIds: [], cosmsParDefaut: ['x'] }],
    } as never);
    const dernierToast = () => useToastStore.getState().toasts.at(-1)?.message ?? '';

    it('Loi de la Ténacité : dite quand le Choc met KO', () => {
        sousLaLoi('tenacite');
        useSessionOSStore.getState().handleApplyImpact('mara', 'pc', { value: 37, type: 'physique' });
        expect(dernierToast()).toMatch(/KO, le Choc dépasse son maximum — Loi testée : s'il est chargé en possibilités, il peut encaisser 1 Blessure/);
    });

    it('Loi de la Souffrance : dite quand une Blessure tombe, et seulement alors', () => {
        sousLaLoi('souffrance');
        useSessionOSStore.getState().handleApplyImpact('mara', 'pc', { value: 18, type: 'physique' });
        expect(dernierToast()).not.toMatch(/Loi testée/);
        useSessionOSStore.getState().handleApplyImpact('mara', 'pc', { value: 29, type: 'physique' });
        expect(dernierToast()).toMatch(/Loi testée : l'attaquant récupère 1 point de Choc/);
    });

    it('un soin reste un soin : il décoche, sans passer par la table', () => {
        useSessionOSStore.getState().handleApplyImpact('mara', 'pc', { value: 29, type: 'physique' });
        useSessionOSStore.getState().handleApplyImpact('mara', 'pc', { value: 1, isRecovery: true });
        expect(cochees()).toBe(1);
    });
});
