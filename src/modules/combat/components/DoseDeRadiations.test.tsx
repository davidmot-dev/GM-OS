import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DoseDeRadiations } from './DoseDeRadiations';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import type { Combatant } from '../types';

/** TRV-A5, T5 (27/11/2026) — C8 et C9 : la dose de Rads et l'Exposition (p. 78). */
const REGLE = { champ: 'rads', endurance: 'endurance', maximum: 'endurance_max' };
const FICHE = { rads: 95, endurance: 7, endurance_max: 7, force: 6, dexterite: 10 };

let de: ReturnType<typeof vi.spyOn>;
const applique = vi.fn();
beforeEach(() => {
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Kathya', init: 0, isPlayer: false, faction: 'player', statuses: [], sheetData: FICHE } as never);
    applique.mockReset();
    useCombatStore.setState({ applyDamage: applique } as never);
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); de.mockRestore(); });
const kathya = () => useCombatStore.getState().combatants[0] as Combatant;

describe('la dose de Rads (C8)', () => {
    it('une dose, sa conséquence cumulée et le prochain seuil — jamais « / 10 »', () => {
        render(<DoseDeRadiations combattant={kathya()} regle={REGLE} valeurs={FICHE} />);
        expect(document.querySelector('[data-dose-rads]')!.textContent).toBe('95 rads — cumul : aucune conséquence ; à 151 rads, −1 END permanent (p. 78)');
        expect(document.body.textContent).not.toContain('/ 10');
    });
});

describe('l’Exposition (C9)', () => {
    it('une arme à rayonnement (160 rads) : la dose s’écrit, 2D de dégâts s’appliquent, l’END permanente se retire', () => {
        render(<DoseDeRadiations combattant={kathya()} regle={REGLE} valeurs={FICHE} />);
        fireEvent.change(screen.getByLabelText('Dose reçue (rads)'), { target: { value: '160' } });
        fireEvent.click(screen.getByText(/Exposer/));
        expect(kathya().sheetData).toMatchObject({ rads: 255 });
        expect(document.querySelector('[data-exposition]')!.textContent).toContain('2D de dégâts');
        let n = 0; de.mockImplementation(() => [3, 4][n++]);
        fireEvent.click(screen.getByText('Lancer 2D et appliquer'));
        expect(applique).toHaveBeenCalledWith(7, 'Rayonnement', [kathya().id]);
        fireEvent.click(screen.getByText(/Retirer 1 END permanent/));
        expect(kathya().sheetData).toMatchObject({ endurance: 6, endurance_max: 6 });
        expect(document.querySelector('[data-end-permanente-retiree]')).toBeTruthy();
    });

    it('une petite dose (20) : rien d’immédiat, aucun seuil franchi', () => {
        render(<DoseDeRadiations combattant={kathya()} regle={REGLE} valeurs={FICHE} />);
        fireEvent.change(screen.getByLabelText('Dose reçue (rads)'), { target: { value: '20' } });
        fireEvent.click(screen.getByText(/Exposer/));
        expect(document.querySelector('[data-exposition]')!.textContent).toContain('Pas de conséquence immédiate');
        expect(screen.queryByText(/Retirer/)).toBeNull();
        expect(screen.queryByText(/Lancer/)).toBeNull();
    });
});
