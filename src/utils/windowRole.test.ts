import { describe, it, expect, afterEach, vi } from 'vitest';
import { getWindowRole, isMainWindow } from './windowRole';

const setSearch = (search: string) => {
    vi.stubGlobal('window', { ...window, location: { ...window.location, search } });
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('getWindowRole', () => {
    it('reconnaît les fenêtres secondaires', () => {
        setSearch('?window=hub');
        expect(getWindowRole()).toBe('hub');

        setSearch('?window=tablet');
        expect(getWindowRole()).toBe('tablet');

        setSearch('?window=projector');
        expect(getWindowRole()).toBe('projector');

        setSearch('?window=remote');
        expect(getWindowRole()).toBe('remote');
    });

    it('considère comme fenêtre MJ tout ce qui n\'est pas reconnu', () => {
        setSearch('');
        expect(getWindowRole()).toBe('gm');

        setSearch('?autre=chose');
        expect(getWindowRole()).toBe('gm');

        // Un rôle inconnu ne doit pas priver la fenêtre principale de ses droits
        // par accident ; à l'inverse, il n'accorde rien de plus non plus.
        setSearch('?window=inconnu');
        expect(getWindowRole()).toBe('gm');
    });

    it('tolère les paramètres additionnels', () => {
        setSearch('?window=hub&mode=adventure');
        expect(getWindowRole()).toBe('hub');
    });
});

describe('isMainWindow', () => {
    it('n\'est vrai que pour la fenêtre MJ', () => {
        setSearch('');
        expect(isMainWindow()).toBe(true);

        for (const role of ['hub', 'tablet', 'projector', 'remote']) {
            setSearch(`?window=${role}`);
            expect(isMainWindow()).toBe(false);
        }
    });
});
