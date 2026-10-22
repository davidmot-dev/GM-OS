// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AlertesDeFranchissement from './AlertesDeFranchissement';
import PanneauDesRessources from './PanneauDesRessources';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useJournalStore } from '../journal/useJournalStore';
import { useModalStore } from '../../stores/useModalStore';
import { CLE_DES_FRANCHISSEMENTS } from './franchissements';
import type { Franchissement } from '../../types/drivers';

/**
 * **La Séquelle de NOC sous le bandeau** (2026-10-22) : proposée au meneur,
 * écrite seulement sur « Noter », retenue par la fiche dans les deux cas.
 */
const SEQUELLE: Franchissement = {
    id: 'sequelle-blessures', champ: 'blessures', label: 'Blessures', aPartirDe: 8,
    rappel: 'Blessure lourde : un point devient une séquelle',
    mouvements: [{ champ: 'sequelles_blessures', label: 'Séquelles (Blessures)', delta: 1, max: 10 }],
};
const updateCharacter = vi.fn();
const addEvent = vi.fn();
const initial = useSessionOSStore.getState();
const journal = useJournalStore.getState();
const avec = (sheetData: Record<string, unknown>) => useSessionOSStore.setState({
    players: [{ id: 'j', name: 'Joueuse', characters: [{ id: 'ilya', name: 'Ilya Vorn', campaignId: 'c', sheetData }] }],
    updateCharacter,
} as never);
beforeEach(() => {
    updateCharacter.mockClear();
    addEvent.mockClear();
    useJournalStore.setState({ addEvent } as never);
});
afterEach(() => { cleanup(); useSessionOSStore.setState(initial, true); useJournalStore.setState(journal, true); });

describe('les seuils franchis, proposés au meneur', () => {
    it('« Noter » écrit la séquelle et la marque, et le dit au journal', () => {
        avec({ blessures: 8, sequelles_blessures: 0 });
        render(<AlertesDeFranchissement campaignId="c" franchissements={[SEQUELLE]} />);
        expect(screen.getByText(/Blessure lourde/)).toBeTruthy();
        fireEvent.click(screen.getByText('Noter'));
        expect(updateCharacter).toHaveBeenCalledWith('j', 'ilya', { sheetData: {
            blessures: 8, sequelles_blessures: 1, [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true },
        } });
        expect(addEvent.mock.calls[0][0].title).toBe('Séquelle — Ilya Vorn — Blessures 8');
    });

    it('« Écarter » marque sans rien écrire d\'autre, et ne consigne rien', () => {
        avec({ blessures: 9, sequelles_blessures: 0 });
        render(<AlertesDeFranchissement campaignId="c" franchissements={[SEQUELLE]} />);
        fireEvent.click(screen.getByText('Écarter'));
        expect(updateCharacter).toHaveBeenCalledWith('j', 'ilya', { sheetData: {
            blessures: 9, sequelles_blessures: 0, [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true },
        } });
        expect(addEvent).not.toHaveBeenCalled();
    });

    it('déjà traité, rien ne s\'affiche ; redescendu, la fiche est réarmée', () => {
        avec({ blessures: 8, [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true } });
        const { container } = render(<AlertesDeFranchissement campaignId="c" franchissements={[SEQUELLE]} />);
        expect(container.innerHTML).toBe('');
        expect(updateCharacter).not.toHaveBeenCalled();
        cleanup();
        avec({ blessures: 6, [CLE_DES_FRANCHISSEMENTS]: { 'sequelle-blessures': true } });
        render(<AlertesDeFranchissement campaignId="c" franchissements={[SEQUELLE]} />);
        expect(updateCharacter).toHaveBeenCalledWith('j', 'ilya', { sheetData: { blessures: 6, [CLE_DES_FRANCHISSEMENTS]: {} } });
    });
});

describe('un jeu sans réserve de table a quand même sa fin de scène', () => {
    it('le bandeau paraît avec le seul geste, qui ouvre l\'aperçu', () => {
        avec({});
        const showCustom = vi.fn();
        const modales = useModalStore.getState();
        useModalStore.setState({ showCustom } as never);
        render(<PanneauDesRessources campaignId="c" ressources={[]}
            gestes={{ finDeScene: [{ champ: 'corruption_temporaire', label: 'Corruption temporaire', delta: 'vide' }] }} />);
        fireEvent.click(screen.getByText('Fin de scène'));
        expect(showCustom).toHaveBeenCalledWith('gestes-des-heros', { geste: 'finDeScene' });
        useModalStore.setState(modales, true);
    });

    it('sans réserve ni geste, rien', () => {
        const { container } = render(<PanneauDesRessources campaignId="c" ressources={[]} />);
        expect(container.innerHTML).toBe('');
    });
});
