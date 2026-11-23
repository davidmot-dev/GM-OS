// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { armesDeNoc, attaqueDeNoc, attaqueParDefaut, coupAAppliquer } from '../logic/attaqueDeLAdversaire';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { RessourceDeTable } from '../../table/RessourcesDeTable';

/**
 * **« Attaquer » un Rouage de NOC** (registre § 267, T14, 23/11/2026) : le Talent Combat contre le niveau requis
 * (p. 250-251) ; les 1 d'un Rouage hostile retirent du Fiel, et s'il est vide un Héros gagne de la Singularité
 * (p. 231) ; les dégâts de l'arme (table p. 250) moins la Constitution et l'Armure de la cible (p. 252). Le jet
 * du pilote 2.0.0 (export du 21/11).
 */
const FIEL: RessourceDeTable = { id: 'Fiel', label: 'Fiel', proprietaire: 'meneur', depart: 0, min: 0, max: 5, manipulableParLesJoueurs: true, visibleAuxJoueurs: true };
const PILOTE = {
    id: 'noc', templateId: 'tpl', ressourcesDeTable: [FIEL],
    dice: { defaultDice: '1d10', logic: 'count-success', engine: 'pool_explode', successThreshold: 8 },
    jet: {
        sens: 'superieur-ou-egal',
        seuil: [{ id: 'talent', label: 'Talent', sectionId: 'talents' }],
        reserve: { base: 0, max: 6, faces: 10, composantes: [{ id: 'domaine', label: 'Domaine', sectionId: 'domaines' }] },
        difficulte: { min: -1, max: 10, defaut: 0 },
        destin: { fiel: 'Fiel', singularite: 'singularite' },
    },
    combat: { defaultHealthType: 'boxes', damageTypes: ['Choc', 'Perforant', 'Tranchant', 'Multiple'], statsToTrack: [] },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'tpl', name: 'NOC', sections: [
        { id: 'talents', label: 'Talents', fields: [nombre('combat', 'Combat'), nombre('constitution', 'Constitution')] },
        { id: 'domaines', label: 'Domaines', fields: [nombre('action', 'Action')] },
    ],
} as unknown as SheetTemplate;
const GARDE_NOIR = { combat: 2, action: 2, constitution: 1, armes: 'Couteau, puis un revolver' };
const HEROS = { constitution: 1, armure: 0, blessures: 0 };

const session = useSessionOSStore.getState();
let applyDamage: ReturnType<typeof vi.fn>;
beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({ campaigns: [{ id: 'c', name: 'NOC', system: 'noc', activeLocationIds: [] }], customGameDrivers: [] } as never);
    useRessourcesDeTableStore.setState({ reserves: { c: { Fiel: 2 } } } as never);
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Héros', init: 3, isPlayer: false, faction: 'player', statuses: [], sheetData: { ...HEROS } } as never);
    useCombatStore.getState().addCombatant({ name: 'Garde noir', init: 2, isPlayer: false, faction: 'enemy', statuses: [], sheetData: GARDE_NOIR } as never);
    applyDamage = vi.fn();
    useCombatStore.setState({ applyDamage } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useSessionOSStore.setState(session, true); });
const tirage = (...faces: number[]) => vi.spyOn(DiceEngine, 'rollFromConfig').mockReturnValue({
    total: 0, rolls: faces.map(val => ({ val, sides: 10 })), modifier: 0, successes: 0, fails: 0, tagSuccess: false, totalDisplay: '',
} as never);
const fiel = () => useRessourcesDeTableStore.getState().reserves.c?.Fiel ?? 0;
const ouvrir = (faction: 'enemy' | 'ally' = 'enemy') => {
    const [heros, garde] = useCombatStore.getState().combatants;
    render(<JetDuCombattant combattant={{ ...garde, faction, targetId: heros.id } as Combatant} driver={PILOTE} gabarit={FICHE} valeurs={GARDE_NOIR}
        cible={heros} auPremierPlan campaignId="c" attaqueProposee={attaqueParDefaut(PILOTE, [], GARDE_NOIR)} />);
    return heros;
};

describe('NOC : les armes de la table, la Constitution, la Précision (T14)', () => {
    it('la table ; l’arme nommée la première ; Combat + Action, niveau requis 1 au contact, 0 au tir (p. 250)', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'NOC', geste: 'attaquer', degats: 'arme-moins-constitution' });
        expect(armesDeNoc(GARDE_NOIR).map(a => [a.libelle, a.degats, a.categorie])).toEqual([
            ['Couteau (Constitution 1 + 2)', 3, 'Tranchant'], ['Revolver', 3, 'Perforant'],
        ]);
        // « Revolver gros calibre » n'est pas aussi un « Revolver » ; « parc » ne contient pas d'arc ; sans arme, les mains nues.
        expect(armesDeNoc({ armes: 'Revolver gros calibre au parc' }).map(a => a.libelle)).toEqual(['Revolver gros calibre']);
        expect(armesDeNoc({ constitution: 2 })).toMatchObject([{ libelle: 'Mains nues (Constitution 2 + 1)', degats: 3 }]);
        expect(attaqueDeNoc(GARDE_NOIR)).toEqual({ champs: { talent: 'combat', domaine: 'action' }, difficulte: 1 });
        expect(attaqueDeNoc({ combat: 1, armes: 'Revolver' })?.difficulte).toBe(0);
        expect(attaqueDeNoc({})).toBeNull();
    });

    it('arme − Constitution − Armure, + Précision ; Tranchant au moins 1, Perforant 2, sans armure ; Choc ne blesse pas (p. 232, 251-252)', () => {
        const regle = 'arme-moins-constitution' as const;
        const coup = (p: Partial<Parameters<typeof coupAAppliquer>[0]>) => coupAAppliquer({ resultat: { total: 0 }, regle, touche: true, ...p });
        expect(coup({ degatsDeLArme: 4, constitution: 1, armure: 1, precision: 2 }).montant).toBe(4);
        expect(coup({ degatsDeLArme: 3, constitution: -1 }).montant).toBe(4);
        expect(coup({ degatsDeLArme: 3, constitution: 4, trait: 'Tranchant' }).montant).toBe(1);
        expect(coup({ degatsDeLArme: 3, constitution: 4, trait: 'Perforant' }).montant).toBe(2);
        expect(coup({ degatsDeLArme: 3, constitution: 4, armure: 1, trait: 'Perforant' }).montant).toBe(0);
        expect(coup({ degatsDeLArme: 5, trait: 'Choc' })).toMatchObject({ montant: 0, raison: 'rate' });
        expect(coup({ degatsDeLArme: 5, touche: false })).toMatchObject({ montant: 0, raison: 'rate' });
    });
});

describe('« Attaquer » un Rouage de NOC (T14)', () => {
    it('un Rouage hostile : son 1 retire une goutte (2 → 1) ; le couteau, 3 − Constitution 1 = 2 Blessures', () => {
        tirage(8, 1);
        const heros = ouvrir();
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(fiel()).toBe(1);
        expect(screen.getByText(/Rouage hostile : Fiel −1/)).toBeTruthy();
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toContain('arme 3 − Constitution 1 − Armure 0 = 2');
        fireEvent.click(screen.getByText(/^Appliquer 2 à Héros/));
        expect(applyDamage).toHaveBeenCalledWith(2, 'Tranchant', [heros.id]);
    });

    it('le Fiel vide : un Héros désigné par la Loi gagne la Singularité ; un Rouage allié, lui, verse sa goutte', () => {
        useRessourcesDeTableStore.setState({ reserves: { c: { Fiel: 0 } } } as never);
        tirage(8, 1);
        ouvrir();
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(fiel()).toBe(0);
        expect(screen.getByText(/Fiel vide : un Héros désigné par la Loi gagne 1 point de Singularité/)).toBeTruthy();
        cleanup();
        ouvrir('ally');
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(fiel()).toBe(1);
    });
});
