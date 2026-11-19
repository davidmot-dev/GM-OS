import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

/**
 * **Une jauge sans couleur déclarée se remplit quand même** (19/11/2026, registre § 263 et § 1 bis).
 *
 * La carte peignait `bg-primary` et écrivait le chiffre en `text-primary` : la couleur `primary`
 * n'existe pas dans GM-OS (`tailwind.config.js` ne déclare que `accent`). Le remplissage restait
 * transparent. Relevé sur les captures de Combat-OS du 19/11 ; David a accepté la correction.
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

const ouvrirLaTable = (style: 'segmented' | 'neon' | 'bar') => useSessionOSStore.setState({
    activeCampaignId: 'c-1',
    campaigns: [{ id: 'c-1', name: 'Essai', system: 'jeu-test' }],
    customGameDrivers: [{
        id: 'jeu-test', name: 'Jeu d’essai',
        dice: { defaultDice: '1d6', logic: 'count-success', engine: 'standard' },
        combat: { statsToTrack: [{ fieldId: 'stress', label: 'Stress', isMainHP: false }] },
        ui_config: { gauges: [{ fieldId: 'stress', label: 'Stress', style }] },
    }],
    players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: true, characters: [
        { id: 'p1', name: 'Rachel', campaignId: 'c-1', templateId: 't', portraitUrl: '', sheetData: { stress: 3 } },
    ] }],
} as never);

const RACHEL = { id: 'cb-1', name: 'Rachel', init: 12, isPlayer: true, faction: 'player', sourcePlayerId: 'p1', statuses: [], hp: 10, hpMax: 12 };

afterEach(() => cleanup());

describe('une jauge sans couleur déclarée', () => {
    it.each(['segmented', 'neon', 'bar'] as const)('style %s : remplie à la couleur d’accent, jamais `primary`', style => {
        ouvrirLaTable(style);
        const { container } = render(<CombatCard combatant={RACHEL as never} isActive={false} />);
        expect(container.querySelectorAll('.bg-accent').length).toBeGreaterThan(0);
        expect(container.querySelector('[class*="primary"]:not([class*="glow-primary"])')).toBeNull();
    });
});
