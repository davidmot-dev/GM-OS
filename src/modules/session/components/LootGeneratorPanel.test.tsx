import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LootGeneratorPanel from './LootGeneratorPanel';

const simulations = vi.hoisted(() => ({ proposer: vi.fn(), notifier: vi.fn(), ajouter: vi.fn() }));
vi.mock('../../ai/modeDeContexte', () => ({ useModeDeContexte: () => ({ allege: true, imposeParLaSeance: false }) }));
vi.mock('../../ai/IndicateurDeMode', () => ({ IndicateurDeMode: () => null }));
vi.mock('../useSessionOSStore', () => ({ useSessionOSStore: () => ({ getActiveDriver: () => ({ lootTables: [] }), addLootToPool: simulations.ajouter }) }));
vi.mock('../logic/propositionDeButinIA', () => ({ proposerDesObjets: simulations.proposer }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: simulations.notifier }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({
    t: (cle: string, options?: { message?: string }) => options?.message === undefined ? cle : `${cle}:${options.message}`,
}) }));

beforeEach(() => {
    vi.clearAllMocks();
    simulations.proposer.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('génération de butin en erreur', () => {
    it.each([
        { exception: null, attendu: 'Error' },
        { exception: { message: 'panne structurée' }, attendu: 'panne structurée' },
    ])('affiche $attendu, garde la demande et autorise la reprise', async ({ exception, attendu }) => {
        simulations.proposer.mockRejectedValueOnce(exception).mockResolvedValueOnce([]);
        render(<LootGeneratorPanel />);
        const saisie = screen.getByPlaceholderText('modules:loot.generator.input_placeholder');
        const generer = screen.getByRole('button', { name: 'modules:loot.generator.agencement.generer' });
        fireEvent.change(saisie, { target: { value: 'Un butin artificiel' } });
        fireEvent.click(generer);
        await waitFor(() => expect(simulations.notifier).toHaveBeenCalledWith(
            `modules:loot.generator.toasts.ai_failed:${attendu}`, 'error',
        ));
        expect(saisie).toHaveValue('Un butin artificiel');
        expect(generer).toBeEnabled();
        fireEvent.click(generer);
        await waitFor(() => expect(simulations.proposer).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(generer).toBeEnabled());
        expect(simulations.ajouter).not.toHaveBeenCalled();
    });
});
