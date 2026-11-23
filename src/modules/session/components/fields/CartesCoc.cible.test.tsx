// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DefenseCibleCoc } from './CartesCoc';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useCombatStore } from '../../../combat/useCombatStore';

/**
 * **La cible de la carte, défenseur d'emblée** — registre § 267, T2 (23/11/2026). « Attaquer » sur un
 * adversaire de COC ouvre son jet : la cible de la carte est choisie comme défenseur, et sa DEF devient
 * la difficulté de l'attaque (livre, p. 58) ; sans cible, rien ne change (`PanneauDeCoc`).
 */
const PILOTE = {
    combat: {},
    jet: { coc: { des: 'd20', sante: 'echelle_de_sante', suivi: { defense: 'defense', constitution: 'constitution', initiative: 'initiative' } } },
};
const initial = useSessionOSStore.getState();

beforeEach(() => {
    useSessionOSStore.setState({ getActiveDriver: () => PILOTE, activeCampaignId: 'c', players: [], entities: [] } as never);
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Rachel', init: 0, isPlayer: true, faction: 'player', statuses: [],
        sheetData: { defense: 14, echelle_de_sante: 0 } } as never);
});
afterEach(() => { cleanup(); useSessionOSStore.setState(initial, true); });

describe('COC : la cible de la carte comme défenseur (§ 267, T2)', () => {
    it('ouvert par « Attaquer », Rachel est choisie : sa DEF 14 fait la difficulté', () => {
        const rachel = useCombatStore.getState().combatants[0];
        const choisir = vi.fn();
        render(<DefenseCibleCoc choisir={choisir} cleInitiale={`combatant:${rachel.id}`} />);
        expect((screen.getByLabelText('Défenseur COC') as HTMLSelectElement).value).toBe(`combatant:${rachel.id}`);
        fireEvent.click(screen.getByRole('button', { name: /Utiliser DEF 14/ }));
        expect(choisir).toHaveBeenCalledWith(14);
    });

    it('sans cible initiale (le panneau COC), rien n’est choisi', () => {
        render(<DefenseCibleCoc choisir={vi.fn()} />);
        expect((screen.getByLabelText('Défenseur COC') as HTMLSelectElement).value).toBe('');
        expect(screen.queryByRole('button', { name: /Utiliser DEF/ })).toBeNull();
    });
});
