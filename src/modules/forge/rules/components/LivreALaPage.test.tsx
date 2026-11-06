import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import LivreALaPage from './LivreALaPage';
import type { LivreDuJeu } from '../livres';

/**
 * **« Livre, p. N »** — « Les chemins des livres », étape D (06/11/2026). Le pont `livres` est
 * simulé : l'ouverture elle-même a son essai côté processus principal.
 */
const ALIEN: LivreDuJeu = { cle: 'jeu', titre: 'ALIEN, le jeu de rôle', chemin: '\\\\CLOUDDAVID\\Media\\ALIEN.pdf', decalage: 3 };
const CM: LivreDuJeu = { cle: 'colonial-marines', titre: 'Colonial Marines Operations Manual', chemin: '\\\\CLOUDDAVID\\Media\\CM.pdf', decalage: 3 };
const registre = { racine: 'systems/alien', livres: [ALIEN, CM] };
const ouvrir = vi.fn();

beforeEach(() => {
    ouvrir.mockReset();
    (window as unknown as { appBridge: unknown }).appBridge = { livres: { ouvrir } };
});
afterEach(() => { delete (window as unknown as { appBridge?: unknown }).appBridge; });

const cliquer = async () => { await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Livre, p\./ })); }); };

describe('LivreALaPage', () => {
    it('le Drone (p. 309) : le bouton ouvre le livre de base ; le clic ne remonte pas à la ligne', async () => {
        ouvrir.mockResolvedValue({ ouvert: true, titre: ALIEN.titre, pagePdf: 312, alaPage: true });
        const surLaLigne = vi.fn();
        render(<div onClick={surLaLigne}><LivreALaPage registre={registre} source={{ livre: 'ALIEN', page: 309, fiche: 'systems/alien/rules/bestiaire-du-livre-de-base.md' }} /></div>);
        expect(screen.getByRole('button', { name: /Livre, p\. 309/ }).getAttribute('title')).toBe('ALIEN, le jeu de rôle — page 309 (page 312 du PDF)');
        await cliquer();
        expect(ouvrir).toHaveBeenCalledWith({ racine: 'systems/alien', cle: 'jeu', page: 309 });
        expect(surLaLigne).not.toHaveBeenCalled();
        expect(screen.queryByRole('status')).toBeNull();
    });

    it('une créature d’un supplément ouvre le supplément', async () => {
        ouvrir.mockResolvedValue({ ouvert: true, titre: CM.titre, pagePdf: 181, alaPage: true });
        render(<LivreALaPage registre={registre} source={{ livre: CM.titre, page: 178, fiche: 'systems/alien/supplements/colonial-marines/rules/x.md' }} />);
        await cliquer();
        expect(ouvrir).toHaveBeenCalledWith({ racine: 'systems/alien', cle: 'colonial-marines', page: 178 });
    });

    it('un livre qui ne répond pas le dit ; ouvert hors de la fenêtre, il dit quelle page chercher', async () => {
        ouvrir.mockResolvedValueOnce({ ouvert: false, motif: 'introuvable' });
        render(<LivreALaPage registre={registre} source={{ cle: 'jeu', page: 309 }} />);
        await cliquer();
        expect(screen.getByRole('status').textContent).toMatch(/ne répond pas/);
        ouvrir.mockResolvedValueOnce({ ouvert: true, titre: ALIEN.titre, pagePdf: 1, alaPage: false });
        await cliquer();
        expect(screen.getByRole('status').textContent).toBe('Ouvert à la première page : allez à la page 312 du PDF.');
    });

    it('sans PDF enregistré : la page reste du texte, qui dit où l’ajouter ; sans page, rien', () => {
        const { rerender, container } = render(<LivreALaPage registre={{ racine: 'systems/alien', livres: [] }} source={{ livre: 'ALIEN', page: 309 }} />);
        expect(screen.queryByRole('button')).toBeNull();
        expect(screen.getByText('p. 309').getAttribute('title')).toMatch(/Forge › Atelier de règles › PDF du livre/);
        rerender(<LivreALaPage registre={{ racine: 'systems/alien', livres: [] }} source={{ livre: 'ALIEN', page: 309 }} sansLivre="rien" />);
        expect(container.textContent).toBe('');
        rerender(<LivreALaPage registre={registre} source={{ livre: 'ALIEN' }} />);
        expect(container.textContent).toBe('');
        // Le corpus n'est pas encore résolu : pas de bouton.
        rerender(<LivreALaPage registre={{ racine: null, livres: [ALIEN] }} source={{ cle: 'jeu', page: 309 }} />);
        expect(screen.queryByRole('button')).toBeNull();
    });
});
