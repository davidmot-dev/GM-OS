import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';

/**
 * **La barre de santé de Crimes suit le Physique** (24/11/2026, § 1 bis du 23/11).
 *
 * Vue dans la vidéo de Crimes : la carte gardait « PV 5/5 » quand le badge disait « Physique 3 » et
 * que la fiche portait deux blessures. Crimes n'a pas de points de vie : la barre suit le Physique
 * actuel (p. 395-396), en lecture seule, sans console ni « Calculer ».
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: CombatCard } = await import('./CombatCard');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { santeDesAtteintes } = await import('../logic/SanteDuCombattant');
const { calculateurDisponible } = await import('../logic/calculateurDeDegats');

const ATTEINTES = { parPotentiel: { physique: { fatigue: 'fatigue_physique', epuisement: 'epuisement_physique', blessures: 'blessures_physique' } }, incapacite: 'physique' };
const PILOTE = {
    id: 'crimes-test', name: 'Crimes',
    dice: { defaultDice: '5d10', logic: 'count-success', engine: 'standard' },
    jet: { garde: { atteintes: ATTEINTES } },
    combat: { defaultHealthType: 'hp', santeDeDepart: 'physique', statsToTrack: [] },
};
const ouvrirLaTable = () => useSessionOSStore.setState({
    activeCampaignId: 'c-1',
    campaigns: [{ id: 'c-1', name: 'Les Heures rayées', system: 'crimes-test' }],
    customGameDrivers: [PILOTE],
    players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: true, characters: [
        { id: 'p1', name: 'Jet', campaignId: 'c-1', templateId: 't', portraitUrl: '', hp: 5, maxHp: 5,
            sheetData: { physique: 5, fatigue_physique: 0, epuisement_physique: 0, blessures_physique: 2 } },
    ] }],
} as never);

const JET = { id: 'cb-1', name: 'Jet', init: 6, isPlayer: true, faction: 'player', sourcePlayerId: 'p1', statuses: [], hp: 5, hpMax: 5 };

afterEach(() => cleanup());

describe('la santé de Crimes', () => {
    it('la règle : Physique actuel sur sa valeur, hors de combat à 0 sans « mort »', () => {
        expect(santeDesAtteintes(ATTEINTES, { physique: 5, blessures_physique: 2 })).toMatchObject({ data: { current: 3, max: 5 }, state: 'scratched' });
        expect(santeDesAtteintes(ATTEINTES, { physique: 5, fatigue_physique: 3, blessures_physique: 3 })).toMatchObject({ data: { current: -1 }, state: 'critical' });
        expect(santeDesAtteintes(undefined, { physique: 5 })).toBeNull();
        expect(santeDesAtteintes(ATTEINTES, {})).toBeNull();
        expect(calculateurDisponible(PILOTE)).toBe(false);
        expect(calculateurDisponible({ jet: {} })).toBe(true);
    });

    it('la carte : « Physique 3/5 » au lieu de « PV 5/5 », chiffres non saisissables, ni console ni « Calculer »', () => {
        ouvrirLaTable();
        const { container, queryByText, getAllByText } = render(<CombatCard combatant={JET as never} isActive={false} />);
        const [actuel, max] = Array.from(container.querySelectorAll('input[title="Actuel"], input[title="Max"]')) as HTMLInputElement[];
        expect([actuel.value, max.value]).toEqual(['3', '5']);
        expect(actuel.readOnly).toBe(true);
        expect(getAllByText('Physique').length).toBeGreaterThan(0);
        expect(queryByText('PV')).toBeNull();
        expect(queryByText('combat.card.calculate')).toBeNull();
        // Un clic sur la barre ne retire rien : la santé du personnage n'a pas bougé.
        fireEvent.click(actuel.closest('[title^="Physique actuel"]')!);
        expect(useSessionOSStore.getState().players[0].characters[0].hp).toBe(5);
    });
});
