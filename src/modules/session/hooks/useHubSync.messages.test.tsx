import { act, cleanup, renderHook } from '@testing-library/react';
import { createStore } from 'zustand/vanilla';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHubSync } from './useHubSync';
import type { NomDeMagasinDuHub } from '../../../utils/magasinsDuHub';
import type { DonneesDuHub } from '../../remote/types/donneesDuHub';

const fenetre = window as unknown as Record<string, unknown>;
const anciens = new Map<string, unknown>();
const noms: NomDeMagasinDuHub[] = ['useImageStore', 'useClockStore', 'useFavoriteStore',
    'useCombatStore', 'useSessionOSStore', 'useClientStore', 'useSyncStore', 'useDiceStore',
    'useMapStore', 'useMapUIStore', 'useWhiteboardStore', 'useRessourcesDeTableStore'];
let diffuser: (payload: unknown) => void;
let projeter: (type: string, payload: unknown) => void;
const sockets: SocketFactice[] = [];

class SocketFactice {
    static OPEN = 1;
    readyState = 0;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    constructor() { sockets.push(this); }
    send() {}
    close() {}
}
function recevoir(type: string, payload: unknown) {
    act(() => sockets.at(-1)?.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ type, payload }) })));
}
function installer<T>(nom: NomDeMagasinDuHub, etat: T) {
    const magasin = createStore(() => etat);
    fenetre[nom] = magasin;
    return magasin;
}
function sessionInitiale() {
    return {
        sessions: [], campaigns: [{ id: 'c1', name: 'Chronique', system: 'generic', activeLocationIds: [] }],
        players: [], entities: [], atlasMaps: [], clues: [], transferRequests: [], connectedCharacters: {},
        activeCampaignId: 'c1', activeCampaignName: 'Chronique', activeCampaignWallpaper: 'decor.jpg',
        customSheetTemplates: [{ id: 'gabarit-maison' }], customGameDrivers: [{ id: 'pilote-maison' }],
        decks: [{ id: 'paquet' }], mainsDesPaquets: { paquet: [{ porteur: null, revelees: [2], scellees: 1 }] },
        demandesDeCarte: [{ id: 'demande' }], cartesRestantes: { paquet: 7 },
    };
}

beforeEach(() => {
    sockets.length = 0;
    for (const nom of [...noms, 'appBridge']) { anciens.set(nom, fenetre[nom]); delete fenetre[nom]; }
    vi.stubGlobal('WebSocket', SocketFactice);
    installer('useClientStore', { deviceId: 'd1', pseudo: '', playerName: '', characterId: null, isOnboarded: false });
    fenetre.appBridge = {
        remote: { onBroadcastSync: (rappel: typeof diffuser) => { diffuser = rappel; return vi.fn(); } },
        image: { onSyncHubData: (rappel: typeof projeter) => { projeter = rappel; return vi.fn(); } },
    };
});
afterEach(() => {
    cleanup();
    for (const [nom, ancien] of anciens) {
        if (ancien === undefined) delete fenetre[nom]; else fenetre[nom] = ancien;
    }
    anciens.clear();
    vi.unstubAllGlobals();
});

describe('messages réels du Hub, par IPC et WebSocket', () => {
    it('fusionne un diff Session sans effacer campagnes, gabarits, cartes ni méthodes', () => {
        const action = vi.fn();
        const etat = sessionInitiale();
        const magasin = installer('useSessionOSStore', { ...etat, setCharacterLocks: action });
        renderHook(() => useHubSync());
        recevoir('sync', { session: { players: [], characterLocks: { pj: 'd1' } } } satisfies DonneesDuHub);
        expect(magasin.getState()).toEqual({ ...etat, connectedCharacters: { pj: 'd1' }, setCharacterLocks: action });
        act(() => diffuser({ session: { connectedCharacters: {}, setCharacterLocks: 'écraser', activeCampaignWallpaper: null } }));
        expect(magasin.getState().connectedCharacters).toEqual({});
        expect(magasin.getState().activeCampaignWallpaper).toBeNull();
        expect(magasin.getState().setCharacterLocks).toBe(action);
        expect(magasin.getState().decks).toBe(etat.decks);
    });

    it('applique les effacements explicites et les zéros dans les segments partiels', () => {
        const magasin = installer('useSessionOSStore', sessionInitiale());
        const clock = installer('useClockStore', { timestamp: 123, mode: 'timer', theme: 'modern', tensions: [], isClockProjected: true, timerRemaining: 8 });
        renderHook(() => useHubSync());
        act(() => diffuser({ clock: { timerRemaining: 0, isClockProjected: false }, session: {
            customSheetTemplates: [], customGameDrivers: [], decks: [], demandesDeCarte: [], mainsDesPaquets: {}, cartesRestantes: {},
        } } satisfies DonneesDuHub));
        expect(clock.getState().timerRemaining).toBe(0);
        expect(clock.getState().isClockProjected).toBe(false);
        expect(clock.getState().timestamp).toBe(123);
        expect(magasin.getState().customSheetTemplates).toEqual([]);
        expect(magasin.getState().customGameDrivers).toEqual([]);
        expect(magasin.getState().decks).toEqual([]);
        expect(magasin.getState().demandesDeCarte).toEqual([]);
        expect(magasin.getState().mainsDesPaquets).toEqual({});
        expect(magasin.getState().cartesRestantes).toEqual({});
    });

    it('ne réécrit que la réserve de la campagne diffusée', () => {
        installer('useSessionOSStore', sessionInitiale());
        const reserves = installer('useRessourcesDeTableStore', { reserves: { c1: { impulsion: 3 }, c2: { impulsion: 8 } } });
        renderHook(() => useHubSync());
        recevoir('sync', { session: { activeCampaignId: 'c1', reservesDeTable: { impulsion: 0 } } } satisfies DonneesDuHub);
        expect(reserves.getState().reserves).toEqual({ c1: { impulsion: 0 }, c2: { impulsion: 8 } });
    });

    it('garde les coordonnées du jeton saisi sans muter le message reçu', () => {
        const token = { id: 't1', name: 'PJ', avatar: '', size: 1, x: 50, y: 60 };
        const map = installer('useMapStore', { projectedTokens: [token] });
        installer('useMapUIStore', { isDraggingToken: true, selectedTokenId: 't1' });
        renderHook(() => useHubSync());
        const payload = { map: { projectedTokens: [{ ...token, name: 'Renommé', x: 4, y: 5 }] } } satisfies DonneesDuHub;
        act(() => diffuser(payload));
        expect(map.getState().projectedTokens).toEqual([{ ...token, name: 'Renommé' }]);
        expect(payload.map.projectedTokens[0].x).toBe(4);
        act(() => diffuser({ map: { projectedTokens: [] } } satisfies DonneesDuHub));
        expect(map.getState().projectedTokens).toEqual([]);
    });

    it('restaure la Date du jet JSON et garde les réglages absents', () => {
        const dice = installer('useDiceStore', { lastRoll: null as unknown, isDiceProjected: false, projectionTrigger: 0, enable3D: false, styleDesDes: 'metal' });
        renderHook(() => useHubSync());
        const roll = { id: 'r1', title: 'Test', timestamp: new Date('2026-10-08T12:00:00Z'), total: 6, rolls: [{ val: 6, sides: 6 }], modifier: 0, totalDisplay: '6' };
        recevoir('sync', { dice: { lastRoll: roll } } satisfies DonneesDuHub);
        expect(dice.getState().lastRoll).toEqual(roll);
        expect(dice.getState().enable3D).toBe(false);
        expect(dice.getState().styleDesDes).toBe('metal');
        act(() => diffuser({ dice: { lastRoll: null } } satisfies DonneesDuHub));
        expect(dice.getState().lastRoll).toBeNull();
    });

    it('ignore une charge mal formée, puis reçoit le message suivant', () => {
        const magasin = installer('useSessionOSStore', sessionInitiale());
        const { result } = renderHook(() => useHubSync());
        recevoir('sync', { session: { players: 'effacer' }, notes: { public: 'invalide' } });
        expect(result.current.sessionSummary).toBe('');
        expect(magasin.getState().players).toEqual([]);
        recevoir('sync', { notes: { public: 'Valide' } });
        expect(result.current.sessionSummary).toBe('Valide');
    });

    it('valide les entités/règles des deux voies et distingue noir et remise à zéro', () => {
        const { result } = renderHook(() => useHubSync());
        recevoir('hub-projection', { type: 'entity', data: JSON.stringify({ id: 'e1', name: 'PNJ', fields: { role: 'Témoin' } }) });
        expect(result.current.liveEntity?.name).toBe('PNJ');
        act(() => projeter('entity', '{cassé'));
        expect(result.current.liveEntity?.name).toBe('PNJ');
        recevoir('session:display-rule', { title: 'Combat', content: 'Texte', category: 'rule' });
        expect(result.current.sharedRule?.title).toBe('Combat');
        act(() => projeter('session:display-rule', { title: 42 }));
        expect(result.current.sharedRule?.title).toBe('Combat');
        act(() => projeter('session:display-rule', null));
        expect(result.current.sharedRule).toBeNull();
        act(() => diffuser({ type: 'BLACKOUT' }));
        expect(result.current.liveImagePath).toBeNull();
        expect(result.current.liveEntity).toBeNull();
        act(() => diffuser({ type: 'FULL_RESET' }));
        expect(result.current.liveImagePath).toBeUndefined();
    });
});
