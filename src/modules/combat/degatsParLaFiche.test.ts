import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStore, type StoreApi } from 'zustand';
import { useCombatStore } from './useCombatStore';
import { createEntitySlice, type EntitySlice } from '../session/store/entitySlice';
import { majDeLaConsole } from './logic/calculateurDeDegats';
import { useJournalStore } from '../journal/useJournalStore';

/**
 * **« Calculer » et la console tiennent le même compte** — audit T4 du chantier § 263 (19/11/2026),
 * correctifs T21 et T22.
 *
 * L'audit a prouvé deux défauts avec ces essais, avant correction :
 *
 * 1. « Calculer » sur un PJ ne réécrivait que `hp` (`updateCharacterHP`) : le champ de santé de la
 *    fiche, qui fait foi pour Blade Runner, Alien et Cthulhu Hack, restait à 8, et un coup de 1
 *    porté ensuite à la console donnait 7 au lieu de 4. Il sautait aussi les conséquences propres
 *    au jeu (le Stress d'un humain d'Alien), qui ne vivent que dans `handleApplyImpact`.
 * 2. La console d'un adversaire autonome n'écrivait que `healthSystem` : console −2 puis
 *    « Calculer » 3 laissaient la barre à 7 et `hp` à 9.
 */

const pv = (current: number, max: number) => ({ type: 'hp' as const, data: { current, max }, state: 'healthy' as never, badges: [] });

const BLADE_RUNNER = {
    id: 'br', name: 'Blade Runner', dice: { defaultDice: '1d6', logic: 'count-success', engine: 'standard' },
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true, max: 'santeMax' }] },
};
// Les déclarations du pilote Alien 1.11.0 qui comptent ici (export du dépôt).
const ALIEN = {
    id: 'alien', name: 'ALIEN', dice: { defaultDice: '1d6', logic: 'count-success', engine: 'yze' },
    combat: {
        defaultHealthType: 'hp', santeDeDepart: 'force',
        statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true, max: 'force' }, { fieldId: 'niveau_de_stress', label: 'Stress' }],
        alien: { sante: 'sante', force: 'force', stress: 'niveau_de_stress', androide: 'androide' },
    },
    jet: { panique: { faces: 6, champ: 'panique_en_cours', seuil: 7,
        suites: { mecanique: 'alien', stress: 'niveau_de_stress', agilite: 'agilite', empathie: 'empathie', talents: 'talent', androide: 'androide' } } },
};

describe('« Calculer » sur un combattant lié à une fiche passe par la fiche (T21)', () => {
    let seance: StoreApi<EntitySlice>;
    const fiche = () => seance.getState().players[0].characters[0];
    const plateau = () => useCombatStore.getState().combatants[0];

    const ouvrir = (pilote: typeof BLADE_RUNNER | typeof ALIEN, sheetData: Record<string, unknown>, hp: number) => {
        seance = createStore<EntitySlice>()((...a) => createEntitySlice(...a));
        seance.setState({
            campaigns: [{ id: 'c1', name: 'Essai', system: pilote.id }],
            activeCampaignId: 'c1',
            customGameDrivers: [pilote],
            getActiveDriver: () => pilote,
            players: [{ id: 'j1', name: 'J', realName: 'J', isOnline: true, characters: [{
                id: 'pc1', name: 'Rachel', campaignId: 'c1', hp, maxHp: hp, sheetData, healthSystem: pv(hp, hp),
            }] }],
        } as never);
        (window as unknown as { useSessionOSStore: unknown }).useSessionOSStore = seance;
        useCombatStore.getState().addCombatant({
            name: 'Rachel', init: 10, hp, hpMax: hp, isPlayer: true, faction: 'ally', statuses: [],
            sourcePlayerId: 'pc1', healthSystem: pv(hp, hp),
        } as never);
    };

    beforeEach(() => useCombatStore.getState().reset());
    afterEach(() => { delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore; });

    it('Blade Runner : « Calculer » 3 sur une Santé de 8 → 5 sur la fiche, ses PV et le plateau', () => {
        ouvrir(BLADE_RUNNER, { sante: 8, santeMax: 8 }, 8);
        useCombatStore.getState().applyDamage(3, 'physique', [plateau().id]);
        expect(fiche().sheetData?.sante, 'le champ Santé, qui fait foi').toBe(5);
        expect(fiche().hp).toBe(5);
        expect(plateau().hp).toBe(5);
    });

    it('le coup suivant, porté à la console, repart de là : 4, pas 7', () => {
        ouvrir(BLADE_RUNNER, { sante: 8, santeMax: 8 }, 8);
        useCombatStore.getState().applyDamage(3, 'physique', [plateau().id]);
        seance.getState().handleApplyImpact('pc1', 'pc', { value: 1 });
        expect(fiche().sheetData?.sante).toBe(4);
        expect(plateau().hp).toBe(4);
    });

    it('un soin remonte la Santé de la fiche', () => {
        ouvrir(BLADE_RUNNER, { sante: 3, santeMax: 8 }, 8);
        useCombatStore.getState().applyDamage(-2, 'physique', [plateau().id]);
        expect(fiche().sheetData?.sante).toBe(5);
    });

    it('l’état automatique du type de dégâts se pose toujours sur le plateau', () => {
        ouvrir(BLADE_RUNNER, { sante: 8, santeMax: 8 }, 8);
        useCombatStore.getState().applyDamage(2, 'feu', [plateau().id]);
        expect(plateau().statuses.map(s => s.name)).toContain('En feu');
        expect(fiche().sheetData?.sante).toBe(6);
    });

    it('le coup est dit une fois au journal, avec son type, pas deux', () => {
        useJournalStore.getState().clearJournal();
        useJournalStore.getState().addJournal('Séance de test');
        useJournalStore.setState({ isRecording: true });
        ouvrir(BLADE_RUNNER, { sante: 8, santeMax: 8 }, 8);
        useCombatStore.getState().applyDamage(3, 'physique', [plateau().id]);
        const impacts = useJournalStore.getState().journals[0].events.filter(e => e.type === 'COMBAT' && e.content.includes('3'));
        expect(impacts).toHaveLength(1);
        expect(impacts[0].content).toContain('physique');
    });

    it('Alien : un humain frappé par « Calculer » perd sa Santé de fiche et gagne son Stress', () => {
        ouvrir(ALIEN, { sante: 3, force: 3, niveau_de_stress: 0 }, 3);
        useCombatStore.getState().applyDamage(2, 'physique', [plateau().id]);
        expect(fiche().sheetData?.sante).toBe(1);
        expect(fiche().sheetData?.niveau_de_stress, 'Alien p. 103 : +1 Stress sur une perte de Santé').toBe(1);
    });
});

describe('la console d’un adversaire autonome tient `hp` (T22)', () => {
    beforeEach(() => useCombatStore.getState().reset());

    it('console −2 puis « Calculer » 3 sur un Cultiste à 12 → 7 partout', () => {
        useCombatStore.getState().addCombatant({
            name: 'Cultiste', init: 8, hp: 12, hpMax: 12, isPlayer: false, faction: 'enemy', statuses: [], healthSystem: pv(12, 12),
        } as never);
        const id = useCombatStore.getState().combatants[0].id;
        // Ce que fait la carte (`CombatCard.tsx`, `onHealthChange`) quand la console frappe.
        useCombatStore.getState().updateCombatant(id, majDeLaConsole(pv(10, 12) as never));
        useCombatStore.getState().applyDamage(3, 'physique', [id]);
        const c = useCombatStore.getState().combatants[0];
        expect(c.healthSystem?.data.current).toBe(7);
        expect(c.hp).toBe(7);
    });

    it('une santé qui n’est pas en points de vie ne s’invente pas de `hp`', () => {
        const horloge = { type: 'clocks' as const, data: { clocks: [] }, state: 'healthy' as never, badges: [] };
        expect(majDeLaConsole(horloge as never)).toEqual({ healthSystem: horloge });
        expect(majDeLaConsole(pv(4, 10) as never)).toMatchObject({ hp: 4 });
    });
});
