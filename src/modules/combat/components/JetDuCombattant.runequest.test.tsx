// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { attaqueDeRuneQuest, attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de RuneQuest** (registre § 267, T9, 23/11/2026) : le score de sa première
 * arme chiffrée, puis les suites du jet — dégâts, localisation et « Porter le coup » — sur la cible de la
 * carte, et non sur celle du combattant dont c'est le rang. Le jet du pilote 2.3.0 (export du 21/11).
 */
const ARMES = [
    { score: 'arme1', nom: 'arme1_nom', degats: 'arme1_degats', ra: 'arme1_ra', genre: 'melee' },
    { score: 'tir1', nom: 'tir1_nom', degats: 'tir1_degats', ra: 'tir1_ra', genre: 'distance' },
];
const PILOTE = {
    id: 'rq', templateId: 'tpl',
    dice: { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' },
    jet: {
        seuil: [{ id: 'aptitude', label: 'Aptitude', sectionId: 'armes', sectionsSupplementaires: ['caracteristiques'],
            motif: '^(?!.*_(nom|sujet|degats|ra|enc|durabilite|portee|cadence|pv)$)' }],
        reserve: { base: 1, max: 1, faces: 100 }, sens: 'sous-ou-egal',
        runequest: { caracteristiques: ['con'], localisations: { poitrine: 'pv_poitrine' }, armes: ARMES, bonusAuxDegats: 'bonus_degats', con: 'con' },
    },
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'points_de_vie', label: 'Points de vie', isMainHP: true }] },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const texte = (id: string, label: string) => ({ id, label, type: 'text', defaultValue: '' });
const FICHE = {
    id: 'tpl', name: 'RuneQuest', sections: [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [nombre('con', 'CON')] },
        { id: 'armes', label: 'Armes', fields: [nombre('arme1', 'Arme 1'), texte('arme1_nom', 'Nom'), texte('arme1_degats', 'Dégâts'),
            nombre('tir1', 'Tir 1'), texte('tir1_nom', 'Nom'), texte('tir1_degats', 'Dégâts')] },
    ],
} as unknown as SheetTemplate;
const BROO = { con: 12, arme1: 60, arme1_nom: 'Hache', arme1_degats: '1D8+2', bonus_degats: '+1D4' };

/* Le d100 du moteur se lance en deux d10 (dizaines, unités), le D20 en un tirage : tous sur `Math.random`. */
let hasard: ReturnType<typeof vi.spyOn>;
const file: number[] = [];
const d100 = (n: number) => { const v = n % 100; file.push(Math.floor(v / 10) / 10 + 0.001, (v % 10) / 10 + 0.001); };
const d20 = (n: number) => file.push((n - 1) / 20 + 0.001);
beforeEach(() => {
    file.length = 0;
    useCombatStore.getState().reset();
    // « Autre » d'abord, et c'est son rang : sa cible est le Broo. Le coup du Broo, lui, vise Vasana.
    useCombatStore.getState().addCombatant({ name: 'Autre', init: 3, isPlayer: false, faction: 'enemy', statuses: [], sheetData: {} } as never);
    useCombatStore.getState().addCombatant({ name: 'Vasana', init: 8, hp: 12, hpMax: 12, isPlayer: true, faction: 'player', statuses: [], sheetData: { pv_poitrine: 5 } } as never);
    useCombatStore.getState().addCombatant({ name: 'Broo', init: 10, isPlayer: false, faction: 'enemy', statuses: [], sheetData: BROO } as never);
    // Le hasard se fixe après : les identifiants des combattants en sont tirés.
    hasard = vi.spyOn(Math, 'random').mockImplementation(() => file.shift() ?? 0.5);
});
afterEach(() => { cleanup(); hasard.mockRestore(); });
const plateau = () => {
    const [autre, vasana, broo] = useCombatStore.getState().combatants;
    useCombatStore.setState(s => ({
        currentTurnIdx: s.combatants.findIndex(c => c.id === autre.id),
        combatants: s.combatants.map(c => c.id === autre.id ? { ...c, targetId: broo.id } : c.id === broo.id ? { ...c, targetId: vasana.id } : c),
    }));
    return { vasana: vasana as Combatant, broo: useCombatStore.getState().combatants.find(c => c.id === broo.id)! as Combatant };
};

describe('« Attaquer » un adversaire de RuneQuest (T9)', () => {
    it('la table et l’attaque proposée : la première arme chiffrée ; un score vide ou sans arme ne compte pas', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'RuneQuest', geste: 'attaquer', degats: 'porte-du-jeu' });
        expect(attaqueParDefaut(PILOTE, [], BROO)).toEqual({ aptitude: 'arme1' });
        expect(attaqueDeRuneQuest({ armes: ARMES as never }, { arme1: '', arme1_nom: 'Hache', tir1: 45, tir1_nom: 'Arc' })).toEqual({ champs: { aptitude: 'tir1' } });
        expect(attaqueDeRuneQuest({ armes: ARMES as never }, { arme1: 50 })).toBeNull();
    });

    it('30 sur 60 % touche : les dégâts de la hache se préparent, et le coup vise la cible de la carte, sans « Appliquer à »', () => {
        const { vasana, broo } = plateau();
        render(<JetDuCombattant combattant={broo} driver={PILOTE} gabarit={FICHE} valeurs={BROO} cible={vasana} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], BROO)} />);
        d100(30);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
        expect(document.querySelector('[data-formule-runequest]')!.textContent).toContain('1D8');
        d20(12);
        fireEvent.click(screen.getByText('Localiser le coup (1D20)'));
        // Sans la cible de la carte, ce serait le Broo : la cible du combattant dont c'est le rang.
        expect((screen.getByLabelText('Cible du coup') as HTMLSelectElement).value).toBe(vasana.id);
        expect(document.querySelector('[data-pv-cible-runequest]')!.textContent).toBe('Vasana · Poitrine : 5 PV max. sur la fiche');
    });
});
