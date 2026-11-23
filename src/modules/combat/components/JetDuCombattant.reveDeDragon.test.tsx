// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { JetDuCombattant } from './JetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { PanneauSanteVoyageur } from '../../session/components/PanneauSanteVoyageur';
import { initialiserSanteVoyageur } from '../../session/logic/santeDuVoyageur';
import { valeursDuJet } from '../../session/logic/jetDuVoyageur.fixtures';
import { armesDOffense, attaqueDuVoyageur, domTotal, protectionDuVoyageur } from '../logic/dommagesDuVoyageur';
import { jeuDuCombat } from '../logic/jetDuCombattant';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » un adversaire de Rêve de Dragon** (registre § 267, T15, 23/11/2026) : la caractéristique dérivée
 * et la compétence de son arme ; le +dom total — arme, +dom personnel, particulière en force, condition
 * (p. 125-129) ; puis le suivi de santé de la cible s'ouvre sur « Encaisser une agression », rempli. Le jet du
 * pilote 2.0.0 (export du 21/11).
 */
const PILOTE = {
    id: 'rdd', templateId: 'rdd-t15',
    dice: { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' },
    jet: {
        sens: 'sous-ou-egal', seuil: [], reserve: { base: 1, max: 1, faces: 100 },
        cible: { mecanique: 'reves-de-dragons',
            caracteristique: { id: 'caracteristique', label: 'Caractéristique', sectionId: 'caracteristiques', sectionsSupplementaires: ['caracteristiques_derivees'] },
            ajustement: [{ id: 'competences_gen', label: 'Compétence', sectionId: 'combat' }] },
    },
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'vie', label: 'Vie', isMainHP: true, max: 'vie_max' }], initiative: { mode: 'phases' } },
} as unknown as GameDriver;
const nombre = (id: string, label: string) => ({ id, label, type: 'number', defaultValue: 0 });
const FICHE = {
    id: 'rdd-t15', name: 'Voyageur', emoji: '', reglesDeFiche: 'rdd-231', sections: [
        { id: 'caracteristiques', label: 'Caractéristiques', fields: [nombre('force', 'Force'), nombre('reve', 'Rêve'), nombre('chance', 'Chance')] },
        { id: 'caracteristiques_derivees', label: 'Dérivées', fields: [nombre('melee', 'Mêlée'), nombre('tir', 'Tir'), nombre('lancer', 'Lancer')] },
        { id: 'combat', label: 'Combat', fields: [nombre('corps_a_corps', 'Corps à corps (-6)'), nombre('dague_melee', 'Dague de mêlée (-6)'),
            nombre('esquive', 'Esquive (-6)'), nombre('dague_jet', 'Dague de jet (-8)'), nombre('bouclier', 'Bouclier (-6)'), nombre('epee_1m', 'Épée 1M (-6)'), nombre('arc', 'Arc (-8)')] },
    ],
} as unknown as SheetTemplate;
// Le Groin du livre : sa dague de mêlée (+1) et son +dom personnel ; corps à corps entre parenthèses.
const GROIN = { ...valeursDuJet, melee: 12, dague_melee: 3, corps_a_corps: 2, arc: 1, plus_dom: 1,
    combat_0_damage: '(+0)', combat_1_damage: '+1', combat_6_damage: '+2' };
const NITOUCHE = { equipment_armor_0_protection: 2 };

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({ customSheetTemplates: [FICHE] } as never);
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Nitouche', init: 3, isPlayer: false, faction: 'player', statuses: [], sheetData: { ...NITOUCHE } } as never);
    useCombatStore.getState().addCombatant({ name: 'Groin', init: 2, isPlayer: false, faction: 'enemy', statuses: [], sheetData: GROIN } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Rêve de Dragon : l’arme, le +dom total et la protection (T15)', () => {
    it('la table, les armes de la fiche avec leur +dom, l’attaque proposée : Mêlée + la compétence de la première arme', () => {
        expect(jeuDuCombat(PILOTE)).toMatchObject({ jeu: 'Rêve de Dragon', geste: 'attaquer', degats: 'porte-du-jeu' });
        expect(armesDOffense(GROIN, FICHE).map(a => [a.cle, a.categorie, a.dom, a.nonMortel])).toEqual([
            ['corps_a_corps', 'melee', 0, true], ['dague_melee', 'melee', 1, false], ['dague_jet', 'lancer', undefined, false],
            ['epee_1m', 'melee', undefined, false], ['arc', 'tir', 2, false],
        ]);
        expect(attaqueDuVoyageur(GROIN, FICHE)).toEqual({ caracteristique: 'melee', competences_gen: 'corps_a_corps' });
        expect(protectionDuVoyageur(NITOUCHE)).toBe(2);
    });

    it('le +dom total : mêlée sans limite et conditions ; tir, l’arme seule ; lancer, au plus le double de l’arme (p. 128-129)', () => {
        // L'exemple du livre : dague +1, particulière en force +5, complète surprise +10 = +16 (p. 128) — ici sans +dom personnel.
        expect(domTotal({ categorie: 'melee', domArme: 1, domPersonnel: 0, enForce: true, condition: 'surprise' }).total).toBe(16);
        expect(domTotal({ categorie: 'melee', domArme: 1, domPersonnel: 2, enForce: false, condition: 'charge' }).total).toBe(5);
        // Une flèche en particulière : +2 + 5 = +7, ni +dom personnel ni condition (p. 126, 128).
        expect(domTotal({ categorie: 'tir', domArme: 2, domPersonnel: 3, enForce: true, condition: 'surprise' }).total).toBe(7);
        expect(domTotal({ categorie: 'lancer', domArme: 1, domPersonnel: 3, enForce: false, condition: 'aucune' }).total).toBe(2);
    });

    it('l’encaissement de la cible s’ouvre rempli : +dom, protection, coups non mortels', () => {
        const donnees = initialiserSanteVoyageur({ ...valeursDuJet, sc: 4 });
        render(<PanneauSanteVoyageur donnees={donnees} appliquer={() => {}} encaissementPropose={{ dommages: 7, protection: 2, nonMortel: true }} />);
        expect((screen.getByLabelText('Bonus aux dommages') as HTMLInputElement).value).toBe('7');
        expect((screen.getByLabelText('Protection') as HTMLInputElement).value).toBe('2');
        expect((screen.getByLabelText('Coups non mortels') as HTMLInputElement).checked).toBe(true);
    });
});

describe('« Attaquer » un adversaire de Rêve de Dragon (T15)', () => {
    it('le panneau du Voyageur rend son résultat : la dague +1 et le +dom personnel +1 donnent +2, et l’encaissement de Nitouche s’ouvre', () => {
        const [nitouche, groin] = useCombatStore.getState().combatants;
        render(<JetDuCombattant combattant={{ ...groin, targetId: nitouche.id } as Combatant} driver={PILOTE} gabarit={FICHE} valeurs={GROIN}
            cible={nitouche} auPremierPlan />);
        // Le suivi de fatigue du Groin est actif : c'est le panneau du Voyageur qui lance.
        expect(screen.getByRole('region', { name: 'Jet du Voyageur' })).toBeTruthy();
        const brut = DiceEngine.rollFromConfig(PILOTE.dice);
        vi.spyOn(DiceEngine, 'rollFromConfig').mockReturnValue({ ...brut, degre: 'reussite-normale', tagSuccess: true, successes: 1 });
        fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
        expect(document.querySelector('[data-appliquer-a-la-cible]')).toBeNull();
        fireEvent.change(screen.getByLabelText('Arme du Voyageur'), { target: { value: 'dague_melee' } });
        expect(document.querySelector('[data-dom-total]')!.textContent).toContain('= +dom +2');
        // Nitouche n'a pas encore repris sa fiche : son suivi le demande d'abord, comme sur sa carte.
        expect(document.querySelector('[data-dommages-du-voyageur]')!.textContent).toMatch(/Reprendre|reprise|Recalculer/i);
    });
});
