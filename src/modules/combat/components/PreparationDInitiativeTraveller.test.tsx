import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PreparationDInitiativeTraveller } from './PreparationDInitiativeTraveller';
import { useInitiativeDeTravellerStore } from '../useInitiativeDeTravellerStore';

/** TRV-A4, T3 (27/11/2026) — C5 et C6 : la préparation se pose dans le magasin que lit le jet. */
describe('préparer l’initiative de Traveller', () => {
    beforeEach(() => useInitiativeDeTravellerStore.getState().reinitialiser());
    afterEach(cleanup);

    it('pose la Tactique de chaque camp et le camp qui surprend ; « Remettre à zéro » efface tout', () => {
        render(<PreparationDInitiativeTraveller />);
        fireEvent.change(screen.getByLabelText('Effet de Tactique des Voyageurs'), { target: { value: '3' } });
        fireEvent.change(screen.getByLabelText('Camp qui tend l’embuscade'), { target: { value: 'adversaires' } });
        expect(useInitiativeDeTravellerStore.getState()).toMatchObject({ tactique: { voyageurs: 3, adversaires: 0 }, embuscade: 'adversaires' });
        fireEvent.click(screen.getByText('Remettre à zéro'));
        expect(useInitiativeDeTravellerStore.getState()).toMatchObject({ tactique: { voyageurs: 0, adversaires: 0 }, embuscade: null });
    });
});
