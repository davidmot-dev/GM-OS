import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Entity, Clue } from '../modules/session/store/types';
import type { GameSession } from '../types/session.types';
import type { Acte, Scene } from '../types/trame.types';

/**
 * **Régression du reste P1 : les PNJ et les indices n'étaient dans aucune
 * sauvegarde.**
 *
 * Signalé le 2026-08-16, reporté trois fois, corrigé le 2026-08-20.
 *
 * Ce test-ci regarde la charge réellement transmise au pont, et non la liste
 * partagée dont elle est tirée : c'est le seul endroit d'où l'on voit ce qui
 * part vraiment vers le fichier. Un test posé sur la liste seule serait resté
 * vert si quelqu'un réécrivait la charge à la main — ce qui est exactement ce
 * qui s'était passé.
 */

type ChargeSauvegardee = {
    modules: {
        sessionOS: {
            entities?: Entity[];
            clues?: Clue[];
            sessions?: GameSession[];
            actes?: Acte[];
            scenes?: Scene[];
        };
        music?: { playlists?: { id: string; campagneId?: string | null }[] };
    };
};

const chargesEnvoyees = vi.hoisted(() => [] as ChargeSauvegardee[]);

vi.mock('../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { SessionService } = await import('./SessionService');
const { useSessionOSStore } = await import('../modules/session/store/index');
const { useMusicStore } = await import('../modules/music/useMusicStore');
const { FullSessionSchema } = await import('../types/schemas');
const { useNPCStore } = await import('../modules/npc/useNPCStore');
const { useWebStore } = await import('../modules/web/useWebStore');
const { useClockStore } = await import('./useClockStore');
const { useSessionStore } = await import('./useSessionStore');

/** Le pont d'Electron, réduit à ce que la sauvegarde en appelle. */
const poserLePont = () => {
    (window as unknown as {
        appBridge: { session: { saveSession: (d: unknown) => Promise<boolean> } };
    }).appBridge = {
        session: {
            saveSession: async (data: unknown) => {
                chargesEnvoyees.push(data as ChargeSauvegardee);
                return true;
            },
        },
    };
};

const laCharge = () => chargesEnvoyees[0].modules.sessionOS;

beforeEach(() => {
    chargesEnvoyees.length = 0;
    poserLePont();
});

describe('saveFullSession', () => {
    it('emporte les PNJ, les indices et les séances', async () => {
        useSessionOSStore.setState({
            entities: [{ id: 'e-42', name: 'Le contremaître' }] as unknown as Entity[],
            clues: [{ id: 'i-7', title: 'La carte magnétique' }] as unknown as Clue[],
            sessions: [{ id: 's-3', name: 'Séance du 19' }] as unknown as GameSession[],
        });

        await SessionService.saveFullSession(true);

        expect(laCharge().entities).toHaveLength(1);
        expect(laCharge().entities?.[0].id).toBe('e-42');
        expect(laCharge().clues?.[0].id).toBe('i-7');
        expect(laCharge().sessions?.[0].id).toBe('s-3');
    });

    it('emporte aussi la trame, qui n\'a jamais manqué et ne doit pas se mettre à manquer', async () => {
        useSessionOSStore.setState({
            actes: [{ id: 'a-1', titre: 'Acte I' }] as unknown as Acte[],
            scenes: [{ id: 'sc-1', titre: 'L\'embuscade' }] as unknown as Scene[],
        });

        await SessionService.saveFullSession(true);

        expect(laCharge().actes?.[0].id).toBe('a-1');
        expect(laCharge().scenes?.[0].id).toBe('sc-1');
    });

    /**
     * **Music-OS n'était dans aucune sauvegarde.** Trouvé le 2026-08-30.
     *
     * Une playlist n'est pas un réglage : chemins de fichiers, points de
     * boucle, scènes lumineuses liées, raccourcis clavier — et depuis ce jour,
     * la campagne à laquelle elle appartient. Tout cela ne vivait que dans le
     * `localStorage`.
     */
    it('emporte les atmosphères de Music-OS, et leur rattachement', async () => {
        useMusicStore.setState({
            playlists: [
                { id: 'pl-colonie', name: 'Colonie', pads: [], campagneId: 'c-hadley' },
                { id: 'pl-tension', name: 'Tension', pads: [] },
            ],
        });

        await SessionService.saveFullSession(true);

        const music = chargesEnvoyees[0].modules.music;
        expect(music?.playlists).toHaveLength(2);
        expect(music?.playlists?.[0].campagneId).toBe('c-hadley');
    });

    /**
     * *Le défaut idéal : écrire la clé, puis la jeter à la relecture.*
     *
     * `modules` est un `z.object` simple — Zod retire les clés qu'il ne nomme
     * pas. Sans la ligne ajoutée au schéma, la sauvegarde aurait emporté les
     * atmosphères et le chargement les aurait supprimées sans un mot. Ce test
     * regarde le schéma sur la charge réelle, seul endroit d'où l'aller-retour
     * se voit.
     */
    it('les fait survivre au schéma qui relit la sauvegarde', async () => {
        useMusicStore.setState({
            playlists: [{ id: 'pl-nid', name: 'Nid', pads: [], campagneId: 'c-hadley' }],
        });

        await SessionService.saveFullSession(true);
        const relu = FullSessionSchema.parse(chargesEnvoyees[0]);

        expect((relu.modules as { music?: { playlists: unknown[] } }).music?.playlists).toHaveLength(1);
    });
});

describe('la restauration conserve les contrats et les données anciennes', () => {
    const etatSession = useSessionOSStore.getState();
    const etatNpc = useNPCStore.getState();
    const etatWeb = useWebStore.getState();
    const etatHorloge = useClockStore.getState();
    const etatGlobal = useSessionStore.getState();

    afterEach(() => {
        useSessionOSStore.setState(etatSession);
        useNPCStore.setState(etatNpc);
        useWebStore.setState(etatWeb);
        useClockStore.setState(etatHorloge);
        useSessionStore.setState(etatGlobal);
    });

    it('la dernière occurrence gagne pour les joueurs, leurs personnages et les PNJ, sans perdre les champs annexes', () => {
        const lu = FullSessionSchema.parse({ modules: { sessionOS: {
            players: [
                { id: 'p1', realName: 'Ancien joueur' },
                { id: 'p2', realName: 'Deuxième joueur' },
                { id: 'p1', realName: 'Joueur retenu', précision: 'conservée', characters: [
                    { id: 'pj1', name: 'Ancien personnage' },
                    { id: 'pj2', name: 'Deuxième personnage' },
                    { id: 'pj1', name: 'Personnage retenu', inventaireAncien: { sac: ['corde'] } },
                ] },
            ],
            entities: [
                { id: 'e1', name: 'Ancien PNJ' }, { id: 'e2', name: 'Deuxième PNJ' },
                { id: 'e1', name: 'PNJ retenu', ancienChamp: { valeur: 7 } },
            ],
            actes: [{ id: 'acte-ancien', titre: 'Acte conservé' }],
        } } });

        SessionService.distributeData(lu);

        const restaure = useSessionOSStore.getState();
        expect(restaure.players.map(p => p.id)).toEqual(['p1', 'p2']);
        expect(restaure.players[0]).toMatchObject({ realName: 'Joueur retenu', précision: 'conservée' });
        expect(restaure.players[0].characters).toMatchObject([
            { id: 'pj1', name: 'Personnage retenu', inventaireAncien: { sac: ['corde'] } },
            { id: 'pj2', name: 'Deuxième personnage' },
        ]);
        expect(restaure.players[1].characters).toEqual([]);
        expect(restaure.entities).toEqual([
            { id: 'e1', name: 'PNJ retenu', ancienChamp: { valeur: 7 } },
            { id: 'e2', name: 'Deuxième PNJ' },
        ]);
        expect(restaure.actes).toEqual([{ id: 'acte-ancien', titre: 'Acte conservé' }]);
    });

    it.each([false, true])('les listes absentes restent ; seules celles présentes à vide sont vidées (%s)', (vider) => {
        // Données volontairement lacunaires : elles représentent une ancienne archive.
        const anciensPnj = [{ id: 'e-ancien', name: 'PNJ conservé' }] as unknown as Entity[];
        const anciensIndices = [{ id: 'i-ancien', title: 'Indice conservé' }] as unknown as Clue[];
        useSessionOSStore.setState({ entities: anciensPnj, clues: anciensIndices });
        const lu = FullSessionSchema.parse({ modules: { sessionOS: vider ? { entities: [], clues: [] } : {} } });

        SessionService.distributeData(lu);

        expect(useSessionOSStore.getState().entities).toEqual(vider ? [] : anciensPnj);
        expect(useSessionOSStore.getState().clues).toEqual(vider ? [] : anciensIndices);
    });

    it('charge les fiches NPC, les liens et le temps via le pont simulé, sans remplacer les autres réglages', async () => {
        const fiche = { id: 'n-essai', name: 'PNJ', category: 'npcs', gmNotes: 'notes privées', fields: { métier: 'pilote' }, timestamp: 1 };
        const npcAvant = useNPCStore.getState();
        const horlogeAvant = useClockStore.getState();
        const session = window.appBridge?.session;
        if (!session) throw new Error('Pont simulé absent');
        session.loadSession = vi.fn(async () => ({ modules: {
            npc: { savedEntities: [fiche] },
            web: { links: [{ id: 'w-essai', name: 'Lien', url: 'https://exemple.invalid', détailAncien: 'conservé' }] },
            clock: { timestamp: 60_000 },
        } }));

        await SessionService.loadFullSession();

        expect(session.loadSession).toHaveBeenCalledOnce();
        expect(useNPCStore.getState().savedEntities).toEqual([fiche]);
        expect(useNPCStore.getState().currentEntity).toBe(npcAvant.currentEntity);
        expect(useNPCStore.getState().config).toBe(npcAvant.config);
        expect(useWebStore.getState().links).toEqual([
            { id: 'w-essai', name: 'Lien', url: 'https://exemple.invalid', color: 'blue', détailAncien: 'conservé' },
        ]);
        expect(useClockStore.getState().timestamp).toBe(60_000);
        expect(useClockStore.getState().mode).toBe(horlogeAvant.mode);
        expect(useClockStore.getState().calendars).toBe(horlogeAvant.calendars);
    });

    it('une archive illisible ne distribue aucune donnée aux magasins', async () => {
        const session = window.appBridge?.session;
        if (!session) throw new Error('Pont simulé absent');
        session.loadSession = vi.fn(async () => ({ modules: { sessionOS: {
            campaigns: [{ id: 'cassée', name: 'Campagne sans système' }],
        } } }));
        const ecrireSession = vi.spyOn(useSessionOSStore, 'setState');
        const ecrireNpc = vi.spyOn(useNPCStore, 'setState');
        const ecrireWeb = vi.spyOn(useWebStore, 'setState');
        const ecrireHorloge = vi.spyOn(useClockStore, 'setState');

        await SessionService.loadFullSession();

        expect(ecrireSession).not.toHaveBeenCalled();
        expect(ecrireNpc).not.toHaveBeenCalled();
        expect(ecrireWeb).not.toHaveBeenCalled();
        expect(ecrireHorloge).not.toHaveBeenCalled();
    });
});
