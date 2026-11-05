import { useState } from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HeroismeCoc, PsychismeCoc, CapacitesCoc } from './AventuresCoc';
import { CHOIX_DE_COC, type ChoixDeCoc, type RegleDeCoc } from '../../../dice/systemes/coc';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_AVANTAGES_COC } from '../../../dice/systemes/avantagesDeCoc';
import { CLE_PSYCHISME_COC } from '../../../dice/systemes/psychismeDeCoc';
const r: RegleDeCoc = { heroisme: true, psychisme: true, evolution: { champ: 'evo', modele: 'modele' }, volonte: 'volonte', physiques: ['agilite'],
    voies: { emplacements: [{ nom: 'voie', reference: 'reference', rangs: ['r1', 'r2'] }] } };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function Carte({ genre, initial, journal, ecrit }: { genre: 'heros' | 'choc'; initial: Record<string, unknown>; journal: (s: string) => void; ecrit: (m: Record<string, unknown>) => void }) {
    const [valeurs, setValeurs] = useState(initial);
    const props = { regle: r, valeurs, consigner: journal, ecrire: (maj: Record<string, unknown>) => { ecrit(maj); setValeurs(f => ({ ...f, ...maj })); } };
    return genre === 'heros' ? <HeroismeCoc {...props} /> : <PsychismeCoc {...props} />;
}
describe('les cartes COC-A4/A5/A6', () => {
    it('DEF+5 : un débit, aperçu et confirmation ; consommation explicite', () => {
        const ecrit = vi.fn(), journal = vi.fn();
        render(<Carte genre="heros" initial={{ evo: 13, modele: 'Héros' }} ecrit={ecrit} journal={journal} />);
        fireEvent.click(screen.getByText('Héroïsme hors du test'));
        expect(screen.getByText(/coût 1, reste 12/)).toBeTruthy();
        const b = screen.getByText('Confirmer l’avantage héroïque'); fireEvent.click(b); fireEvent.click(b);
        expect(ecrit).toHaveBeenCalledTimes(1); expect(ecrit.mock.calls[0][0].evo).toBe(12);
        expect(journal.mock.calls[0][0]).toContain('Test déjà lancé inchangé');
        fireEvent.click(screen.getByText('Attaque terminée : consommer la DEF'));
        expect(ecrit.mock.calls[1][0][CLE_AVANTAGES_COC].actifs).toHaveLength(0);
    });
    it('choc rang2 critique : durée proposée, confirmation, séquelle séparée et Blues inchangé', () => {
        vi.spyOn(DiceEngine, 'roll').mockImplementation(faces => faces === 20 ? 3 : faces === 4 ? 4 : 2);
        const ecrit = vi.fn(), journal = vi.fn();
        render(<Carte genre="choc" initial={{ evo: 7, modele: 'Blues', volonte: 1 }} ecrit={ecrit} journal={journal} />);
        fireEvent.click(screen.getByText('Événement choquant et santé psychique'));
        fireEvent.change(screen.getByLabelText('Événement choquant'), { target: { value: 'Découverte' } });
        fireEvent.change(screen.getByLabelText('Rang de l’événement'), { target: { value: '2' } });
        fireEvent.click(screen.getByText('Lancer VOL pour l’événement'));
        expect(ecrit).not.toHaveBeenCalled(); expect((screen.getByLabelText('Rounds de choc') as HTMLInputElement).value).toBe('4');
        fireEvent.click(screen.getByText('Confirmer les conséquences psychiques'));
        const p = ecrit.mock.calls[0][0][CLE_PSYCHISME_COC];
        expect(p.choc.nature).toBe('Tétanisé'); expect(p.demandes).toHaveLength(1); expect(p.sequelles).toHaveLength(0);
        expect(ecrit.mock.calls[0][0]).not.toHaveProperty('evo');
        fireEvent.change(screen.getByLabelText('Séquelle psychique'), { target: { value: 'Réminiscence' } });
        fireEvent.click(screen.getByText('Confirmer la séquelle'));
        expect(ecrit.mock.calls[1][0][CLE_PSYCHISME_COC].sequelles[0].nature).toBe('Réminiscence');
    });
    it('le joueur voit le choc confirmé, sans pouvoir imposer une séquelle', () => {
        render(<PsychismeCoc regle={r} valeurs={{}} joueur ecrire={vi.fn()} consigner={vi.fn()} />);
        expect(screen.queryByText('Confirmer les conséquences psychiques')).toBeNull();
    });
    it('Furtif reste décoché : la sélection demande le contexte et ne coche pas un rang à sa place', () => {
        const initial = { reference: 'furtivite', r1: true }, ecrire = vi.fn();
        function Voies() { const [choix, setChoix] = useState<ChoixDeCoc>(CHOIX_DE_COC); return <CapacitesCoc regle={r} valeurs={initial} choix={choix} setChoix={setChoix} champ="agilite" ecrire={ecrire} consigner={vi.fn()} />; }
        render(<Voies />); fireEvent.click(screen.getByText('Capacités de Voies pour ce test'));
        const c = screen.getByLabelText('Furtif') as HTMLInputElement; expect(c.checked).toBe(false);
        fireEvent.click(c); expect(c.checked).toBe(true); expect(ecrire).not.toHaveBeenCalled();
        expect(screen.getByText(/coût 0 échelon, durée : ce test/)).toBeTruthy();
    });
});
