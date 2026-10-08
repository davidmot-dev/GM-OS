import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AtelierDesTables } from './AtelierDesTables';
import { pontDesTables } from '../pontDesTables';
import type { TableBridge } from '../types';

vi.mock('../pontDesTables', () => ({ pontDesTables: vi.fn() }));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));

const pont: TableBridge = {
    listUniverses: vi.fn(), listTables: vi.fn(), loadTable: vi.fn(),
    saveTable: vi.fn(), deleteTable: vi.fn(), ouvrirUneSource: vi.fn(),
};
const changees = vi.fn();
const props = { ouvert: true, onFermer: () => {}, onTablesChangees: changees };
function enAttente<T>() {
    let resoudre!: (valeur: T) => void;
    const promesse = new Promise<T>(resolve => { resoudre = resolve; });
    return { promesse, resoudre };
}
function choisir(univers: string) {
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: univers } });
}

beforeEach(() => {
    vi.mocked(pontDesTables).mockReset().mockReturnValue(pont);
    vi.mocked(pont.listUniverses).mockReset().mockResolvedValue(['Alpha', 'Beta']);
    vi.mocked(pont.listTables).mockReset().mockResolvedValue([]);
    vi.mocked(pont.loadTable).mockReset().mockResolvedValue({ name: 'Oracle', dice: '1d6', entries: [
        { min: 1, max: 6, title: 'Résultat', description: '' },
    ] });
    vi.mocked(pont.saveTable).mockReset().mockResolvedValue({ ok: true });
    vi.mocked(pont.deleteTable).mockReset().mockResolvedValue({ ok: true });
    changees.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => vi.unstubAllGlobals());

describe('la liste des tables du contexte courant', () => {
    it('ne demande aucune liste sans univers ou sans pont', async () => {
        const vue = render(<AtelierDesTables {...props} />);
        await screen.findByRole('option', { name: 'Alpha' });
        expect(pont.listTables).not.toHaveBeenCalled();
        vi.mocked(pontDesTables).mockReturnValue(undefined);
        choisir('Alpha');
        expect(pont.listTables).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /Nouvelle table/ })).toBeTruthy();
        vue.unmount();
    });

    it('retire la liste précédente pendant la lecture du nouvel univers et sans sélection', async () => {
        const beta = enAttente<string[]>();
        vi.mocked(pont.listTables).mockResolvedValueOnce(['Oracle Alpha']).mockReturnValueOnce(beta.promesse);
        render(<AtelierDesTables {...props} universDepart="Alpha" />);
        await screen.findByRole('button', { name: 'Oracle Alpha' });
        choisir('Beta');
        expect(screen.queryByRole('button', { name: 'Oracle Alpha' })).toBeNull();
        await act(async () => beta.resoudre(['Oracle Beta']));
        expect(screen.getByRole('button', { name: 'Oracle Beta' })).toBeTruthy();
        choisir('');
        expect(screen.queryByRole('button', { name: 'Oracle Beta' })).toBeNull();
        expect(pont.listTables).toHaveBeenCalledTimes(2);
    });

    it('ignore une réponse arrivée après celle du nouvel univers', async () => {
        const alpha = enAttente<string[]>();
        vi.mocked(pont.listTables).mockReturnValueOnce(alpha.promesse).mockResolvedValueOnce(['Oracle Beta']);
        render(<AtelierDesTables {...props} universDepart="Alpha" />);
        await screen.findByRole('option', { name: 'Beta' });
        choisir('Beta');
        await screen.findByRole('button', { name: 'Oracle Beta' });
        await act(async () => alpha.resoudre(['Oracle Alpha']));
        expect(screen.queryByRole('button', { name: 'Oracle Alpha' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Oracle Beta' })).toBeTruthy();
    });

    it('traite une liste illisible comme vide', async () => {
        vi.mocked(pont.listTables).mockRejectedValueOnce(new Error('lecture indisponible'));
        render(<AtelierDesTables {...props} universDepart="Alpha" />);
        await waitFor(() => expect(pont.listTables).toHaveBeenCalledExactlyOnceWith('Alpha'));
        expect(screen.getByRole('button', { name: /Nouvelle table/ })).toBeTruthy();
    });

    it('abandonne une lecture à la fermeture et relit à la réouverture', async () => {
        const ancienne = enAttente<string[]>();
        vi.mocked(pont.listTables).mockReturnValueOnce(ancienne.promesse).mockResolvedValueOnce(['Liste fraîche']);
        const vue = render(<AtelierDesTables {...props} universDepart="Alpha" />);
        vue.rerender(<AtelierDesTables {...props} ouvert={false} universDepart="Alpha" />);
        await act(async () => ancienne.resoudre(['Liste périmée']));
        vue.rerender(<AtelierDesTables {...props} universDepart="Alpha" />);
        expect(screen.queryByRole('button', { name: 'Liste périmée' })).toBeNull();
        await screen.findByRole('button', { name: 'Liste fraîche' });
        expect(pont.listTables).toHaveBeenCalledTimes(2);
    });

    it('rafraîchit la liste après sauvegarde et suppression, et informe le pupitre', async () => {
        vi.mocked(pont.listTables).mockResolvedValueOnce([]).mockResolvedValueOnce(['Mon oracle']).mockResolvedValueOnce([]);
        render(<AtelierDesTables {...props} universDepart="Alpha" />);
        await screen.findByRole('option', { name: 'Alpha' });
        fireEvent.change(screen.getByPlaceholderText('Titre de la table'), { target: { value: 'Mon oracle' } });
        fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));
        await screen.findByRole('button', { name: 'Mon oracle' });
        expect(pont.saveTable).toHaveBeenCalledWith('Alpha', 'Mon oracle', expect.objectContaining({ name: 'Mon oracle' }));
        expect(changees).toHaveBeenCalledExactlyOnceWith('Alpha');
        fireEvent.click(screen.getByRole('button', { name: /Supprimer/ }));
        await waitFor(() => expect(pont.listTables).toHaveBeenCalledTimes(3));
        expect(screen.queryByRole('button', { name: 'Mon oracle' })).toBeNull();
        expect(pont.deleteTable).toHaveBeenCalledExactlyOnceWith('Alpha', 'Mon oracle');
        expect(changees).toHaveBeenCalledTimes(2);
    });

    it('sauvegarde dans un nouvel univers et recharge sa liste', async () => {
        vi.mocked(pont.listTables).mockResolvedValueOnce(['Nouvel oracle']);
        render(<AtelierDesTables {...props} />);
        await screen.findByRole('option', { name: 'Alpha' });
        fireEvent.change(screen.getByPlaceholderText('…ou un nouvel univers'), { target: { value: 'Gamma' } });
        fireEvent.change(screen.getByPlaceholderText('Titre de la table'), { target: { value: 'Nouvel oracle' } });
        fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));
        await screen.findByRole('button', { name: 'Nouvel oracle' });
        expect(pont.listTables).toHaveBeenCalledExactlyOnceWith('Gamma');
        expect(changees).toHaveBeenCalledExactlyOnceWith('Gamma');
    });
});
