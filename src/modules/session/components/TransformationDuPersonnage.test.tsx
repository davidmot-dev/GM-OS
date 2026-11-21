import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '../../../i18n';

/**
 * § 268 (21/11/2026) — David : « je voudrais pouvoir transformer un PNJ en
 * Personnage Joueur, et vice-versa ». Les deux gestes, tels que l'écran les
 * fait : la confirmation qui dit ce qui change, puis le magasin de séance, le
 * combattant du plateau et les cartes tenues.
 */

vi.mock('../logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({ useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) } }));

const { FaireUnPersonnageJoueur, FaireUnPnj } = await import('./TransformationDuPersonnage');
const { default: CharacterGrid } = await import('./CharacterGrid');
const { default: HubCharacterSheet } = await import('../../../components/hub/HubCharacterSheet');
const { useSessionOSStore } = await import('../useSessionOSStore');
const { useCombatStore } = await import('../../combat/useCombatStore');
const { useClientStore } = await import('../../../stores/useClientStore');

const magasin = () => useSessionOSStore.getState();

const marta = {
    id: 'e-marta', name: 'Marta', type: 'npc', role: 'ally', status: 'alive', avatar: '', hp: 7, maxHp: 10,
    ac: 0, speed: 0, initiative: 0, description: '', roleplayingNotes: '', gmSecretInfo: '', linkedMapIds: [],
    campaignId: 'c1', templateId: 'generic', sheetData: {},
};
const rachel = { id: 'pc-rachel', name: 'Rachel', portraitUrl: '', campaignId: 'c1', templateId: 'generic', sheetData: {}, hp: 8, maxHp: 10 };

beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'c1',
        campaigns: [{ id: 'c1', name: 'Les pluies', system: 'generic', activeLocationIds: [] }],
        entities: [marta],
        players: [
            { id: 'j-bob', realName: 'Bob', avatarUrl: '', isOnline: true, characters: [] },
            { id: 'j-ana', realName: 'Ana', avatarUrl: '', isOnline: true, characters: [rachel] },
        ],
        scenes: [],
        rencontres: [{ id: 'r1', campaignId: 'c1', nom: 'La patrouille', lignes: [{ genre: 'entite', entiteId: 'e-marta' }] }],
        deckStates: { destin: { enMain: [{ index: 4, porteur: 'pc-rachel', face: 'visible' }] } },
        connectedCharacters: {},
        selectedPlayerId: 'j-ana', selectedCharacterId: 'pc-rachel', selectedEntityId: 'e-marta', sessions: [],
    } as never);
    useCombatStore.setState({ combatants: [
        { id: 'cb-marta', name: 'Marta', init: 0, isPlayer: false, faction: 'ally', statuses: [], sourceEntityId: 'e-marta' },
        { id: 'cb-rachel', name: 'Rachel', init: 0, isPlayer: true, faction: 'player', statuses: [], sourcePlayerId: 'pc-rachel' },
    ] } as never);
});
afterEach(cleanup);

describe('« Faire un personnage joueur… » sur la fiche du PNJ', () => {
    it('la confirmation propose d’abord le joueur qui joue déjà dans la campagne, et nomme les rencontres', () => {
        render(<FaireUnPersonnageJoueur entite={marta as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Faire un personnage joueur/ }));
        const choix = screen.getByRole('combobox') as HTMLSelectElement;
        expect([...choix.options].map(o => o.textContent)).toEqual(['Ana', 'Bob']);
        expect(screen.getByText(/ne l'enverront plus : La patrouille/)).toBeTruthy();
    });

    it('« Transformer » : Marta passe chez le joueur choisi, son combattant devient un PJ, la fiche se relâche', () => {
        render(<FaireUnPersonnageJoueur entite={marta as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Faire un personnage joueur/ }));
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'j-bob' } });
        fireEvent.click(screen.getByRole('button', { name: 'Transformer' }));
        expect(magasin().entities).toEqual([]);
        expect(magasin().players[0].characters.map(c => c.id)).toEqual(['e-marta']);
        expect(magasin().selectedEntityId).toBeNull();
        expect(useCombatStore.getState().combatants[0]).toMatchObject({ isPlayer: true, sourcePlayerId: 'e-marta', faction: 'player' });
    });

    it('« Annuler » ne change rien', () => {
        render(<FaireUnPersonnageJoueur entite={marta as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Faire un personnage joueur/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
        expect(magasin().entities).toHaveLength(1);
        expect(screen.queryByRole('button', { name: 'Transformer' })).toBeNull();
    });

    it('sans aucun joueur, la confirmation le dit et « Transformer » est désactivé', () => {
        useSessionOSStore.setState({ players: [] } as never);
        render(<FaireUnPersonnageJoueur entite={marta as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Faire un personnage joueur/ }));
        expect(screen.getByText(/Aucun joueur pour le recevoir/)).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Transformer' }) as HTMLButtonElement).disabled).toBe(true);
    });
});

describe('« Faire un PNJ… » dans le roster', () => {
    it('le bouton est sur la carte du PJ', () => {
        render(<CharacterGrid ignoreCampaignFilter />);
        expect(screen.getByRole('button', { name: /Faire un PNJ/ })).toBeTruthy();
    });

    it('« Transformer » : Rachel rejoint les PNJ au rôle choisi, son combattant devient ennemi, ses cartes reviennent au meneur', () => {
        render(<FaireUnPnj joueurId="j-ana" personnage={rachel as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Faire un PNJ/ }));
        expect(screen.getByText(/Les cartes qu'il tient \(1\) reviennent au meneur/)).toBeTruthy();
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'hostile' } });
        fireEvent.click(screen.getByRole('button', { name: 'Transformer' }));
        expect(magasin().players[1].characters).toEqual([]);
        expect(magasin().entities.find(e => e.id === 'pc-rachel')).toMatchObject({ role: 'hostile' });
        expect(magasin().selectedCharacterId).toBeNull();
        expect(useCombatStore.getState().combatants[1]).toMatchObject({ isPlayer: false, sourceEntityId: 'pc-rachel', faction: 'enemy' });
        expect(magasin().deckStates.destin.enMain?.[0].porteur).toBeNull();
    });

    it('un PJ tenu par une tablette : la confirmation le dit, et la transformation a lieu (Q4)', () => {
        useSessionOSStore.setState({ connectedCharacters: { 'pc-rachel': 'tablette-1' } } as never);
        render(<FaireUnPnj joueurId="j-ana" personnage={rachel as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Faire un PNJ/ }));
        expect(screen.getByText(/Une tablette tient encore Rachel/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Transformer' }));
        expect(magasin().entities.some(e => e.id === 'pc-rachel')).toBe(true);
    });

    it('un PJ sans campagne : refusé, rien ne change (C5)', () => {
        const orphelin = { ...rachel, campaignId: null };
        useSessionOSStore.setState({ players: [{ id: 'j-ana', realName: 'Ana', avatarUrl: '', isOnline: true, characters: [orphelin] }] } as never);
        render(<FaireUnPnj joueurId="j-ana" personnage={orphelin as never} />);
        fireEvent.click(screen.getByRole('button', { name: /Faire un PNJ/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Transformer' }));
        expect(magasin().players[0].characters).toHaveLength(1);
        expect(magasin().entities.some(e => e.id === 'pc-rachel')).toBe(false);
    });
});

describe('la tablette qui tenait un PJ devenu PNJ', () => {
    it('affiche qu’il n’est plus un personnage joueur, au lieu d’une fiche vide', () => {
        useClientStore.setState({ characterId: 'pc-rachel' } as never);
        magasin().transformerEnPnj('j-ana', 'pc-rachel', 'ally');
        render(<HubCharacterSheet onClose={() => {}} />);
        expect(screen.getByRole('status').textContent).toMatch(/n'est plus un personnage joueur/);
    });

    it('un personnage introuvable qui n’est pas un PNJ (avant la synchronisation) garde l’écran vide', () => {
        useClientStore.setState({ characterId: 'pc-inconnu' } as never);
        const { container } = render(<HubCharacterSheet onClose={() => {}} />);
        expect(container.textContent).toBe('');
    });
});
