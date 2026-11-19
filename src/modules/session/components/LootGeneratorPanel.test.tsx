import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LootGeneratorPanel from './LootGeneratorPanel';

const simulations = vi.hoisted(() => ({ proposer: vi.fn(), notifier: vi.fn(), ajouter: vi.fn(), pilote: { lootTables: [] } as Record<string, unknown> }));
vi.mock('../../ai/modeDeContexte', () => ({ useModeDeContexte: () => ({ allege: true, imposeParLaSeance: false }) }));
vi.mock('../../ai/IndicateurDeMode', () => ({ IndicateurDeMode: () => null }));
vi.mock('../useSessionOSStore', () => ({ useSessionOSStore: () => ({ getActiveDriver: () => simulations.pilote, addLootToPool: simulations.ajouter }) }));
vi.mock('../logic/propositionDeButinIA', () => ({ proposerDesObjets: simulations.proposer }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: simulations.notifier }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({
    t: (cle: string, options?: { message?: string }) => options?.message === undefined ? cle : `${cle}:${options.message}`,
}) }));

beforeEach(() => {
    vi.clearAllMocks();
    simulations.proposer.mockReset();
    simulations.pilote = { lootTables: [] };
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

/**
 * **Le tirage lit le catalogue du pilote** — registre § 264, T2 (19/11/2026) : une ligne
 * « Objet du catalogue » donne au pool l'objet du catalogue, relié (`catalogueId`).
 */
describe('tirer une table qui désigne le catalogue', () => {
    it('verse au pool l’objet du catalogue du pilote, relié', async () => {
        simulations.pilote = {
            catalogue: { colonnes: {}, objets: [{ id: 'm4a3', famille: 'arme', nom: 'Pistolet M4A3', valeurs: {}, cout: '200 $' }] },
            lootTables: [{ id: 'casier', name: 'Casier', rollMode: 'weighted', entries: [
                { name: 'Pistolet M4A3', type: 'catalogue', weight: 1, metadata: { catalogueId: 'm4a3' } },
            ] }],
        };
        render(<LootGeneratorPanel />);
        fireEvent.click(screen.getByText('Casier'));
        await waitFor(() => expect(simulations.ajouter).toHaveBeenCalledTimes(1));
        expect(simulations.ajouter.mock.calls[0][0]).toEqual([expect.objectContaining({
            name: 'Pistolet M4A3', type: 'arme', value: 200, properties: { catalogueId: 'm4a3' },
        })]);
        expect(simulations.notifier).not.toHaveBeenCalled();
    });
});

/**
 * **« Depuis le catalogue », en séance** — registre § 264, T6 (19/11/2026). David :
 * « Oui, aussi en séance ». Les objets cochés vont au pool, reliés, sans table (C9).
 */
describe('verser au butin depuis le catalogue', () => {
    const CATALOGUE = { colonnes: {}, objets: [
        { id: 'combinaison', famille: 'protection', nom: 'Combinaison spatiale', valeurs: {}, cout: '1 000 $' },
        { id: 'ration', famille: 'materiel', nom: 'Ration', valeurs: {} },
    ] };

    it('les objets cochés arrivent au pool, reliés au catalogue, et le geste se dit', () => {
        simulations.pilote = { catalogue: CATALOGUE, lootTables: [] };
        render(<LootGeneratorPanel />);
        fireEvent.click(screen.getByRole('button', { name: /modules:loot.generator.catalogue_btn/ }));
        const fenetre = screen.getByRole('dialog', { name: 'Choisir dans le catalogue' });
        fireEvent.click(within(fenetre).getByRole('option', { name: /Combinaison spatiale/ }));
        fireEvent.click(within(fenetre).getByRole('tab', { name: /Matériel/ }));
        fireEvent.click(within(fenetre).getByRole('option', { name: /Ration/ }));
        fireEvent.click(within(fenetre).getByRole('button', { name: /modules:loot.generator.catalogue_geste/ }));
        expect(simulations.ajouter).toHaveBeenCalledTimes(1);
        expect(simulations.ajouter.mock.calls[0][0].map((o: { name: string; value: number; properties: { catalogueId: string } }) => [o.name, o.value, o.properties.catalogueId]))
            .toEqual([['Combinaison spatiale', 1000, 'combinaison'], ['Ration', 0, 'ration']]);
        // Le pool annonce lui-même ce qu'il reçoit : pas de second message ici.
        expect(simulations.notifier).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog', { name: 'Choisir dans le catalogue' })).toBeNull();
    });

    it('sans catalogue, pas de bouton', () => {
        render(<LootGeneratorPanel />);
        expect(screen.queryByRole('button', { name: /modules:loot.generator.catalogue_btn/ })).toBeNull();
    });
});
