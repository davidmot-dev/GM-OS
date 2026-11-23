// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { attaqueDeStarTrek, attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import { lireStarTrek } from '../../dice/systemes/starTrekRegles';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un PNJ de Star Trek** (registre § 267, T5, 23/11/2026) : la tâche d'attaque du livre
 * (Maîtrise + Sécurité, difficulté 2 à distance ; Audace + Sécurité, difficulté 1 au contact, p. 290),
 * puis la blessure portée sur la cible, évitée par le Stress ou encaissée (p. 292). Le jet du pilote
 * 2.0.0 (export du 21/11 : 2d20 sous attribut + fonction, critique sous la fonction).
 */
const PILOTE = {
    id: 'st', templateId: 'tpl',
    dice: { defaultDice: '2d20', logic: 'count-success', engine: '2d20' },
    jet: {
        seuil: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'fonction', label: 'Fonction', sectionId: 'fonctions', sectionsSupplementaires: ['jauges'], motif: '^(commandement|navigation|ingenierie|securite|medecine|science|reputation)$' },
        ],
        reserve: { base: 2, max: 5, faces: 20, cout: [1, 2, 3], ressource: 'impulsion' },
        sens: 'sous-ou-egal', critique: 1, complication: 20, difficulte: { min: 0, max: 5, defaut: 1 },
        specialisation: { label: 'Spécialisation', composante: 'fonction' },
        starTrek: {
            attributs: ['maitrise', 'forme', 'presence', 'audace', 'intuition', 'raison'],
            fonctions: ['commandement', 'navigation', 'ingenierie', 'securite', 'medecine', 'science'],
            forme: 'forme', stress: { courant: 'stress', maximum: 'stress_max' }, protection: 'resistance',
            determination: 'determination', reputation: 'reputation',
        },
    },
    ressourcesDeTable: [
        { id: 'impulsion', label: 'Impulsion', depart: 0, min: 0, max: 6, proprietaire: 'joueurs', reportSurEpuisement: 'menace', paiementAuChoix: true },
        { id: 'menace', label: 'Menace', depart: 2, min: 0, proprietaire: 'meneur' },
    ],
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl', name: 'Star Trek', sections: [
        { id: 'attributs', label: 'Attributs', fields: [nombre('maitrise', 'Maîtrise'), nombre('audace', 'Audace'), nombre('forme', 'Forme')] },
        { id: 'fonctions', label: 'Fonctions', fields: [nombre('securite', 'Sécurité')] },
        { id: 'jauges', label: 'Jauges', fields: [nombre('stress', 'Stress'), nombre('resistance', 'Résistance')] },
    ],
} as unknown as SheetTemplate;
const GARDE = { maitrise: 10, audace: 9, securite: 3, attaques: 'Disrupteur (Distance, 3, Polyvalente)\nAttaque à mains nues (Mêlée, 1, Étourdissante)' };
const garde = { id: 'g', name: 'Garde romulien', isPlayer: false, faction: 'enemy', statuses: [], init: 0, sheetData: GARDE, targetId: 'kirk' } as unknown as Combatant;
const kirk = () => ({ id: 'kirk', name: 'Kirk', isPlayer: true, faction: 'player', statuses: [], init: 0,
    sheetData: { forme: 9, stress: 4, resistance: 1 } }) as unknown as Combatant;
const kirkDuPlateau = () => useCombatStore.getState().combatants.find(c => c.id === 'kirk')!;

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    useCombatStore.setState({ combatants: [garde, kirk()] });
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); de.mockRestore(); });

describe('« Attaquer » un PNJ de Star Trek (T5)', () => {
    it('la table : Star Trek attaque, sa blessure passe par sa propre porte', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Star Trek', geste: 'attaquer', degats: 'porte-du-jeu' });
    });

    it('l’attaque proposée : le disrupteur l’emporte, à distance, gravité 3 ; une lame seule fait le contact', () => {
        expect(attaqueDeStarTrek(GARDE)).toEqual({ champs: { attribut: 'maitrise', fonction: 'securite' }, nature: 'distance', difficulte: 2, gravite: 3 });
        expect(attaqueDeStarTrek({ attaques: 'Bat’leth (Mêlée, 3, Létale)' })).toEqual({ champs: { attribut: 'audace', fonction: 'securite' }, nature: 'melee', difficulte: 1, gravite: 3 });
        expect(attaqueDeStarTrek({})).toMatchObject({ nature: 'distance', difficulte: 2 });
        expect(attaqueParDefaut(PILOTE, [], GARDE)).toEqual({ attribut: 'maitrise', fonction: 'securite' });
    });

    it('à distance, difficulté 2 ; touché, Kirk évite en prenant 3 Stress (4 → 7 sur 9)', () => {
        render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} cible={kirk()} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE)} />);
        expect((screen.getByRole('radio', { name: 'Attaque à distance' }) as HTMLInputElement).checked).toBe(true);
        // Seuil 10 + 3 = 13, critique sous 1 (sans spécialisation) : deux 3 font deux réussites.
        de.mockImplementation(() => 3);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect((screen.getByLabelText('Gravité de l’arme') as HTMLInputElement).value).toBe('3');
        expect(document.querySelector('[data-blessure-sur-la-cible="kirk"]')).toBeTruthy();
        expect(document.querySelector('[data-appliquer-a-la-cible]'), 'Star Trek n’a pas de points de vie').toBeNull();
        fireEvent.click(screen.getByText('Éviter : +3 Stress'));
        expect(kirkDuPlateau().sheetData?.stress).toBe(7);
        expect(document.querySelector('[data-blessure-portee]')!.textContent).toContain('Stress 4 → 7 / 9');
    });

    it('encaissée : Brûlure 3 − Protection 1 = 2, létale ; Kirk est vaincu', () => {
        render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} cible={kirk()} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE)} />);
        de.mockImplementation(() => 3);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        fireEvent.click(within(document.querySelector('[data-blessure-infligee]') as HTMLElement).getByRole('checkbox', { name: 'Létale' }));
        fireEvent.click(screen.getByText(/^Encaisser :/));
        const suivi = lireStarTrek(kirkDuPlateau().sheetData ?? {});
        expect(suivi.vaincu).toBe(true);
        expect(suivi.blessures).toEqual([expect.objectContaining({ gravite: 2, letale: true })]);
    });

    it('un PNJ dépense la Menace : l’attaque létale coûte 1 Menace au lieu d’en ajouter (p. 265)', () => {
        render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} cible={kirk()} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE)} />);
        de.mockImplementation(() => 3);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        fireEvent.click(within(document.querySelector('[data-blessure-infligee]') as HTMLElement).getByRole('checkbox', { name: 'Létale' }));
        expect(screen.getByText(/−1 Menace \(attaque létale d’un PNJ/)).toBeTruthy();
        expect(screen.queryByText('+1 Menace (escalade)')).toBeNull();
    });

    it('la Menace bouge vraiment : les deux réussites de trop vont à la Menace, l’attaque létale en coûte 1', () => {
        const r = (PILOTE as unknown as { ressourcesDeTable: never }).ressourcesDeTable;
        const table = useRessourcesDeTableStore.getState();
        table.fixer('st-test', r, 'menace', 5);
        table.fixer('st-test', r, 'impulsion', 0);
        render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} cible={kirk()} auPremierPlan campaignId="st-test"
            attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE)} />);
        // Deux 1 : deux critiques, quatre réussites pour une difficulté 2.
        de.mockImplementation(() => 1);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        // Quatre réussites pour une difficulté 2 : deux de trop, en Menace pour un PNJ (p. 265).
        expect(useRessourcesDeTableStore.getState().valeur('st-test', r, 'menace')).toBe(7);
        expect(useRessourcesDeTableStore.getState().valeur('st-test', r, 'impulsion')).toBe(0);
        fireEvent.click(within(document.querySelector('[data-blessure-infligee]') as HTMLElement).getByRole('checkbox', { name: 'Létale' }));
        fireEvent.click(screen.getByText(/−1 Menace \(attaque létale d’un PNJ/));
        expect(useRessourcesDeTableStore.getState().valeur('st-test', r, 'menace')).toBe(6);
    });
});
