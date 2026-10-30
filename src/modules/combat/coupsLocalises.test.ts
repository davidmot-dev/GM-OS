import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useCombatStore } from './useCombatStore';
import { porterUnCoupLocalise } from './coupsLocalises';
import { useToastStore } from '../../stores/useToastStore';
import type { GameDriver } from '../../types/drivers';
import type { Combatant } from './types';

/**
 * **Un coup localisé de RuneQuest, jusqu'à la fiche** (2026-10-30) : par la porte
 * des dégâts pour un PJ, sur le plateau pour un adversaire autonome.
 */

const RUNEQUEST = {
    id: 'runequest', name: 'RuneQuest', templateId: 'tpl',
    combat: {
        defaultHealthType: 'hp', initiativeFormula: 'ra_dex + ra_tai',
        statsToTrack: [{ fieldId: 'points_de_vie', label: 'Points de vie', isMainHP: true, isResource: true, max: 'pv_max' }],
        coupsLocalises: {
            mecanique: 'runequest',
            zones: {
                tete: { pv: 'pv_tete', armure: 'pa_tete', degats: 'degats_tete' },
                'bras-droit': { pv: 'pv_bras_droit', armure: 'pa_bras_droit', degats: 'degats_bras_droit' },
            },
        },
    },
} as unknown as GameDriver;

const FICHE = { pv_max: 12, points_de_vie: 12, pv_tete: 4, pa_tete: 1, degats_tete: 0, pv_bras_droit: 3, pa_bras_droit: 0, degats_bras_droit: 0 };

describe('un coup localisé porté à un combattant', () => {
    const session = useSessionOSStore.getState();
    const combat = useCombatStore.getState();

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        useSessionOSStore.setState({
            activeCampaignId: 'c', customGameDrivers: [RUNEQUEST],
            campaigns: [{ id: 'c', name: 'Pavis', system: 'runequest', activeLocationIds: [] }],
            players: [{ id: 'p', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [{
                id: 'vasana', name: 'Vasana', campaignId: 'c', templateId: 'tpl', systemId: 'runequest',
                hp: 12, maxHp: 12, sheetData: { ...FICHE },
            }] }],
        } as never);
        useCombatStore.setState({ combatants: [] });
    });
    afterEach(() => {
        vi.restoreAllMocks();
        useSessionOSStore.setState(session, true);
        useCombatStore.setState(combat, true);
    });

    const vasana = () => useSessionOSStore.getState().players[0].characters[0];

    it('Harmast, pour un PJ : 10 à la tête, 1 d’armure — la zone et le total perdent 9, le journal dit l’effet', () => {
        const pj = { id: 'cv', name: 'Vasana', isPlayer: true, sourcePlayerId: 'vasana', hp: 12, hpMax: 12, statuses: [] } as unknown as Combatant;
        porterUnCoupLocalise(pj, 'tete', 10);
        expect(vasana().sheetData).toMatchObject({ degats_tete: 9, points_de_vie: 3 });
        expect(vasana().hp).toBe(3);
        expect(useToastStore.getState().toasts.at(-1)?.message).toMatch(/Vasana — Tête : 10 − 1 d'armure = 9 dégâts.*inconscient/);
    });

    it('le soin rend à la zone et au total', () => {
        const pj = { id: 'cv', name: 'Vasana', isPlayer: true, sourcePlayerId: 'vasana', hp: 12, hpMax: 12, statuses: [] } as unknown as Combatant;
        porterUnCoupLocalise(pj, 'bras-droit', 2);
        porterUnCoupLocalise(pj, 'bras-droit', 5, true);
        expect(vasana().sheetData).toMatchObject({ degats_bras_droit: 0 });
        expect(vasana().hp).toBe(12);
    });

    it('un adversaire autonome : le bras de 3 PV touché pour 8 ne perd que 6, sur le plateau', () => {
        const broo = { id: 'b', name: 'Broo', isPlayer: false, hp: 12, hpMax: 12, statuses: [], sheetData: { ...FICHE } } as unknown as Combatant;
        useCombatStore.setState({ combatants: [broo] });
        porterUnCoupLocalise(broo, 'bras-droit', 8);
        const apres = useCombatStore.getState().combatants[0];
        expect(apres.hp).toBe(6);
        expect(apres.sheetData).toMatchObject({ degats_bras_droit: 6, points_de_vie: 6 });
        expect(useToastStore.getState().toasts.at(-1)?.message).toMatch(/6 retenus.*neutralisé/);
    });
});
