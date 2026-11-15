import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RemoteTables from './RemoteTables';
import type { TablesDuJeu } from '../hooks/useRemoteSync';
import type { TableResult } from '../../tables/types';

/**
 * **L'onglet Tables de la télécommande** (Fire HD 8, registre § 256, T7). La télécommande ne tire
 * rien elle-même : elle demande la liste à l'ouverture, envoie la table choisie et son
 * modificateur, et montre un tirage par son horodatage.
 */
const VIDE: TablesDuJeu = { univers: null, liste: [], chargement: false, tirageEnCours: null, resultat: null, montres: [] };
const ALIEN: TablesDuJeu = {
    ...VIDE, univers: 'Alien',
    liste: [
        { id: 'blessures_critiques', nom: 'Blessures Critiques', des: 'd66' },
        { id: 'test_de_panique', nom: 'Test de Panique', des: '1d6' },
    ],
};
const RESULTAT: TableResult = {
    rawRoll: 15, modifier: 0, finalValue: 15, timestamp: 42, tableName: 'Blessures Critiques',
    entry: { min: 11, max: 16, title: 'Sang dans les yeux', description: 'Le sang coule.', effect: 'OBSERVATION −2' },
};

const rendre = (tables: TablesDuJeu, appaire = true) => {
    const gestes = { onCharger: vi.fn(), onTirer: vi.fn(), onMontrer: vi.fn() };
    const vue = render(<RemoteTables tables={tables} appaire={appaire} {...gestes} />);
    return { ...gestes, vue };
};

describe("l'onglet Tables", () => {
    it('demande la liste une fois à l’ouverture, et pas sans appairage', () => {
        const { onCharger, vue } = rendre(ALIEN);
        vue.rerender(<RemoteTables tables={ALIEN} appaire onCharger={onCharger} onTirer={vi.fn()} onMontrer={vi.fn()} />);
        expect(onCharger).toHaveBeenCalledTimes(1);
        expect(rendre(VIDE, false).onCharger).not.toHaveBeenCalled();
    });

    it('dit pourquoi il n’y a pas de tables', () => {
        rendre({ ...VIDE, raison: 'Aucune table pour Symbaroum.' });
        expect(screen.getByText('Aucune table pour Symbaroum.')).toBeTruthy();
    });

    it('filtre, choisit une table, règle le modificateur et tire', () => {
        const { onTirer } = rendre(ALIEN);
        fireEvent.change(screen.getByLabelText('Filtrer les tables'), { target: { value: 'panique' } });
        expect(screen.queryByText('Blessures Critiques')).toBeNull();
        fireEvent.click(screen.getByText('Test de Panique'));
        fireEvent.click(screen.getByLabelText('Ajouter 1'));
        fireEvent.click(screen.getByLabelText('Ajouter 1'));
        fireEvent.click(screen.getByLabelText('Retirer 1'));
        fireEvent.click(screen.getByRole('button', { name: /^Tirer$/ }));
        expect(onTirer).toHaveBeenCalledWith('test_de_panique', 1);
    });

    it('montre le résultat au meneur seul, puis le montre aux joueurs par son horodatage', () => {
        const { onMontrer } = rendre({ ...ALIEN, resultat: RESULTAT });
        expect(screen.getByText('Sang dans les yeux')).toBeTruthy();
        expect(screen.getByText('OBSERVATION −2')).toBeTruthy();
        expect(screen.getByText(/Vu par toi seul/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Montrer aux joueurs/ }));
        expect(onMontrer).toHaveBeenCalledWith(42);
    });

    it('un tirage déjà montré le dit, et ne se remontre pas', () => {
        rendre({ ...ALIEN, resultat: RESULTAT, montres: [42] });
        expect(screen.getByText(/Montré aux joueurs/)).toBeTruthy();
        expect((screen.getByRole('button', { name: /Montrer aux joueurs/ }) as HTMLButtonElement).disabled).toBe(true);
    });
});
