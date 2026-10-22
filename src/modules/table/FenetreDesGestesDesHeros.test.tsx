// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import FenetreDesGestesDesHeros from './FenetreDesGestesDesHeros';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import type { GameDriver } from '../../types/drivers';

/**
 * **La fenêtre du moment de calme et des effets du Fiel** — NOC, 2026-10-16 :
 * on lit l'aperçu Héros par Héros, puis on applique ; seules les fiches qui
 * changent sont écrites.
 */
const PILOTE = {
    id: 'noc', name: 'NOC', templateId: 'tpl-noc',
    ressourcesDeTable: [
        { id: 'Fiel', label: 'Fiel', proprietaire: 'meneur', depart: 0, min: 0, max: 5, debordement: { vers: 'Menace' } },
        { id: 'Menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0 },
    ],
    gestesDesHeros: {
        momentDeCalme: {
            table: [{ ressource: 'Fiel', delta: -1 }],
            heros: [{ champ: 'espoir', label: 'Espoir', delta: 1, plus: 'extase', max: 10 }, { champ: 'trauma', label: 'Trauma', delta: -1 }],
            leve: ['fatigue'],
        },
        effetsDuDebordement: {
            ressource: 'Fiel', nombreSelon: 'Menace',
            effets: [{ id: 'tension', label: 'Tension', heros: [{ champ: 'trauma', label: 'Trauma', delta: 2, resistance: 'folie', max: 10 }] }],
        },
    },
} as unknown as GameDriver;

const updateCharacter = vi.fn();
const initial = useSessionOSStore.getState();
beforeEach(() => {
    updateCharacter.mockClear();
    useSessionOSStore.setState({
        activeCampaignId: 'c',
        campaigns: [{ id: 'c', name: 'NOC', system: 'noc', activeLocationIds: [] }],
        players: [{ id: 'j', name: 'Joueuse', characters: [
            { id: 'ilse', name: 'Ilse', campaignId: 'c', sheetData: { espoir: 1, extase: 1, trauma: 3, folie: 1, fatigue: true, nom: 'Ilse' } },
            { id: 'bram', name: 'Bram', campaignId: 'c', sheetData: { espoir: 10, trauma: 0, folie: 2 } },
            { id: 'ailleurs', name: 'Ailleurs', campaignId: 'x', sheetData: { espoir: 0 } },
        ] }],
        getActiveDriver: () => PILOTE,
        customSheetTemplates: [{ id: 'tpl-noc', name: 'Héros', emoji: '', sections: [{ id: 's', label: 'S', fields: [
            { id: 'extase', label: 'Extase', type: 'number' }, { id: 'fatigue', label: 'Fatigué', type: 'checkbox' }] }] }],
        updateCharacter,
        updateCharacterHealth: vi.fn(),
    } as never);
    useRessourcesDeTableStore.setState({ reserves: { c: { Fiel: 2, Menace: 1 } } });
});
afterEach(() => { cleanup(); useSessionOSStore.setState(initial, true); });

describe('le moment de calme', () => {
    it('montre ce qui change, puis écrit les fiches et retire une goutte de Fiel', () => {
        const fermer = vi.fn();
        render(<FenetreDesGestesDesHeros geste="calme" onClose={fermer} />);
        expect(screen.getByText('Espoir 1 → 3 (+2, +1 Extase)')).toBeTruthy();
        // Les libellés de la fiche, pas les identifiants.
        expect(screen.getByText('Fatigué prend fin')).toBeTruthy();
        expect(screen.queryByText('Ailleurs')).toBeNull();
        // Bram n'a rien à récupérer : Espoir au plafond, Trauma à zéro.
        expect(screen.getByText('Rien ne change.')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
        expect(updateCharacter).toHaveBeenCalledTimes(1);
        expect(updateCharacter).toHaveBeenCalledWith('j', 'ilse', {
            sheetData: { espoir: 3, extase: 1, trauma: 2, folie: 1, fatigue: false, nom: 'Ilse' },
        });
        expect(useRessourcesDeTableStore.getState().reserves.c.Fiel).toBe(1);
        expect(fermer).toHaveBeenCalled();
    });
});

describe('les effets du Fiel', () => {
    it('la Menace dit combien en choisir ; rien ne s’applique sans choix', () => {
        render(<FenetreDesGestesDesHeros geste="debordement" onClose={() => {}} />);
        expect(screen.getByText(/1 effet à choisir/)).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Appliquer' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('Tension choisie deux fois : les pertes s’additionnent avant la Folie', () => {
        render(<FenetreDesGestesDesHeros geste="debordement" onClose={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: 'Une fois de plus : Tension' }));
        fireEvent.click(screen.getByRole('button', { name: 'Une fois de plus : Tension' }));
        expect(screen.getByRole('status').textContent).toBe('La règle en demande 1 ; 2 choisis.');
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
        // Ilse : 3 + 4 − 1 = 6 ; Bram : 0 + 4 − 2 = 2.
        expect(updateCharacter.mock.calls.map(([, id, maj]) => [id, maj.sheetData.trauma])).toEqual([['ilse', 6], ['bram', 2]]);
        expect(useRessourcesDeTableStore.getState().reserves.c.Fiel).toBe(2);
    });
});

/** **La fin de scène** (Symbaroum, 2026-10-22) : la Corruption temporaire revient à zéro, après l'aperçu. */
describe('la fin de scène', () => {
    it('montre la remise à zéro Héros par Héros, puis n\'écrit que les fiches qui changent', () => {
        // Un seul objet : le sélecteur du magasin compare les références.
        const symbaroum = { ...PILOTE, gestesDesHeros: { finDeScene: [{ champ: 'trauma', label: 'Trauma', delta: 'vide' }] } };
        useSessionOSStore.setState({ getActiveDriver: () => symbaroum } as never);
        const fermer = vi.fn();
        render(<FenetreDesGestesDesHeros geste="finDeScene" onClose={fermer} />);
        expect(screen.getByText('Trauma 3 → 0 (remis à 0)')).toBeTruthy();
        fireEvent.click(screen.getByText('Appliquer'));
        expect(updateCharacter).toHaveBeenCalledTimes(1);
        expect(updateCharacter.mock.calls[0][2].sheetData.trauma).toBe(0);
        expect(fermer).toHaveBeenCalled();
    });
});
