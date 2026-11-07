import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { PanneauDesModulesMJ, type PropsDuPanneau } from './PanneauDesModulesMJ';
import type { VueDesModulesMJ } from './protocole';

/** Le panneau commun du poste et de la tablette du meneur — 07/11/2026, T2 et T3. */
afterEach(cleanup);
vi.mock('./vuesDuRegistre', () => ({
    VueDeModule: ({ id, lieu }: { id: string; lieu?: string }) => <div data-testid="pupitre">{`${id} sur ${lieu}`}</div>,
}));
const vue: VueDesModulesMJ = {
    campagneId: 'a', contexte: 2, revision: 1, enSeance: true,
    appareils: [{ id: 'tab-nel', libelle: 'Tablette de Nel', personnageId: 'nel' }],
    modules: [
        { id: 'alien-muthur', libelle: 'MU/TH/UR 6000', revision: 1, acces: ['nel'], diffusionSonore: true, appareilDeDiffusion: 'poste-mj', vue: {} },
        { id: 'alien-detecteur', libelle: 'Détecteur de mouvement', revision: 1, acces: [], vue: {} },
    ],
};
function monter(habillage: 'poste' | 'tablette', autres: Partial<PropsDuPanneau> = {}) {
    const gestes = { commander: vi.fn(), autoriser: vi.fn(async () => ({ ok: true as const })), toutCouper: vi.fn(async () => ({ ok: true as const })), choisirDiffusion: vi.fn(async () => ({ ok: true as const })) };
    render(<PanneauDesModulesMJ habillage={habillage} campagneId="a" vue={vue} gestes={gestes} enSeance
        personnages={[{ id: 'nel', nom: 'Nel Varga' }, { id: 'idris', nom: 'Idris Koa' }]}
        proposes={vue.modules.map(m => ({ reference: { id: m.id }, libelle: m.libelle, description: 'Description', disponibilite: 'pret' }))} {...autres} />);
    return gestes;
}

describe.each(['poste', 'tablette'] as const)('le panneau des modules — %s', habillage => {
    it('une case cochée ajoute le personnage, une case décochée le retire', async () => {
        const gestes = monter(habillage);
        const muthur = screen.getByRole('heading', { name: 'MU/TH/UR 6000' }).closest('article')!;
        const cases = muthur.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        expect([...cases].map(c => c.checked)).toEqual([true, false]);
        fireEvent.click(cases[1]);
        await waitFor(() => expect(gestes.autoriser).toHaveBeenCalledWith('alien-muthur', ['nel', 'idris']));
        fireEvent.click(cases[0]);
        await waitFor(() => expect(gestes.autoriser).toHaveBeenCalledWith('alien-muthur', []));
    });

    it('Tout couper, et le son sur un appareil autorisé', async () => {
        const gestes = monter(habillage);
        fireEvent.click(screen.getByRole('button', { name: 'Tout couper' }));
        await waitFor(() => expect(gestes.toutCouper).toHaveBeenCalled());
        fireEvent.click(screen.getByRole('button', { name: 'Son : Tablette de Nel' }));
        await waitFor(() => expect(gestes.choisirDiffusion).toHaveBeenCalledWith('alien-muthur', 'tab-nel'));
    });

    it('sans séance, les cases restent fermées et le panneau le dit', () => {
        monter(habillage, { enSeance: false });
        expect(screen.getByText(/Démarre une séance/)).toBeTruthy();
        expect([...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].every(c => c.disabled)).toBe(true);
    });

    it('un refus du serveur s’affiche, jamais en silence', async () => {
        const gestes = monter(habillage);
        gestes.toutCouper.mockResolvedValueOnce({ ok: false, erreur: 'La table a changé.' } as never);
        fireEvent.click(screen.getByRole('button', { name: 'Tout couper' }));
        expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'La table a changé.');
    });
});

describe('le pupitre', () => {
    it('sur la tablette, il remplace la liste ; « Modules » y ramène', () => {
        monter('tablette');
        fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir le pupitre' })[0]);
        expect(screen.getByTestId('pupitre').textContent).toBe('alien-muthur sur tablette');
        expect(screen.queryByRole('button', { name: 'Tout couper' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Modules' }));
        expect(screen.queryByTestId('pupitre')).toBeNull();
        expect(screen.getByRole('button', { name: 'Tout couper' })).toBeTruthy();
    });

    it('au poste, il s’ouvre sous la liste et se referme du même bouton', () => {
        monter('poste');
        fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir le pupitre' })[0]);
        expect(screen.getByTestId('pupitre').textContent).toBe('alien-muthur sur poste');
        expect(screen.getByRole('button', { name: 'Tout couper' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Fermer le pupitre' }));
        expect(screen.queryByTestId('pupitre')).toBeNull();
    });
});
