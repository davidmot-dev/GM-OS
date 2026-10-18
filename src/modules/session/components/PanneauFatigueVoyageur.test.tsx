import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PanneauFatigueVoyageur } from './PanneauFatigueVoyageur';
const d = {endurance_max:23,endurance:23,vie_max:11,vie:11,fatigue:11,__rddFatigue231:1};
describe('la fatigue proposée à la table', () => {
    it('la lecture et l’aperçu ne changent rien ; appliquer produit une écriture absolue et une trace', () => {
        const appliquer = vi.fn();
        render(<PanneauFatigueVoyageur donnees={d} appliquer={appliquer} />);
        expect(appliquer).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button',{name:'Prévisualiser'}));
        const apercu = screen.getByLabelText('Aperçu du mouvement');
        expect(apercu.textContent).toContain('11 → 12');expect(appliquer).not.toHaveBeenCalled();
        fireEvent.click(within(apercu).getByRole('button',{name:'Appliquer le mouvement'}));
        expect(appliquer).toHaveBeenCalledTimes(1);
        expect(appliquer.mock.calls[0][0]).toMatchObject({fatigue:12,endurance:23,__rddMouvementsFatigue:[{avant:11,apres:12}]});
        expect(screen.queryByLabelText('Aperçu du mouvement')).toBeNull();
    });
    it('un aperçu périmé ou un formulaire non sauvegardé ne peut pas écraser les données nouvelles', () => {
        const appliquer = vi.fn();
        const {rerender} = render(<PanneauFatigueVoyageur donnees={d} appliquer={appliquer} />);
        fireEvent.click(screen.getByRole('button',{name:'Prévisualiser'}));
        rerender(<PanneauFatigueVoyageur donnees={{...d,fatigue:13}} appliquer={appliquer} />);
        fireEvent.click(screen.getByRole('button',{name:'Appliquer le mouvement'}));
        expect(appliquer).not.toHaveBeenCalled();expect(screen.getByRole('alert').textContent).toContain('refaire');
        rerender(<PanneauFatigueVoyageur donnees={d} appliquer={appliquer} avantOperation={() => false} />);
        fireEvent.click(screen.getByRole('button',{name:'Prévisualiser'}));
        fireEvent.click(screen.getByRole('button',{name:'Appliquer le mouvement'}));
        expect(appliquer).not.toHaveBeenCalled();
    });
    it('l’activation garde la fatigue et une copie des saisies, sans les recalculer rétroactivement', () => {
        const appliquer = vi.fn();const avant = {...d,__rddFatigue231:0,endurance:7};
        render(<PanneauFatigueVoyageur donnees={avant} appliquer={appliquer} />);
        fireEvent.click(screen.getByRole('button',{name:'Activer le suivi de fatigue'}));
        expect(appliquer.mock.calls[0][0]).toEqual({__rddFatigue231:1,__rddAvantFatigue231:avant});
    });
    it('suspendre puis réactiver préserve la première copie ; une endurance hors table permet de revenir au manuel', () => {
        const appliquer = vi.fn();const copie = {fatigue:1};
        const {rerender} = render(<PanneauFatigueVoyageur donnees={{...d,__rddFatigue231:0,__rddAvantFatigue231:copie}} appliquer={appliquer} />);
        fireEvent.click(screen.getByRole('button',{name:'Activer le suivi de fatigue'}));
        expect(appliquer.mock.calls[0][0].__rddAvantFatigue231).toEqual(copie);
        rerender(<PanneauFatigueVoyageur donnees={{...d,endurance_max:31}} appliquer={appliquer} />);
        fireEvent.click(screen.getByRole('button',{name:'Revenir au suivi manuel'}));
        expect(appliquer.mock.calls[1][0]).toEqual({__rddFatigue231:0});
    });
});
