// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { attaqueDeCrimes, attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Crimes** (registre § 267, T13, 23/11/2026) : Physique GARDE Combat, puis
 * l'attaque du panneau (C6) déjà réglée sur la cible de la carte et l'arme de l'équipement — succès
 * excédentaires + arme − Physique de la cible − protection, au moins 1 (p. 393), et « Infliger ». Le jet du
 * pilote 1.0.0 (export du 21/11).
 */
const ATTEINTES = {
    parPotentiel: {
        physique: { fatigue: 'fatigue_physique', epuisement: 'epuisement_physique', blessures: 'blessures_physique' },
        mental: { fatigue: 'fatigue_mental', epuisement: 'epuisement_mental', blessures: 'blessures_mental' },
        social: { fatigue: 'fatigue_social', epuisement: 'epuisement_social', blessures: 'blessures_social' },
    },
    incapacite: 'physique',
};
const PILOTE = {
    id: 'crimes', templateId: 'tpl',
    dice: { defaultDice: '1d10', logic: 'count-success', engine: 'standard' },
    jet: {
        reserve: { base: 0, max: 10, faces: 10, composantes: [{ id: 'potentiel', label: 'Potentiel', sectionId: 'potentiels' }] },
        sens: 'superieur-ou-egal',
        garde: { competence: { id: 'competence', label: 'Compétence', sectionId: 'competences' }, seuil: 9, competent: 1, specialise: 2, atteintes: ATTEINTES, armes: 'crimes' },
    },
    combat: { defaultHealthType: 'hp', santeDeDepart: 'physique', damageTypes: ['épuisement', 'blessure'], statsToTrack: [] },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl', name: 'Crimes', sections: [
        { id: 'potentiels', label: 'Potentiels', fields: [nombre('physique', 'Physique'), nombre('mental', 'Mental'), nombre('social', 'Social')] },
        { id: 'competences', label: 'Compétences', fields: [nombre('combat', 'Combat'), nombre('sport', 'Sport')] },
    ],
} as unknown as SheetTemplate;
const APACHE = { physique: 4, combat: 2, equipement: 'Revolver Galand, six balles ; un rasoir' };
const SURINEUR = { physique: 3, fatigue_physique: 0, epuisement_physique: 0, blessures_physique: 0 };

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    useCombatStore.getState().reset();
    // « Autre » d'abord : sans la cible de la carte, l'attaque viserait le premier combattant venu, ou personne.
    useCombatStore.getState().addCombatant({ name: 'Autre', init: 2, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { physique: 2 } } as never);
    useCombatStore.getState().addCombatant({ name: 'Surineur', init: 5, isPlayer: false, faction: 'player', statuses: [], sheetData: { ...SURINEUR } } as never);
    useCombatStore.getState().addCombatant({ name: 'Apache', init: 6, isPlayer: false, faction: 'enemy', statuses: [], sheetData: APACHE } as never);
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); de.mockRestore(); });
const plateau = () => {
    const [, surineur, apache] = useCombatStore.getState().combatants;
    return { surineur: surineur as Combatant, apache: { ...apache, targetId: surineur.id } as Combatant };
};
const surineurApres = () => useCombatStore.getState().combatants.find(c => c.name === 'Surineur')!;

describe('« Attaquer » un adversaire de Crimes (T13)', () => {
    it('la table, et l’attaque proposée : Physique GARDE Combat ; l’arme que l’équipement nomme en toutes lettres', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Crimes', geste: 'attaquer', degats: 'porte-du-jeu' });
        expect(attaqueDeCrimes(APACHE)).toEqual({ champs: { potentiel: 'physique', competence: 'combat' }, arme: 'galand' });
        // « un revolver » ne nomme aucune arme du livre : rien n'est deviné.
        expect(attaqueDeCrimes({ equipement: 'un revolver' })).toEqual({ champs: { potentiel: 'physique', competence: 'combat' } });
        expect(attaqueParDefaut(PILOTE, [], APACHE)).toEqual({ potentiel: 'physique', competence: 'combat' });
    });

    it('deux succès : 2 + 5 (Galand) − 3 (Physique) − 0 = 4 blessures, infligées au Surineur de la carte, sans « Appliquer à »', () => {
        const { surineur, apache } = plateau();
        render(<JetDuCombattant combattant={apache} driver={PILOTE} gabarit={FICHE} valeurs={APACHE} cible={surineur} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], APACHE)} />);
        expect((document.querySelector('[data-cible]') as HTMLSelectElement).value).toBe(surineur.id);
        // Physique 4 : quatre d10, deux gardés ; tous des 9.
        de.mockImplementation(() => 9);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
        expect(document.querySelector('[data-issue-de-l-attaque]')!.textContent).toContain('Touché : 4 blessures');
        fireEvent.click(screen.getByText('Infliger à Surineur'));
        expect(surineurApres().sheetData).toMatchObject({ blessures_physique: 4 });
    });
});
