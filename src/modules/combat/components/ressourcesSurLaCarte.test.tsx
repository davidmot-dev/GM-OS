import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Les ressources de Cthulhu Hack sur la carte de combat** (2026-09-30).
 *
 * Le pilote de David affiche Torche, Bagou… en jauges. Leur champ vaut « D8 » :
 * la jauge lisait NaN, et **un clic écrivait NaN dans la fiche** — le dé du
 * personnage perdu. Une ressource à dé d'usure s'y affiche désormais comme un
 * dé, qui se lance.
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
const { DiceEngine } = await import('../../dice/DiceEngine');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useDiceStore } = await import('../../../stores/useDiceStore');

const ouvrirLaTable = (torche: string) => useSessionOSStore.setState({
    activeCampaignId: 'c-1',
    campaigns: [{ id: 'c-1', name: 'Le Secret de Milo', system: 'ch-test' }],
    customGameDrivers: [{
        id: 'ch-test', name: 'Cthulhu Hack',
        dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
        combat: { statsToTrack: [{ fieldId: 'torche', label: 'Torche', isMainHP: false, isResource: true }] },
        ui_config: { gauges: [{ fieldId: 'torche', label: 'Torche', color: 'bg-yellow-500', style: 'segmented' }] },
    }],
    players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: true, characters: [
        { id: 'p1', name: 'Dan', campaignId: 'c-1', templateId: 't', portraitUrl: '', sheetData: { torche } },
    ] }],
} as never);

const DAN = {
    id: 'cb-1', name: 'Dan', init: 12, isPlayer: true, faction: 'player', sourcePlayerId: 'p1',
    statuses: [], hp: 10, hpMax: 12,
};

const ficheDeDan = () => (useSessionOSStore.getState() as never as { players: { characters: { sheetData: Record<string, unknown> }[] }[] })
    .players[0].characters[0].sheetData;

beforeEach(() => useDiceStore.getState().clearHistory());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('une ressource à dé d’usure sur la carte de combat', () => {
    it('s’affiche comme un dé, et se lance : la fiche garde le dé qui descend', () => {
        ouvrirLaTable('D8');
        render(<CombatCard combatant={DAN as never} isActive={false} />);
        vi.spyOn(DiceEngine, 'roll').mockImplementation(() => 1);

        fireEvent.click(screen.getByTitle(/Lancer Torche \(d8\)/));

        expect(ficheDeDan().torche).toBe('d6');
        expect(useDiceStore.getState().history[0].title).toBe('Dan — Torche d8');
    });

    it('n’écrit jamais NaN dans la fiche', () => {
        ouvrirLaTable('D8');
        render(<CombatCard combatant={DAN as never} isActive={false} />);
        vi.spyOn(DiceEngine, 'roll').mockImplementation(() => 5);

        fireEvent.click(screen.getByTitle(/Lancer Torche/));

        expect(ficheDeDan().torche).toBe('D8');
    });

    it('épuisée, elle ne se lance plus', () => {
        ouvrirLaTable('Épuisée');
        render(<CombatCard combatant={DAN as never} isActive={false} />);
        expect(screen.getByTitle('Torche : épuisée').hasAttribute('disabled')).toBe(true);
    });
});
