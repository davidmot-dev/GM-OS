import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../../i18n';

/**
 * **La fiche d'un joueur, à la Table** — David, 11/11/2026 : « lorsqu'on est à
 * Table, je voudrais quand je vais sur un joueur, ne voir que ses personnages
 * actifs dans la partie ». Décision : actifs = **ajoutés à la séance en cours** ;
 * en Atelier, tous ceux de la campagne.
 */

vi.mock('../logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({ useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) } }));

const { default: CharacterGrid } = await import('./CharacterGrid');
const { useSessionOSStore } = await import('../useSessionOSStore');

const pj = (id: string, name: string) => ({ id, name, campaignId: 'camp', hp: 10, maxHp: 10, sheetData: {} });
const voit = (nom: string) => screen.queryAllByText(nom).length > 0;

beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'camp', campaigns: [{ id: 'camp', name: 'Recette', system: 'argyropee', activeLocationIds: [] }],
        players: [{ id: 'j1', realName: 'David', isOnline: true, characters: [pj('a', '[RECETTE] BAS'), pj('b', '[RECETTE] JET'), pj('c', '[RECETTE] SANTE')] }],
        selectedPlayerId: 'j1', selectedCharacterId: null, connectedCharacters: {},
        sessions: [],
    } as never);
});

describe('la fiche d’un joueur', () => {
    it('en Atelier (aucune séance en cours), tous ses personnages de la campagne', () => {
        render(<CharacterGrid />);
        expect(voit('[RECETTE] BAS') && voit('[RECETTE] JET') && voit('[RECETTE] SANTE')).toBe(true);
        expect(document.querySelector('[data-hors-seance]')).toBeNull();
    });

    it('à la Table, seulement ceux de la séance ; les autres se retrouvent par « Afficher »', () => {
        useSessionOSStore.setState({ sessions: [{ id: 's1', campaignId: 'camp', status: 'active', number: 1, sessionEntityIds: ['b'] }] } as never);
        render(<CharacterGrid />);
        expect(voit('[RECETTE] JET')).toBe(true);
        expect(voit('[RECETTE] BAS') || voit('[RECETTE] SANTE')).toBe(false);
        const ligne = document.querySelector('[data-hors-seance]')!;
        expect(ligne.textContent).toContain('2 autres personnages ne sont pas dans la séance');
        fireEvent.click(screen.getByRole('button', { name: 'Afficher' }));
        expect(voit('[RECETTE] BAS') && voit('[RECETTE] SANTE')).toBe(true);
    });
});
