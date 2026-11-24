import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

/**
 * **La Détermination de Dune sur la carte de combat** (24/11/2026, § 1 bis du 19/11).
 *
 * La carte partait de 10 et ne lisait le maximum d'un champ que pour un `number` : la Détermination,
 * `gauge` de maximum 3, s'affichait « 0/10 ». Et un PNJ n'a pas de Détermination — le meneur dépense
 * 3 Menace à la place (livre p. 240) : la jauge n'a pas à paraître sur sa carte.
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

const ouvrirLaTable = (dune: boolean) => useSessionOSStore.setState({
    activeCampaignId: 'c-1',
    campaigns: [{ id: 'c-1', name: 'Arrakis', system: 'dune-test' }],
    customSheetTemplates: [{ id: 't-dune', name: 'Dune', emoji: '', sections: [
        { id: 'ressources', label: 'Ressources', fields: [{ id: 'determination', label: 'Détermination', type: 'gauge', defaultValue: 1, min: 0, max: 3 }] },
    ] }],
    customGameDrivers: [{
        id: 'dune-test', name: 'Dune', templateId: 't-dune',
        dice: { defaultDice: '2d20', logic: 'count-success', engine: 'standard' },
        ...(dune ? { jet: { dune: { determination: 'determination' } } } : {}),
        combat: { statsToTrack: [{ fieldId: 'determination', label: 'Détermination', isMainHP: false, isResource: true }] },
        ui_config: { gauges: [{ fieldId: 'determination', label: 'Détermination', color: '#d97706', style: 'segmented' }] },
    }],
    players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: true, characters: [
        { id: 'p1', name: 'Jessica', campaignId: 'c-1', templateId: 't-dune', portraitUrl: '', sheetData: { determination: 1 } },
    ] }],
} as never);

const JESSICA = { id: 'cb-1', name: 'Jessica', init: 12, isPlayer: true, faction: 'player', sourcePlayerId: 'p1', statuses: [], hp: 10, hpMax: 10 };
const SOLDAT = { id: 'cb-2', name: 'Soldat Harkonnen', init: 8, isPlayer: false, faction: 'enemy', statuses: [], hp: 10, hpMax: 10,
    sheetData: { determination: 0 } };

afterEach(() => cleanup());

describe('la Détermination de Dune sur la carte', () => {
    it('un PJ : le maximum du champ (3), pas 10', () => {
        ouvrirLaTable(true);
        const { container } = render(<CombatCard combatant={JESSICA as never} isActive={false} />);
        const jauge = container.querySelector('[title^="Détermination:"]');
        expect(jauge?.getAttribute('title')).toContain('1/3');
    });

    it('un PNJ : pas de jauge de Détermination (p. 240)', () => {
        ouvrirLaTable(true);
        const { container } = render(<CombatCard combatant={SOLDAT as never} isActive={false} />);
        expect(container.querySelector('[title^="Détermination:"]')).toBeNull();
    });

    it('un autre jeu garde la jauge d’un PNJ, à son maximum déclaré', () => {
        ouvrirLaTable(false);
        const { container } = render(<CombatCard combatant={SOLDAT as never} isActive={false} />);
        expect(container.querySelector('[title^="Détermination:"]')?.getAttribute('title')).toContain('0/3');
    });
});
