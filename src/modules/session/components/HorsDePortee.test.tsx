import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HorsDePortee from './HorsDePortee';
import { regimeDInterface } from '../logic/regimeDInterface';

const ATELIER = regimeDInterface('preparation');
const TABLE = regimeDInterface('partie');

const bouton = <button type="button">Tout effacer</button>;

describe('ce qui détruit s’éloigne', () => {
    it("laisse l'action telle quelle en préparation", () => {
        render(<HorsDePortee regime={ATELIER} libelle="Tout effacer">{bouton}</HorsDePortee>);
        expect(screen.getByText('Tout effacer')).toBeTruthy();
    });

    it('demande un geste de plus en séance', () => {
        render(<HorsDePortee regime={TABLE} libelle="Tout effacer">{bouton}</HorsDePortee>);

        expect(screen.queryByText('Tout effacer'), "l'action est repliée").toBeNull();
        fireEvent.click(screen.getByText(/Tout effacer…/));
        expect(screen.getByText('Tout effacer'), 'un clic la révèle').toBeTruthy();
    });

    /**
     * **Le défaut du 2026-08-24, signalé par David : « je ne vois pas les
     * boutons ».**
     *
     * Le mode compact reprenait `opacity-0 group-hover:opacity-100` — le motif
     * des corbeilles du journal, qui vivent dans une ligne `.group`. Mais les
     * trois commandes de la carte étaient **toujours visibles** et n'ont aucun
     * parent `.group` : elles sont devenues **introuvables** en séance.
     *
     * *Un remplaçant qui hérite d'un style que l'original n'avait pas ne
     * remplace pas, il efface.* Aucun type et aucun des 2 314 tests ne l'a vu.
     */
    it('reste visible par défaut, même en compact', () => {
        render(<HorsDePortee regime={TABLE} libelle="Tout effacer" compact>{bouton}</HorsDePortee>);

        const declencheur = screen.getByLabelText('Tout effacer');
        expect(declencheur.className, "rien ne doit le cacher jusqu'au survol")
            .not.toContain('opacity-0');
    });

    /** Là où l'original ne se montrait qu'au survol, le repli fait de même. */
    it('se cache jusqu’au survol quand on le lui demande', () => {
        render(
            <HorsDePortee regime={TABLE} libelle="Tout effacer" compact surInvitation>
                {bouton}
            </HorsDePortee>,
        );

        const declencheur = screen.getByLabelText('Tout effacer');
        expect(declencheur.className).toContain('opacity-0');
        expect(declencheur.className).toContain('group-hover:opacity-100');
    });

    it('révèle aussi en compact, et rend alors l’action d’origine', () => {
        render(<HorsDePortee regime={TABLE} libelle="Tout effacer" compact>{bouton}</HorsDePortee>);

        fireEvent.click(screen.getByLabelText('Tout effacer'));
        expect(screen.getByText('Tout effacer')).toBeTruthy();
    });
});
