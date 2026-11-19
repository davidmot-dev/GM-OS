import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatStore } from './useCombatStore';
import { ecrireLaFicheDuCombattant } from './ficheDesCombattants';
import { majDeLaConsole } from './logic/calculateurDeDegats';
import { santeDeLaFicheDuCombattant } from './logic/SanteDuCombattant';
import { CLE_COMBAT_ALIEN } from '../dice/systemes/combatAlien';
import { useSessionOSStore } from '../session/useSessionOSStore';

/**
 * **La santé d'une créature du livre, une seule** — registre § 263, T20 (19/11/2026). David : le
 * Rôdeur d'Alien affichait « Points de vie 10/10 » au-dessus de « Santé xénomorphe : 6/6 » ; l'Agent
 * du LAPD de Blade Runner, « Points de vie 10/10 » au-dessus de sa Santé 5/5. Une créature autonome
 * tenait trois santés (barre, `hp`, fiche) que cinq écrivains ne déplaçaient pas ensemble.
 *
 * La règle des PJ vaut pour elle : la santé principale de la fiche fait foi.
 */

const BLADE_RUNNER = {
    id: 'br', name: 'Blade Runner',
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true, max: 'santeMax' }] },
    jet: {},
};
const pv = (current: number, max: number) => ({ type: 'hp' as const, data: { current, max }, state: 'healthy' as never, badges: [] });

describe('une créature autonome et sa santé de fiche', () => {
    beforeEach(() => {
        useCombatStore.getState().reset();
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = {
            getState: () => ({
                players: [{ id: 'j1', characters: [{ id: 'pc1', name: 'Rachel', sheetData: { sante: 8, santeMax: 8 } }] }],
                entities: [], getActiveDriver: () => BLADE_RUNNER,
                updateCharacterHP: () => {}, updateEntityHP: () => {}, updateEntity: () => {},
                updateCharacterSheetData: () => {}, updateEntitySheetData: () => {},
            }),
        };
    });
    afterEach(() => { delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore; });

    const poserLAgent = () => {
        // Ce que pose l'onglet « Livre » : la fiche du livre, la santé par défaut (10/10).
        useCombatStore.getState().addCombatant({
            name: 'Agent du LAPD', init: 0, isPlayer: false, faction: 'enemy', statuses: [],
            sheetData: { sante: 5, santeMax: 5, agilite: 'C (D8)' }, healthSystem: pv(10, 10),
            origineDuLivre: { creatureId: 'agent-du-lapd-en-uniforme' },
        } as never);
        return useCombatStore.getState().combatants[0];
    };

    it('naît avec la Santé de sa fiche, plus 10/10', () => {
        const agent = poserLAgent();
        expect([agent.hp, agent.hpMax]).toEqual([5, 5]);
        expect(agent.healthSystem?.data).toMatchObject({ current: 5, max: 5 });
    });

    it('« Calculer » 2 : la barre, les points de vie ET la Santé de la fiche disent 3', () => {
        const id = poserLAgent().id;
        useCombatStore.getState().applyDamage(2, 'physique', [id]);
        const agent = useCombatStore.getState().combatants[0];
        expect([agent.hp, agent.healthSystem?.data.current, agent.sheetData?.sante]).toEqual([3, 3, 3]);
    });

    it('un clic sur la jauge Santé déplace aussi la barre et les points de vie', () => {
        // `ecrireLaFicheDuCombattant` lit le pilote dans le vrai magasin de séance.
        useSessionOSStore.setState({ campaigns: [{ id: 'c1', name: 'Essai', system: 'br' }], activeCampaignId: 'c1', customGameDrivers: [BLADE_RUNNER] } as never);
        const agent = poserLAgent();
        ecrireLaFicheDuCombattant(agent, { sante: 1 });
        const apres = useCombatStore.getState().combatants[0];
        expect([apres.sheetData?.sante, apres.hp, apres.healthSystem?.data.current]).toEqual([1, 1, 1]);
    });

    it('un autre champ de la fiche ne touche pas la santé', () => {
        const agent = poserLAgent();
        ecrireLaFicheDuCombattant(agent, { agilite: 'B (D10)' });
        expect(useCombatStore.getState().combatants[0].hp).toBe(5);
    });

    it('la console écrit aussi la Santé de la fiche, quand la fiche la porte', () => {
        expect(majDeLaConsole(pv(2, 5) as never, { champ: 'sante', sheetData: { sante: 5, agilite: 'C' } }))
            .toEqual({ healthSystem: pv(2, 5), hp: 2, sheetData: { sante: 2, agilite: 'C' } });
        expect(majDeLaConsole(pv(2, 5) as never, { champ: 'sante', sheetData: { agilite: 'C' } }), 'on n’invente pas un champ absent')
            .toEqual({ healthSystem: pv(2, 5), hp: 2 });
    });

    it('un PJ garde ses points de vie : la règle ne vaut que pour un combattant sans fiche de campagne', () => {
        useCombatStore.getState().addCombatant({
            name: 'Rachel', init: 10, hp: 7, hpMax: 8, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: 'pc1', healthSystem: pv(7, 8),
        } as never);
        expect(useCombatStore.getState().combatants[0].hp).toBe(7);
    });

    it('un combattant qui rejoint avec ses points de vie les garde', () => {
        useCombatStore.getState().addCombatant({
            name: 'Agent blessé', init: 0, hp: 2, hpMax: 5, isPlayer: false, faction: 'enemy', statuses: [], sheetData: { sante: 5, santeMax: 5 },
        } as never);
        expect(useCombatStore.getState().combatants[0].hp).toBe(2);
    });
});

describe('le Rôdeur d’Alien', () => {
    it('sa santé de combat prend la Santé de l’espèce (6), pas 10', () => {
        const alien = { combat: { defaultHealthType: 'hp', santeDeDepart: 'force', statsToTrack: [{ fieldId: 'sante', isMainHP: true, max: 'force' }] } };
        const fiche = { sante: 6, [CLE_COMBAT_ALIEN]: { xenomorphe: { maximum: 6, vitesse: 2 } } };
        expect(santeDeLaFicheDuCombattant(alien, fiche, pv(10, 10))).toMatchObject({ hp: 6, hpMax: 6, healthSystem: { data: { current: 6, max: 6 } } });
    });

    it('un jeu en horloges ou en cases n’est pas concerné', () => {
        expect(santeDeLaFicheDuCombattant(BLADE_RUNNER, { sante: 5 }, { type: 'clocks', data: {}, state: 'healthy' })).toBeNull();
        expect(santeDeLaFicheDuCombattant({ combat: { defaultHealthType: 'clocks', statsToTrack: [] } }, { sante: 5 }, undefined)).toBeNull();
    });
});
