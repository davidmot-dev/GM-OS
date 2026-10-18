import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PanneauJetVoyageur } from './PanneauJetVoyageur';
import { ficheDuJet, jetDuTest, valeursDuJet } from '../logic/jetDuVoyageur.fixtures';
import { initialiserSanteVoyageur, lireSanteVoyageur, CLE_SANTE_VOYAGEUR } from '../logic/santeDuVoyageur';
import { DiceEngine } from '../../dice/DiceEngine';
vi.mock('../../journal/consignerLeJet', () => ({consignerLeJet: vi.fn()}));
describe('le jet du Voyageur sur tablette', () => {
    it('zéro rêve : le sommeil empêche de lancer tant que le rêve n’est pas récupéré', () => {
        render(<PanneauJetVoyageur descripteur={jetDuTest} template={ficheDuJet} valeurs={{ ...valeursDuJet, reve_pts: 0 }}
            dice={{ defaultDice: '1d100', logic: 'd100-low', engine: 'standard' }} personnageId="pj" />);
        expect((screen.getByRole('button', { name: 'Lancer' }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText(/endormi jusqu’à récupération/)).toBeTruthy();
    });
    it('sonné : une normale offensive devient un échec total, avec zéro réussite transmis et le même seuil', () => {
        const recevoir = vi.fn();window.addEventListener('fiche:resultat',recevoir);
        const d = initialiserSanteVoyageur({...valeursDuJet,sc:4});
        const sante = lireSanteVoyageur(d)!;sante.sonneJusqua = 2;d[CLE_SANTE_VOYAGEUR] = sante;
        const dice = {defaultDice:'1d100',logic:'d100-low' as const,engine:'standard' as const};
        const brut = DiceEngine.rollFromConfig(dice);
        const lancer = vi.spyOn(DiceEngine,'rollFromConfig').mockReturnValue({...brut,degre:'reussite-normale',tagSuccess:true,successes:1});
        render(<PanneauJetVoyageur descripteur={jetDuTest} template={ficheDuJet} valeurs={d} dice={dice} personnageId="pj" pourLesJoueurs />);
        const [carac,comp] = screen.getAllByRole('combobox');
        fireEvent.change(carac,{target:{value:'melee'}});fireEvent.change(comp,{target:{value:'discretion'}});
        fireEvent.click(screen.getByLabelText(/Action offensive/));
        expect(screen.getByText('52 %')).toBeTruthy();
        fireEvent.click(screen.getByRole('button',{name:'Lancer'}));
        expect((recevoir.mock.calls[0][0] as CustomEvent).detail).toMatchObject({degre:'echec-total',tagSuccess:false,successes:0});
        lancer.mockRestore();window.removeEventListener('fiche:resultat',recevoir);
    });
    it('montre l’état appliqué, transmet son seuil et conserve le contexte du dernier lancer', () => {
        const recevoir = vi.fn();window.addEventListener('fiche:resultat',recevoir);
        const {rerender} = render(<PanneauJetVoyageur descripteur={jetDuTest} template={ficheDuJet}
            valeurs={valeursDuJet} dice={{defaultDice:'1d100',logic:'d100-low',engine:'standard'}} personnageId="pj" pourLesJoueurs />);
        const [carac,comp] = screen.getAllByRole('combobox');
        fireEvent.change(carac,{target:{value:'melee'}});fireEvent.change(comp,{target:{value:'discretion'}});
        expect(screen.getByText('52 %')).toBeTruthy();
        fireEvent.click(screen.getByRole('button',{name:'Lancer'}));
        expect(recevoir).toHaveBeenCalledTimes(1);
        const detail = (recevoir.mock.calls[0][0] as CustomEvent).detail;
        expect(detail).toMatchObject({characterId:'pj',titre:expect.stringContaining('état -5')});
        expect(detail.totalDisplay).toContain('seuil 52');expect(detail.degre).toBeTruthy();
        rerender(<PanneauJetVoyageur descripteur={jetDuTest} template={ficheDuJet} valeurs={{...valeursDuJet,fatigue:0,vie:11}}
            dice={{defaultDice:'1d100',logic:'d100-low',engine:'standard'}} personnageId="pj" pourLesJoueurs />);
        expect(screen.getByLabelText('Dernier jet du Voyageur').textContent).toContain('seuil 52');
        window.removeEventListener('fiche:resultat',recevoir);
    });
});
