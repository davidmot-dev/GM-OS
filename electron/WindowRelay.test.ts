import { describe, it, expect, vi } from 'vitest';
import {
    relayToOthers,
    installWindowRelay,
    RELAY_MESSAGE_CHANNEL,
    RELAY_PUBLISH_CHANNEL,
    type RelayTarget,
} from './WindowRelay';
import type { RelayRole } from './relayPolicy';

/** Fenêtre factice : enregistre ce qu'elle reçoit. */
function fakeWindow(id: number, options: { destroyed?: boolean; throws?: boolean; role?: RelayRole } = {}) {
    const received: { channel: string; message: string }[] = [];
    const target: RelayTarget & { received: typeof received } = {
        id,
        // Ces cas portent sur le transport, pas sur l'aiguillage par audience :
        // des destinataires MJ laissent passer tout ce qui est émis.
        role: options.role ?? 'gm',
        received,
        isDestroyed: () => options.destroyed === true,
        send: (channel, message) => {
            if (options.throws) throw new Error('fenêtre détruite');
            received.push({ channel, message });
        },
    };
    return target;
}

describe('relayToOthers', () => {
    it('sert toutes les fenêtres sauf l\'émetteur', () => {
        const a = fakeWindow(1);
        const b = fakeWindow(2);
        const c = fakeWindow(3);

        const delivered = relayToOthers([a, b, c], 1, '{"type":"clock"}');

        expect(delivered).toBe(2);
        expect(a.received).toHaveLength(0);
        expect(b.received).toEqual([{ channel: RELAY_MESSAGE_CHANNEL, message: '{"type":"clock"}' }]);
        expect(c.received).toHaveLength(1);
    });

    it('ne renvoie rien à l\'émetteur, même seul', () => {
        const a = fakeWindow(1);
        expect(relayToOthers([a], 1, 'x')).toBe(0);
        expect(a.received).toHaveLength(0);
    });

    it('ignore les fenêtres détruites sans priver les autres', () => {
        const dead = fakeWindow(2, { destroyed: true });
        const alive = fakeWindow(3);

        expect(relayToOthers([dead, alive], 1, 'x')).toBe(1);
        expect(dead.received).toHaveLength(0);
        expect(alive.received).toHaveLength(1);
    });

    it('absorbe l\'échec d\'une fenêtre détruite entre le test et l\'envoi', () => {
        // isDestroyed() ment : la fenêtre disparaît juste après la vérification.
        const racing = fakeWindow(2, { throws: true });
        const alive = fakeWindow(3);

        expect(() => relayToOthers([racing, alive], 1, 'x')).not.toThrow();
        expect(alive.received).toHaveLength(1);
    });

    it('transmet la chaîne telle quelle, sans la retoucher', () => {
        const b = fakeWindow(2);
        const message = JSON.stringify({ type: 'whiteboard', payload: { paths: [{ id: 'p1' }] } });

        relayToOthers([b], 1, message);

        expect(b.received[0].message).toBe(message);
    });

    it('ne fait rien quand il n\'y a aucune autre fenêtre', () => {
        expect(relayToOthers([], 1, 'x')).toBe(0);
    });
});

describe('installWindowRelay', () => {
    type Listener = (event: { sender: { id: number } }, type: unknown, message: unknown) => void;

    /** ipcMain factice : retient le listener pour pouvoir le déclencher. */
    function fakeIpc() {
        const handlers = new Map<string, Listener>();
        return {
            on: (channel: string, listener: Listener) => {
                handlers.set(channel, listener);
            },
            // `type` par défaut : ces cas-ci portent sur le transport, pas sur la
            // politique de rôle — voir electron/relayPolicy.test.ts.
            emit: (channel: string, senderId: number, message: unknown, type: unknown = 'clock') => {
                handlers.get(channel)?.({ sender: { id: senderId } }, type, message);
            },
            has: (channel: string) => handlers.has(channel),
        };
    }

    /** Toutes les fenêtres sont MJ : la politique laisse tout passer. */
    const gmPolicy = { resolveRole: () => 'gm' as const };

    it('écoute le canal de publication', () => {
        const ipc = fakeIpc();
        installWindowRelay(ipc, () => [], gmPolicy);
        expect(ipc.has(RELAY_PUBLISH_CHANNEL)).toBe(true);
    });

    it('diffuse aux autres fenêtres à la réception', () => {
        const ipc = fakeIpc();
        const a = fakeWindow(1);
        const b = fakeWindow(2);
        installWindowRelay(ipc, () => [a, b], gmPolicy);

        ipc.emit(RELAY_PUBLISH_CHANNEL, 1, 'salut');

        expect(b.received).toEqual([{ channel: RELAY_MESSAGE_CHANNEL, message: 'salut' }]);
        expect(a.received).toHaveLength(0);
    });

    it('refuse un message qui n\'est pas une chaîne', () => {
        // Le contrat du relais est une chaîne déjà sérialisée. Sérialiser à la
        // place de l'appelant masquerait la régression de performance que la
        // mesure du 2026-08-06 a justement mise en évidence.
        const ipc = fakeIpc();
        const b = fakeWindow(2);
        installWindowRelay(ipc, () => [b], gmPolicy);

        ipc.emit(RELAY_PUBLISH_CHANNEL, 1, { type: 'clock' });
        ipc.emit(RELAY_PUBLISH_CHANNEL, 1, 42);
        ipc.emit(RELAY_PUBLISH_CHANNEL, 1, null);
        ipc.emit(RELAY_PUBLISH_CHANNEL, 1, undefined);

        expect(b.received).toHaveLength(0);
    });

    it('réévalue la liste des fenêtres à chaque message', () => {
        // Le Player Hub et le projecteur vont et viennent : un registre capturé
        // une fois se désynchroniserait.
        const ipc = fakeIpc();
        const a = fakeWindow(1);
        const late = fakeWindow(2);
        const windows: RelayTarget[] = [a];
        const listTargets = vi.fn(() => windows);

        installWindowRelay(ipc, listTargets, gmPolicy);

        ipc.emit(RELAY_PUBLISH_CHANNEL, 1, 'avant');
        expect(late.received).toHaveLength(0);

        windows.push(late);
        ipc.emit(RELAY_PUBLISH_CHANNEL, 1, 'apres');

        expect(late.received).toEqual([{ channel: RELAY_MESSAGE_CHANNEL, message: 'apres' }]);
        expect(listTargets).toHaveBeenCalledTimes(2);
    });
});
