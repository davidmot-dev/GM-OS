// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PanneauDesRessources from './PanneauDesRessources';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import type { RessourceDeTable } from './RessourcesDeTable';

/** **Le lieu magique de Nephilim, au bandeau** — 23/10/2026 : la valeur se lit par son nom. */
const LIEU: RessourceDeTable = {
    id: 'lieuMagique', label: 'Lieu magique', proprietaire: 'meneur', depart: 0, min: 0, max: 6,
    libelles: ['Aucun lieu magique', 'Plexus de Feu', 'Plexus d’Air', 'Plexus d’Eau', 'Plexus de Terre', 'Plexus de Lune', 'Nexus'],
};
beforeEach(() => { useRessourcesDeTableStore.setState({ reserves: { c: { lieuMagique: 0 } } }); });
afterEach(cleanup);

describe('une réserve à libellés', () => {
    it('affiche le nom de sa valeur, et le change avec les mêmes boutons', () => {
        render(<PanneauDesRessources campaignId="c" ressources={[LIEU]} />);
        expect(screen.getByText('Aucun lieu magique')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Ajouter un point de Lieu magique' }));
        expect(screen.getByText('Plexus de Feu')).toBeTruthy();
        expect(useRessourcesDeTableStore.getState().reserves.c.lieuMagique).toBe(1);
    });
});
