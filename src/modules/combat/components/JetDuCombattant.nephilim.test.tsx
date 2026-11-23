// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import { attaqueDeNephilim, bonusDeKaFeu, dommagesDeNephilim } from '../logic/dommagesDeNephilim';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Nephilim** (registre § 267, T11, 23/11/2026) : la Menace d'un PNJ tient lieu
 * de Vécu (p. 117), puis les degrés de dommages — arme, Ka-Feu, protection, critique, Défense (p. 103,
 * 129-136) — et la cible choisit comment elle les absorbe (p. 136). Le jet du pilote 2.0.0 (export du 21/11).
 */
const CASES = [
    { champ: 'health_physical_case_1', valeur: 1 }, { champ: 'health_physical_case_2', valeur: 2 }, { champ: 'health_physical_case_3', valeur: 3 },
    { champ: 'health_physical_case_bonus_1', valeur: 1, kaTerre: 5 }, { champ: 'health_physical_case_bonus_2', valeur: 1, kaTerre: 10 },
];
const CONSEQUENCES = [
    { champ: 'consequences_physical_minor_active', label: 'Mineure', absorbe: 2 },
    { champ: 'consequences_physical_serious_active', label: 'Sérieuse', absorbe: 4 },
    { champ: 'consequences_physical_severe_active', label: 'Grave', absorbe: 6 },
];
const PILOTE = {
    id: 'neph', templateId: 'tpl',
    dice: { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' },
    jet: {
        sens: 'sous-ou-egal', reserve: { base: 1, max: 1, faces: 100 },
        cible: { mecanique: 'nephilim', caracteristique: { id: 'vecu', label: 'Vécu', sectionId: 'les_vecus' }, ajustement: [] },
        nephilim: { composantes: { vecu: 'vecu' }, pentacle: { Feu: 'ka_fire', Terre: 'ka_earth' }, kaTerre: 'ka_earth',
            sante: { physique: { cases: CASES, compte: 'health_physical', consequences: CONSEQUENCES } } },
    },
    combat: { defaultHealthType: 'boxes', damageTypes: ['physique', 'magique'], statsToTrack: [] },
} as unknown as GameDriver;
const FICHE = {
    id: 'tpl', name: 'Nephilim', sections: [
        { id: 'les_vecus', label: 'Vécus', fields: [{ id: 'pastlives_0_name', label: 'Vécu 1', type: 'text' }, { id: 'pastlives_0_degree', label: 'Degré du vécu 1', type: 'number' }] },
    ],
} as unknown as SheetTemplate;
const TEMPLIER = { pastlives_0_name: 'Menace', pastlives_0_degree: 8, ka_fire: 5 };
const CICERACK = { ka_earth: 3 };

/* Le d100 du moteur se lance en deux d10, dizaines puis unités, sur `Math.random`. */
let hasard: ReturnType<typeof vi.spyOn>;
const file: number[] = [];
const d100 = (n: number) => { const v = n % 100; file.push(Math.floor(v / 10) / 10 + 0.001, (v % 10) / 10 + 0.001); };
beforeEach(() => {
    file.length = 0;
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Cicerack', init: 6, isPlayer: false, faction: 'player', statuses: [], sheetData: { ...CICERACK } } as never);
    useCombatStore.getState().addCombatant({ name: 'Templier', init: 8, isPlayer: false, faction: 'enemy', statuses: [], sheetData: TEMPLIER } as never);
    // Après les combattants : leurs identifiants sont tirés du hasard.
    hasard = vi.spyOn(Math, 'random').mockImplementation(() => file.shift() ?? 0.5);
});
afterEach(() => { cleanup(); hasard.mockRestore(); });
const plateau = () => {
    const [cicerack, templier] = useCombatStore.getState().combatants;
    return { cicerack: cicerack as Combatant, templier: { ...templier, targetId: cicerack.id } as Combatant };
};
const cicerackApres = () => useCombatStore.getState().combatants.find(c => c.name === 'Cicerack')!;

describe('Nephilim : la Menace et les degrés de dommages (T11)', () => {
    it('la table, et la Menace du PNJ proposée comme Vécu (p. 117) ; sans Menace, rien n’est deviné', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Nephilim', geste: 'attaquer', degats: 'porte-du-jeu' });
        expect(attaqueDeNephilim({ pastlives_2_name: 'Menace', pastlives_2_degree: 9 })).toEqual({ vecu: 'pastlives_2_degree' });
        expect(attaqueParDefaut(PILOTE, [], TEMPLIER)).toEqual({ vecu: 'pastlives_0_degree' });
        expect(attaqueDeNephilim({ pastlives_0_name: 'Policier' })).toBeNull();
    });

    it('les exemples du livre : Sig Sauer à balles creuses 6, AK-47 blindé en Rafale 13 (p. 132) ; Ka-Feu (p. 103)', () => {
        expect(dommagesDeNephilim({ degre: 2, famille: 'feu', munition: 4 }).degres).toBe(6);
        expect(dommagesDeNephilim({ degre: 4, famille: 'feu', munition: 4, cadence: 5 }).degres).toBe(13);
        expect([4, 5, 9, 10].map(bonusDeKaFeu)).toEqual([0, 1, 1, 2]);
        // Le bonus du Ka-Feu ne compte pas pour une arme à feu (p. 132).
        expect(dommagesDeNephilim({ degre: 2, famille: 'feu', bonusDeKaFeu: 2 }).degres).toBe(2);
    });

    it('la protection, le degré minimal, le critique après la protection, la Rafale après elle, la Défense (p. 129-136)', () => {
        expect(dommagesDeNephilim({ degre: 2, famille: 'melee', bonusDeKaFeu: 1, protection: 1 }).degres).toBe(2);
        // Une arme de 2 et plus réduite à 0 inflige tout de même 1 degré ; une dague (1), rien.
        expect(dommagesDeNephilim({ degre: 2, famille: 'melee', protection: 4 }).degres).toBe(1);
        expect(dommagesDeNephilim({ degre: 1, famille: 'melee', protection: 2 }).degres).toBe(0);
        expect(dommagesDeNephilim({ degre: 2, famille: 'melee', bonusDeKaFeu: 1, protection: 1, critique: true }).degres).toBe(4);
        // La Rafale ne s'ajoute que si des dommages passent (p. 133).
        expect(dommagesDeNephilim({ degre: 2, famille: 'feu', cadence: 5, protection: 3 }).degres).toBe(6);
        expect(dommagesDeNephilim({ degre: 3, famille: 'melee', defense: 'reflexe' }).degres).toBe(2);
        expect(dommagesDeNephilim({ degre: 3, famille: 'melee', defense: 'reduit-de-deux' }).degres).toBe(1);
        expect(dommagesDeNephilim({ degre: 3, famille: 'melee', defense: 'esquive' }).degres).toBe(0);
    });
});

describe('« Attaquer » un adversaire de Nephilim (T11)', () => {
    it('35 sur 80 % touche : l’épée (2) + Ka-Feu 5 (+1) = 3 degrés ; Cicerack coche sa case de 3, sans « Appliquer à »', () => {
        const { cicerack, templier } = plateau();
        render(<JetDuCombattant combattant={templier} driver={PILOTE} gabarit={FICHE} valeurs={TEMPLIER} cible={cicerack} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], TEMPLIER)} />);
        d100(35);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
        fireEvent.change(screen.getByLabelText('Arme de Nephilim'), { target: { value: '3' } });
        expect(document.querySelector('[data-calcul-nephilim]')!.textContent).toContain('arme 2 + Ka-Feu 1 = 3 degrés');
        fireEvent.click(screen.getByText('Cocher la case de 3'));
        expect(cicerackApres().sheetData).toMatchObject({ health_physical_case_3: true, health_physical: 1 });
        expect(document.querySelector('[data-dommages-absorbes]')).toBeTruthy();
    });

    it('un échec (95 sur 80 %) : pas de dommages', () => {
        const { cicerack, templier } = plateau();
        render(<JetDuCombattant combattant={templier} driver={PILOTE} gabarit={FICHE} valeurs={TEMPLIER} cible={cicerack} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], TEMPLIER)} />);
        d100(95);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-dommages-nephilim][data-coup-nul]')).toBeTruthy();
    });
});
