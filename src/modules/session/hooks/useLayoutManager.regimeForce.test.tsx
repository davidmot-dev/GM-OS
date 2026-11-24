// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

/**
 * **« Atelier (forcé) » libère la Bibliothèque pendant une séance** (24/11/2026, § 1 bis du 07/11).
 * Le bandeau annonçait l'atelier, mais `useLayoutManager` lisait le seul moment de jeu et ramenait au
 * cockpit toute vue d'atelier. Le forçage du meneur décide désormais des vues permises à l'écran.
 */

vi.mock('../../../stores/useToastStore', () => ({ gmToast: () => {} }));

const { useLayoutManager } = await import('./useLayoutManager');
const { useSessionOSStore } = await import('../useSessionOSStore');
const { useSessionStore } = await import('../../../store/useSessionStore');

const Sonde = () => { useLayoutManager(); return null; };
const vue = () => useSessionOSStore.getState().currentView;
const initialOS = useSessionOSStore.getState();
const initial = useSessionStore.getState();

beforeEach(() => {
    useSessionOSStore.setState({ activeCampaignId: null, sessions: [{ id: 's1', status: 'active' }], currentView: 'library' } as never);
});
afterEach(() => { cleanup(); useSessionOSStore.setState(initialOS, true); useSessionStore.setState(initial, true); });

describe('le classement des vues suit le régime de l’écran', () => {
    it('en séance, sans forçage : la Bibliothèque rend la main au cockpit (inchangé)', () => {
        useSessionStore.setState({ surchargeDuRegime: null });
        render(<Sonde />);
        expect(vue()).not.toBe('library');
    });

    it('en séance, « Atelier (forcé) » : la Bibliothèque reste ouverte', () => {
        useSessionStore.setState({ surchargeDuRegime: 'preparation' });
        render(<Sonde />);
        expect(vue()).toBe('library');
    });

    it('le forçage levé, la séance reprend la main sur l’écran', () => {
        useSessionStore.setState({ surchargeDuRegime: 'preparation' });
        render(<Sonde />);
        act(() => useSessionStore.setState({ surchargeDuRegime: null }));
        expect(vue()).not.toBe('library');
    });

    it('hors séance, « Table (forcée) » écarte une vue d’atelier, comme le dit le bandeau', () => {
        useSessionOSStore.setState({ sessions: [] } as never);
        useSessionStore.setState({ surchargeDuRegime: 'partie' });
        render(<Sonde />);
        expect(vue()).not.toBe('library');
    });
});
