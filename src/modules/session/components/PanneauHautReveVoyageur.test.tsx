import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PanneauHautReveVoyageur } from './PanneauHautReveVoyageur';

const nitouche = {
    reve: 15, reve_seuil: 15, reve_pts: 13, onrios: -2, hypnos: 3, narcos: 1, thanatos: -11,
    spells_0_path: 'Hypnos', spells_0_name: 'Invocation du Guerrier Sorde', spells_0_tmr: 'D13', spells_0_difficulty: -8, spells_0_dreamCost: 7,
};

describe('la carte Haut-Rêve du Voyageur', () => {
    it('prévisualise une rencontre maîtrisée et n’écrit qu’à la validation', () => {
        const appliquer = vi.fn();
        render(<PanneauHautReveVoyageur donnees={nitouche} appliquer={appliquer} />);
        fireEvent.change(screen.getByLabelText('Genre de terre'), { target: { value: 'cite' } });
        fireEvent.change(screen.getByLabelText('d100 des rencontres'), { target: { value: '55' } });
        expect(screen.getByText(/Fleur des rêves — force 1d6/)).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Force de la rencontre'), { target: { value: '3' } });
        fireEvent.change(screen.getByLabelText('d100 de maîtrise'), { target: { value: '10' } });
        fireEvent.click(screen.getByRole('button', { name: 'Préparer la rencontre' }));
        const apercu = screen.getByLabelText('Aperçu de l’opération RdD');
        expect(apercu.textContent).toContain('Points de rêve : 13 → 16.');
        expect(appliquer).not.toHaveBeenCalled();
        fireEvent.click(within(apercu).getByRole('button', { name: 'Valider cette opération' }));
        expect(appliquer.mock.calls[0][0]).toMatchObject({ reve_pts: 16 });
    });

    it('lance un sort du livret', () => {
        const appliquer = vi.fn();
        render(<PanneauHautReveVoyageur donnees={nitouche} appliquer={appliquer} />);
        fireEvent.change(screen.getByLabelText('Sort à lancer'), { target: { value: '0' } });
        fireEvent.change(screen.getByLabelText('d100 du lancer'), { target: { value: '20' } });
        fireEvent.click(screen.getByRole('button', { name: 'Préparer le lancer' }));
        expect(screen.getByLabelText('Aperçu de l’opération RdD').textContent).toContain('Points de rêve : 13 → 6.');
    });

    it('sur la tablette, montre les effets sans rien proposer', () => {
        render(<PanneauHautReveVoyageur lectureSeule appliquer={vi.fn()} donnees={{ ...nitouche, __rddHautReve231: { version: 1, refoulement: 2, enAttente: [], lutte: null, ombre: false,
            actifs: [{ id: 'q', table: 'queue', nom: 'Idée fixe', effet: '…', precision: 'Faire le mort', refoulable: 1, source: 'essai' }] } }} />);
        expect(screen.getByText(/refoulement 2/)).toBeTruthy();
        expect(screen.getByText(/Idée fixe/)).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Refouler/ })).toBeNull();
    });
});
