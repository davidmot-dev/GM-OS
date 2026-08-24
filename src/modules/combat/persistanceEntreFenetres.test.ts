import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **Le plateau de combat ne s'écrit que depuis la fenêtre MJ.**
 *
 * Le point de vigilance du § 6 de `2026-08-07-fiabilite-cortex-combat.md` :
 * `useCombatStore` est persisté sous `gmos-combat-storage` dans le
 * `localStorage`, et le Player Hub — même origine, même magasin — y écrivait
 * aussi. Il reçoit du combat par `useHubSync` et par
 * `CrossWindowEventService`, tous deux par `setState` ; un `setState` sur un
 * store persisté écrit.
 *
 * Ce fichier vérifie le branchement réel, là où `ecritureReserveeAuMJ.test.ts`
 * ne vérifie que la garde elle-même. *Une garde écrite et non branchée est une
 * garde absente* — la leçon du 22/08 sur les quatre étages de l'Oracle, écrits
 * et inatteignables.
 */

const role = vi.hoisted(() => ({ current: 'gm' as string }));

vi.mock('../../utils/windowRole', () => ({
    getWindowRole: () => role.current,
    isMainWindow: () => role.current === 'gm',
}));

const { useCombatStore } = await import('./useCombatStore');

const CLE = 'gmos-combat-storage';

const unCombattant = (name: string) => ({
    name, init: 10, hp: 10, hpMax: 10, isPlayer: false,
    faction: 'enemy' as const, statuses: [],
});

/** Ce que le magasin contient réellement, une fois le JSON de Zustand déballé. */
const persiste = () => {
    const brut = localStorage.getItem(CLE);
    return brut ? JSON.parse(brut).state : null;
};

beforeEach(() => {
    role.current = 'gm';
    localStorage.clear();
    useCombatStore.setState({ combatants: [], round: 1, currentTurnIdx: 0 });
});

describe('la persistance du plateau entre fenêtres', () => {
    it('la fenêtre MJ persiste ce qu’elle change', () => {
        useCombatStore.getState().addCombatant(unCombattant('Xénomorphe'));

        expect(persiste()?.combatants).toHaveLength(1);
    });

    it('le Player Hub ne persiste rien — c’est lui qui écrasait le plateau', () => {
        useCombatStore.getState().addCombatant(unCombattant('Xénomorphe'));
        const duMJ = localStorage.getItem(CLE);

        // Le hub reçoit la synchronisation : `useHubSync` et
        // `CrossWindowEventService` font tous deux exactement ceci.
        role.current = 'hub';
        useCombatStore.setState(prev => ({ ...prev, combatants: [], round: 9 }));

        expect(localStorage.getItem(CLE)).toBe(duMJ);
        expect(persiste()?.combatants).toHaveLength(1);
        expect(persiste()?.round).toBe(1);
    });

    it('le projecteur non plus', () => {
        useCombatStore.getState().addCombatant(unCombattant('Sentinelle'));
        const duMJ = localStorage.getItem(CLE);

        role.current = 'projector';
        useCombatStore.setState(prev => ({ ...prev, combatants: [] }));

        expect(localStorage.getItem(CLE)).toBe(duMJ);
    });

    /**
     * **Le dégât nommé, reproduit.** Le hub ne reçoit que quatre champs ; il
     * persistait les neuf de `partialize`, donc les cinq autres tels qu'il les
     * avait à son propre démarrage — vides.
     */
    it('un combat garé survit à ce que le hub reçoive de la synchronisation', () => {
        useCombatStore.setState({
            combatsGares: { 'sc-07': { combatants: [unCombattant('Sentinelle')] } } as never,
            sceneId: 'sc-12',
        });
        expect(persiste()?.combatsGares['sc-07']).toBeTruthy();

        role.current = 'hub';
        // Le hub n'a jamais reçu `combatsGares` ni `sceneId` : sa charge les
        // remet à leur valeur de départ.
        useCombatStore.setState(prev => ({
            ...prev, combatsGares: {}, sceneId: null, combatants: [], round: 3,
        }));

        expect(persiste()?.combatsGares['sc-07']).toBeTruthy();
        expect(persiste()?.sceneId).toBe('sc-12');
    });

    it('la lecture reste ouverte au hub — sans quoi il ne pourrait plus s’hydrater', async () => {
        useCombatStore.getState().addCombatant(unCombattant('Xénomorphe'));

        role.current = 'hub';
        useCombatStore.setState({ combatants: [] });
        await useCombatStore.persist.rehydrate();

        expect(useCombatStore.getState().combatants).toHaveLength(1);
    });
});
