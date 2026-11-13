import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import DommagesDeltaGreen from './DommagesDeltaGreen';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import type { Combatant } from '../types';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: vi.fn() }));
const combatAvant = useCombatStore.getState(), sessionAvant = useSessionOSStore.getState();
const attaquant: Combatant = { id: 'a', name: 'Agent', isPlayer: false, faction: 'player', init: 10, statuses: [], hp: 10, hpMax: 10, sheetData: { PV: 10, arme1: 'Grenade', arme1_letalite: '15', arme1_degats: '1D10' } };
const cible: Combatant = { id: 'b', name: 'Garde', isPlayer: false, faction: 'enemy', init: 10, statuses: [], hp: 10, hpMax: 10, sheetData: { PV: 10 } };
beforeEach(() => { useSessionOSStore.setState({ players: [], entities: [], activeCampaignId: null }); useCombatStore.setState({ combatants: [attaquant, cible] }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); useCombatStore.setState(combatAvant, true); useSessionOSStore.setState(sessionAvant, true); });
function monter() {
    render(<DommagesDeltaGreen attaquant={useCombatStore.getState().combatants[0]} regle={{ sante: 'PV' }} />);
    fireEvent.change(screen.getByLabelText('Cible Delta Green'), { target: { value: 'b' } });
    fireEvent.click(screen.getByLabelText('Attaque réussie confirmée'));
    fireEvent.click(screen.getByLabelText('Cible humaine (les autres protections sont à arbitrer)'));
}
const garde = () => useCombatStore.getState().combatants.find(c => c.id === 'b')!;
describe('les dégâts Delta Green depuis une carte du combat', () => {
    it('80 : 8 + 10 − 10 de protection = 8 ; à 2 PV inconscient, double clic sans second impact', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(80);
        monter();
        fireEvent.change(screen.getByLabelText('Protection Delta Green'), { target: { value: '10' } });
        const b = screen.getByRole('button', { name: 'Lancer et appliquer les dégâts' });
        act(() => { fireEvent.click(b); fireEvent.click(b); });
        expect(garde()).toMatchObject({ hp: 2, sheetData: { PV: 2 }, healthSystem: { state: 'critical', data: { inconscienceA: 2 } } });
    });
    it('15 : mort directe malgré l’armure ; le couvert oblige la somme des dés', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(15);
        monter();
        fireEvent.change(screen.getByLabelText('Protection Delta Green'), { target: { value: '100' } });
        fireEvent.click(screen.getByRole('button', { name: 'Lancer et appliquer les dégâts' }));
        expect(garde().hp).toBe(0);
        expect(garde().healthSystem?.state).toBe('dead');
        cleanup();
        useCombatStore.setState({ combatants: [attaquant, cible] });
        monter();
        fireEvent.click(screen.getByLabelText('Couvert : aucun décès direct par létalité'));
        fireEvent.click(screen.getByRole('button', { name: 'Lancer et appliquer les dégâts' }));
        expect(garde().hp).toBe(4); // 1 + 5.
    });
    it('une attaque critique double la létalité ; une arme ordinaire double ses dégâts', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(25);
        monter();
        fireEvent.click(screen.getByLabelText('Réussite critique : létalité et dégâts doublés'));
        fireEvent.click(screen.getByRole('button', { name: 'Lancer et appliquer les dégâts' }));
        expect(garde().hp).toBe(0); // 25 ≤ 30.
        cleanup();
        const pistolet = { ...attaquant, sheetData: { PV: 10, arme1: 'Pistolet', arme1_degats: '1D10' } };
        useCombatStore.setState({ combatants: [pistolet, cible] });
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(4);
        monter();
        fireEvent.click(screen.getByLabelText('Réussite critique : létalité et dégâts doublés'));
        fireEvent.click(screen.getByRole('button', { name: 'Lancer et appliquer les dégâts' }));
        expect(garde().hp).toBe(2);
    });
    it('l’enrayement conserve sa durée sur l’arme, et sa confirmation ne se répète pas', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(3);
        monter();
        const b = screen.getByRole('button', { name: 'Appliquer la complication choisie' });
        act(() => { fireEvent.click(b); fireEvent.click(b); });
        expect(useCombatStore.getState().combatants[0].sheetData?.arme1_enrayee).toBe(3);
    });
});
