import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Le paiement au choix et l'Impulsion du jet** — Dune, lot D2 (2026-10-22).
 * Le livre (p. 149–152) : payer tout ou partie des dés achetés en Menace, même
 * avec de l'Impulsion ; dépenser l'Impulsion du test avant de conserver le
 * reliquat, plafonné à six.
 */
const DUNE = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const FICHE = DEFAULT_SHEET_TEMPLATES.find(t => t.id === 'dune')!;
const RESSOURCES = DUNE.ressourcesDeTable!;
const reserves = () => useRessourcesDeTableStore.getState().reserves.c;

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 20);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); useRessourcesDeTableStore.setState({ reserves: {} }); });

const monter = (etat: Record<string, number>) => {
    useRessourcesDeTableStore.setState({ reserves: { c: etat } });
    render(<PanneauDeJet descripteur={DUNE.jet!} dice={DUNE.dice as DiceConfig} template={FICHE}
        valeurs={{ combat: 6, devoir: 5 }} campaignId="c" ressourcesDeTable={RESSOURCES} />);
    const [competence, principe] = screen.getAllByRole('combobox');
    fireEvent.change(competence, { target: { value: 'combat' } });
    fireEvent.change(principe, { target: { value: 'devoir' } });
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const acheterUnDe = () => fireEvent.click(screen.getAllByRole('button').find(b => b.closest('div')?.textContent?.startsWith('Dés') && b.querySelector('.lucide-plus'))!);

describe('payer les dés achetés en Menace, par choix', () => {
    it('deux dés (1 + 2) : deux points en Menace par choix, un d\'Impulsion', () => {
        monter({ impulsion: 4, menace: 0 });
        acheterUnDe();
        acheterUnDe();
        const enMenace = screen.getByRole('button', { name: 'Un point de plus en Menace' });
        fireEvent.click(enMenace);
        fireEvent.click(enMenace);
        faces(15, 15, 15, 15);
        lancer();
        expect(reserves()).toMatchObject({ impulsion: 3, menace: 2 });
        expect(screen.getByText(/2 points payés en Menace par choix/)).toBeTruthy();
    });

    it('à zéro, la règle d\'avant : l\'Impulsion d\'abord', () => {
        monter({ impulsion: 4, menace: 0 });
        acheterUnDe();
        faces(15, 15, 15);
        lancer();
        expect(reserves()).toMatchObject({ impulsion: 3, menace: 0 });
    });
});

describe('l\'Impulsion du jet, quand la réserve est pleine', () => {
    it('ce qui ne tient pas reste sur le test, et se dépense', () => {
        monter({ impulsion: 6, menace: 0 });
        faces(3, 4); // deux réussites, difficulté 1 : un excédent
        lancer();
        expect(reserves().impulsion).toBe(6);
        expect(screen.getByText('1 Impulsion hors réserve')).toBeTruthy();
        fireEvent.click(screen.getByText('Dépenser un point'));
        expect(screen.queryByText('1 Impulsion hors réserve')).toBeNull();
        expect(reserves().impulsion).toBe(6);
    });

    it('ou se verse quand la réserve a fait de la place', () => {
        monter({ impulsion: 5, menace: 0 });
        faces(1, 4); // le 1 compte double : trois réussites, deux d'excédent
        lancer();
        expect(reserves().impulsion).toBe(6);
        expect(screen.getByText('1 Impulsion hors réserve')).toBeTruthy();
        useRessourcesDeTableStore.getState().depenser('c', RESSOURCES, 'impulsion', 2);
        fireEvent.click(screen.getByText('Verser à la réserve'));
        expect(reserves().impulsion).toBe(5);
    });
});
