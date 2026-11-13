import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { useState } from 'react';
import DeltaGreenAuJet from './DeltaGreenAuJet';
import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { RegleDeDeltaGreen } from '../../../dice/systemes/deltaGreen';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: vi.fn() }));
const regle: RegleDeDeltaGreen = { sante: 'PV', san: 'SAN', pouvoir: 'POU', charisme: 'CHA', seuilRupture: 'SR', inconcevable: 'inconcevable', experience: { armes_a_feu: 'experience_armes_a_feu' } };
const resultat = { total: 88, modifier: 0, rolls: [], tagSuccess: false, degre: 'echec-total' as const, totalDisplay: 'Échec critique' };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('les commandes de Delta Green sur la fiche', () => {
    it('cas de David : SAN 60, SR 48, POU 12, perte -5 retire cinq SAN une seule fois', () => {
        const ecrire = vi.fn();
        render(<DeltaGreenAuJet regle={regle} valeurs={{ SAN: 60, SR: 48, POU: 12 }} dernier={{ id: 'san-david', champ: 'SAN', chances: 60, resultat }} ecrire={ecrire} consigner={() => {}} libelle={s => s} />);
        fireEvent.change(screen.getByLabelText('Perte de SAN'), { target: { value: '-5' } });
        const b = screen.getByRole('button', { name: 'Appliquer la perte de SAN' });
        act(() => { fireEvent.click(b); fireEvent.click(b); });
        expect(ecrire).toHaveBeenCalledTimes(1);
        expect(ecrire.mock.calls[0][0]).toMatchObject({ SAN: 55, __deltaGreen: { folieTemporaire: true } });
        expect(ecrire.mock.calls[0][0]).not.toHaveProperty('SR');
        expect((screen.getByRole('button', { name: 'Perte déjà appliquée' }) as HTMLButtonElement).disabled).toBe(true);
    });
    it('affiche une saisie invalide près du bouton et permet de la corriger sans relancer le test', () => {
        const ecrire = vi.fn();
        render(<DeltaGreenAuJet regle={regle} valeurs={{ SAN: 60, SR: 48, POU: 12 }} dernier={{ id: 'san-correction', champ: 'SAN', chances: 60, resultat }} ecrire={ecrire} consigner={() => {}} libelle={s => s} />);
        fireEvent.change(screen.getByLabelText('Perte de SAN'), { target: { value: 'abc' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer la perte de SAN' }));
        expect(screen.getByRole('alert').textContent).toContain('Perte invalide');
        expect(ecrire).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('Perte de SAN'), { target: { value: '−5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer la perte de SAN' }));
        expect(ecrire.mock.calls[0][0].SAN).toBe(55);
        expect(screen.queryByRole('alert')).toBeNull();
    });
    it('explique le refus quand le Pouvoir de la fiche n’est pas renseigné', () => {
        const ecrire = vi.fn();
        render(<DeltaGreenAuJet regle={regle} valeurs={{ SAN: 50, SR: 40, POU: 0 }} dernier={{ id: 'san-incomplete', champ: 'SAN', chances: 50, resultat }} ecrire={ecrire} consigner={() => {}} libelle={s => s} />);
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer la perte de SAN' }));
        expect(ecrire).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain('Pouvoir');
    });
    it('une perte ne s’applique qu’une fois, même avec un retour de fiche différé', () => {
        const ecrire = vi.fn(), consigner = vi.fn();
        render(<DeltaGreenAuJet regle={regle} valeurs={{ SAN: 50, SR: 40, POU: 10 }} dernier={{ id: 'san-1', champ: 'SAN', chances: 50, resultat }} ecrire={ecrire} consigner={consigner} libelle={s => s} />);
        fireEvent.change(screen.getByLabelText('Perte de SAN'), { target: { value: '0/1D10' } });
        act(() => { const bouton = screen.getByRole('button', { name: 'Appliquer la perte de SAN' }); fireEvent.click(bouton); fireEvent.click(bouton); });
        expect(ecrire).toHaveBeenCalledTimes(1);
        expect(ecrire.mock.calls[0][0]).toMatchObject({ SAN: 40, SR: 30 });
        expect(screen.getByText(/1 trouble\(s\)/)).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Perte déjà appliquée' }) as HTMLButtonElement).disabled).toBe(true);
    });
    it('accoutumé : une perte de réussite subsiste et ne déclenche pas le D6 d’accoutumance', () => {
        const ecrire = vi.fn();
        const de = vi.spyOn(DiceEngine, 'roll').mockReturnValue(4);
        render(<DeltaGreenAuJet regle={regle} valeurs={{ SAN: 50, SR: 40, POU: 10, accoutumance_violence: true }} dernier={{ id: 'san-2', champ: 'SAN', chances: 50, resultat }} ecrire={ecrire} consigner={() => {}} libelle={s => s} />);
        fireEvent.change(screen.getByLabelText('Perte de SAN'), { target: { value: '1/1D10' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer la perte de SAN' }));
        expect(ecrire.mock.calls[0][0].SAN).toBe(49);
        expect(de).not.toHaveBeenCalled();
    });
    it('la fin de partie décoche les compétences et bloque un second gain', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(3);
        const ecrire = vi.fn();
        render(<DeltaGreenAuJet regle={regle} valeurs={{ armes_a_feu: 50, experience_armes_a_feu: true }} dernier={null} ecrire={ecrire} consigner={() => {}} libelle={s => s} />);
        const b = screen.getByRole('button', { name: /Améliorer les compétences/ });
        act(() => { fireEvent.click(b); fireEvent.click(b); });
        expect(ecrire).toHaveBeenCalledTimes(1);
        expect(ecrire.mock.calls[0][0]).toEqual({ armes_a_feu: 53, experience_armes_a_feu: false });
    });
    it('le vrai panneau coche l’échec d’une compétence et transporte le vocabulaire du livre', () => {
        const ecrire = vi.fn();
        const template = { id: 'tpl', name: 'Agent', emoji: '', sections: [{ id: 'competences', label: 'Compétences', fields: [{ id: 'armes_a_feu', label: 'Armes à feu', type: 'number' }] }] } as SheetTemplate;
        vi.spyOn(Math, 'random').mockReturnValue(0.85); // 88, double raté.
        function Fiche() {
            const [valeurs, setValeurs] = useState<Record<string, unknown>>({ armes_a_feu: 50, distraction_dg: true });
            return <PanneauDeJet personnageId="agent" template={template} valeurs={valeurs} dice={{ engine: 'standard', defaultDice: '1d100', logic: 'd100-low' }}
                descripteur={{ seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }], reserve: { base: 1, max: 1, faces: 100 }, sens: 'sous-ou-egal', deltaGreen: regle }}
                ecrireSurLaFiche={maj => { ecrire(maj); setValeurs(v => ({ ...v, ...maj })); }} />;
        }
        render(<Fiche />);
        fireEvent.change(screen.getByLabelText('Compétence'), { target: { value: 'armes_a_feu' } });
        fireEvent.click(screen.getByRole('button', { name: /^Lancer$/ }));
        expect(ecrire).toHaveBeenCalledWith({ experience_armes_a_feu: true });
        expect(ecrire).toHaveBeenLastCalledWith({ experience_armes_a_feu: true, distraction_dg: false });
        expect(screen.getAllByText('Échec critique').length).toBeGreaterThan(0);
    });
});
