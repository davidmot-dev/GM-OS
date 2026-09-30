import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * **Un joueur lance depuis sa fiche, sur sa tablette** — Cthulhu Hack,
 * 2026-09-30. La tablette ne dit que ce qu'elle lance ; le meneur lit la fiche
 * qu'il détient, lance, écrit le dé qui descend, et inscrit le jet.
 */

vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { ficheActions } = await import('./ficheActions');
const { DiceEngine } = await import('../../dice/DiceEngine');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useDiceStore } = await import('../../../stores/useDiceStore');

const GABARIT = {
    id: 't-ch', name: 'Cthulhu Hack', emoji: '🐙',
    sections: [
        { id: 'sauvegardes', label: 'Sauvegardes', fields: [{ id: 'force', label: 'Force', type: 'number' }] },
        { id: 'ressources', label: 'Ressources', fields: [{ id: 'torche', label: 'Torche', type: 'text' }] },
    ],
};

const ouvrirLaTable = () => useSessionOSStore.setState({
    activeCampaignId: 'c-1',
    campaigns: [{ id: 'c-1', name: 'Le Secret de Milo', system: 'ch-test' }],
    customSheetTemplates: [GABARIT],
    customGameDrivers: [{
        id: 'ch-test', name: 'Cthulhu Hack', templateId: 't-ch',
        dice: { defaultDice: '1d20', logic: 'count-success', engine: 'standard' },
        jet: { sens: 'sous-ou-egal', reserve: { max: 1, faces: 20 }, seuil: [{ id: 's', label: 'Sauvegarde', sectionId: 'sauvegardes' }] },
        combat: { statsToTrack: [{ fieldId: 'torche', label: 'Torche', isMainHP: false, isResource: true }] },
    }],
    players: [{ id: 'j1', realName: 'Joueuse', avatarUrl: '', isOnline: true, characters: [
        { id: 'p1', name: 'Dan', campaignId: 'c-1', templateId: 't-ch', portraitUrl: '', sheetData: { force: 11, torche: 'D8' } },
    ] }],
} as never);

const tirer = (...faces: number[]) => {
    const suite = [...faces];
    vi.spyOn(DiceEngine, 'roll').mockImplementation(() => suite.shift()!);
};
const ficheDeDan = () => (useSessionOSStore.getState() as never as { players: { characters: { sheetData: Record<string, unknown> }[] }[] })
    .players[0].characters[0].sheetData;

beforeEach(() => { ouvrirLaTable(); useDiceStore.getState().clearHistory(); });
afterEach(() => vi.restoreAllMocks());

describe('un jet demandé depuis la fiche', () => {
    it('lance la ressource au dé de la fiche, et y écrit ce qu’elle devient', () => {
        tirer(1);
        ficheActions['fiche:jet']({ playerId: 'j1', characterId: 'p1', genre: 'ressource', champ: 'torche' }, {} as never);

        expect(ficheDeDan().torche).toBe('d6');
        expect(useDiceStore.getState().history[0].title).toBe('Dan — Torche d8');
    });

    it('lance la Sauvegarde sur la valeur que le meneur détient', () => {
        tirer(15, 4);
        ficheActions['fiche:jet']({ playerId: 'j1', characterId: 'p1', genre: 'sauvegarde', champ: 'force', modificateur: 'avantage' }, {} as never);

        const jet = useDiceStore.getState().history[0];
        expect(jet.totalDisplay).toBe('4 / 11');
        expect(jet.tagSuccess).toBe(true);
    });

    it('ne croit pas le playerId envoyé : le personnage se retrouve par son seul identifiant', () => {
        tirer(2);
        ficheActions['fiche:jet']({ playerId: 'un-autre', characterId: 'p1', genre: 'ressource', champ: 'torche' }, {} as never);
        expect(ficheDeDan().torche).toBe('d6');
    });

    it('ignore une demande que la fiche ne soutient pas', () => {
        ficheActions['fiche:jet']({ playerId: 'j1', characterId: 'p1', genre: 'ressource', champ: 'force' }, {} as never);
        ficheActions['fiche:jet']({ characterId: 'inconnu', genre: 'ressource', champ: 'torche' }, {} as never);
        ficheActions['fiche:jet'](null, {} as never);
        expect(useDiceStore.getState().history).toHaveLength(0);
        expect(ficheDeDan().torche).toBe('D8');
    });
});

/**
 * **Le jet de la tablette entre au journal de séance** — demandé par David le
 * 2026-09-30. Hors séance, le journal n'inscrit rien, ni ce jet ni ceux du
 * meneur : c'est `addEvent` qui en décide, pour tous.
 */
describe('un résultat lancé sur la tablette', () => {
    it('entre à l’historique et au journal de la séance, au nom que le meneur connaît', async () => {
        const { useJournalStore } = await import('../../journal/useJournalStore');
        useJournalStore.getState().startJournal({ id: 'c-1', nom: 'Le Secret de Milo' } as never, 'Séance 3');

        ficheActions['fiche:resultat']({
            characterId: 'p1', titre: 'Force', totalDisplay: '7 (seuil 13)',
            total: 7, rolls: [{ val: 7, sides: 20 }], tagSuccess: true, degre: 'reussite-normale',
        }, {} as never);

        expect(useDiceStore.getState().history[0].title).toBe('Dan — Force');
        const journal = useJournalStore.getState().journals.find(j => j.id === useJournalStore.getState().activeJournalId)!;
        const des = journal.events.filter(e => e.type === 'DICE');
        expect(des.map(e => e.title)).toEqual(['Jet : Dan — Force']);
        expect(des[0].content).toContain('7 (seuil 13)');
    });

    it('ignore un résultat pour un personnage que le meneur ne connaît pas', () => {
        ficheActions['fiche:resultat']({ characterId: 'inconnu', titre: 'Faux', totalDisplay: '20' }, {} as never);
        expect(useDiceStore.getState().history).toHaveLength(0);
    });
});
