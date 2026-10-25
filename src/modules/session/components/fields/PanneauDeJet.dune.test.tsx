import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../../../../data/defaultGameDrivers';
import { DEFAULT_SHEET_TEMPLATES } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';
import { CLE_DUNE, lireDune } from '../../../dice/systemes/duneRegles';

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
        expect(screen.getByText(/Impulsion du test/).textContent).toContain('1 normale');
        fireEvent.change(screen.getByLabelText('Effet de l’Impulsion'), { target: { value: 'Qui contrôle ce passage ?' } });
        fireEvent.click(screen.getByText('Obtenir une information (1)'));
        expect(screen.getByText(/Impulsion du test/).textContent).toContain('0 normale');
        expect(reserves().impulsion).toBe(6);
    });

    it('ou se verse quand la réserve a fait de la place', () => {
        monter({ impulsion: 5, menace: 0 });
        faces(1, 4); // le 1 compte double : trois réussites, deux d'excédent
        lancer();
        expect(reserves().impulsion).toBe(5); // Le reliquat attend la fin des dépenses du test.
        expect(screen.getByText(/Impulsion du test/).textContent).toContain('2 normale');
        useRessourcesDeTableStore.getState().depenser('c', RESSOURCES, 'impulsion', 2);
        fireEvent.click(screen.getByText('Terminer le test et conserver le reliquat'));
        expect(reserves().impulsion).toBe(5);
    });
});

describe('Dune : le test complet au panneau', () => {
    it('une relance sélective recompte le même test avant un versement unique', () => {
        useRessourcesDeTableStore.setState({ reserves: { c: { impulsion: 0, menace: 0 } } });
        const ecrire = vi.fn();
        render(<PanneauDeJet descripteur={DUNE.jet!} dice={DUNE.dice as DiceConfig} template={FICHE}
            valeurs={{ combat: 6, devoir: 7, determination: 2, [CLE_DUNE]: { ...lireDune({}), maximes: { devoir: 'Je protège ma Maison.' } } }} ecrireSurLaFiche={ecrire} campaignId="c" ressourcesDeTable={RESSOURCES} />);
        const [competence, principe] = screen.getAllByRole('combobox');
        fireEvent.change(competence, { target: { value: 'combat' } }); fireEvent.change(principe, { target: { value: 'devoir' } });
        fireEvent.click(screen.getByLabelText('Maxime pertinente, validée à la table'));
        faces(15, 5); lancer();
        expect(reserves().impulsion).toBe(0);
        fireEvent.click(screen.getByLabelText('Dé 1 : 15'));
        faces(1); fireEvent.click(screen.getByText('Relancer les dés choisis (1 Détermination)'));
        expect(ecrire.mock.calls.at(-1)?.[0]).toMatchObject({ determination: 1 });
        expect(screen.getByText(/Impulsion du test/).textContent).toContain('2 normale');
        expect(reserves().impulsion).toBe(0);
        fireEvent.click(screen.getByText('Terminer le test et conserver le reliquat'));
        expect(reserves().impulsion).toBe(2);
    });
    it('spécialisation pertinente : un 5 de Combat 6 compte double', () => {
        monter({ impulsion: 0, menace: 0 });
        fireEvent.click(screen.getByLabelText('Spécialisation pertinente'));
        faces(5, 20); lancer();
        expect(screen.getByText(/Impulsion du test/).textContent).toContain('1 normale');
        fireEvent.click(screen.getByText('Terminer le test et conserver le reliquat'));
        expect(reserves().impulsion).toBe(1);
        expect(screen.getByText('Test terminé. L’Impulsion conservable a été versée une seule fois.')).toBeTruthy();
    });
    it('un PNJ ennemi achète avec sa Menace, sans toucher à l’Impulsion', () => {
        monter({ impulsion: 6, menace: 10 });
        fireEvent.click(screen.getByLabelText('PNJ ennemi : achats et dépenses en Menace'));
        acheterUnDe(); faces(20, 20, 20); lancer();
        expect(reserves()).toMatchObject({ impulsion: 6, menace: 9 });
    });
    it('l’Impulsion bonus disparaît à la clôture, même si la réserve est vide', () => {
        monter({ impulsion: 0, menace: 0 });
        fireEvent.change(screen.getByLabelText('Impulsion bonus'), { target: { value: '3' } });
        faces(3, 4); lancer();
        fireEvent.click(screen.getByText('Terminer le test et conserver le reliquat'));
        expect(reserves().impulsion).toBe(1);
    });
});
