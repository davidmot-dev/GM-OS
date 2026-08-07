import { describe, it, expect, vi } from 'vitest';
import { evaluateRelay, type RelayRole } from './relayPolicy';
import { installWindowRelay, RELAY_PUBLISH_CHANNEL, type RelayTarget } from './WindowRelay';

describe('relayPolicy — la politique seule', () => {
    it('la fenêtre MJ émet tout, y compris ce qui n\'est listé nulle part', () => {
        for (const type of ['clock', 'combat', 'map', 'whiteboard', 'hub:ready', 'type-inconnu']) {
            expect(evaluateRelay('gm', type).allowed).toBe(true);
        }
    });

    it.each([
        ['hub', 'whiteboard'],
        ['hub', 'map'],
        ['hub', 'map:lock'],
        ['hub', 'map:unlock'],
        ['hub', 'hub:ready'],
        ['projector', 'hub:ready'],
        ['projector', 'map:lock'],
    ] as const)("la fenêtre '%s' émet légitimement '%s'", (role, type) => {
        expect(evaluateRelay(role, type).allowed).toBe(true);
    });

    it.each([
        ['hub', 'clock'],
        ['hub', 'combat'],
        ['projector', 'clock'],
        ['projector', 'combat'],
    ] as const)("la fenêtre '%s' ne peut pas émettre '%s' — flux du MJ", (role, type) => {
        const verdict = evaluateRelay(role, type);
        expect(verdict.allowed).toBe(false);
        expect(verdict.detail).toContain(type);
    });

    it('refuse par défaut un type non énoncé', () => {
        expect(evaluateRelay('hub', 'type-invente-demain').allowed).toBe(false);
    });

    it("une fenêtre qu'on ne sait pas rattacher n'émet rien", () => {
        for (const type of ['map:lock', 'hub:ready', 'whiteboard', 'map']) {
            expect(evaluateRelay('unknown', type).allowed).toBe(false);
        }
    });
});

/** Cible factice qui note ce qu'elle a reçu. */
function fakeTarget(id: number) {
    const received: Array<{ message: string; senderRole: string }> = [];
    const target: RelayTarget = {
        id,
        isDestroyed: () => false,
        send: (_channel, message, senderRole) => { received.push({ message, senderRole }); },
    };
    return { target, received };
}

/** `ipcMain` factice : retient le gestionnaire pour le déclencher à la main. */
function fakeIpc() {
    let handler: ((event: { sender: { id: number } }, type: unknown, message: unknown) => void) | null = null;
    return {
        ipc: { on: (_channel: string, listener: NonNullable<typeof handler>) => { handler = listener; } },
        publish: (senderId: number, type: unknown, message: unknown) =>
            handler?.({ sender: { id: senderId } }, type, message),
    };
}

describe('relayPolicy — câblée dans le relais', () => {
    /** 1 = MJ, 2 = Player Hub, 3 = destinataire neutre. */
    const roleOf = (id: number): RelayRole => (id === 1 ? 'gm' : id === 2 ? 'hub' : 'projector');

    function setup() {
        const gm = fakeTarget(1);
        const hub = fakeTarget(2);
        const onDenied = vi.fn();
        const { ipc, publish } = fakeIpc();

        installWindowRelay(ipc, () => [gm.target, hub.target], { resolveRole: roleOf, onDenied });
        return { gm, hub, publish, onDenied };
    }

    it('un message légitime du hub atteint le MJ, estampillé de son rôle', () => {
        const { gm, publish } = setup();

        publish(2, 'whiteboard', '{"type":"whiteboard"}');

        expect(gm.received).toEqual([{ message: '{"type":"whiteboard"}', senderRole: 'hub' }]);
    });

    it("un message refusé n'atteint personne", () => {
        const { gm, hub, publish, onDenied } = setup();

        publish(2, 'combat', '{"type":"combat"}');

        expect(gm.received).toHaveLength(0);
        expect(hub.received).toHaveLength(0);
        expect(onDenied).toHaveBeenCalledWith('hub', 'combat', expect.stringContaining('combat'));
    });

    it('le MJ reste libre de tout émettre', () => {
        const { hub, publish } = setup();

        publish(1, 'combat', '{"type":"combat"}');

        expect(hub.received).toEqual([{ message: '{"type":"combat"}', senderRole: 'gm' }]);
    });

    it('un émetteur inconnu du registre est refusé', () => {
        const { gm, publish, onDenied } = setup();

        // 99 n'est aucune des fenêtres connues : roleOf le classe 'projector'
        // dans ce test, mais en production `resolveRole` renverrait 'unknown'.
        publish(99, 'clock', '{"type":"clock"}');

        expect(gm.received).toHaveLength(0);
        expect(onDenied).toHaveBeenCalled();
    });

    it('le contrat de la chaîne tient toujours : un objet est refusé', () => {
        const { gm, publish } = setup();

        publish(1, 'map', { type: 'map' } as unknown);

        expect(gm.received).toHaveLength(0);
    });

    it('un type non textuel est refusé', () => {
        const { gm, publish } = setup();

        publish(1, 42 as unknown, '{"type":"map"}');

        expect(gm.received).toHaveLength(0);
    });
});
