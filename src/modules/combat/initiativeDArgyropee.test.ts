import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { useJournalStore } from '../journal/useJournalStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { DiceEngine } from '../dice/DiceEngine';
import { resolveInitiativeFormula } from './logic/CombatRules';
import type { Combatant } from './types';
import type { GameDriver } from '../../types/drivers';

/**
 * **L'initiative d'Argyropée lit le d10 de 0 à 9** (12/11/2026, écart COM-01 de la
 * campagne de recette, registre § 240). Livre 2 p. 44 et 46 : 1d10 + Agilité +
 * Détection, la face 0 valant zéro. Le moteur rend 10 pour cette face : Agilité 2,
 * Détection 2, face « 0 » donnait 14 au lieu de 4.
 */
const ARGYROPEE = {
    id: 'argyropee', name: 'Argyropée', templateId: 'tpl',
    jet: { argyropee: { sante: 'points_de_sante' } },
    combat: { initiativeFormula: '1d10 + agilite + detection', initiativeSort: 'desc', defaultHealthType: 'hp',
        statsToTrack: [{ fieldId: 'points_de_sante', isMainHP: true }] },
} as unknown as GameDriver;
const FICHE: Record<string, number> = { agilite: 2, detection: 2 };
const store = () => useCombatStore.getState();
const session = useSessionOSStore.getState();
const combattant = { name: 'Vanille', init: 0, isPlayer: false, faction: 'enemy', statuses: [] } as unknown as Combatant;

describe('la face lue', () => {
    afterEach(() => vi.restoreAllMocks());
    it('la face 10 se lit 0 ; les autres faces ne changent pas', () => {
        const des = [10, 7];
        vi.spyOn(DiceEngine, 'roll').mockImplementation(() => des.shift() ?? 1);
        const lireLaFace = (face: number, faces: number) => (faces === 10 && face === 10 ? 0 : face);
        const resolver = (stat: string) => FICHE[stat] ?? 0;
        expect(resolveInitiativeFormula({ formula: '1d10 + agilite + detection', combatant: combattant, resolver, lireLaFace })).toBe(4);
        expect(resolveInitiativeFormula({ formula: '1d10 + agilite + detection', combatant: combattant, resolver, lireLaFace })).toBe(11);
    });
    it('sans lecture, le moteur garde sa face — les autres jeux', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(10);
        expect(resolveInitiativeFormula({ formula: '1d10 + agilite + detection', combatant: combattant, resolver: s => FICHE[s] ?? 0 })).toBe(14);
    });
});

describe('le jet d’initiative du plateau', () => {
    beforeEach(() => {
        (window as unknown as { useSessionOSStore: typeof useSessionOSStore }).useSessionOSStore = useSessionOSStore;
        useSessionOSStore.setState({
            activeCampaignId: 'c', customGameDrivers: [ARGYROPEE],
            campaigns: [{ id: 'c', name: 'Les Comptes de la marée', system: 'argyropee', activeLocationIds: [] }],
        } as never);
        store().reset();
        useCombatStore.setState({ combatsGares: {}, dejaConsigne: false, ouvertureConsignee: false });
        useJournalStore.getState().clearJournal();
        store().addCombatant({ name: 'Vanille', init: 0, hp: 4, hpMax: 8, isPlayer: false, faction: 'enemy', statuses: [] });
    });
    afterEach(() => {
        vi.restoreAllMocks();
        useSessionOSStore.setState(session, true);
    });

    it('Vanille, Agilité 2, Détection 2, face « 0 » : 4 (COM-01)', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(10);
        store().rollAutoInitiative({ formula: '1d10 + agilite + detection', sortOrder: 'desc', resolver: s => FICHE[s] ?? 0 });
        expect(store().combatants[0].init).toBe(4);
    });
    it('le combattant entre avec la règle « sous zéro, inconscient »', () => {
        expect(store().combatants[0].santeSousZero).toBe(true);
    });
});
