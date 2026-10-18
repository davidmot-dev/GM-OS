import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PanneauRepriseVoyageur } from './PanneauRepriseVoyageur';
import { fiche } from '../logic/ficheDeVoyageur.fixtures';
import { CLE_ORIGINAUX, CLE_REPRISE } from '../logic/ficheDeVoyageur';

describe('la reprise explicite du Voyageur', () => {
    it('ne remplace rien tant que les conflits ne sont pas arbitrés, et conserve la valeur zéro choisie', () => {
        const appliquer = vi.fn();
        const donnees = {vie: 0, points_de_vie: 5, heure_naissance: 'Le Dragon', heure_de_naissance: 12};
        const { rerender } = render(<PanneauRepriseVoyageur fiche={fiche} donnees={donnees} appliquer={appliquer} vieCombat={8} maxVieCombat={22} />);
        fireEvent.click(screen.getByRole('button', {name: 'Appliquer la reprise et les calculs'}));
        expect(appliquer).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain('Choisir');
        const vie = screen.getByRole('group', {name: /vie : quelle valeur/i});
        expect((within(vie).getByLabelText(/Santé du combat : 8/) as HTMLInputElement).checked).toBe(false);
        fireEvent.click(within(vie).getByLabelText(/Vie — ancienne fiche : 0/));
        fireEvent.change(screen.getByLabelText('Heure draconique à conserver'), {target: {value: 'Le Dragon'}});
        fireEvent.click(screen.getByRole('button', {name: 'Appliquer la reprise et les calculs'}));
        expect(appliquer).toHaveBeenCalledTimes(1);
        const suivant = appliquer.mock.calls[0][0];
        expect(suivant.vie).toBe(0);expect(suivant.heure_naissance).toBe('Le Dragon');
        expect(suivant[CLE_ORIGINAUX]).toMatchObject({...donnees, __rddVieCombat: 8, __rddMaxVieCombat: 22});
        expect(suivant[CLE_REPRISE]).toBe(1);
        rerender(<PanneauRepriseVoyageur fiche={fiche} donnees={suivant} appliquer={appliquer} vieCombat={0} />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('ne crée pas deux radios actives pour deux sources égales et conserve les saisies en cours', () => {
        const appliquer = vi.fn();
        render(<PanneauRepriseVoyageur fiche={fiche} donnees={{vie: 9, points_de_vie: 6, force: 9}}
            appliquer={appliquer} vieCombat={9} brouillon={{force: 15}} />);
        const groupe = screen.getByRole('group', {name: /vie : quelle valeur/i});
        expect(within(groupe).getAllByRole('radio')).toHaveLength(2);
        fireEvent.click(within(groupe).getByLabelText(/Vie — ancienne fiche : 9/));
        expect(within(groupe).getAllByRole('radio').filter(r => (r as HTMLInputElement).checked)).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', {name: 'Appliquer la reprise et les calculs'}));
        const suivant = appliquer.mock.calls[0][0];
        expect(suivant).toMatchObject({force: 15, melee: 14, vie: 9});
        expect(suivant[CLE_ORIGINAUX]).toMatchObject({force: 9, vie: 9, points_de_vie: 6});
    });
});
