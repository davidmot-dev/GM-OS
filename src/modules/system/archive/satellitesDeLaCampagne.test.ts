import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Ce que l'archive emporte hors du magasin de session** — lot E2 du chantier
 * des archives, 2026-10-19 : extraire ce qui porte la campagne, le reposer sans
 * toucher aux autres campagnes, et ne rien vider quand une archive ancienne
 * n'en parle pas.
 */
function magasin<T extends object>(faire: () => T) {
    let etat = faire();
    return {
        getState: () => etat,
        setState: (maj: Partial<T> | ((e: T) => Partial<T>)) => { etat = { ...etat, ...(typeof maj === 'function' ? maj(etat) : maj) }; },
        remettre: () => { etat = faire(); },
    };
}
const storyboard = magasin(() => ({ moments: [
    { id: 'm1', campaignId: 'c1', name: 'Orage' }, { id: 'm2', campaignId: 'c2', name: 'Ailleurs' },
] as { id: string; campaignId: string; name: string }[] }));
const ressources = magasin(() => ({ reserves: { c1: { traque: 3 }, c2: { traque: 1 } } as Record<string, unknown> }));
const combat = magasin(() => ({ combatsGares: { s1: { round: 2 }, sAutre: { round: 5 } } as Record<string, unknown> }));
const favoris = magasin(() => ({ favorites: [
    { id: 'f1', campaignId: 'c1' }, { id: 'f2', campaignId: 'c2' },
] as { id: string; campaignId?: string }[] }));
const lumiere = magasin(() => ({ scenes: {
    SCENE_c1_01: { id: 'SCENE_c1_01', campagneId: 'c1' }, SCENE_c2_01: { id: 'SCENE_c2_01', campagneId: 'c2' },
} as Record<string, { id: string; campagneId?: string | null }> }));

vi.mock('../../storyboard/useStoryboardStore', () => ({ useStoryboardStore: storyboard }));
vi.mock('../../table/useRessourcesDeTableStore', () => ({ useRessourcesDeTableStore: ressources }));
vi.mock('../../combat/useCombatStore', () => ({ useCombatStore: combat }));
vi.mock('../../favorite/useFavoriteStore', () => ({ useFavoriteStore: favoris }));
vi.mock('../../light/useLightStore', () => ({ useLightStore: lumiere }));

const { extraireLesSatellites, injecterLesSatellites } = await import('./satellitesDeLaCampagne');

beforeEach(() => [storyboard, ressources, combat, favoris, lumiere].forEach(m => m.remettre()));

describe('les satellites d’une campagne', () => {
    it('extrait ce qui porte la campagne, et rien d’autre', () => {
        const s = extraireLesSatellites('c1', ['s1']);
        expect(s.moments!.map(m => m.id)).toEqual(['m1']);
        expect(s.reservesDeTable).toEqual({ traque: 3 });
        expect(Object.keys(s.combatsGares!)).toEqual(['s1']);
        expect(s.favoris!.map(f => f.id)).toEqual(['f1']);
        expect(s.tuilesDeLumiere!.map(t => t.id)).toEqual(['SCENE_c1_01']);
    });

    it('à l’import, remplace ce qui portait la campagne, et laisse les autres', () => {
        injecterLesSatellites('c1', ['s1'], {
            moments: [{ id: 'm9', campaignId: 'c1', name: 'Neige' } as never],
            reservesDeTable: { traque: 0 } as never,
            combatsGares: { s1: { round: 1 } as never },
            favoris: [],
            tuilesDeLumiere: [{ id: 'SCENE_c1_02', campagneId: 'c1' } as never],
        });
        expect(storyboard.getState().moments.map(m => m.id)).toEqual(['m2', 'm9']);
        expect(ressources.getState().reserves).toEqual({ c1: { traque: 0 }, c2: { traque: 1 } });
        expect(combat.getState().combatsGares).toEqual({ sAutre: { round: 5 }, s1: { round: 1 } });
        expect(favoris.getState().favorites.map(f => f.id)).toEqual(['f2']);
        expect(Object.keys(lumiere.getState().scenes).sort()).toEqual(['SCENE_c1_02', 'SCENE_c2_01']);
    });

    it('une archive qui n’en parle pas ne vide rien', () => {
        injecterLesSatellites('c1', ['s1'], {});
        expect(storyboard.getState().moments).toHaveLength(2);
        expect(Object.keys(lumiere.getState().scenes)).toHaveLength(2);
        expect(ressources.getState().reserves.c1).toEqual({ traque: 3 });
    });
});
