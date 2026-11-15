import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VueDesModulesJoueurRecue } from '../modules/modulesDuJeu/protocole';

/** L'écran de la Fire en appareil de table (Fire HD 8, 15/11/2026, § 256, T11). */
const etat: { etat: string; vue: VueDesModulesJoueurRecue | null; commander: ReturnType<typeof vi.fn> } = { etat: 'connexion', vue: null, commander: vi.fn() };
vi.mock('../modules/modulesDuJeu/useAppareilDeTable', () => ({ useAppareilDeTable: () => etat }));
vi.mock('../modules/modulesDuJeu/vuesDuRegistre', () => ({
    VueDeModule: ({ id, role, envoyerCommande }: { id: string; role: string; envoyerCommande: (c: unknown) => void }) =>
        <button type="button" onClick={() => envoyerCommande({ id: 'orienter-discret', charge: { cap: 90, tour: 3 } })}>{`${id} pour ${role}`}</button>,
}));
const { default: AppareilDeTable } = await import('./AppareilDeTable');

const vue = (ids: string[]): VueDesModulesJoueurRecue => ({
    campagneId: 'camp', personnageId: 'table:commune', contexte: 1, revision: 1,
    modules: ids.map(id => ({ id, libelle: id === 'alien-detecteur' ? 'Détecteur de mouvement' : 'Autre', revision: 1, vue: {} })),
});

afterEach(() => { cleanup(); etat.vue = null; etat.commander.mockReset(); });

describe("l'appareil de table", () => {
    it('attend le poste, puis dit qu’aucun module n’est ouvert', () => {
        etat.etat = 'connexion';
        const { rerender } = render(<AppareilDeTable />);
        expect(screen.getByText('Connexion au poste du meneur…')).toBeTruthy();
        etat.etat = 'connecte';
        rerender(<AppareilDeTable />);
        expect(screen.getByText('Aucun module ouvert à la table.')).toBeTruthy();
    });

    it('dit quand une autre tablette sert déjà d’appareil de table', () => {
        etat.etat = 'table-prise';
        render(<AppareilDeTable />);
        expect(screen.getByText('Une autre tablette sert déjà d’appareil de table.')).toBeTruthy();
    });

    it('montre le module ouvert en vue joueur, et lui transmet les gestes', () => {
        etat.etat = 'connecte';
        etat.vue = vue(['alien-detecteur']);
        render(<AppareilDeTable />);
        expect(screen.getByText('Détecteur de mouvement')).toBeTruthy();
        expect(screen.getByText(/Ouvert par le meneur/)).toBeTruthy();
        fireEvent.click(screen.getByText('alien-detecteur pour joueur'));
        expect(etat.commander).toHaveBeenCalledWith('alien-detecteur', { id: 'orienter-discret', charge: { cap: 90, tour: 3 } });
    });

    it('propose de passer d’un module à l’autre quand le meneur en ouvre plusieurs', () => {
        etat.etat = 'connecte';
        etat.vue = vue(['alien-detecteur', 'autre']);
        render(<AppareilDeTable />);
        fireEvent.click(screen.getByRole('button', { name: 'Autre' }));
        expect(screen.getByText('autre pour joueur')).toBeTruthy();
    });
});
