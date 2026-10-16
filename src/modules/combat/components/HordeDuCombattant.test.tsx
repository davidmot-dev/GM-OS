import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import HordeDuCombattant from './HordeDuCombattant';
import { nouvelleHorde } from '../logic/sbiresEtHordes';

/** La horde de Torg sur la carte d'un adversaire (livre p. 119 et 264), 2026-10-14. */
afterEach(cleanup);

describe('la horde sur la carte', () => {
    it('se forme, préremplie de l’Esprit et de la Résistance de la fiche', () => {
        const onChange = vi.fn();
        render(<HordeDuCombattant horde={undefined} espritParDefaut={7} resistanceParDefaut={9} onChange={onChange} />);
        fireEvent.click(screen.getByText('En horde…'));
        fireEvent.change(screen.getByLabelText('Membres'), { target: { value: '8' } });
        fireEvent.click(screen.getByText('Former la horde'));
        expect(onChange).toHaveBeenCalledWith({ membres: 8, debout: 8, choc: 0, koParLeChoc: 0, esprit: 7, resistance: 9 });
    });

    it('un coup se compte contre la Résistance d’un membre, et l’attaque combinée suit les assaillants', () => {
        const onChange = vi.fn();
        render(<HordeDuCombattant horde={nouvelleHorde(8, 7, 10)} espritParDefaut={0} resistanceParDefaut={0} onChange={onChange} />);
        expect(screen.getByText('Attaque combinée : +3')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Dommages'), { target: { value: '15' } });
        fireEvent.click(screen.getByText('Coup sur la horde'));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ debout: 7, choc: 0 }));
        fireEvent.change(screen.getByLabelText('Assaillants'), { target: { value: '2' } });
        expect(screen.getByText('Attaque combinée : +1')).toBeTruthy();
    });

    it('la capacité « Horde » se coche : le bonus compte aussi aux dommages (p. 271)', () => {
        const onChange = vi.fn();
        const horde = nouvelleHorde(5, 6, 8);
        const { rerender } = render(<HordeDuCombattant horde={horde} espritParDefaut={0} resistanceParDefaut={0} onChange={onChange} />);
        fireEvent.click(screen.getByLabelText('Capacité Horde'));
        expect(onChange).toHaveBeenCalledWith({ ...horde, capacite: true });
        rerender(<HordeDuCombattant horde={{ ...horde, capacite: true }} espritParDefaut={0} resistanceParDefaut={0} onChange={onChange} />);
        expect(screen.getByText('Attaque et dommages combinés : +3')).toBeTruthy();
    });
});
