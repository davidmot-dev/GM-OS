import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **La carte de combat après le chantier § 263** (19/11/2026) :
 *
 * - Dune n'a pas de points de vie : ni « Calculer » ni la console Dégâts / Soins (David : « masque
 *   pour Dune », puis « masque aussi la console pour Dune ») ; « Fiche » reste ;
 * - « Attaquer » (T5, décision D2) ouvre la fenêtre « Fiche » sur le jet, et ne paraît que là où la
 *   règle `attaqueSurLaCarte` le permet.
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
const attaquePermise = vi.hoisted(() => ({ valeur: false }));
vi.mock('../logic/jetDuCombattant', async (original) => ({
    ...(await original<typeof import('../logic/jetDuCombattant')>()),
    attaqueSurLaCarte: () => attaquePermise.valeur,
}));

const { default: CombatCard } = await import('./CombatCard');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useModalStore } = await import('../../../stores/useModalStore');

const ouvrirLaTable = (jet: Record<string, unknown>, defaultHealthType = 'hp') => useSessionOSStore.setState({
    activeCampaignId: 'c-1',
    campaigns: [{ id: 'c-1', name: 'Essai', system: 'jeu' }],
    customGameDrivers: [{
        id: 'jeu', name: 'Jeu d’essai', dice: { defaultDice: '2d20', logic: 'count-success', engine: 'standard' },
        combat: { defaultHealthType, statsToTrack: [] }, jet,
    }],
    players: [], entities: [],
} as never);

const SOLDAT = { id: 'cb-1', name: 'Soldat Harkonnen', init: 8, isPlayer: false, faction: 'enemy', statuses: [], targetId: 'duncan' };

afterEach(() => { cleanup(); attaquePermise.valeur = false; useModalStore.getState().closeModal(); });

describe('la carte de Dune', () => {
    it('n’a ni « Calculer » ni console de dégâts ; « Fiche » reste', () => {
        ouvrirLaTable({ dune: { determination: 'determination' } }, 'clocks');
        render(<CombatCard combatant={SOLDAT as never} isActive={false} />);
        expect(screen.queryByText('combat.card.calculate')).toBeNull();
        expect(screen.queryByTitle(/Infliger dégâts/)).toBeNull();
        expect(screen.getByText('Fiche')).toBeTruthy();
    });

    it('un autre jeu garde les deux', () => {
        ouvrirLaTable({});
        render(<CombatCard combatant={SOLDAT as never} isActive={false} />);
        expect(screen.getByText('combat.card.calculate')).toBeTruthy();
        expect(screen.getByTitle(/Infliger dégâts/)).toBeTruthy();
    });
});

describe('les jauges d’une figure du livre (T20)', () => {
    const ouvrirBladeRunner = () => useSessionOSStore.setState({
        activeCampaignId: 'c-1',
        campaigns: [{ id: 'c-1', name: 'Essai', system: 'br' }],
        customGameDrivers: [{
            id: 'br', name: 'Blade Runner', dice: { defaultDice: '2d10', logic: 'count-success', engine: 'standard' },
            combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true, max: 'santeMax' }, { fieldId: 'sangFroid', label: 'Sang-froid' }] },
            ui_config: { gauges: [{ fieldId: 'sante', label: 'Santé', style: 'bar' }, { fieldId: 'sangFroid', label: 'Sang-froid', style: 'bar' }] },
            jet: {},
        }],
        players: [], entities: [],
    } as never);

    it('n’a pas la jauge que le livre ne lui donne pas (Sang-froid) ; garde sa Santé', () => {
        ouvrirBladeRunner();
        render(<CombatCard combatant={{ ...SOLDAT, origineDuLivre: { creatureId: 'agent' }, sheetData: { sante: 5, santeMax: 5 } } as never} isActive={false} />);
        expect(screen.queryByText('Sang-froid')).toBeNull();
        expect(screen.getAllByText('Santé').length).toBeGreaterThan(0);
    });

    it('un adversaire fabriqué garde ses jauges, même vides', () => {
        ouvrirBladeRunner();
        render(<CombatCard combatant={{ ...SOLDAT, sheetData: { sante: 5, santeMax: 5 } } as never} isActive={false} />);
        expect(screen.getByText('Sang-froid')).toBeTruthy();
    });
});

describe('« Attaquer » sur la carte (T5)', () => {
    it('absent tant que la règle du jeu ne le permet pas (C10)', () => {
        ouvrirLaTable({});
        render(<CombatCard combatant={SOLDAT as never} isActive={false} />);
        expect(screen.queryByText('combat.card.attack')).toBeNull();
    });

    it('T16 : chez Cthulhu Hack, le même bouton s’appelle « Riposte »', () => {
        attaquePermise.valeur = true;
        ouvrirLaTable({ cthulhuHack: { pv: 'hp', armures: [] } });
        render(<CombatCard combatant={SOLDAT as never} isActive={false} />);
        expect(screen.getByText('combat.card.riposte')).toBeTruthy();
        expect(screen.queryByText('combat.card.attack')).toBeNull();
    });

    it('permis, il ouvre la fenêtre « Fiche » sur le jet du combattant', () => {
        attaquePermise.valeur = true;
        ouvrirLaTable({});
        render(<CombatCard combatant={SOLDAT as never} isActive={false} />);
        fireEvent.click(screen.getByText('combat.card.attack'));
        const modale = useModalStore.getState() as unknown as { customVariant?: string; defaultValue?: unknown };
        expect(modale.customVariant).toBe('fiche-combattant');
        expect(modale.defaultValue).toEqual({ combatantId: 'cb-1', ouvrirSur: 'jet' });
    });
});
