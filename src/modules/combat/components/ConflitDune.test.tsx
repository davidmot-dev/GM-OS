import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { DefaiteDune } from './ConflitDune';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { CLE_DUNE, lireDune } from '../../dice/systemes/duneRegles';
const dune = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const campagnes = useSessionOSStore.getState().campaigns;
const active = useSessionOSStore.getState().activeCampaignId;
afterEach(() => { cleanup(); useCombatStore.setState({ combatants: [] }); useSessionOSStore.setState({ campaigns: campagnes, activeCampaignId: active }); useRessourcesDeTableStore.setState({ reserves: {} }); });
describe('survivre à la défaite sur la carte', () => {
    it('un PNJ autonome nomme sa scène, dépense sa Menace et ne survit qu’une fois dans cette scène', () => {
        const defaite = { genre: 'notable' as const, vaincu: true, progression: 6, conditions: 6, qualite: 1, durable: '', recuperation: 0 };
        useSessionOSStore.setState({ campaigns: [...campagnes, { id: 'dune-test', name: 'Dune', system: 'dune', description: '', activeLocationIds: [] }], activeCampaignId: 'dune-test' });
        useRessourcesDeTableStore.setState({ reserves: { 'dune-test': { impulsion: 6, menace: 10 } } });
        useCombatStore.setState({ combatants: [{ id: 'garde', name: 'Garde', isPlayer: false, faction: 'enemy', init: 0, statuses: [], sheetData: { [CLE_DUNE]: { ...lireDune({}), defaite } } }] });
        const Carte = () => <DefaiteDune combattant={useCombatStore(s => s.combatants[0])} regle={dune.jet!.dune!} />;
        render(<Carte />);
        fireEvent.change(screen.getByLabelText('Nouvelle scène du combattant Dune'), { target: { value: 'duel-1' } });
        fireEvent.click(screen.getByText('Ouvrir la scène du combattant'));
        fireEvent.change(screen.getByLabelText('Complication de survie Dune'), { target: { value: 'Désarmé' } });
        fireEvent.click(screen.getByRole('button', { name: /^Survivre à la défaite/ }));
        expect(useRessourcesDeTableStore.getState().reserves['dune-test']).toMatchObject({ impulsion: 6, menace: 8 });
        let c = useCombatStore.getState().combatants[0];
        expect(lireDune(c.sheetData!).defaite).toMatchObject({ vaincu: false, progression: 6, survieScene: 'duel-1' });
        expect(c.healthSystem?.state).toBe('healthy');
        // Une nouvelle attaque dans la même scène ne rend pas la survie disponible.
        const s = lireDune(c.sheetData!); act(() => useCombatStore.getState().updateCombatant(c.id, { sheetData: { ...c.sheetData, [CLE_DUNE]: { ...s, defaite: { ...s.defaite, vaincu: true } } } }));
        c = useCombatStore.getState().combatants[0];
        expect(lireDune(c.sheetData!).defaite?.survieScene).toBe('duel-1');
        expect((screen.getByRole('button', { name: /^Survivre à la défaite/ }) as HTMLButtonElement).disabled).toBe(true);
    });
});
