import { describe, it, expect } from 'vitest';
import { TokenLockRegistry, buildUnlockMessage, type ReleasedLock } from './TokenLockRegistry';

const lockMessage = (tokenId: string, senderId = 'renderer-a') =>
    JSON.stringify({ type: 'map:lock', payload: { tokenId }, senderId });

const unlockMessage = (tokenId: string, senderId = 'renderer-a') =>
    JSON.stringify({ type: 'map:unlock', payload: { tokenId }, senderId });

describe('TokenLockRegistry — observation', () => {
    it('retient un verrou pris par une fenêtre', () => {
        const registry = new TokenLockRegistry();
        registry.observe(1, lockMessage('jeton-1'));

        expect(registry.size).toBe(1);
        expect(registry.releaseForWindow(1)).toEqual([
            { tokenId: 'jeton-1', windowId: 1, senderId: 'renderer-a' },
        ]);
    });

    it('oublie un verrou relâché normalement', () => {
        const registry = new TokenLockRegistry();
        registry.observe(1, lockMessage('jeton-1'));
        registry.observe(1, unlockMessage('jeton-1'));

        expect(registry.size).toBe(0);
    });

    it('ignore les messages qui ne concernent pas les verrous', () => {
        // Le registre est un spectateur du flux relayé : tout le reste y passe
        // aussi, et ne doit rien lui faire.
        const registry = new TokenLockRegistry();
        registry.observe(1, JSON.stringify({ type: 'clock', payload: { timestamp: 1 }, senderId: 'x' }));
        registry.observe(1, JSON.stringify({ type: 'combat', payload: { round: 2 }, senderId: 'x' }));

        expect(registry.size).toBe(0);
    });

    it('ignore ce qui n\'est pas décodable ou pas exploitable', () => {
        const registry = new TokenLockRegistry();
        registry.observe(1, '{tronqué');
        registry.observe(1, 'null');
        registry.observe(1, JSON.stringify({ type: 'map:lock' }));
        registry.observe(1, JSON.stringify({ type: 'map:lock', payload: {} }));
        registry.observe(1, JSON.stringify({ type: 'map:lock', payload: { tokenId: '' } }));
        registry.observe(1, JSON.stringify({ type: 'map:lock', payload: { tokenId: 42 } }));
        registry.observe(1, { type: 'map:lock', payload: { tokenId: 'x' } } as unknown);

        expect(registry.size).toBe(0);
    });

    it('réattribue un verrou repris par une autre fenêtre', () => {
        // Le registre reflète ce que les renderers ont décidé — l'expiration de
        // cinq secondes leur permet de reprendre un verrou étranger périmé.
        const registry = new TokenLockRegistry();
        registry.observe(1, lockMessage('jeton-1', 'renderer-a'));
        registry.observe(2, lockMessage('jeton-1', 'renderer-b'));

        expect(registry.releaseForWindow(1)).toEqual([]);
        expect(registry.releaseForWindow(2)).toEqual([
            { tokenId: 'jeton-1', windowId: 2, senderId: 'renderer-b' },
        ]);
    });

    it('tolère un senderId absent', () => {
        const registry = new TokenLockRegistry();
        registry.observe(1, JSON.stringify({ type: 'map:lock', payload: { tokenId: 'jeton-1' } }));

        expect(registry.releaseForWindow(1)).toEqual([
            { tokenId: 'jeton-1', windowId: 1, senderId: '' },
        ]);
    });
});

describe('TokenLockRegistry — libération à la fermeture', () => {
    it('libère tous les verrous de la fenêtre fermée, et eux seuls', () => {
        const registry = new TokenLockRegistry();
        registry.observe(1, lockMessage('jeton-1', 'renderer-a'));
        registry.observe(1, lockMessage('jeton-2', 'renderer-a'));
        registry.observe(2, lockMessage('jeton-3', 'renderer-b'));

        const released = registry.releaseForWindow(1);

        expect(released.map(l => l.tokenId).sort()).toEqual(['jeton-1', 'jeton-2']);
        expect(registry.size).toBe(1);
    });

    it('ne rend rien pour une fenêtre sans verrou', () => {
        const registry = new TokenLockRegistry();
        registry.observe(1, lockMessage('jeton-1'));

        expect(registry.releaseForWindow(99)).toEqual([]);
        expect(registry.size).toBe(1);
    });

    it('est sans effet si on la rappelle', () => {
        const registry = new TokenLockRegistry();
        registry.observe(1, lockMessage('jeton-1'));

        expect(registry.releaseForWindow(1)).toHaveLength(1);
        expect(registry.releaseForWindow(1)).toEqual([]);
    });
});

describe('buildUnlockMessage', () => {
    it('reproduit l\'enveloppe qu\'aurait émise le détenteur', () => {
        // La réception ne doit pas distinguer un déverrouillage d'origine d'un
        // déverrouillage de nettoyage.
        const lock: ReleasedLock = { tokenId: 'jeton-1', windowId: 3, senderId: 'renderer-ferme' };

        expect(JSON.parse(buildUnlockMessage(lock))).toEqual({
            type: 'map:unlock',
            payload: { tokenId: 'jeton-1' },
            senderId: 'renderer-ferme',
        });
    });

    it('produit une chaîne, comme l\'exige le relais', () => {
        expect(typeof buildUnlockMessage({ tokenId: 'j', windowId: 1, senderId: 's' })).toBe('string');
    });

    it('boucle avec le registre : ce qui est relâché est bien déverrouillable', () => {
        const registry = new TokenLockRegistry();
        registry.observe(7, lockMessage('jeton-1', 'renderer-a'));

        const messages = registry.releaseForWindow(7).map(buildUnlockMessage);
        const replay = new TokenLockRegistry();
        replay.observe(7, lockMessage('jeton-1', 'renderer-a'));
        messages.forEach(m => replay.observe(7, m));

        expect(replay.size).toBe(0);
    });
});
