import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { DiceEngine } from './DiceEngine';
import type { GameDriver } from '../../types/drivers';
import {
    facesDeLaTable, fortuneDuJet, jetRate, placerLaFortune, suitesDuDeclin, suitesProposees, tirerLaSuiteDuDeclin,
} from './suitesDuJetDeFiche';

/**
 * **Les suites d'un jet de fiche, au pupitre** — Cthulhu Hack, 2026-10-16
 * (carnet « Cthulhu Hack », « Fortune », « Folie passagère », « Choc »).
 */
const PILOTE = {
    id: 'ch', name: 'Cthulhu Hack', templateId: 'tpl-ch',
    dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
    jet: {
        sens: 'sous-ou-egal', seuil: [{ id: 'sauvegarde', label: 'Sauvegarde', sectionId: 'sauvegardes' }],
        reserve: { base: 1, max: 1, faces: 20 },
        fortune: { champ: 'fortune', max: 2, relance: 1, reussite: 2 },
    },
    desDUsure: [{
        fieldId: 'mentalHealth', label: 'Santé mentale',
        auDeclin: [
            { label: 'Folie passagère', table: { univers: 'Cthulhu Hack', table: 'folies_passageres' } },
            { label: 'Choc', table: { univers: 'Cthulhu Hack', table: 'chocs' } },
        ],
    }, { fieldId: 'torche', label: 'Torche' }],
} as unknown as GameDriver;
const GABARIT = { id: 'tpl-ch', name: 'CH', emoji: '', sections: [
    { id: 'sauvegardes', label: 'Sauvegardes', fields: [{ id: 'sagesse', label: 'Sagesse', type: 'number' }] },
] };

const updateCharacter = vi.fn();
const initial = useSessionOSStore.getState();
const fiche = (sheetData: Record<string, unknown>) => useSessionOSStore.setState({
    players: [{ id: 'j', name: 'J', characters: [{ id: 'h', name: 'Ada', campaignId: 'c', templateId: 'tpl-ch', sheetData }] }],
} as never);
beforeEach(() => {
    updateCharacter.mockReset();
    useSessionOSStore.setState({
        activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'C', system: 'ch', activeLocationIds: [] }],
        customGameDrivers: [PILOTE], customSheetTemplates: [GABARIT], updateCharacter,
    } as never);
    useDiceStore.setState({ history: [], lastRoll: null });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); useSessionOSStore.setState(initial, true); });

const jetDeRessource = (avant: number, apres: number | null, champ = 'mentalHealth'): RollRecord => ({
    id: 'r', timestamp: new Date(), title: 'Ada — Santé mentale d8', total: 2, modifier: 0, rolls: [{ val: 2, sides: avant }],
    tagSuccess: false, totalDisplay: '2', usure: { avant, apres },
    deFiche: { joueurId: 'j', characterId: 'h', genre: 'ressource', champ },
} as RollRecord);
const jetDeSauvegarde = (reussi: boolean): RollRecord => ({
    id: 's', timestamp: new Date(), title: 'Ada — Sauvegarde de Sagesse', total: 17, modifier: 0, rolls: [{ val: 17, sides: 20 }],
    tagSuccess: reussi, totalDisplay: '17 / 12',
    deFiche: { joueurId: 'j', characterId: 'h', genre: 'sauvegarde', champ: 'sagesse', modificateur: 'aucun' },
} as RollRecord);
const regle = PILOTE.jet!.fortune!;

describe('la Fortune : quand et combien', () => {
    it('un jet raté : une Sauvegarde manquée, une ressource qui descend', () => {
        expect(jetRate(jetDeSauvegarde(false))).toBe(true);
        expect(jetRate(jetDeSauvegarde(true))).toBe(false);
        expect(jetRate(jetDeRessource(8, 6))).toBe(true);
        expect(jetRate(jetDeRessource(8, 8))).toBe(false);
    });

    it('jamais plus de deux jetons : relancer à 0 ou 1, réussir seulement à 0', () => {
        expect(fortuneDuJet(jetDeSauvegarde(false), regle, { fortune: 0 })).toEqual({ jetons: 0, relance: true, reussite: true });
        expect(fortuneDuJet(jetDeSauvegarde(false), regle, { fortune: 1 })).toEqual({ jetons: 1, relance: true, reussite: false });
        expect(fortuneDuJet(jetDeSauvegarde(false), regle, { fortune: 2 })).toEqual({ jetons: 2, relance: false, reussite: false });
        expect(fortuneDuJet({ ...jetDeSauvegarde(false), suite: 'fortune' }, regle, {})).toBeNull();
    });

    it('réussir une ressource : deux jetons, et le dé perdu revient', () => {
        fiche({ mentalHealth: 'd6', fortune: 0 });
        useDiceStore.getState().setLastRoll(jetDeRessource(8, 6));
        placerLaFortune('reussite');
        expect(updateCharacter).toHaveBeenCalledWith('j', 'h', { sheetData: { mentalHealth: 'd8', fortune: 2 } });
        const [nouveau, ancien] = useDiceStore.getState().history;
        expect(nouveau.title).toMatch(/réussi par la Fortune$/);
        expect(ancien.suite).toBe('fortune');
        expect(suitesProposees(nouveau).declin).toEqual([]);
    });

    it('relancer une Sauvegarde : un jeton, et le même jet relu sur la fiche', () => {
        fiche({ sagesse: 12, fortune: 1 });
        useDiceStore.getState().setLastRoll(jetDeSauvegarde(false));
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(5);
        placerLaFortune('relance');
        expect(updateCharacter).toHaveBeenCalledWith('j', 'h', { sheetData: { sagesse: 12, fortune: 2 } });
        const nouveau = useDiceStore.getState().history[0];
        expect(nouveau.title).toBe('Ada — Sauvegarde de Sagesse · relancé (Fortune)');
        expect(nouveau.tagSuccess).toBe(true);
    });

    it('relancer une ressource : le dé revient, puis on le relance', () => {
        fiche({ torche: 'd6', fortune: 0 });
        useDiceStore.getState().setLastRoll(jetDeRessource(8, 6, 'torche'));
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(1);
        placerLaFortune('relance');
        // Relancé d8 → 1 : il redescend, à d6.
        expect(updateCharacter).toHaveBeenCalledWith('j', 'h', { sheetData: { torche: 'd6', fortune: 1 } });
        expect(useDiceStore.getState().history[0].usure).toEqual({ avant: 8, apres: 6 });
    });
});

describe('la suite d’un déclin : la Folie passagère ou le Choc', () => {
    it('seule la ressource qui le déclare, et seulement si elle descend', () => {
        const ressources = [{ fieldId: 'mentalHealth', label: 'SM', plafond: 12, auDeclin: PILOTE.desDUsure![0].auDeclin }];
        expect(suitesDuDeclin(jetDeRessource(8, 6), ressources).map(s => s.label)).toEqual(['Folie passagère', 'Choc']);
        expect(suitesDuDeclin(jetDeRessource(8, 8), ressources)).toEqual([]);
        expect(suitesDuDeclin(jetDeRessource(8, 6, 'torche'), ressources)).toEqual([]);
    });

    it('tire dans la table de Table-OS et l’écrit dans l’historique, une seule fois', async () => {
        fiche({ mentalHealth: 'd6' });
        const loadTable = vi.fn(async () => ({ name: 'Chocs', dice: '1d6', entries: [
            { min: 1, max: 5, title: 'Autre', description: '' }, { min: 6, max: 6, title: 'Hurlement', description: '', effect: 'Attire l’attention.' }] }));
        vi.stubGlobal('appBridge', { tables: { loadTable } });
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(6);
        useDiceStore.getState().setLastRoll(jetDeRessource(8, 6));
        await tirerLaSuiteDuDeclin(1);
        expect(loadTable).toHaveBeenCalledWith('Cthulhu Hack', 'chocs');
        const [tire, ancien] = useDiceStore.getState().history;
        expect(tire.title).toBe('Ada — Choc');
        expect(tire.totalDisplay).toBe('6 — Hurlement : Attire l’attention.');
        expect(ancien.suite).toBe('declin');
    });

    it('les faces d’une table se lisent dans son dé', () => {
        expect(['1d6', 'd10', ' 1d100 ', '2d6', 'x'].map(facesDeLaTable)).toEqual([6, 10, 100, 0, 0]);
    });
});
