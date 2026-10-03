import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RulebookViewer } from './RulebookViewer';
import { useSessionOSStore } from '../useSessionOSStore';
import { tousLesPilotes } from '../store/tousLesPilotes';

/**
 * **Le livre de règles montre le jeu de la campagne, ou le dit.**
 *
 * Relevé le 2026-10-03 en écrivant le manuel : une campagne rattachée à un
 * gabarit de fiche (« Generic ») n'a pas de pilote, et le livre ouvrait alors
 * le **premier de la liste** — Dune — sans un mot. Ces tests gardent les deux
 * moitiés de la correction : on ne montre pas un autre jeu à la place du sien,
 * et quand le meneur en consulte un autre, l'écran le nomme.
 */

/* L'atelier de règles lit le corpus : on ne teste que le choix du jeu ici. */
vi.mock('./RuleWorkshopViewer', () => ({ RuleWorkshopViewer: () => null }));

const PILOTES = tousLesPilotes([]);
const UN_JEU = PILOTES[0];

const campagne = (system: string) => ({
    id: 'c1', name: 'Le Silence de Varn', system, description: '', synopsis: '',
});

describe('le livre de règles et le jeu de la campagne', () => {
    beforeEach(() => {
        useSessionOSStore.setState({ customGameDrivers: [], activeCampaignId: 'c1' } as never);
    });

    it('sans jeu, il le dit au lieu d’ouvrir le premier pilote venu', () => {
        useSessionOSStore.setState({ campaigns: [campagne('generic')] } as never);
        render(<RulebookViewer />);

        expect(screen.getByText(/Cette campagne n’a pas de jeu/)).toBeTruthy();
        expect(screen.getByText('Choisir le jeu de la campagne')).toBeTruthy();
        expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    });

    it('un autre jeu se consulte, et l’écran le nomme', () => {
        useSessionOSStore.setState({ campaigns: [campagne('generic')] } as never);
        render(<RulebookViewer />);

        fireEvent.click(screen.getByRole('button', { name: new RegExp(UN_JEU.name) }));

        expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(UN_JEU.name);
        expect(screen.getByText(/ce n’est pas le jeu de la campagne/i)).toBeTruthy();
    });

    it('le jeu de la campagne s’ouvre directement, sans avertissement', () => {
        useSessionOSStore.setState({ campaigns: [campagne(UN_JEU.id)] } as never);
        render(<RulebookViewer />);

        expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(UN_JEU.name);
        expect(screen.queryByText(/ce n’est pas le jeu de la campagne/i)).toBeNull();
    });
});
