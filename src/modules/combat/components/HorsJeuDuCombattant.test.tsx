// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import HorsJeuDuCombattant from './HorsJeuDuCombattant';
import { lancerUneFormule } from '../../dice/suitesDuJetDeFiche';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { DiceEngine } from '../../dice/DiceEngine';
import type { Combatant } from '../types';

/**
 * **Le Hors Jeu** — Cthulhu Hack, 2026-10-16 : à zéro PV, la table des
 * Conséquences (1d10), puis 1d4 PV pour qui survit.
 */
const PILOTE = { combat: { horsJeu: { table: { univers: 'Cthulhu Hack', table: 'consequences_du_hors_jeu' }, recuperation: '1d4' } } };
const handleApplyImpact = vi.fn();
const initial = useSessionOSStore.getState();
beforeEach(() => {
    handleApplyImpact.mockReset();
    useSessionOSStore.setState({ getActiveDriver: () => PILOTE, handleApplyImpact } as never);
    useDiceStore.setState({ history: [], lastRoll: null });
    vi.stubGlobal('appBridge', { tables: { loadTable: async () => ({ name: 'Conséquences', dice: '1d10', entries: [
        { min: 1, max: 1, title: 'Mort', description: '' },
        { min: 2, max: 10, title: 'Commotion', description: '', effect: 'Désavantage 20 minutes.' }] }) } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); useSessionOSStore.setState(initial, true); });

const combattant = (hp: number): Combatant => ({
    id: 'c1', name: 'Ada', isPlayer: true, sourcePlayerId: 'h', hp, maxHp: 10,
    healthSystem: { type: 'hp', data: { current: hp, max: 10 }, state: hp <= 0 ? 'dead' : 'healthy', badges: [] },
} as unknown as Combatant);

describe('le Hors Jeu', () => {
    it('ne paraît qu’à zéro point de vie', () => {
        const { rerender } = render(<HorsJeuDuCombattant combatant={combattant(3)} />);
        expect(screen.queryByText('Tirer les conséquences')).toBeNull();
        rerender(<HorsJeuDuCombattant combatant={combattant(0)} />);
        expect(screen.getByText('Tirer les conséquences')).toBeTruthy();
    });

    it('tire la table, puis rend 1d4 PV par la porte unique de la santé', async () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValueOnce(7).mockReturnValueOnce(3);
        render(<HorsJeuDuCombattant combatant={combattant(0)} />);
        await act(async () => { fireEvent.click(screen.getByText('Tirer les conséquences')); });
        expect(screen.getByText('7 — Commotion')).toBeTruthy();
        expect(useDiceStore.getState().history[0].totalDisplay).toBe('7 — Commotion : Désavantage 20 minutes.');
        fireEvent.click(screen.getByText("S'il survit : récupérer 1d4 PV"));
        expect(handleApplyImpact).toHaveBeenCalledWith('h', 'pc', { value: 3, isRecovery: true });
        expect(screen.queryByText("S'il survit : récupérer 1d4 PV")).toBeNull();
    });

    it('un adversaire n’a pas de Hors Jeu', () => {
        render(<HorsJeuDuCombattant combatant={{ ...combattant(0), isPlayer: false }} />);
        expect(screen.queryByText('Tirer les conséquences')).toBeNull();
    });
});

describe('une formule de dés', () => {
    it('1d4, 2d6, et ce qui ne se lit pas', () => {
        const de = vi.fn((f: number) => f);
        expect(lancerUneFormule('1d4', de)).toBe(4);
        expect(lancerUneFormule('2d6', de)).toBe(12);
        expect(lancerUneFormule('d8', de)).toBe(8);
        expect(lancerUneFormule('beaucoup', de)).toBeNull();
        expect(lancerUneFormule(undefined, de)).toBeNull();
    });
});
