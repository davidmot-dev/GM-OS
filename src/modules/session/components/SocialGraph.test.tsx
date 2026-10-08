import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { GraphNode } from '../logic/socialNexusUtils';
import type { ComponentProps } from 'react';
import type SocialGraphFilters from './SocialGraph/SocialGraphFilters';
import SocialGraph from './SocialGraph';

const commandes = vi.hoisted(() => ({ force: vi.fn(), reprendre: vi.fn(), detacher: vi.fn(), reinitialiser: vi.fn(), avatars: vi.fn() }));
const noeuds: GraphNode[] = [
    { id: 'a', name: 'A', type: 'npc', avatar: '', x: 0, y: 9, fx: 0, fy: 9 },
    { id: 'b', name: 'B', type: 'pc', avatar: '', x: 12, y: 24, fx: 12, fy: 24 },
];
const donnees = { nodes: noeuds, links: [] };
const etat = { entities: [], players: [], activeCampaignId: 'campagne', campaigns: [{ id: 'campagne' }],
    detacherLesNoeuds: commandes.detacher, resetGraphLayout: commandes.reinitialiser };
vi.mock('../useSessionOSStore', () => ({ useSessionOSStore: () => etat }));
vi.mock('../logic/socialNexusUtils', () => ({ prepareSocialGraphData: () => donnees, getUniqueFactions: () => [] }));
vi.mock('../hooks/useAvatarResolver', () => ({ useAvatarResolver: () => ({ resolvedAvatars: {}, resolveBatch: commandes.avatars }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (cle: string) => cle }) }));
vi.mock('./SocialGraph/NodeDetailPanel', () => ({ default: () => null }));
vi.mock('./SocialGraph/RelationForm', () => ({ default: () => null }));
vi.mock('./SocialGraph/SocialGraphFilters', () => ({ default: (props: ComponentProps<typeof SocialGraphFilters>) => <>
    <button onClick={props.onDetacherTout}>Libérer</button>
    <button onClick={props.onResetLayout}>Réinitialiser</button>
</> }));
vi.mock('react-force-graph-2d', async () => {
    const { forwardRef, useImperativeHandle } = await import('react');
    // Ne fournir que les commandes publiques : d3Simulation n’existe pas.
    return { default: forwardRef(function Canevas(_props, ref) {
        useImperativeHandle(ref, () => ({ d3Force: commandes.force, d3ReheatSimulation: commandes.reprendre }));
        return <div>CANEVAS</div>;
    }) };
});

describe('le graphe social commande le canevas par son API publique', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        for (const noeud of noeuds) { noeud.fx = noeud.x; noeud.fy = noeud.y; }
        vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 800, height: 600, x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 600, toJSON: () => ({}),
        });
    });
    afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

    it('applique les forces dès que le canevas apparaît après son dimensionnement', () => {
        const avertir = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<SocialGraph />);
        expect(screen.getByText('CANEVAS')).toBeTruthy();
        expect(commandes.force).toHaveBeenCalledWith('collide', expect.any(Function));
        expect(commandes.reprendre).toHaveBeenCalledTimes(1);
        expect(avertir).not.toHaveBeenCalled();
    });

    it('libère les objets vivants puis relance après libération ou réinitialisation', () => {
        render(<SocialGraph />);
        commandes.reprendre.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Libérer' }));
        expect(commandes.detacher).toHaveBeenCalledWith('campagne', undefined);
        expect(noeuds.map(n => [n.x, n.y, n.fx, n.fy])).toEqual([
            [0, 9, undefined, undefined], [12, 24, undefined, undefined],
        ]);
        expect(commandes.reprendre).toHaveBeenCalledTimes(1);
        for (const noeud of noeuds) { noeud.fx = noeud.x; noeud.fy = noeud.y; }
        commandes.reprendre.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
        expect(commandes.reinitialiser).toHaveBeenCalledWith('campagne');
        expect(noeuds.every(n => n.fx === undefined && n.fy === undefined)).toBe(true);
        expect(commandes.reprendre).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(150));
        expect(commandes.reprendre).toHaveBeenCalledTimes(1);
    });
});
