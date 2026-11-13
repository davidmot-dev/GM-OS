import { afterEach, describe, expect, it } from 'vitest';
import { useSessionOSStore } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { HealthInterpreter } from './HealthInterpreter';
import { estHorsDeCombat } from '../../combat/logic/SanteDuCombattant';
import { chutesEntre } from '../../combat/logic/DecesAuJournal';
import { motDeLaSanteSousZero } from './santeSousZero';
import type { GameDriver } from '../../../types/drivers';

const pilote = { id: 'dg', name: 'Delta Green', templateId: 'tpl', jet: { deltaGreen: { sante: 'PV' } }, combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'PV', isMainHP: true, max: '(FOR + CON) / 2' }] } } as GameDriver;
const initial = useSessionOSStore.getState(), combatInitial = useCombatStore.getState();
afterEach(() => { useSessionOSStore.setState(initial, true); useCombatStore.setState(combatInitial, true); });
const monter = () => useSessionOSStore.setState({ activeCampaignId: 'c', campaigns: [{ id: 'c', system: 'dg', name: 'Test', activeLocationIds: [] }], customGameDrivers: [pilote], players: [{ id: 'j', realName: 'Test', characters: [{ id: 'agent', campaignId: 'c', name: 'Agent', templateId: 'tpl', hp: 10, maxHp: 10, sheetData: { PV: 10, FOR: 10, CON: 10, __deltaGreen: { pertesTraitees: ['a'], violence: 1, impuissance: 0, troubles: 0 } }, healthSystem: HealthInterpreter.createDefault('hp') }] }], entities: [] } as never);
const pj = () => useSessionOSStore.getState().players[0].characters[0];
describe('la santé Delta Green de la fiche jusqu’au plateau', () => {
    it('édition de la fiche : 2 PV inconscient, 1 PV aussi, 0 PV mort ; soin à 3 conscient', () => {
        monter();
        for (const pv of [2, 1]) {
            useSessionOSStore.getState().updateCharacterSheetData('j', 'agent', 'PV', pv);
            expect(pj().hp).toBe(pv);
            expect(pj().healthSystem?.state).toBe('critical');
            expect(motDeLaSanteSousZero(pj().healthSystem)).toBe('Inconscient');
            expect(estHorsDeCombat(pj())).toBe(true);
        }
        useSessionOSStore.getState().updateCharacterSheetData('j', 'agent', 'PV', 0);
        expect(pj().healthSystem?.state).toBe('dead');
        useSessionOSStore.getState().updateCharacterSheetData('j', 'agent', 'PV', 3);
        expect(motDeLaSanteSousZero(pj().healthSystem)).toBeNull();
        expect(estHorsDeCombat(pj())).toBe(false);
    });
    it('un coup de la console suit le même seuil et n’écrit aucun faux décès à 2 PV', () => {
        monter();
        useSessionOSStore.getState().handleApplyImpact('agent', 'pc', { value: 8 });
        expect(pj().hp).toBe(2);
        expect(pj().sheetData?.PV).toBe(2);
        expect(motDeLaSanteSousZero(pj().healthSystem)).toBe('Inconscient');
        const avant = { id: 'comb', name: 'Agent', isPlayer: true, hp: 10, hpMax: 10, statuses: [], healthSystem: { type: 'hp', data: { current: 10, max: 10, inconscienceA: 2 }, state: 'healthy', badges: [] } };
        const apres = { ...avant, hp: 2, healthSystem: pj().healthSystem };
        expect(chutesEntre([avant] as never, [apres] as never)).toEqual([]);
        expect(chutesEntre([apres] as never, [{ ...apres, healthSystem: { ...pj().healthSystem, state: 'dead' } }] as never)).toHaveLength(1);
    });
    it('une fiche HTML ancienne garde les reçus de SAN et les compteurs', () => {
        monter();
        useSessionOSStore.getState().updateCharacter('j', 'agent', { sheetData: { PV: 4, FOR: 10, CON: 10 } });
        expect(pj().sheetData?.__deltaGreen).toMatchObject({ pertesTraitees: ['a'], violence: 1 });
    });
    it('un combattant autonome arrive au plateau à 2 PV, inconscient sans décès', () => {
        monter();
        useCombatStore.setState({ combatants: [], sceneId: 'scene' });
        useCombatStore.getState().addCombatant({ name: 'Garde', isPlayer: false, hp: 2, hpMax: 10, init: 10, statuses: [], sheetData: { PV: 2, FOR: 10, CON: 10 } } as never);
        const c = useCombatStore.getState().combatants[0];
        expect(estHorsDeCombat(c)).toBe(true);
        expect(c.healthSystem?.state).toBe('critical');
        expect(motDeLaSanteSousZero(c.healthSystem)).toBe('Inconscient');
    });
});
