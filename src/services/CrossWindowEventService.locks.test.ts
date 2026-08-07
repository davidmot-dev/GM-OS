import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { crossWindowSync } from './CrossWindowEventService';

/**
 * Point 4 du plan des restes : `isTokenLocked` n'était pas réactif.
 *
 * Il était lu pendant le rendu de `MapTokenNode` sans que rien n'y soit abonné.
 * Un verrou pris ou relâché ailleurs n'entraînait aucun re-rendu, et le jeton
 * restait affiché comme saisissable jusqu'au rendu suivant, quelle qu'en soit la
 * cause. La protection tenait — `requestLock` refuse —, mais l'écran mentait.
 *
 * L'expiration compte autant que les messages : un verrou meurt au bout de cinq
 * secondes sans que personne n'émette quoi que ce soit.
 */

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('CrossWindowEventService — abonnement aux verrous', () => {
    it('prévient les abonnés quand un verrou est pris', () => {
        const vu = vi.fn();
        const desabonner = crossWindowSync.subscribeLocks(vu);

        crossWindowSync.requestLock('jeton-a');

        expect(vu).toHaveBeenCalled();
        desabonner();
    });

    it('prévient les abonnés quand un verrou est relâché', () => {
        crossWindowSync.requestLock('jeton-b');

        const vu = vi.fn();
        const desabonner = crossWindowSync.subscribeLocks(vu);
        crossWindowSync.releaseLock('jeton-b');

        expect(vu).toHaveBeenCalled();
        desabonner();
    });

    it('un abonné retiré ne reçoit plus rien', () => {
        const vu = vi.fn();
        crossWindowSync.subscribeLocks(vu)();

        crossWindowSync.requestLock('jeton-c');

        expect(vu).not.toHaveBeenCalled();
    });

    it("la version change à chaque mouvement, de quoi alimenter useSyncExternalStore", () => {
        const avant = crossWindowSync.getLocksVersion();

        crossWindowSync.requestLock('jeton-d');
        const apresPrise = crossWindowSync.getLocksVersion();
        crossWindowSync.releaseLock('jeton-d');

        expect(apresPrise).toBeGreaterThan(avant);
        expect(crossWindowSync.getLocksVersion()).toBeGreaterThan(apresPrise);
    });

    it("l'expiration réveille les abonnés, sans qu'aucun message n'arrive", () => {
        // Le cas que rien ne couvrait : un verrou meurt tout seul au bout de
        // cinq secondes, et personne n'annonce sa mort.
        crossWindowSync.requestLock('jeton-e');

        const vu = vi.fn();
        const desabonner = crossWindowSync.subscribeLocks(vu);

        vi.advanceTimersByTime(5100);

        expect(vu).toHaveBeenCalled();
        desabonner();
    });

    it('un verrou pris par soi-même ne se déclare pas verrouillé', () => {
        crossWindowSync.requestLock('jeton-f');

        // `isTokenLocked` répond « tenu par quelqu'un d'autre », pas « tenu ».
        expect(crossWindowSync.isTokenLocked('jeton-f')).toBe(false);
    });
});
