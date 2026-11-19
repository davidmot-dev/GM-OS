// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { AppliquerALaCible } from './AppliquerALaCible';
import { jetDuCombattantPossible, attaqueSurLaCarte } from '../logic/jetDuCombattant';
import { armesDeLaFicheAlien, attaqueParDefaut, preparerLeCoupAlien } from '../logic/attaqueDeLAdversaire';
import { DiceEngine } from '../../dice/DiceEngine';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien } from '../../dice/systemes/combatAlien';
import { xenoViergeAlien } from '../../dice/systemes/xenomorphesAlien';
import { useCombatStore } from '../useCombatStore';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » pour un humain d'Alien** — registre § 263, T12 (19/11/2026). Un garde de la Weyland-
 * Yutani tire sur Vasquez : Agilité + Combat à distance, son pistolet de la fiche choisi au panneau
 * (`preparerLeTir`), puis le coup se **prépare** sur la carte de Vasquez — sa Protection s'y lance
 * avant les dégâts (`CoupAlien`, `SanteAlien`). Règle du jet reprise du pilote Alien 1.11.0, sans les
 * modules d'actions.
 */
const ARMES = { noms: 'armes_noms', bonus: 'armes_bonus', degats: 'armes_degats', portees: 'armes_portees' };
const COMBAT = { sante: 'sante', force: 'force', endurance: 'endurance', protection: 'protection', talents: 'talent', proprietesArmes: 'armes_proprietes', stress: 'niveau_de_stress', androide: 'androide' };
const PILOTE = {
    id: 'alien', templateId: 'tpl',
    dice: { defaultDice: 'd6', logic: 'count-success', engine: 'yze', successThreshold: 6 },
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true, max: 'force' }], alien: COMBAT },
    jet: {
        sens: 'superieur-ou-egal',
        reserve: { base: 0, max: 10, faces: 6, sansPlafond: true, composantes: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'compétence', label: 'Compétence', sectionId: 'competences' },
        ],
        // Le Stress du pilote : une composante obligatoire à un seul champ — vue à l'écran le 19/11.
        secondaire: { label: 'Stress', libelleDuUn: 'Panique', composantes: [
            { id: 'stress', label: 'Stress', sectionId: 'jauges', motif: '^niveau_de_stress$' },
        ] } },
        alien: { competence: 'compétence', competences: { combat_a_distance: 'distance', combat_rapproche: 'rapproche' }, equipement: ARMES, combat: COMBAT },
        // Le panneau ne compose le jet d'Alien (arme, tir) que si la Panique est déclarée, comme au pilote.
        panique: { faces: 6, champ: 'panique_en_cours', seuil: 7, suites: { mecanique: 'alien', stress: 'niveau_de_stress', agilite: 'agilite', empathie: 'empathie', talents: 'talent', androide: 'androide' } },
    },
} as unknown as GameDriver;
const FICHE = { id: 'tpl', name: 'Alien', sections: [
    { id: 'attributs', label: 'Attributs', fields: ['force', 'agilite'].map(id => ({ id, label: id === 'force' ? 'Force' : 'Agilité', type: 'number', defaultValue: 0 })) },
    { id: 'competences', label: 'Compétences', fields: [
        { id: 'combat_a_distance', label: 'Ag_Combat à distance', type: 'number', defaultValue: 0 },
        { id: 'combat_rapproche', label: 'Fo_Combat rapproché', type: 'number', defaultValue: 0 },
    ] },
    { id: 'jauges', label: 'Jauges', fields: [
        { id: 'niveau_de_stress', label: 'Niveau de Stress', type: 'number', defaultValue: 0 },
        { id: 'sante', label: 'Santé', type: 'number', defaultValue: 0 },
    ] },
] } as unknown as SheetTemplate;
const GARDE = {
    force: 3, agilite: 3, combat_a_distance: 2, combat_rapproche: 1, sante: 3, niveau_de_stress: 0,
    armes_noms: 'Pistolet M4A3\nMatraque électrique', armes_bonus: '+2\n+1', armes_degats: '2\n1', armes_portees: 'Moyenne\nContact', armes_proprietes: '\n',
};
const garde = { id: 'garde', name: 'Garde Weyland-Yutani', isPlayer: false, faction: 'enemy', statuses: [], init: 0, sheetData: GARDE } as unknown as Combatant;

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); useCombatStore.getState().reset(); });
afterEach(() => { cleanup(); de.mockRestore(); });

describe('« Attaquer » pour un humain d’Alien (T12)', () => {
    it('le jet s’ouvre à un humain d’Alien, pas à un xénomorphe (il tire son attaque au D6)', () => {
        expect(jetDuCombattantPossible(garde, PILOTE, FICHE, GARDE)).toBe(true);
        expect(attaqueSurLaCarte(garde, PILOTE, FICHE, GARDE)).toBe(true);
        const xeno = { sante: 6, [CLE_COMBAT_ALIEN]: { ...lireLeCombatAlien({}), xenomorphe: xenoViergeAlien() } };
        expect(jetDuCombattantPossible(garde, PILOTE, FICHE, xeno)).toBe(false);
    });

    it('ses armes viennent de sa fiche ; l’attaque proposée suit l’arme', () => {
        const armes = armesDeLaFicheAlien(PILOTE, GARDE);
        expect(armes).toEqual([
            { id: '0', libelle: 'Pistolet M4A3', degats: 2, categorie: 'Moyenne', armure: 'normale' },
            { id: '1', libelle: 'Matraque électrique', degats: 1, categorie: 'Contact', armure: 'normale' },
        ]);
        expect(attaqueParDefaut(PILOTE, armes, GARDE)).toEqual({ attribut: 'agilite', 'compétence': 'combat_a_distance' });
        expect(attaqueParDefaut(PILOTE, armes.slice(1), GARDE)).toEqual({ attribut: 'force', 'compétence': 'combat_rapproche' });
        expect(attaqueParDefaut(PILOTE, [], { combat_rapproche: 2 })).toEqual({ attribut: 'force', 'compétence': 'combat_rapproche' });
        expect(attaqueParDefaut(PILOTE, [], {})).toBeNull();
    });

    it('le coup se prépare sur la cible, sa Protection lue ; un coup en attente n’est pas écrasé', () => {
        const vierge = lireLeCombatAlien({});
        const prepare = preparerLeCoupAlien(vierge, { id: 'c1', degats: 3, protectionDeLaFiche: 2, type: 'perce-armure' })!;
        expect(prepare.coup).toEqual({ id: 'c1', degats: 3, protection: 2, type: 'perce-armure' });
        expect(preparerLeCoupAlien(prepare, { id: 'c2', degats: 1, protectionDeLaFiche: 0, type: 'normale' })).toBeNull();
        const xeno = { ...vierge, xenomorphe: { ...xenoViergeAlien(), protection: 5 } };
        expect(preparerLeCoupAlien(xeno, { id: 'c3', degats: 2, protectionDeLaFiche: 0, type: 'normale', origine: 'ordinaire' })!.coup)
            .toEqual({ id: 'c3', degats: 2, protection: 5, type: 'normale', origine: 'ordinaire' });
    });

    it('le garde tire : jet prérempli, arme choisie au panneau, coup préparé sur la carte de Vasquez', () => {
        useCombatStore.getState().addCombatant({ name: 'Vasquez', init: 9, hp: 4, hpMax: 4, isPlayer: false, faction: 'player', statuses: [],
            sheetData: { sante: 4, force: 4, protection: '2' } } as never);
        const vasquez = useCombatStore.getState().combatants[0];
        const armes = armesDeLaFicheAlien(PILOTE, GARDE);
        render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} auPremierPlan cible={vasquez}
            armes={armes} attaqueProposee={attaqueParDefaut(PILOTE, armes, GARDE)} />);
        expect(document.querySelector('[data-attaque-par-defaut]')!.textContent).toContain('Agilité + Ag_Combat à distance (Pistolet M4A3)');
        // Agilité 3 + Combat à distance 2 + bonus du pistolet 2 = sept dés : deux six.
        const faces = [6, 6, 3, 2, 4, 5, 1];
        de.mockImplementation(() => faces.shift() ?? 2);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(de).toHaveBeenCalledTimes(7);

        // Pistolet 2 + 2 succès − 1 = 3 ; le coup se prépare, la santé ne bouge pas encore.
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toBe('arme 2 + 2 succès − 1 = 3');
        expect(screen.queryByLabelText('Protection retirée'), 'la Protection se lance sur la carte de la cible').toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Préparer ce coup de 3 sur Vasquez' }));
        const apres = useCombatStore.getState().combatants[0];
        expect(lireLeCombatAlien(apres.sheetData ?? {}).coup).toMatchObject({ degats: 3, protection: 2, type: 'normale' });
        expect(apres.hp).toBe(4);
        expect(document.querySelector('[data-coup-prepare]')!.textContent).toContain('Coup de 3 préparé sur la carte de Vasquez');
    });

    it('une attaque perforante se prépare perce-armure ; un coup déjà en attente est refusé, et dit', () => {
        useCombatStore.getState().addCombatant({ name: 'Vasquez', init: 9, hp: 4, hpMax: 4, isPlayer: false, faction: 'player', statuses: [],
            sheetData: { sante: 4, protection: '1' } } as never);
        const vasquez = useCombatStore.getState().combatants[0];
        const { unmount } = render(<AppliquerALaCible cible={vasquez} resultat={{ total: 2, successes: 2, compte: 'reussites' }} driver={PILOTE}
            armes={[{ libelle: 'Griffes', degats: 1 }]} perforant />);
        fireEvent.click(screen.getByRole('button', { name: 'Préparer ce coup de 2 sur Vasquez' }));
        expect(lireLeCombatAlien(useCombatStore.getState().combatants[0].sheetData ?? {}).coup).toMatchObject({ degats: 2, type: 'perce-armure' });
        unmount();
        render(<AppliquerALaCible cible={vasquez} resultat={{ total: 1, successes: 1, compte: 'reussites' }} driver={PILOTE}
            armes={[{ libelle: 'Griffes', degats: 1 }]} />);
        fireEvent.click(screen.getByRole('button', { name: 'Préparer ce coup de 1 sur Vasquez' }));
        expect(document.querySelector('[data-refus-du-coup]')!.textContent).toContain('Un coup attend déjà sur la carte de Vasquez');
    });
});
