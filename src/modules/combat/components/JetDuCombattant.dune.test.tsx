// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { attaqueSurLaCarte, jetDuCombattantPossible } from '../logic/jetDuCombattant';
import { attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import { DiceEngine } from '../../dice/DiceEngine';
import { useCombatStore } from '../useCombatStore';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import type { Combatant } from '../types';

/**
 * **« Attaquer » pour Dune** — registre § 263, T18 (19/11/2026). Un Soldat Harkonnen, PNJ mineur
 * (livre p. 327 : une compétence à 6, une valeur de principe ajoutée à chaque test, pas de maxime),
 * attaque Duncan : Combat 6 + son principe 6, deux d20. Une réussite ouvre « Appliquer cette
 * attaque réussie » avec Duncan déjà choisi. Dune n'a pas de points de vie : pas d'« Appliquer à ».
 */
const DUNE = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const FICHE = DEFAULT_SHEET_TEMPLATES.find(t => t.id === DUNE.templateId)!;
const SOLDAT_FICHE = { combat: 6, discipline: 5, mob: 4, domination: 6 };
const soldat = { id: 'soldat', name: 'Soldat Harkonnen', isPlayer: false, faction: 'enemy', statuses: [], init: 0,
    sheetData: SOLDAT_FICHE, targetId: 'duncan' } as unknown as Combatant;
const duncan = { id: 'duncan', name: 'Duncan', isPlayer: true, faction: 'player', statuses: [], init: 0,
    sheetData: { combat: 6 } } as unknown as Combatant;

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); useCombatStore.setState({ combatants: [soldat, duncan] }); });
afterEach(() => { cleanup(); de.mockRestore(); useCombatStore.setState({ combatants: [] }); });

describe('« Attaquer » pour Dune (T18)', () => {
    it('le jet d’un adversaire s’ouvre à Dune, et le bouton paraît ; jamais pour un PJ', () => {
        expect(jetDuCombattantPossible(soldat, DUNE, FICHE)).toBe(true);
        expect(attaqueSurLaCarte(soldat, DUNE, FICHE)).toBe(true);
        expect(attaqueSurLaCarte(duncan, DUNE, FICHE)).toBe(false);
    });

    it('l’attaque proposée : Combat et le principe le plus haut (celui du PNJ mineur) ; sans principe, rien', () => {
        expect(attaqueParDefaut(DUNE, [], SOLDAT_FICHE)).toEqual({ competence: 'combat', principe: 'domination' });
        expect(attaqueParDefaut(DUNE, [], { combat: 6, justice: 5, foi: 7 })).toEqual({ competence: 'combat', principe: 'foi' });
        expect(attaqueParDefaut(DUNE, [], { combat: 6 })).toBeNull();
    });

    it('le test réussi ouvre l’attaque Dune sur la cible de la carte, « PNJ ennemi » coché, sans « Appliquer à »', () => {
        render(<JetDuCombattant combattant={soldat} driver={DUNE} gabarit={FICHE} valeurs={SOLDAT_FICHE} auPremierPlan
            cible={duncan} attaqueProposee={attaqueParDefaut(DUNE, [], SOLDAT_FICHE)} />);
        // Les PNJ ennemis paient en Menace (livre, p. 240).
        expect((screen.getByLabelText(/PNJ ennemi/) as HTMLInputElement).checked).toBe(true);
        // Seuil 6 + 6 = 12 : deux 3 sont deux réussites, la difficulté 1 est passée.
        de.mockImplementation(() => 3);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        const cible = screen.getByLabelText('Cible de l’attaque Dune') as HTMLSelectElement;
        expect(cible.value).toBe('duncan');
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
    });

    it('ouvert par « Fiche » (sans cible), l’attaque Dune reste à choisir', () => {
        render(<JetDuCombattant combattant={soldat} driver={DUNE} gabarit={FICHE} valeurs={SOLDAT_FICHE} />);
        const [competence, principe] = screen.getAllByRole('combobox') as HTMLSelectElement[];
        fireEvent.change(competence, { target: { value: 'combat' } });
        fireEvent.change(principe, { target: { value: 'domination' } });
        de.mockImplementation(() => 3);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect((screen.getByLabelText('Cible de l’attaque Dune') as HTMLSelectElement).value).toBe('');
    });
});
