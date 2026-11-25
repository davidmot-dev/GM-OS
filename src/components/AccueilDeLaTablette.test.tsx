// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

/**
 * **L'accueil de la tablette de la table** (§ 256, T14, 24/11/2026) : le rôle mémorisé rouvert au
 * démarrage (C11), le secret d'appairage oublié en rôle public quand un code est réglé, et le code du
 * meneur pour revenir à l'Aide au MJ (C12).
 */
const verrou = vi.hoisted(() => ({ connecte: true, codeRegle: true as boolean | null, ouvrir: vi.fn() }));
vi.mock('../modules/tablette/useVerrouDuMeneur', () => ({ useVerrouDuMeneur: () => verrou }));

const { default: AccueilDeLaTablette } = await import('./AccueilDeLaTablette');
const { getPairingToken, enregistrerPairingToken } = await import('../modules/remote/pairingToken');
const { lireRoleMemorise, memoriserRole } = await import('../modules/tablette/roleDeLaTablette');

const aller = vi.fn<(adresse: string) => void>();
const ouvrirLAccueil = (choisir = true) => {
    window.history.replaceState(null, '', `/?window=accueil-tablette${choisir ? '&choisir=1' : ''}`);
    return render(<AccueilDeLaTablette aller={aller} />);
};

beforeEach(() => {
    window.localStorage.clear();
    aller.mockClear();
    verrou.ouvrir.mockReset();
    verrou.connecte = true;
    verrou.codeRegle = true;
});
afterEach(() => cleanup());

describe('l’accueil des rôles', () => {
    it('au démarrage, rouvre le rôle mémorisé sans rien montrer ; « Changer de rôle » montre les trois', () => {
        memoriserRole('ecran');
        const { container } = ouvrirLAccueil(false);
        expect(aller).toHaveBeenCalledWith('/?window=ecran-de-table');
        expect(container.textContent).toBe('');
        cleanup(); aller.mockClear();
        ouvrirLAccueil(true);
        expect(aller).not.toHaveBeenCalled();
        expect(screen.getByText('Rôle actuel').closest('button')?.dataset.role).toBe('ecran');
    });

    it('un rôle public oublie le secret d’appairage quand un code est réglé, et se mémorise', () => {
        enregistrerPairingToken('secret');
        ouvrirLAccueil();
        fireEvent.click(document.querySelector('[data-role="appareil"]')!);
        expect(getPairingToken()).toBe('');
        expect(lireRoleMemorise()).toBe('appareil');
        expect(aller).toHaveBeenCalledWith('/?window=appareil-de-table');
    });

    it('sans code réglé au poste, il garde le secret, et l’accueil le dit', () => {
        verrou.codeRegle = false;
        enregistrerPairingToken('secret');
        ouvrirLAccueil();
        expect(document.querySelector('[data-sans-code]')).toBeTruthy();
        fireEvent.click(document.querySelector('[data-role="ecran"]')!);
        expect(getPairingToken()).toBe('secret');
    });

    it('tant que le poste n’a pas dit s’il a un code, aucun rôle ne se choisit', () => {
        verrou.codeRegle = null;
        ouvrirLAccueil();
        expect((document.querySelector('[data-role="appareil"]') as HTMLButtonElement).disabled).toBe(true);
    });

    it('l’Aide au MJ, avec le secret encore là : directement, sans code', () => {
        enregistrerPairingToken('secret');
        ouvrirLAccueil();
        fireEvent.click(document.querySelector('[data-role="aide"]')!);
        expect(aller).toHaveBeenCalledWith('/?window=remote');
        expect(verrou.ouvrir).not.toHaveBeenCalled();
    });
});

describe('le code du meneur', () => {
    const taper = (code: string) => { for (const c of code) fireEvent.click(screen.getByRole('button', { name: c })); };

    it('un code faux le dit et vide la saisie ; le bon code rend le secret et ouvre l’Aide au MJ', async () => {
        ouvrirLAccueil();
        expect(screen.getByText('Code du meneur demandé')).toBeTruthy();
        fireEvent.click(document.querySelector('[data-role="aide"]')!);
        expect(screen.getByRole('heading', { name: 'Code du meneur' })).toBeTruthy();

        verrou.ouvrir.mockResolvedValueOnce({ ok: false, raison: 'faux', restants: 2 });
        taper('1234');
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider' })); });
        expect(verrou.ouvrir).toHaveBeenCalledWith('1234');
        expect(screen.getByRole('alert').textContent).toContain('Code incorrect. Encore 2 essais.');
        expect(document.querySelector('[data-cases]')?.getAttribute('aria-label')).toBe('0 chiffre sur 4');
        expect(aller).not.toHaveBeenCalled();

        verrou.ouvrir.mockResolvedValueOnce({ ok: true, token: 'secret-rendu' });
        taper('4821');
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider' })); });
        expect(getPairingToken()).toBe('secret-rendu');
        expect(lireRoleMemorise()).toBe('aide');
        expect(aller).toHaveBeenCalledWith('/?window=remote');
    });

    it('trop d’essais : l’attente est dite en minutes ; « Retour aux rôles » ramène aux cartes', async () => {
        ouvrirLAccueil();
        fireEvent.click(document.querySelector('[data-role="aide"]')!);
        verrou.ouvrir.mockResolvedValueOnce({ ok: false, raison: 'bloque', attenteMs: 300_000 });
        taper('0000');
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider' })); });
        expect(screen.getByRole('alert').textContent).toContain('Réessaie dans 5 min');
        fireEvent.click(screen.getByRole('button', { name: /Retour aux rôles/ }));
        expect(document.querySelector('[data-role="aide"]')).toBeTruthy();
    });
});

describe('les adresses des rôles', () => {
    it('gardent le port du serveur annoncé par l’adresse (développement)', async () => {
        const { adresseDuRole, adresseDeLAccueil } = await import('../modules/tablette/roleDeLaTablette');
        window.history.replaceState(null, '', '/?window=accueil-tablette&sync=4101');
        expect(adresseDuRole('aide')).toBe('/?window=remote&sync=4101');
        expect(adresseDeLAccueil()).toBe('/?window=accueil-tablette&choisir=1&sync=4101');
        window.history.replaceState(null, '', '/?window=ecran-de-table');
        expect(adresseDuRole('appareil')).toBe('/?window=appareil-de-table');
    });
});
