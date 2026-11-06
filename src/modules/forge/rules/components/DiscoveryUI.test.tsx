import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiscoveryUI from './DiscoveryUI';
import { useBrainstormStore } from '../store/useBrainstormStore';
import type { BrainstormCandidate } from '../types';

/*
 * Le sujet libre retrouvé dans la liste — David, le 06/11/2026, sur COC : il tape « La gestion
 * simplifiée des adversaires… », déjà inventorié et déjà publié, et « il n'y a rien qui se passe
 * dans la forge ». La liste le dit maintenant, au-dessus des cartes.
 */
const sujet = (id: string, title: string, tags: string[]): BrainstormCandidate =>
    ({ id, title, category: 'rule', summary: '', tags });

const ADVERSAIRES = 'la-gestion-simplifiee-des-adversaires-par-roles-et-bandes-de-sbires';

describe('DiscoveryUI — le sujet libre', () => {
    const origine = useBrainstormStore.getState();
    afterEach(() => useBrainstormStore.setState(origine, true));

    const poser = (candidates: BrainstormCandidate[]) =>
        useBrainstormStore.setState({ ...origine, candidates, isProcessing: false });

    it('un sujet déjà publié : le bandeau dit de cliquer pour reforger, la carte est désignée', () => {
        poser([
            sujet(ADVERSAIRES, 'La gestion simplifiée des adversaires', ['oui', 'hors canevas', 'sujet libre retrouvé']),
            sujet('poursuites', 'Poursuites', ['oui']),
        ]);
        render(<DiscoveryUI onSelect={vi.fn()} fichesPubliees={[ADVERSAIRES]} />);
        const bandeau = screen.getByRole('status');
        expect(bandeau.getAttribute('data-sujet-libre')).toBe(ADVERSAIRES);
        expect(bandeau.textContent).toContain('custom_subject_found_published');
        const designee = document.querySelector('[aria-current="true"]');
        expect(designee?.textContent).toContain('La gestion simplifiée des adversaires');
    });

    it('un sujet inventorié mais pas encore publié : le bandeau dit de cliquer pour forger', () => {
        poser([sujet(ADVERSAIRES, 'La gestion simplifiée des adversaires', ['oui', 'sujet libre retrouvé'])]);
        render(<DiscoveryUI onSelect={vi.fn()} fichesPubliees={[]} />);
        expect(screen.getByRole('status').textContent).toContain('custom_subject_found');
        expect(screen.getByRole('status').textContent).not.toContain('published');
    });

    it('un sujet inédit, ajouté en tête : pas de bandeau, la carte suffit', () => {
        poser([sujet('voyages', 'Voyages interstellaires', ['hors canevas', 'sujet libre'])]);
        render(<DiscoveryUI onSelect={vi.fn()} />);
        expect(screen.queryByRole('status')).toBeNull();
        expect(document.querySelector('[aria-current="true"]')?.textContent).toContain('Voyages interstellaires');
    });

    it('sans sujet libre : ni bandeau, ni carte désignée', () => {
        poser([sujet('poursuites', 'Poursuites', ['oui'])]);
        render(<DiscoveryUI onSelect={vi.fn()} />);
        expect(screen.queryByRole('status')).toBeNull();
        expect(document.querySelector('[aria-current]')).toBeNull();
    });
});
