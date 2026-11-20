import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '../../../i18n';

/**
 * **Le pilote de chaque personnage, sur sa carte du roster** — David, 20/11/2026 :
 * « je voudrais que dans le Roster joueur je vois sur quel Drivers est lié un
 * personnage ». Même règle que la fiche et la tablette (`piloteDuPersonnage`) :
 * le jeu que le personnage déclare, sinon celui de sa campagne — jamais la
 * campagne ouverte.
 */

vi.mock('../logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({ useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) } }));

const { default: CharacterGrid } = await import('./CharacterGrid');
const { useSessionOSStore } = await import('../useSessionOSStore');

const PILOTES = [
    { id: 'alien', name: 'ALIEN, le jeu de rôle', version: '1.11.0', templateId: 'tpl-alien' },
    { id: 'runequest', name: 'RuneQuest', version: '2.3.0', templateId: 'tpl-rq' },
];
const pj = (id: string, name: string, extra: Record<string, unknown>) => ({ id, name, hp: 10, maxHp: 10, sheetData: {}, ...extra });
const ligneDe = (nom: string) => [...document.querySelectorAll('[data-pilote-du-personnage]')]
    .find(l => l.closest('.rounded-xl')?.textContent?.includes(nom));

beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'camp-rq',
        campaigns: [
            { id: 'camp-rq', name: 'Les Bornes du gué', system: 'runequest', activeLocationIds: [] },
            { id: 'camp-perdue', name: 'Campagne sans jeu', system: 'jeu-retire', activeLocationIds: [] },
        ],
        customGameDrivers: PILOTES,
        players: [{ id: 'j1', realName: 'Thomas', isOnline: true, characters: [
            pj('a', 'Vasquez', { campaignId: 'camp-rq', systemId: 'alien' }),
            pj('b', 'Arven', { campaignId: 'camp-rq' }),
            pj('c', 'Orphelin', { campaignId: 'camp-perdue' }),
        ] }],
        selectedPlayerId: 'j1', selectedCharacterId: null, connectedCharacters: {}, sessions: [],
    } as never);
});

describe('le pilote sur la carte du personnage', () => {
    it('le jeu que le personnage déclare l’emporte sur celui de sa campagne, version comprise', () => {
        render(<CharacterGrid ignoreCampaignFilter />);
        expect(ligneDe('Vasquez')?.getAttribute('data-pilote-du-personnage')).toBe('alien');
        expect(ligneDe('Vasquez')?.textContent).toContain('ALIEN, le jeu de rôle 1.11.0');
    });

    it('sans jeu déclaré, celui de sa campagne', () => {
        render(<CharacterGrid ignoreCampaignFilter />);
        expect(ligneDe('Arven')?.textContent).toContain('RuneQuest 2.3.0');
    });

    it('sans pilote trouvé, la carte le dit', () => {
        render(<CharacterGrid ignoreCampaignFilter />);
        expect(ligneDe('Orphelin')?.getAttribute('data-pilote-du-personnage')).toBe('');
        expect(ligneDe('Orphelin')?.textContent).toContain('Aucun pilote trouvé');
    });
});
