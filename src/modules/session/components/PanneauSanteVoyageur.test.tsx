import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PanneauSanteVoyageur } from './PanneauSanteVoyageur';
import { initialiserSanteVoyageur } from '../logic/santeDuVoyageur';
const base = {vie:14,vie_max:14,endurance:28,endurance_max:28,sc:5,volonte:12,fatigue:0,__rddFatigue231:1};
describe('les conséquences d’un encaissement sont validées explicitement', () => {
    it('le tirage n’écrit rien ; appliquer conserve une trace et les mêmes dés', () => {
        const appliquer = vi.fn();const donnees = initialiserSanteVoyageur(base);
        render(<PanneauSanteVoyageur donnees={donnees} appliquer={appliquer} />);
        fireEvent.click(screen.getByText('Encaisser une agression'));
        fireEvent.change(screen.getByLabelText('Dés de table déjà tirés (facultatif, dans l’ordre)'),{target:{value:'7, 6, 5, 5'}});
        fireEvent.change(screen.getByLabelText('Bonus aux dommages'),{target:{value:'7'}});
        fireEvent.change(screen.getByLabelText('Protection'),{target:{value:'2'}});
        fireEvent.click(screen.getByRole('button',{name:'Tirer et prévisualiser l’encaissement'}));
        const apercu = screen.getByLabelText('Aperçu de santé');
        expect(apercu.textContent).toContain('18 : grave');expect(appliquer).not.toHaveBeenCalled();
        fireEvent.click(within(apercu).getByRole('button',{name:'Appliquer les conséquences'}));
        expect(appliquer).toHaveBeenCalledTimes(1);
        expect(appliquer.mock.calls[0][0]).toMatchObject({endurance:18,vie:12,fatigue:10,
            __rddHistoriqueSante231:[{motif:'Encaisser',des:[{faces:10,valeur:7},{faces:10,valeur:6},{faces:6,valeur:5},{faces:6,valeur:5}]}]});
        expect(screen.queryByLabelText('Aperçu de santé')).toBeNull();
    });
    it('un état modifié ailleurs invalide l’aperçu, un d10 invalide n’est pas accepté', () => {
        const appliquer = vi.fn();const donnees = initialiserSanteVoyageur(base);
        const {rerender} = render(<PanneauSanteVoyageur donnees={donnees} appliquer={appliquer} />);
        fireEvent.click(screen.getByText('Encaisser une agression'));
        const des = screen.getByLabelText('Dés de table déjà tirés (facultatif, dans l’ordre)');
        fireEvent.change(des,{target:{value:'11, 4'}});
        fireEvent.click(screen.getByRole('button',{name:'Tirer et prévisualiser l’encaissement'}));
        expect(screen.getByRole('alert').textContent).toContain('d10');expect(appliquer).not.toHaveBeenCalled();
        fireEvent.change(des,{target:{value:'4, 4, 2'}});
        fireEvent.click(screen.getByRole('button',{name:'Tirer et prévisualiser l’encaissement'}));
        rerender(<PanneauSanteVoyageur donnees={{...donnees,vie:13}} appliquer={appliquer} />);
        fireEvent.click(screen.getByRole('button',{name:'Appliquer les conséquences'}));
        expect(appliquer).not.toHaveBeenCalled();expect(screen.getByRole('alert').textContent).toContain('a changé');
    });
});
