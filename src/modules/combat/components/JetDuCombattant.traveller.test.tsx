// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { DegatsDeTraveller } from './DegatsDeTraveller';
import PanneauDeJet from '../../session/components/fields/PanneauDeJet';
import { AttaqueDAnimalTraveller } from './AttaqueDAnimalTraveller';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { jeuDuCombat, jetDuCombattantPossible } from '../logic/jetDuCombattant';
import { armesDeTraveller } from '../logic/attaqueDeTraveller';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Traveller** — TRV-A2, 27/11/2026 (spécification
 * `2026-11-27-traveller-jets-demandes-et-degats.md`, C6, C7, C8, C9, C11). Même forme de jet que le
 * pilote 2.0.0 ; règles p. 74-76.
 */
const PILOTE = {
    id: 'trav', templateId: 'tpl', name: 'Traveller',
    dice: { defaultDice: '2d6', logic: 'sum', engine: 'standard' },
    jet: {
        sens: 'superieur-ou-egal',
        seuil: [
            { id: 'caracteristique', label: 'Caractéristique', sectionId: 'caracteristiques' },
            { id: 'competence', label: 'Compétence', sectionId: 'competences', facultative: true },
        ],
        reserve: { base: 2, max: 3, faces: 6 },
        traveller: {
            caracteristiques: ['force', 'dexterite'],
            competences: [{ niveau: 'melee_1', domaine: 'Mêlée' }, { niveau: 'combat_arme_1', domaine: 'Combat Arme' }],
            cible: 8,
        },
    },
    combat: { damageTypes: ['Incapacitante'], statsToTrack: [{ fieldId: 'sante_physique', label: 'Physique', isMainHP: true }] },
    catalogue: { colonnes: {}, objets: [
        { id: 'fusil-gauss', famille: 'arme', nom: 'Fusil Gauss', valeurs: { portee: '600', degats: '4D', traits: 'AP 5, Auto 3, Viseur' } },
        { id: 'baton-incapacitant', famille: 'arme', nom: 'Bâton incapacitant', valeurs: { portee: 'Mêlée', degats: '2D', traits: 'Incapacitante' } },
    ] },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 7 });
const texte = (id: string, label: string) => ({ id, label, type: 'text', defaultValue: '' });
const FICHE = {
    id: 'tpl', name: 'Voyageur', sections: [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [nombre('force', 'Force'), nombre('dexterite', 'Dextérité')] },
        { id: 'competences', label: 'Compétences', fields: [texte('melee_1', 'Mêlée'), texte('combat_arme_1', 'Combat Arme')] },
    ],
} as unknown as SheetTemplate;
const TIREUR = { force: 7, dexterite: 9, combat_arme_1: '1', arme_1: 'Fusil', arme_1_degats: '3D', arme_1_portee: '500 m', arme_2: 'Fusil Gauss' };
const KATHYA = { endurance: 7, force: 6, dexterite: 10, armure_1: 'Gilet pare-balles', armure_1_protection: '+3', armure_2: 'Tissu', armure_2_protection: '+2' };

let de: ReturnType<typeof vi.spyOn>;
const applique = vi.fn();
beforeEach(() => {
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Kathya', init: 8, hp: 23, hpMax: 23, isPlayer: false, faction: 'player', statuses: [], sheetData: KATHYA } as never);
    useCombatStore.getState().addCombatant({ name: 'Pirate', init: 9, isPlayer: false, faction: 'enemy', statuses: [], sheetData: TIREUR } as never);
    applique.mockReset();
    useCombatStore.setState({ applyDamage: applique } as never);
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); de.mockRestore(); });
const plateau = () => {
    const [kathya, pirate] = useCombatStore.getState().combatants;
    return { kathya: kathya as Combatant, pirate: pirate as Combatant };
};
const suite = (...des: number[]) => { let n = 0; de.mockImplementation(() => des[n++]); };

describe('Traveller dans Combat-OS (T5)', () => {
    it('C6 · la table : Traveller attaque, ses dégâts passent par sa carte ; un PNJ à fiche de Voyageur peut lancer', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Traveller', geste: 'attaquer', degats: 'porte-du-jeu' });
        expect(jetDuCombattantPossible({ isPlayer: false }, PILOTE, FICHE, TIREUR)).toBe(true);
    });
});

describe('« Attaquer » un adversaire de Traveller (T6)', () => {
    it('DEX + Combat Arme proposés ; 6 + 4 + 2 = 12 contre 8, Effet +4 ; le fusil fait 9 : 9 + 4 − 3 = 10, appliqués à Kathya', () => {
        const { kathya, pirate } = plateau();
        render(<JetDuCombattant combattant={pirate} driver={PILOTE} gabarit={FICHE} valeurs={TIREUR} cible={kathya} auPremierPlan />);
        expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('dexterite');
        suite(6, 4);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-degats-traveller]')!.textContent).toContain('Effet +4');
        // La meilleure armure de Kathya (C8), modifiable.
        expect((screen.getByLabelText('Protection de la cible') as HTMLInputElement).value).toBe('3');
        suite(3, 3, 3);
        fireEvent.click(screen.getByText('Lancer 3D'));
        expect(document.querySelector('[data-calcul-traveller]')!.textContent).toBe('9 + 4 (Effet) − 3 (armure) = 10');
        fireEvent.click(screen.getByText(/^Appliquer 10 à Kathya/));
        expect(applique).toHaveBeenCalledWith(10, 'Dégâts', [kathya.id]);
        expect(document.querySelector('[data-coup-applique]')).toBeTruthy();
    });

    it('un échec (1 + 1 + 2 = 4) : pas de dégâts', () => {
        const { kathya, pirate } = plateau();
        render(<JetDuCombattant combattant={pirate} driver={PILOTE} gabarit={FICHE} valeurs={TIREUR} cible={kathya} auPremierPlan />);
        suite(1, 1);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-degats-traveller][data-coup-nul]')).toBeTruthy();
    });
});

describe('la carte des dégâts (T6) — traits, rafale, mêlée', () => {
    it('C11 · le Fusil Gauss : AP 5 perce l’armure, la rafale ajoute 3, le reste est rappelé', () => {
        const { kathya } = plateau();
        const armes = armesDeTraveller(TIREUR, PILOTE.catalogue).filter(a => a.libelle === 'Fusil Gauss');
        render(<DegatsDeTraveller armes={armes} effet={0} reussie cibleId={kathya.id} />);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Rafale' }));
        expect(document.querySelector('[data-traits-rappeles]')!.textContent).toContain('Viseur');
        suite(2, 2, 2, 2);
        fireEvent.click(screen.getByText('Lancer 4D'));
        // 8 + 3 (rafale), armure 3 − AP 5 → 0.
        expect(document.querySelector('[data-calcul-traveller]')!.textContent).toBe('8 + 3 (rafale) = 11 — rafale : 3 munitions consommées');
    });

    it('C7 · le Bâton incapacitant, en mêlée, ajoute la FOR et passe « Incapacitante » à la porte', () => {
        const { kathya } = plateau();
        const armes = armesDeTraveller({ arme_1: 'Bâton incapacitant' }, PILOTE.catalogue);
        render(<DegatsDeTraveller armes={armes} effet={1} reussie cibleId={kathya.id} mdDeForce={1} />);
        suite(4, 4);
        fireEvent.click(screen.getByText('Lancer 2D'));
        expect(document.querySelector('[data-calcul-traveller]')!.textContent).toBe('8 + 1 (Effet) + 1 (FOR) − 3 (armure) = 7');
        fireEvent.click(screen.getByText(/^Appliquer 7 à Kathya/));
        expect(applique).toHaveBeenCalledWith(7, 'Incapacitante', [kathya.id]);
    });

    it('C9 · sans cible donnée (le test d’un Voyageur chez le meneur), la cible se choisit parmi les combattants', () => {
        const { kathya, pirate } = plateau();
        render(<DegatsDeTraveller armes={armesDeTraveller(TIREUR)} effet={2} reussie attaquantId={kathya.id} />);
        const cible = screen.getByLabelText('Cible des dégâts') as HTMLSelectElement;
        expect([...cible.options].map(o => o.textContent)).toEqual(['— choisir —', 'Pirate']);
        fireEvent.change(cible, { target: { value: pirate.id } });
        suite(1, 1, 1);
        fireEvent.click(screen.getByText('Lancer 3D'));
        fireEvent.click(screen.getByText(/^Appliquer 5 à Pirate/));
        expect(applique).toHaveBeenCalledWith(5, 'Dégâts', [pirate.id]);
    });
});

/**
 * **C9 — le test d'attaque d'un Voyageur, chez le meneur** (T7) : la carte des dégâts sous le
 * résultat, cible à choisir ; jamais sous un test hors combat, jamais sur la tablette.
 */
describe('le test d’attaque d’un Voyageur chez le meneur (T7)', () => {
    const FICHE_PJ = {
        ...FICHE, sections: [FICHE.sections[0], { ...FICHE.sections[1], fields: [...FICHE.sections[1].fields, texte('furtivite', 'Furtivité')] }],
    } as unknown as SheetTemplate;
    const JET = { ...PILOTE.jet!, traveller: { ...PILOTE.jet!.traveller!, competences: [...PILOTE.jet!.traveller!.competences, { niveau: 'furtivite', domaine: 'Furtivité' }] } };
    const KATHYA_PJ = { force: 6, dexterite: 10, combat_arme_1: '0', furtivite: '1', arme_1: 'Pistolet', arme_1_degats: '3D-3' };
    const ouvrir = (competence: string, pourLesJoueurs = false) => render(
        <PanneauDeJet descripteur={JET} dice={PILOTE.dice} template={FICHE_PJ} valeurs={KATHYA_PJ} personnageId="kathya"
            pourLesJoueurs={pourLesJoueurs} compositionInitiale={{ champs: { caracteristique: 'dexterite', competence } }} />);

    it('un test de Combat Arme réussi propose les dégâts, la cible parmi les combattants', () => {
        ouvrir('combat_arme_1');
        suite(5, 5);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-degats-traveller]')).toBeTruthy();
        expect([...(screen.getByLabelText('Cible des dégâts') as HTMLSelectElement).options].map(o => o.textContent))
            .toEqual(['— choisir —', 'Kathya', 'Pirate']);
    });

    it('rien sous un test de Furtivité, ni sur la tablette', () => {
        ouvrir('furtivite');
        suite(5, 5);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-degats-traveller]')).toBeNull();
        cleanup();
        ouvrir('combat_arme_1', true);
        suite(5, 5);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-degats-traveller]')).toBeNull();
    });
});

describe('l’attaque d’un animal (T8, C10)', () => {
    it('Carthus, Mêlée (naturelles) 3 : 4 + 3 + 3 = 10 contre 8, Effet +2 ; Morsure 4D sans FOR, moins l’armure de Kathya', () => {
        const { kathya } = plateau();
        const carthus = { id: 'c1', name: 'Carthus', isPlayer: false } as Combatant;
        render(<AttaqueDAnimalTraveller combattant={carthus} cible={kathya}
            animal={{ mdDeMelee: 3, attaques: [{ index: 0, libelle: 'Morsure', texteDesDegats: '4D', degats: { des: 4, bonus: 0, destructrice: false }, melee: false, traits: { ap: 0, auto: 0, incapacitante: false, autres: [] } }] }} />);
        suite(4, 3);
        fireEvent.click(screen.getByText('Lancer 2D + 3'));
        expect(document.querySelector('[data-resultat-attaque-animal]')!.textContent).toContain('Effet +2');
        suite(2, 2, 2, 2);
        fireEvent.click(screen.getByText('Lancer 4D'));
        expect(document.querySelector('[data-calcul-traveller]')!.textContent).toBe('8 + 2 (Effet) − 3 (armure) = 7');
        fireEvent.click(screen.getByText(/^Appliquer 7 à Kathya/));
        expect(applique).toHaveBeenCalledWith(7, 'Dégâts', [kathya.id]);
    });
});
