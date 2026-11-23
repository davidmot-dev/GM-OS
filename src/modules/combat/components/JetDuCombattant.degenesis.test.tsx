// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { attaqueDeDegenesis, attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Degenesis** (registre § 267, T8, 23/11/2026) : Physique + Corps à corps (ou
 * Agilité + Armes à projectiles pour une arme à portée, p. 102), l'arme de sa fiche choisie, puis l'attaque du
 * panneau (`AttaqueDegenesis`) déjà réglée sur la cible de la carte. Le jet du pilote 2.3.0 (export du 21/11).
 */
const COMBAT = {
    force: ['physique', 'force'], attaques: ['corps_a_corps', 'lutte', 'armes_a_projectiles'], aDistance: ['armes_a_projectiles'],
    armes: [1, 2, 3].map(n => ({ nom: `arme${n}`, degats: `arme${n}_degats`, maniabilite: `arme${n}_maniabilite`, proprietes: `arme${n}_proprietes` })),
    armures: [1, 2].map(n => ({ nom: `armure${n}`, valeur: `armure${n}_valeur` })),
    defenses: { esquive: ['agilite', 'mobilite'], 'parade-corps-a-corps': ['physique', 'corps_a_corps'], 'parade-lutte': ['physique', 'lutte'] },
};
const PILOTE = {
    id: 'deg', templateId: 'tpl',
    dice: { defaultDice: '1d6', logic: 'count-success', engine: 'standard' },
    jet: {
        reserve: { base: 0, max: 12, faces: 6, composantes: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'competence', label: 'Compétence', sectionId: 'competences_phy', sectionsSupplementaires: ['competences_agi'] },
        ] },
        sens: 'superieur-ou-egal', difficulte: { min: 0, max: 12, defaut: 2 },
        degenesis: {
            traumatismes: 'traumatismes', ego: 'ego_jauge', combat: COMBAT,
            reserves: [
                { attribut: 'physique', competences: ['corps_a_corps', 'force', 'lutte'] },
                { attribut: 'agilite', competences: ['armes_a_projectiles', 'mobilite'] },
            ],
        },
    },
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true }] },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl', name: 'Degenesis', sections: [
        { id: 'attributs', label: 'Attributs', fields: [nombre('physique', 'Physique'), nombre('agilite', 'Agilité')] },
        { id: 'competences_phy', label: 'PHY', fields: [nombre('corps_a_corps', 'Corps à corps'), nombre('force', 'Force'), nombre('lutte', 'Lutte')] },
        { id: 'competences_agi', label: 'AGI', fields: [nombre('armes_a_projectiles', 'Armes à projectiles'), nombre('mobilite', 'Mobilité')] },
    ],
} as unknown as SheetTemplate;
const PILLARD = { physique: 3, agilite: 2, corps_a_corps: 2, force: 1, armes_a_projectiles: 1, arme1: 'Machette', arme1_degats: '4+F/2', arme1_maniabilite: '0' };

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    useCombatStore.getState().reset();
    // « Autre » d'abord : sans l'adversaire reconnu, la carte d'attaque viserait le premier combattant venu.
    useCombatStore.getState().addCombatant({ name: 'Autre', init: 3, isPlayer: false, faction: 'enemy', statuses: [], sheetData: {} } as never);
    useCombatStore.getState().addCombatant({ name: 'Ezra', init: 8, hp: 12, hpMax: 12, isPlayer: true, faction: 'player', statuses: [], sheetData: { sante: 12, agilite: 2, mobilite: 1 } } as never);
    useCombatStore.getState().addCombatant({ name: 'Pillard', init: 10, isPlayer: false, faction: 'enemy', statuses: [], sheetData: PILLARD } as never);
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); de.mockRestore(); });
const plateau = () => {
    const [, ezra, pillard] = useCombatStore.getState().combatants;
    useCombatStore.setState(s => ({ combatants: s.combatants.map(c => c.id === pillard.id ? { ...c, targetId: ezra.id } : c) }));
    return { ezra: ezra as Combatant, pillard: useCombatStore.getState().combatants.find(c => c.id === pillard.id)! as Combatant };
};

describe('« Attaquer » un adversaire de Degenesis (T8)', () => {
    it('la table et l’attaque proposée : la machette, Physique + Corps à corps ; une arme à portée, Agilité + Projectiles', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Degenesis', geste: 'attaquer', degats: 'porte-du-jeu' });
        expect(attaqueDeDegenesis(COMBAT, PILLARD)).toEqual({ champs: { attribut: 'physique', competence: 'corps_a_corps' }, arme: 'arme1' });
        expect(attaqueDeDegenesis(COMBAT, { arme1: 'Fusil', arme1_portee: '50/100' })).toEqual({ champs: { attribut: 'agilite', competence: 'armes_a_projectiles' }, arme: 'arme1' });
        expect(attaqueParDefaut(PILOTE, [], {})).toEqual({ attribut: 'physique', competence: 'corps_a_corps' });
    });

    it('le test réussi ouvre l’attaque Degenesis sur la cible de la carte, l’arme choisie, sans « Appliquer à »', () => {
        const { ezra, pillard } = plateau();
        render(<JetDuCombattant combattant={pillard} driver={PILOTE} gabarit={FICHE} valeurs={PILLARD} cible={ezra} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], PILLARD)} />);
        // Physique 3 + Corps à corps 2 : cinq d6, tous des 5 — cinq succès pour une difficulté 2.
        de.mockImplementation(() => 5);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-attaque-degenesis]')).toBeTruthy();
        expect((screen.getByLabelText('Cible de l’attaque') as HTMLSelectElement).value).toBe(ezra.id);
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
    });
});
