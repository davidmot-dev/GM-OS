// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

/**
 * **La fenêtre « Fiche » ouverte par « Attaquer »** — chantier § 263, T5 (19/11/2026), décision D2
 * de David : « Fenêtre Fiche, ouverte sur le jet ». La carte l'ouvre avec
 * `{ combatantId, ouvrirSur: 'jet' }` : le jet passe au premier plan, la cible de la carte en tête.
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
vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

const { FicheDuCombattant } = await import('./FicheDuCombattant');
const { useModalStore } = await import('../../../stores/useModalStore');
const { useCombatStore } = await import('../useCombatStore');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');

// Le pilote du lieutenant de Vampire (`JetDuCombattant.test.tsx`) : le seul jeu dont le jet
// d'adversaire existe aujourd'hui. Le câblage de la fenêtre est le même pour tous les jeux.
const PILOTE = {
    id: 'vampire', name: 'Vampire', templateId: 'tpl',
    dice: { defaultDice: '1d10', logic: 'count-success', engine: 'standard', successThreshold: 6 },
    combat: { statsToTrack: [] },
    jet: {
        sens: 'superieur-ou-egal',
        reserve: { base: 0, max: 30, sansPlafond: true, faces: 10, composantes: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        ] },
        difficulte: { min: 1, max: 10, defaut: 3 },
        vampire: { soif: 'soif', volonte: 'volonte' },
    },
};
const FICHE = { id: 'tpl', name: 'Vampire', sections: [
    { id: 'attributs', label: 'Attributs', fields: [{ id: 'dexterite', label: 'Dextérité', type: 'number', defaultValue: 1 }] },
] };

const ouvrir = (pilote: object, ouvrirSur?: 'jet') => {
    useSessionOSStore.setState({
        activeCampaignId: 'c1',
        campaigns: [{ id: 'c1', name: 'Essai', system: (pilote as { id: string }).id }],
        customGameDrivers: [pilote],
        customSheetTemplates: [FICHE],
        players: [], entities: [],
    } as never);
    useCombatStore.setState({ combatants: [
        { id: 'lt', name: 'Lieutenant', init: 8, isPlayer: false, faction: 'enemy', statuses: [], targetId: 'rachel', sheetData: { dexterite: 3 } },
        { id: 'rachel', name: 'Rachel', init: 10, isPlayer: true, faction: 'player', statuses: [] },
    ] } as never);
    useModalStore.setState({ defaultValue: { combatantId: 'lt', ...(ouvrirSur ? { ouvrirSur } : {}) } } as never);
    render(<FicheDuCombattant />);
};

beforeEach(() => useModalStore.getState().closeModal());
afterEach(() => cleanup());

describe('la fenêtre « Fiche » ouverte par « Attaquer » (T5)', () => {
    it('met le jet au premier plan, avec la cible de la carte', () => {
        ouvrir(PILOTE, 'jet');
        expect(document.querySelector('[data-ouvert-sur-le-jet]')).toBeTruthy();
        expect(document.querySelector('[data-cible-de-l-attaque="rachel"]')).toBeTruthy();
        expect(screen.getByText('Lieutenant attaque Rachel')).toBeTruthy();
    });

    it('ouverte par « Fiche », elle reste celle d’avant', () => {
        ouvrir(PILOTE);
        expect(document.querySelector('[data-jet-du-combattant]')).toBeTruthy();
        expect(document.querySelector('[data-ouvert-sur-le-jet]')).toBeNull();
        expect(document.querySelector('[data-cible-de-l-attaque]')).toBeNull();
    });

    it('sans jet d’adversaire dans le jeu, elle le dit au lieu de s’ouvrir muette', () => {
        ouvrir({ ...PILOTE, id: 'autre', jet: { sens: 'superieur-ou-egal' } }, 'jet');
        expect(document.querySelector('[data-jet-du-combattant]')).toBeNull();
        expect(document.querySelector('[data-aucun-jet]')?.textContent).toContain('Aucun jet d’adversaire');
    });
});
