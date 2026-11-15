import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EtatDeLEcran } from '../modules/ulanzi/ecranDeTable';
import { lireLeTemps } from '../modules/ulanzi/ecranDeTable';

/** L'écran de table sur la Fire (15/11/2026, § 256, T13). */
const etat: { connexion: string; ecran: EtatDeLEcran | null } = { connexion: 'connexion', ecran: null };
vi.mock('../modules/ulanzi/useEcranDeTable', () => ({ useEcranDeTable: () => etat }));
const { default: EcranDeTable } = await import('./EcranDeTable');

afterEach(() => { cleanup(); etat.ecran = null; });

describe("l'écran de table", () => {
    it('attend le poste, puis dit qu’aucun widget n’est choisi et où les choisir', () => {
        etat.connexion = 'connexion';
        const { rerender } = render(<EcranDeTable />);
        expect(screen.getByText('Connexion au poste du meneur…')).toBeTruthy();
        etat.connexion = 'connecte'; etat.ecran = { tuiles: [], choisi: false };
        rerender(<EcranDeTable />);
        expect(screen.getByText('Aucun widget choisi pour l’écran de table.')).toBeTruthy();
        expect(screen.getByText(/section « Écran de table »/)).toBeTruthy();
    });

    it('distingue « rien à montrer » de « rien de choisi »', () => {
        etat.connexion = 'connecte'; etat.ecran = { tuiles: [], choisi: true };
        render(<EcranDeTable />);
        expect(screen.getByText('Rien à montrer pour l’instant.')).toBeTruthy();
    });

    it('montre l’ordre du tour, une jauge, le minuteur et l’heure en grand', () => {
        etat.connexion = 'connecte';
        etat.ecran = { choisi: true, tuiles: [
            { forme: 'rang', id: 'ordre', nom: 'Ordre du tour', ordre: { round: 3, actif: 'Wilson', suivants: ['Rôdeur', 'Nel Varga'] } },
            { forme: 'jauge', id: 'horloge:air', nom: 'Air restant', valeur: 6, max: 10 },
            { forme: 'compte-a-rebours', id: 'minuteur', nom: 'Minuteur', restant: 272, duree: 600 },
            { forme: 'temps', id: 'heure', nom: 'Heure du monde', maintenant: 0,
                temps: { mode: 'fantasy', timestamp: 0, dateFantastique: { jour: 3, mois: 'Vendémiaire', annee: 1, heure: 14, minute: 20 } } },
        ] };
        render(<EcranDeTable />);
        expect(screen.getByText('Wilson')).toBeTruthy();
        expect(screen.getByText('Tour 3')).toBeTruthy();
        expect(screen.getByText('Rôdeur')).toBeTruthy(); expect(screen.getByText('Nel Varga')).toBeTruthy();
        expect(screen.getByRole('region', { name: 'Air restant' }).textContent).toContain('6/10');
        expect(screen.getByText('04:32')).toBeTruthy();
        expect(screen.getByText('3 Vendémiaire')).toBeTruthy();
        expect(screen.getByText('14:20')).toBeTruthy();
    });
});

describe('lireLeTemps', () => {
    it('lit une date fantastique, son heure nommée, et l’heure réelle', () => {
        expect(lireLeTemps({ mode: 'fantasy', timestamp: 0, dateFantastique: { jour: 1, mois: 'Givre', annee: 2, heure: 5, minute: 7 } }, 0))
            .toEqual({ haut: '1 Givre', heure: '05:07' });
        // Le nom de l'heure va à part : il prenait la place des chiffres, à leur taille (photo du 15/11).
        expect(lireLeTemps({ mode: 'fantasy', timestamp: 0, dateFantastique: { jour: 1, mois: 'Givre', annee: 2, heure: 5, minute: 7, nomDeLHeure: 'Heure du Serpent' } }, 0))
            .toEqual({ haut: '1 Givre', heure: '05:07', nom: 'Heure du Serpent' });
        const midi = new Date(2026, 10, 15, 12, 5).getTime();
        expect(lireLeTemps({ mode: 'realtime', timestamp: 0 }, midi)).toEqual({ heure: '12:05' });
    });
});
