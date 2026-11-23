// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { armesDeShadowrun, attaqueDeShadowrun, attaqueParDefaut, coupAAppliquer } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Shadowrun : Anarchy** (registre § 267, T10, 23/11/2026) : la compétence de
 * l'arme + Agilité en opposition (tir p. 66, mêlée p. 67), puis la VD de l'arme + les succès nets, que le
 * moniteur de la cible compare à ses seuils (p. 68 ; exemple p. 72). Le jet du pilote 2.2.0 (export du 21/11).
 */
const MONITEUR = {
    mecanique: 'shadowrun', sante: 'moniteur', legeres: 'blessures_legeres', graves: 'blessures_graves', incapacitantes: 'blessures_incapacitantes',
    capacites: { legeres: 'blessures_legeres_max', graves: 'blessures_graves_max' },
    seuils: { principale: { legere: 'seuil_principale_legere', grave: 'seuil_principale_grave', incapacitante: 'seuil_principale_incapacitante' } },
    force: 'force', volonte: 'volonte',
};
const PILOTE = {
    id: 'sr', name: 'Shadowrun: Anarchy 2.0', templateId: 'tpl',
    dice: { defaultDice: '1d6', logic: 'count-success', engine: 'standard' },
    jet: {
        reserve: { base: 0, max: 16, sansPlafond: true, faces: 6, composantes: [
            { id: 'competence', label: 'Compétence', sectionId: 'competences', motif: '^competence_\\d+$', facultative: true },
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        ] },
        sens: 'superieur-ou-egal', difficulte: { min: 0, max: 12, defaut: 3 },
        shadowrun: { anarchy: 'anarchy', opposition: true },
    },
    combat: { defaultHealthType: 'boxes', damageTypes: ['physique', 'sans armure', 'armure secondaire', 'mental'], statsToTrack: [], moniteurDEtat: MONITEUR },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl', name: 'Shadowrun', sections: [
        { id: 'attributs', label: 'Attributs', fields: [nombre('force', 'Force'), nombre('agilite', 'Agilité')] },
        { id: 'competences', label: 'Compétences', fields: [nombre('competence_1', 'Compétence 1'), nombre('competence_2', 'Compétence 2')] },
    ],
} as unknown as SheetTemplate;
const GANGER = {
    force: 3, agilite: 4, competence_1_nom: 'Combat rapproché (lames)', competence_1: 3, competence_2_nom: 'Armes à distance (pistolets)', competence_2: 5,
    arme_1: 'Ares Predator VI', arme_1_type: 'VD 5', arme_2: 'Couteau', arme_2_type: 'VD 3',
};
// L'ork de l'exemple du livre : Force 4, Armure 2, seuils 6/9/12 (p. 72).
const ORK = { force: 4, seuil_principale_legere: 6, seuil_principale_grave: 9, seuil_principale_incapacitante: 12,
    blessures_legeres: 0, blessures_graves: 0, blessures_incapacitantes: 0, blessures_legeres_max: 2, blessures_graves_max: 1, moniteur: 0 };

const session = useSessionOSStore.getState();
let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [PILOTE],
        campaigns: [{ id: 'c', name: 'Seattle', system: 'sr', activeLocationIds: [] }],
    } as never);
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Ork', init: 8, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { ...ORK } } as never);
    useCombatStore.getState().addCombatant({ name: 'Ganger', init: 10, isPlayer: false, faction: 'enemy', statuses: [], sheetData: GANGER } as never);
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useSessionOSStore.setState(session, true); });
const plateau = () => {
    const [ork, ganger] = useCombatStore.getState().combatants;
    return { ork: ork as Combatant, ganger: { ...ganger, targetId: ork.id } as Combatant };
};
const orkApres = () => useCombatStore.getState().combatants.find(c => c.name === 'Ork')!;

describe('Shadowrun : l’arme, la compétence et la VD (T10)', () => {
    it('la table, les armes de la fiche et l’attaque proposée : le pistolet, Armes à distance + Agilité, en tir', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ geste: 'attaquer', degats: 'vd-plus-nets' });
        expect(armesDeShadowrun(GANGER)).toEqual([
            { libelle: 'Ares Predator VI', degats: 5, melee: false },
            { libelle: 'Couteau', degats: 3, melee: true },
        ]);
        expect(attaqueDeShadowrun(GANGER)).toEqual({ champs: { competence: 'competence_2', attribut: 'agilite' }, epreuve: 'tir' });
        expect(attaqueDeShadowrun({ ...GANGER, arme_1: 'Couteau', arme_1_type: 'VD 3' })?.epreuve).toBe('melee');
        expect(attaqueParDefaut(PILOTE, [], GANGER)).toEqual({ competence: 'competence_2', attribut: 'agilite' });
        expect(attaqueDeShadowrun({ agilite: 3 })).toBeNull();
    });

    it('VD de l’arme + succès nets, sans protection retirée ; un tir qui ne touche pas ne fait rien (p. 66)', () => {
        const regle = 'vd-plus-nets' as const;
        expect(coupAAppliquer({ resultat: { total: 0 }, regle, degatsDeLArme: 5, touche: true, nets: 3, protection: 2 }))
            .toMatchObject({ montant: 8 });
        expect(coupAAppliquer({ resultat: { total: 0 }, regle, degatsDeLArme: 5, touche: false, nets: 0 })).toMatchObject({ montant: 0, raison: 'rate' });
        expect(coupAAppliquer({ resultat: { total: 0 }, regle, touche: true, nets: 2 })).toMatchObject({ montant: null, raison: 'arme-inconnue' });
    });
});

describe('« Attaquer » un adversaire de Shadowrun (T10)', () => {
    it('neuf succès contre trois : VD 5 + 6 = 11, une grave pour l’ork aux seuils 6/9/12 — et non onze cases', () => {
        const { ork, ganger } = plateau();
        render(<JetDuCombattant combattant={ganger} driver={PILOTE} gabarit={FICHE} valeurs={GANGER} cible={ork} auPremierPlan
            attaqueProposee={attaqueParDefaut(PILOTE, [], GANGER)} />);
        expect((screen.getByLabelText('Épreuve Shadowrun') as HTMLSelectElement).value).toBe('tir');
        fireEvent.change(screen.getByLabelText('Dés de risque'), { target: { value: '0' } });
        fireEvent.change(screen.getByLabelText('Succès adverses Shadowrun'), { target: { value: '3' } });
        // Armes à distance 5 + Agilité 4 : neuf dés, tous des 5.
        de.mockImplementation(() => 5);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toContain('VD 5 + 6 succès nets = VD 11');
        expect(screen.queryByLabelText('Protection retirée')).toBeNull();
        fireEvent.click(screen.getByText(/^Appliquer 11 à Ork/));
        expect(orkApres().sheetData).toMatchObject({ blessures_graves: 1, blessures_legeres: 0, moniteur: 3 });
    });
});
