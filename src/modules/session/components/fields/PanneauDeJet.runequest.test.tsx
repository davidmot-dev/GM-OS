import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const consigner = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { useCombatStore } from '../../../combat/useCombatStore';
import type { Combatant } from '../../../combat/types';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Le jet de RuneQuest au panneau** (2026-10-30) : le jet du pilote 2.0.0, sur les
 * exemples du livre (pages imprimées). Le pilote forgé ne rendait que réussite ou échec,
 * et lançait une caractéristique sous sa valeur brute.
 */
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'aptitude', label: 'Aptitude', sectionId: 'competences', sectionsSupplementaires: ['caracteristiques'] }],
    reserve: { base: 1, max: 1, faces: 100 },
    runequest: { caracteristiques: ['pou', 'con'], localisations: { poitrine: 'pv_poitrine' } },
};
const DICE = { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-rq', name: 'RuneQuest', emoji: '🏺',
    sections: [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [
            { id: 'pou', label: 'POU', type: 'number', defaultValue: 10 },
            { id: 'con', label: 'CON', type: 'number', defaultValue: 10 },
        ] },
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'epee_large', label: 'Épée large', type: 'number', defaultValue: 10 },
            { id: 'bouclier_moyen', label: 'Bouclier moyen', type: 'number', defaultValue: 15 },
        ] },
        { id: 'localisations', label: 'Localisations', fields: [{ id: 'pv_poitrine', label: 'Poitrine', type: 'number', defaultValue: 5 }] },
    ],
} as unknown as SheetTemplate;
const VALEURS = { pou: 15, con: 12, epee_large: 56, bouclier_moyen: 65, pv_poitrine: 5 };

/*
  Le d100 du moteur se lance en deux d10 — dizaines puis unités, 00 valant 100 — et le
  D20 par `DiceEngine.roll` : les deux tirent sur `Math.random`, qu'on fixe ici.
*/
let hasard: ReturnType<typeof vi.spyOn>;
const file: number[] = [];
const d100 = (n: number) => { const v = n % 100; file.push(Math.floor(v / 10) / 10 + 0.001, (v % 10) / 10 + 0.001); };
const d20 = (n: number) => file.push((n - 1) / 20 + 0.001);
const faces = (...f: number[]) => { file.length = 0; f.forEach(d100); };
beforeEach(() => { file.length = 0; hasard = vi.spyOn(Math, 'random').mockImplementation(() => file.shift() ?? 0.5); consigner.mockClear(); });
afterEach(() => { cleanup(); hasard.mockRestore(); });

const monter = (aptitude: string) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} />).container;
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: aptitude } });
    return panneau;
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('le jet de RuneQuest au panneau', () => {
    it('02 sur 56 % est une réussite critique (p. 142)', () => {
        const panneau = monter('epee_large');
        expect(panneau.querySelector('[data-composition-runequest]')!.textContent).toContain('critique 01-03 · spéciale 01-11');
        faces(2);
        lancer();
        expect(screen.getAllByText(/Réussite critique/).length).toBeGreaterThan(0);
        expect((consigner.mock.calls[0][0] as { tagSuccess: boolean }).tagSuccess).toBe(true);
    });

    it('99 sur 56 % est un échec critique, et 57 un échec (p. 142)', () => {
        monter('epee_large');
        faces(99);
        lancer();
        expect(screen.getAllByText(/Échec critique — 99 contre 56 %/).length).toBeGreaterThan(0);
        faces(57);
        lancer();
        expect(screen.getAllByText(/Échec — 57 contre 56 %/).length).toBeGreaterThan(0);
    });

    it('une caractéristique se teste ×5 : CON 12 donne 60 %, et non 12 % (p. 141)', () => {
        const panneau = monter('con');
        expect(panneau.querySelector('[data-composition-runequest]')!.textContent).toContain('CON 12 × 5 = 60 %');
        faces(45);
        lancer();
        expect(screen.getAllByText(/Réussite — 45 contre 60 %/).length).toBeGreaterThan(0);
    });

    it('la table de résistance : POU 15 contre 14, 55 % (p. 145)', () => {
        const panneau = monter('pou');
        fireEvent.change(screen.getByLabelText('Test de caractéristique'), { target: { value: 'resistance' } });
        fireEvent.change(screen.getByLabelText('Caractéristique passive'), { target: { value: '14' } });
        expect(panneau.querySelector('[data-composition-runequest]')!.textContent).toContain('= 55 %');
    });

    it('un test d’augmentation réussi sert +20 % au jet suivant, une seule fois (p. 144)', () => {
        const panneau = monter('epee_large');
        faces(30);
        lancer();
        fireEvent.click(screen.getByText('Augmenter le prochain jet (+20 %)'));
        expect(panneau.querySelector('[data-composition-runequest]')!.textContent).toContain('Épée large 56 % + 20 augmentation = 76 %');
        faces(70);
        lancer();
        expect(screen.getAllByText(/Réussite — 70 contre 76 %/).length).toBeGreaterThan(0);
        expect(panneau.querySelector('[data-composition-runequest]')!.textContent).not.toContain('augmentation');
    });

    it('l’opposition : le meilleur niveau de réussite l’emporte (errata p. 142)', () => {
        monter('bouclier_moyen');
        fireEvent.change(screen.getByLabelText('Aptitude adverse'), { target: { value: '90' } });
        faces(10);
        lancer();
        fireEvent.change(screen.getByLabelText('Jet de l’adversaire'), { target: { value: '40' } });
        fireEvent.click(screen.getByText('Trancher'));
        // 10 sur 65 % est une spéciale (01-13) ; 40 sur 90 % une réussite.
        expect(screen.getByText(/Il l’emporte/)).toBeTruthy();
    });

    it('localise le coup au D20 et dit les PV de la zone (p. 146)', () => {
        monter('epee_large');
        faces(30);
        lancer();
        d20(12);
        fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
        expect(screen.getByText(/12 → Poitrine \(5 PV sur la fiche\)/)).toBeTruthy();
    });

    describe('le coup localisé, porté depuis le jet (2026-10-30)', () => {
        const combat = useCombatStore.getState();
        const broo = { id: 'broo', name: 'Broo', isPlayer: false, hp: 12, hpMax: 12, statuses: [], sheetData: {} } as unknown as Combatant;
        const vasana = { id: 'vasana', name: 'Vasana', isPlayer: false, hp: 12, hpMax: 12, statuses: [], targetId: 'broo', sheetData: {} } as unknown as Combatant;
        beforeEach(() => useCombatStore.setState({ combatants: [vasana, broo], currentTurnIdx: 0 }));
        afterEach(() => useCombatStore.setState(combat, true));

        it('vise par défaut la cible du combattant dont c’est le tour', () => {
            monter('epee_large');
            faces(30);
            lancer();
            d20(12);
            fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
            expect((screen.getByLabelText('Cible du coup') as HTMLSelectElement).value).toBe('broo');
            expect(screen.getByText('Porter le coup')).toBeTruthy();
        });

        it('ne se propose pas sur la tablette d’un joueur', () => {
            render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={VALEURS} pourLesJoueurs />);
            fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'epee_large' } });
            faces(30);
            lancer();
            d20(12);
            fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
            expect(screen.queryByText('Porter le coup')).toBeNull();
        });
    });
});
