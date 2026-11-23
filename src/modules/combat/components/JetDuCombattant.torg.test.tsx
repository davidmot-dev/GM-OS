// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { attaqueDeTorg, attaqueParDefaut, coupAAppliquer, desBonusDeTorg, lancerLesDesBonus, ndDeTorg } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Torg Eternity** (registre § 267, T12, 23/11/2026) : Dextérité + la compétence
 * de l'arme (p. 79) contre la défense de la cible pour ND (p. 115) ; les dommages, l'arme plus les Dés Bonus
 * d'un succès Supérieur ou Spectaculaire (p. 115-116), comparés à la Résistance par `applyDamage`. Le jet du
 * pilote 2.0.0 (export du 21/11).
 */
const PILOTE = {
    id: 'torg', name: 'Torg Eternity', templateId: 'tpl',
    dice: { defaultDice: '1d20', logic: 'sum', engine: 'standard' },
    jet: {
        sens: 'superieur-ou-egal', tableDeBonus: 'torg',
        seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }, { id: 'competence', label: 'Compétence', sectionId: 'competences', facultative: true }],
        reserve: { base: 1, max: 1, faces: 20 }, difficulte: { min: 0, max: 30, defaut: 10 },
        torg: { blessures: 'blessures', possibilites: 'possibilites', choc: 'choc' },
    },
    combat: {
        defaultHealthType: 'boxes', statsToTrack: [{ fieldId: 'choc', label: 'Choc', isMainHP: false, isResource: true, max: 'esprit' }],
        casesDeSante: { libelle: 'Blessures', nombre: 4, champ: 'blessures', seuils: [] },
        dommages: { mecanique: 'torg', resistance: 'resistance', choc: 'choc' },
    },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl', name: 'Torg', sections: [
        { id: 'attributs', label: 'Attributs', fields: [nombre('dexterite', 'Dextérité'), nombre('force', 'Force')] },
        { id: 'competences', label: 'Compétences', fields: [nombre('armes_feu', 'Armes à feu'), nombre('armes_melee', 'Armes de mêlée'), nombre('combat_mains_nues', 'Combat à mains nues')] },
    ],
} as unknown as SheetTemplate;
const GARDE = { dexterite: 8, force: 8, armes_feu: 3, armes: 'Pistolet 9mm, dommages 13' };
const HEROS = { esquive_def: 11, melee_def: 10, mains_nues_def: 9, resistance: 10, esprit: 9, choc: 0, blessures: 0 };

const session = useSessionOSStore.getState();
let de: ReturnType<typeof vi.spyOn>;
/** Les dés rendent ces faces, dans l'ordre : le d20, puis les Dés Bonus. */
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 11);
beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c', customGameDrivers: [PILOTE],
        campaigns: [{ id: 'c', name: 'Possibilités', system: 'torg', activeLocationIds: [] }],
    } as never);
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Héros', init: 9, isPlayer: false, faction: 'player', statuses: [], sheetData: { ...HEROS } } as never);
    useCombatStore.getState().addCombatant({ name: 'Garde', init: 8, isPlayer: false, faction: 'enemy', statuses: [], sheetData: GARDE } as never);
    de = vi.spyOn(DiceEngine, 'roll');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useSessionOSStore.setState(session, true); });
const plateau = () => {
    const [heros, garde] = useCombatStore.getState().combatants;
    return { heros: heros as Combatant, garde: { ...garde, targetId: heros.id } as Combatant };
};
const herosApres = () => useCombatStore.getState().combatants.find(c => c.name === 'Héros')!;
const ouvrir = () => {
    const { heros, garde } = plateau();
    render(<JetDuCombattant combattant={garde} driver={PILOTE} gabarit={FICHE} valeurs={GARDE} cible={heros} auPremierPlan
        attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE)} />);
};

describe('Torg : la compétence, le ND et les Dés Bonus (T12)', () => {
    it('la table ; le pistolet : Dextérité + Armes à feu, contre l’Esquive ; une épée contre Armes de mêlée ; à mains nues, la Force', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Torg Eternity', geste: 'attaquer', degats: 'arme-plus-des-bonus' });
        expect(attaqueDeTorg(GARDE)).toEqual({ champs: { attribut: 'dexterite', competence: 'armes_feu' }, aDistance: true, degats: 13 });
        expect(ndDeTorg({ aDistance: true }, HEROS)).toEqual({ nd: 11, libelle: 'Esquive' });
        // Au contact, le ND suit l'arme du défenseur : Armes de mêlée s'il en tient une, sinon Combat à mains nues.
        expect(ndDeTorg({ aDistance: false }, { ...HEROS, armes: 'Épée' })?.nd).toBe(10);
        expect(ndDeTorg({ aDistance: false }, HEROS)?.nd).toBe(9);
        // Le loup blanc du livre : « Morsure/griffes : Force +2 (10) » (p. 88) ; sans la compétence, l'attribut seul.
        expect(attaqueDeTorg({ force: 8, armes: 'Épée, Force +3' })).toMatchObject({ champs: { attribut: 'dexterite' }, aDistance: false, degats: 11 });
        expect(attaqueDeTorg({ force: 8, armes: 'Griffes : Force +2 (10)' }).degats).toBe(10);
        expect(attaqueDeTorg({ force: 7, combat_mains_nues: 2 })).toEqual({ champs: { attribut: 'dexterite', competence: 'combat_mains_nues' }, aDistance: false, degats: 7 });
    });

    it('les Dés Bonus : Supérieur 1, Spectaculaire 2 ; un 6 vaut 5 et se relance (p. 115)', () => {
        expect([undefined, 'reussite-normale', 'reussite-significative', 'reussite-particuliere'].map(desBonusDeTorg)).toEqual([0, 0, 1, 2]);
        const d6 = [6, 6, 3];
        expect(lancerLesDesBonus(1, () => d6.shift()!)).toEqual({ total: 13, detail: '5+5+3' });
        const regle = 'arme-plus-des-bonus' as const;
        expect(coupAAppliquer({ resultat: { total: 0 }, regle, touche: false, degatsDeLArme: 13 })).toMatchObject({ montant: 0, raison: 'rate' });
        expect(coupAAppliquer({ resultat: { total: 0 }, regle, touche: true, degatsDeLArme: 13, desBonus: 1 })).toMatchObject({ montant: null, raison: 'des-bonus-a-lancer' });
        expect(coupAAppliquer({ resultat: { total: 0 }, regle, touche: true, degatsDeLArme: 13, desBonus: 1, bonusLance: 4, protection: 3 })).toMatchObject({ montant: 17 });
    });
});

describe('« Attaquer » un adversaire de Torg (T12)', () => {
    it('ND 11, l’Esquive du Héros ; dé 17 (+4) : 15, Succès Simple ; 13 dommages contre Résistance 10 : 2 Choc', () => {
        ouvrir();
        expect(document.querySelector('[data-nd-de-torg]')!.textContent).toContain('Esquive de Héros, 11');
        faces(17);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.queryByLabelText('Protection retirée')).toBeNull();
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toContain('arme 13 = 13 dommages');
        fireEvent.click(screen.getByText(/^Appliquer 13 à Héros/));
        expect(herosApres().sheetData).toMatchObject({ choc: 2, blessures: 0 });
    });

    it('dé 20 puis 5 (25, +8) : 19, Succès Supérieur — un Dé Bonus, 6 puis 3 : 13 + 8 = 21, 2 Blessures et 4 Choc', () => {
        ouvrir();
        faces(20, 5, 6, 3);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(screen.getByText(/^Appliquer … à Héros/)).toBeTruthy();
        fireEvent.click(screen.getByText('Lancer 1 Dé Bonus'));
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toContain('arme 13 + 1 Dé Bonus (8) = 21 dommages');
        fireEvent.click(screen.getByText(/^Appliquer 21 à Héros/));
        expect(herosApres().sheetData).toMatchObject({ choc: 4, blessures: 2 });
    });
});
