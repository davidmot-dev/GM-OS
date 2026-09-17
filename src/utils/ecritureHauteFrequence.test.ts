import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **Un geste continu ne doit pas écrire cent fois sur le disque.**
 *
 * ⛔ Défaut trouvé par David à l'écran le 2026-09-17 : *« whiteboard os saccade un
 * peu »*. Chaque point d'un trait appelait `setActivePath`, donc un `set()` sur
 * un magasin persisté — et Zustand appelle `setItem()` à **chaque** `set()`, sans
 * condition. Sur un tableau de cent tracés : **1,75 ms de `JSON.stringify` et
 * 285 Ko écrits, par point.**
 *
 * ⭐ **Deux modules avaient écrit la croyance inverse** — `useWhiteboardStore` et
 * `useMapStore` — en retirant des champs de `partialize` pour « éviter les
 * écritures haute fréquence ». *`partialize` ne décide pas SI l'on écrit,
 * seulement CE QU'ON écrit.*
 *
 * ⚠️ **Ce fichier est la garde qui aurait crié.** Il ne mesure pas une durée —
 * *un essai qui mesure une durée devient rouge sur une machine chargée* — il
 * compte les écritures. Elles, elles ne dépendent pas de la machine.
 */

const role = vi.hoisted(() => ({ current: 'gm' as string }));

vi.mock('./windowRole', () => ({
    getWindowRole: () => role.current,
    isMainWindow: () => role.current === 'gm',
}));

const { useWhiteboardStore } = await import('../modules/whiteboard/useWhiteboardStore');
const { useMapStore } = await import('../modules/map/useMapStore');
const { viderLesEcrituresDifferees } = await import('./ecritureReserveeAuMJ');

/** Combien de fois `localStorage` a réellement été touché pendant un geste. */
const compterLesEcritures = (geste: () => void) => {
    const espion = vi.spyOn(Storage.prototype, 'setItem');
    espion.mockClear();
    geste();
    const pendantLeGeste = espion.mock.calls.length;
    viderLesEcrituresDifferees();
    const apresVidage = espion.mock.calls.length;
    espion.mockRestore();
    return { pendantLeGeste, apresVidage };
};

beforeEach(() => {
    role.current = 'gm';
    localStorage.clear();
    viderLesEcrituresDifferees();
});

describe('un trait de tableau blanc', () => {
    /** Cent points, tels que la souris en produit en une seconde de dessin. */
    const centPoints = () => {
        for (let i = 0; i < 100; i++) {
            useWhiteboardStore.getState().setActivePath({
                id: 'active',
                points: Array.from({ length: i + 1 }, (_, j) => ({ x: j / 100, y: j / 100 })),
                color: '#ffffff',
                width: 3,
                tool: 'brush',
            }, 'essai');
        }
    };

    it('n’écrit rien sur le disque pendant qu’on dessine', () => {
        const { pendantLeGeste } = compterLesEcritures(centPoints);
        expect(pendantLeGeste).toBe(0);
    });

    it('n’écrit qu’une fois quand la fenêtre se referme', () => {
        const { apresVidage } = compterLesEcritures(centPoints);
        expect(apresVidage).toBe(1);
    });

    /**
     * ⭐ **Et ce qui compte vraiment arrive bien sur le disque.** *Une
     * optimisation qui perd la donnée n'est pas une optimisation* — c'est ce
     * qu'on vérifie ici, et pas seulement le compte d'écritures.
     */
    it('le tracé validé, lui, finit bien enregistré', () => {
        useWhiteboardStore.getState().finishDrawing({
            id: 'trace-1',
            points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            color: '#ff0000',
            width: 5,
            tool: 'brush',
        });
        viderLesEcrituresDifferees();

        const brut = localStorage.getItem('gm-os-whiteboard-storage-v1');
        expect(JSON.parse(brut!).state.paths).toHaveLength(1);
    });
});

describe('un pion qu’on glisse sur la carte', () => {
    const glisser = () => {
        for (let i = 0; i < 100; i++) {
            useMapStore.getState().updateToken('pion-1', { x: i, y: i });
        }
    };

    beforeEach(() => {
        useMapStore.setState({
            tokens: [{ id: 'pion-1', name: 'Sentinelle', avatar: '', x: 0, y: 0, size: 1 }],
            dangerZones: [],
            projectionTarget: null,
        } as never);
        viderLesEcrituresDifferees();
    });

    it('n’écrit rien sur le disque pendant le glissement', () => {
        const { pendantLeGeste } = compterLesEcritures(glisser);
        expect(pendantLeGeste).toBe(0);
    });

    it('n’écrit qu’une fois quand la fenêtre se referme', () => {
        const { apresVidage } = compterLesEcritures(glisser);
        expect(apresVidage).toBe(1);
    });

    /**
     * ⛔ **Le déplacement ne faisait pas UNE mutation, il en faisait DEUX** — les
     * pions, puis les zones de danger rattachées. Donc deux sérialisations
     * complètes du magasin de carte par mouvement de souris. Elles voyagent
     * désormais ensemble, ce qui empêche aussi une zone de se désolidariser de
     * son pion le temps d'un rendu.
     */
    it('déplace le pion et sa zone rattachée dans la même mutation', () => {
        useMapStore.setState({
            tokens: [{ id: 'pion-1', name: 'Sentinelle', avatar: '', x: 0, y: 0, size: 1 }],
            dangerZones: [{ id: 'z1', parentTokenId: 'pion-1', x: 0, y: 0 }],
        } as never);

        let mutations = 0;
        const desabonner = useMapStore.subscribe(() => { mutations++; });
        useMapStore.getState().updateToken('pion-1', { x: 10, y: 4 });
        desabonner();

        expect(mutations).toBe(1);
        const zone = useMapStore.getState().dangerZones[0];
        expect([zone.x, zone.y]).toEqual([10, 4]);
    });

    it('la position finale du pion arrive bien sur le disque', () => {
        glisser();
        viderLesEcrituresDifferees();

        const brut = localStorage.getItem('gmos-map-storage');
        const pion = JSON.parse(brut!).state.tokens.find((t: { id: string }) => t.id === 'pion-1');
        expect([pion.x, pion.y]).toEqual([99, 99]);
    });
});
