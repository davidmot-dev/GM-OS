import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **Les jauges de la carte de combat se règlent à vue** (2026-10-13).
 *
 * David : *« le Choc ne diminue pas »*. Le seul geste était un clic gauche ou
 * droit sur la barre, annoncé par une infobulle. Chaque jauge a désormais ses
 * boutons − et +, et la règle du jeu peut y poser ses gestes — le Choc de Torg :
 * « Récupérer » (le tour sacrifié, −2) et « Reprendre son souffle » (remis à 0).
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

const TORG = {
    id: 'torg', name: 'Torg Eternity', templateId: 'tpl',
    dice: { defaultDice: '1d20', logic: 'sum', engine: 'standard' },
    combat: {
        statsToTrack: [{
            fieldId: 'choc', label: 'Choc', isMainHP: false, isResource: true, max: 'esprit',
            gestes: [{ libelle: 'Récupérer', delta: -2 }, { libelle: 'Reprendre son souffle', valeur: 0 }],
        }],
        initiativeFormula: 'dexterite',
    },
    ui_config: { gauges: [{ fieldId: 'choc', label: 'Choc', color: 'bg-yellow-400', style: 'bar' }] },
};

const ouvrirLaTable = (choc: number) => useSessionOSStore.setState({
    activeCampaignId: 'c', customGameDrivers: [TORG],
    campaigns: [{ id: 'c', name: 'Torg', system: 'torg' }],
    players: [{ id: 'j', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [
        { id: 'pj', name: 'Mara', campaignId: 'c', templateId: 'tpl', portraitUrl: '', sheetData: { esprit: 8, choc } },
    ] }],
} as never);

const MARA = { id: 'cb', name: 'Mara', init: 0, isPlayer: true, faction: 'player', sourcePlayerId: 'pj', statuses: [] };

const choc = () => (useSessionOSStore.getState() as never as { players: { characters: { sheetData: Record<string, unknown> }[] }[] })
    .players[0].characters[0].sheetData.choc;

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('les boutons d’une jauge', () => {
    it('− et + se voient, et écrivent sur la fiche', () => {
        ouvrirLaTable(8);
        render(<CombatCard combatant={MARA as never} isActive={false} />);

        fireEvent.click(screen.getByRole('button', { name: 'Choc : retirer 1' }));
        expect(choc()).toBe(7);
        fireEvent.click(screen.getByRole('button', { name: 'Choc : ajouter 1' }));
        expect(choc()).toBe(8);
    });
});

describe('les gestes de la règle — le Choc de Torg', () => {
    it('« Récupérer » retire 2', () => {
        ouvrirLaTable(8);
        render(<CombatCard combatant={MARA as never} isActive={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Récupérer −2' }));
        expect(choc()).toBe(6);
    });

    it('sans descendre sous zéro', () => {
        ouvrirLaTable(1);
        render(<CombatCard combatant={MARA as never} isActive={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Récupérer −2' }));
        expect(choc()).toBe(0);
    });

    it('« Reprendre son souffle » remet à zéro', () => {
        ouvrirLaTable(8);
        render(<CombatCard combatant={MARA as never} isActive={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Reprendre son souffle' }));
        expect(choc()).toBe(0);
    });

    it('un jeu qui ne déclare rien n’a que − et +', () => {
        ouvrirLaTable(8);
        useSessionOSStore.setState({
            customGameDrivers: [{ ...TORG, combat: { ...TORG.combat, statsToTrack: [{ ...TORG.combat.statsToTrack[0], gestes: undefined }] } }],
        } as never);
        render(<CombatCard combatant={MARA as never} isActive={false} />);
        expect(screen.queryByRole('button', { name: /Récupérer/ })).toBeNull();
        expect(screen.getByRole('button', { name: 'Choc : retirer 1' })).toBeTruthy();
    });
});
