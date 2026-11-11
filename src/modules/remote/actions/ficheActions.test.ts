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
const { demandesOuvertes } = await import('../../dice/filDesDemandes');

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

/**
 * **Un jet qui répond à une demande du meneur la clôt** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T4 (C4, C5).
 */
describe('la réponse à une demande de jet', () => {
    const demande = (id: string, characterId = 'p1') => ({
        genre: 'test' as const, id, characterId, emiseLe: 1, titre: 'Force',
        composition: { champs: { s: 'force' } },
    });
    const ouvertes = () => demandesOuvertes((useSessionOSStore.getState() as never as { messages: never[] }).messages).map(d => d.id);
    const resultat = (extra: Record<string, unknown>) => ficheActions['fiche:resultat']({
        characterId: 'p1', titre: 'Force', totalDisplay: '7 (seuil 11)', total: 7, rolls: [{ val: 7, sides: 20 }], ...extra,
    }, {} as never);

    beforeEach(() => {
        useSessionOSStore.setState({ messages: [] } as never);
        useSessionOSStore.getState().demanderUnJet(demande('d1'), 'Dan');
    });

    it('le résultat qui porte la demande la clôt, et s’inscrit comme tout jet', () => {
        expect(ouvertes()).toEqual(['d1']);
        resultat({ demandeId: 'd1' });
        expect(ouvertes()).toEqual([]);
        expect(useDiceStore.getState().history[0].title).toBe('Dan — Force');
        const fil = (useSessionOSStore.getState() as never as { messages: { suiteDeDemande?: unknown; toId: string }[] }).messages;
        expect(fil.at(-1)).toMatchObject({ toId: 'p1', suiteDeDemande: { id: 'd1', etat: 'lancee' } });
    });

    it('un second jet avec la même demande ne la rouvre pas, et ne la reclôt pas', () => {
        resultat({ demandeId: 'd1' });
        const avant = (useSessionOSStore.getState() as never as { messages: unknown[] }).messages.length;
        resultat({ demandeId: 'd1' });
        expect((useSessionOSStore.getState() as never as { messages: unknown[] }).messages).toHaveLength(avant);
        expect(useDiceStore.getState().history).toHaveLength(2);
    });

    it('un identifiant inconnu, ou un jet sans demande, ne ferme rien', () => {
        resultat({ demandeId: 'autre' });
        resultat({});
        expect(ouvertes()).toEqual(['d1']);
        expect(useDiceStore.getState().history).toHaveLength(2);
    });

    it('la demande d’un autre personnage ne se ferme pas par ce jet', () => {
        useSessionOSStore.getState().demanderUnJet(demande('d2', 'p2'), 'Autre');
        resultat({ demandeId: 'd2' });
        expect(ouvertes()).toEqual(['d1', 'd2']);
    });

    it('une Sauvegarde demandée (Cthulhu Hack) clôt sa demande', () => {
        tirer(5);
        ficheActions['fiche:jet']({ playerId: 'j1', characterId: 'p1', genre: 'sauvegarde', champ: 'force', demandeId: 'd1' }, {} as never);
        expect(ouvertes()).toEqual([]);
    });
});
