import { describe, expect, it, vi } from 'vitest';
import { messageDException } from './messageDException';

describe('message des exceptions inconnues', () => {
    it.each([
        { exception: new Error('MCP_AUTH_EXPIRED'), attendu: 'MCP_AUTH_EXPIRED' },
        { exception: { message: 'message du pont' }, attendu: 'message du pont' },
        { exception: { message: 42 }, attendu: '42' },
        { exception: Object.assign(() => {}, { message: 'message de fonction' }), attendu: 'message de fonction' },
    ])('garde le message et ne calcule pas le repli ($attendu)', ({ exception, attendu }) => {
        const repli = vi.fn(() => 'repli');
        expect(messageDException(exception, repli)).toBe(attendu);
        expect(repli).not.toHaveBeenCalled();
    });

    it.each([null, undefined, 'exception primitive', 42, {}, { message: '' }, { message: 0 }, { message: false }])(
        'applique le repli historique à %j', exception => {
            const repli = vi.fn(() => 'repli');
            expect(messageDException(exception, repli)).toBe('repli');
            expect(repli).toHaveBeenCalledTimes(1);
        },
    );
});
