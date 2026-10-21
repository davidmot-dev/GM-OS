import { useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SanteAlien from './SanteAlien';
import { DiceEngine } from '../../../dice/DiceEngine';
import { CLE_COMBAT_ALIEN, combatAlienVierge, demanderUnCritique, lireLeCombatAlien } from '../../../dice/systemes/combatAlien';
import { lireLeSynthetique } from '../../../dice/systemes/synthetiquesAlien';

const { charger } = vi.hoisted(() => ({ charger: vi.fn() }));
vi.mock('../../../tables/pontDesTables', () => ({ pontDesTables: () => ({ loadTable: charger }) }));
const regle = { sante: 'sante', force: 'force', endurance: 'endurance', protection: 'protection', talents: 'talent', proprietesArmes: 'proprietes', stress: 'stress', androide: 'androide' };
const table = { entries: Array.from({ length: 6 }, (_, i) => ({ min: i + 1, max: i + 1, title: `Avarie ${i + 1}`, effect: `Effet ${i + 1}` })) };
let fiche: Record<string, unknown>;
function Hote({ joueur = false, sante = 0 }: { joueur?: boolean; sante?: number }) {
    const [valeurs, ecrire] = useState<Record<string, unknown>>({ androide: '1', force: 4, sante, stress: 5, protection: 0,
        [CLE_COMBAT_ALIEN]: demanderUnCritique(combatAlienVierge(), 'a') });
    useEffect(() => { fiche = valeurs; }, [valeurs]);
    return <SanteAlien regle={regle} valeurs={valeurs} ecrire={ecrire} pourLesJoueurs={joueur} consigner={vi.fn()} />;
}
const clic = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); charger.mockReset(); });
describe('A4 — fiche, critiques synthétiques et intervention', () => {
    it('tire un D6, conserve le résultat et masque les soins humains ; reprise sans second tirage', async () => {
        charger.mockResolvedValue(table); const de = vi.spyOn(DiceEngine, 'roll').mockReturnValue(3);
        const vue = render(<Hote />); clic('Tirer le prochain critique synthétique (D6)');
        await screen.findByText('3 — Avarie 3');
        expect(de.mock.calls).toEqual([[6]]); expect(fiche.stress).toBe(5);
        expect(screen.queryByLabelText('Réussites de Soins médicaux validées')).toBeNull();
        expect(screen.queryByRole('button', { name: /repos écoulé/ })).toBeNull();
        vue.unmount(); render(<SanteAlien regle={regle} valeurs={fiche} ecrire={vi.fn()} pourLesJoueurs={false} consigner={vi.fn()} />);
        expect(screen.getByText('3 — Avarie 3')).toBeTruthy(); expect(de).toHaveBeenCalledTimes(1);
    });
    it('une table absente conserve la demande sans lancer un dé', async () => {
        charger.mockResolvedValue(null); const de = vi.spyOn(DiceEngine, 'roll');
        render(<Hote />); clic('Tirer le prochain critique synthétique (D6)');
        await screen.findByText(/Table synthétique indisponible/);
        expect(lireLeCombatAlien(fiche).critiques).toEqual(['a']); expect(de).not.toHaveBeenCalled();
    });
    it('réactive avec énergie et trauma, puis restaure toute la Santé par une réparation séparée', async () => {
        charger.mockResolvedValue(table); vi.spyOn(DiceEngine, 'roll').mockReturnValue(6);
        render(<Hote />); clic('Tirer le prochain critique synthétique (D6)'); await screen.findByText('6 — Avarie 6');
        expect((screen.getByRole('button', { name: 'Commencer la réactivation (un Tour)' }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByLabelText('Source d’énergie disponible')); clic('Commencer la réactivation (un Tour)');
        fireEvent.change(screen.getByLabelText('Réussites de Comtech validées'), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText('Trauma mental permanent choisi avec Maman'), { target: { value: 'Mémoire fragmentée' } });
        expect((screen.getByRole('button', { name: 'Appliquer le résultat de Comtech' }) as HTMLButtonElement).disabled).toBe(true);
        clic('Valider un tour'); clic('Appliquer le résultat de Comtech');
        expect(fiche.sante).toBe(0); expect(lireLeSynthetique(lireLeCombatAlien(fiche))).toMatchObject({ arret: true, reactive: true });
        clic('Commencer la réparation (un Quart)'); clic('Valider un quart');
        fireEvent.change(screen.getByLabelText('Réussites de Comtech validées'), { target: { value: '1' } }); clic('Appliquer le résultat de Comtech');
        expect(fiche.sante).toBe(4); expect(fiche.stress).toBe(5);
        expect(lireLeSynthetique(lireLeCombatAlien(fiche))).toMatchObject({ arret: false, avaries: [], traumatismes: ['Mémoire fragmentée'] });
    });
    it('le Hub expose le suivi sans boutons de résolution du meneur', () => {
        render(<Hote joueur />); expect(screen.getByText(/critique\(s\) synthétique/)).toBeTruthy();
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
    it('le vide ne retire aucune Santé et ne demande pas de critique supplémentaire', async () => {
        render(<Hote sante={4} />);
        fireEvent.change(screen.getByLabelText('Origine des dégâts'), { target: { value: 'vide' } });
        fireEvent.change(screen.getByLabelText('Dégâts entrants'), { target: { value: '9' } });
        clic('Préparer ce coup'); clic('Appliquer les dégâts restants');
        await waitFor(() => expect(fiche.sante).toBe(4));
        expect(lireLeCombatAlien(fiche).critiques).toEqual(['a']); expect(fiche.stress).toBe(5);
    });
});
