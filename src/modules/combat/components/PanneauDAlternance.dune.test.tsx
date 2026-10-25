import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PanneauDAlternance from './PanneauDAlternance';
import { useCombatStore } from '../useCombatStore';
import { useOrdreDuTourStore } from '../useOrdreDuTourStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { agir, ouvrirLeRound } from '../logic/OrdreDuTour';
import type { Combatant } from '../types';
const dune = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const c = (id: string, joueur = false): Combatant => ({ id, name: id, init: 0, isPlayer: joueur, faction: joueur ? 'player' : 'enemy', statuses: [] });
const installer = (acteur: Combatant, autres: Combatant[]) => {
    useCombatStore.setState({ combatants: [acteur, ...autres], round: 1 });
    useOrdreDuTourStore.setState({ tour: agir(ouvrirLeRound(acteur.isPlayer ? 'joueurs' : 'adversaires'), acteur.id) });
    useRessourcesDeTableStore.setState({ reserves: { dune: { impulsion: 6, menace: 10 } } });
    render(<PanneauDAlternance descripteur={dune.combat.initiative!} campaignId="dune" ressourcesDeTable={dune.ressourcesDeTable} />);
};
afterEach(() => { cleanup(); useOrdreDuTourStore.setState({ tour: null }); useCombatStore.setState({ combatants: [] }); useRessourcesDeTableStore.setState({ reserves: {} }); });
describe('les gestes de rétention Dune', () => {
    it('la rétention ennemie dépense 2 Menace, même avec six points d’Impulsion', () => {
        installer(c('Garde'), [c('Soldat'), c('Paul', true)]);
        fireEvent.click(screen.getByRole('button', { name: /^Conserver/ }));
        expect(useRessourcesDeTableStore.getState().reserves.dune).toMatchObject({ impulsion: 6, menace: 8 });
    });
    it('un PJ seul rejoue et le +1 appartient seulement à sa nouvelle action', () => {
        installer(c('Paul', true), [c('Garde')]);
        fireEvent.click(screen.getByRole('button', { name: /^Rejouer le même personnage/ }));
        expect(useOrdreDuTourStore.getState().tour?.repriseDune).toBe('Paul');
        fireEvent.click(screen.getByRole('button', { name: /Paul.*Nouvelle action/ }));
        expect(useOrdreDuTourStore.getState().tour).toMatchObject({ ontAgi: ['Paul'], difficulteDune: 1, activationsConsecutives: 2 });
        expect((screen.getByRole('button', { name: /^Conserver/ }) as HTMLButtonElement).disabled).toBe(true);
    });
    it('le résultat de l’action interdit une rétention après attaque ratée', () => {
        installer(c('Paul', true), [c('Garde')]);
        fireEvent.change(screen.getByLabelText('Action résolue Dune'), { target: { value: 'attaque-ratee' } });
        expect((screen.getByRole('button', { name: /^Rejouer/ }) as HTMLButtonElement).disabled).toBe(true);
        expect(useRessourcesDeTableStore.getState().reserves.dune).toMatchObject({ impulsion: 6, menace: 10 });
    });
});
