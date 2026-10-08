import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import DiceBox3D from './DiceBox3D';
import type { RollRecord } from '../../stores/useDiceStore';

// Les solides et leurs textures sont réels ; seul le pilote graphique est simulé.
vi.mock('three', async importOriginal => {
    const three = await importOriginal<typeof import('three')>();
    return { ...three,
        WebGLRenderer: class {
            domElement = document.createElement('canvas');
            shadowMap = {};
            setPixelRatio() {}
            setClearColor() {}
            setSize() {}
            render() {}
            dispose() {}
        },
        PMREMGenerator: class {
            fromScene() { return { texture: new three.Texture() }; }
            dispose() {}
        },
    };
});

describe('DiceBox3D — un jet reçu plusieurs fois', () => {
    const jet: RollRecord = { id: 'jet-1', timestamp: new Date(0), title: 'd6',
        total: 4, totalDisplay: '4', modifier: 0, rolls: [{ sides: 6, val: 4 }] };
    const peindre = vi.fn();

    beforeEach(() => {
        peindre.mockClear();
        const contexte = {
            fillRect: peindre, fillText: vi.fn(), measureText: () => ({ width: 10 }),
        } as unknown as CanvasRenderingContext2D;
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
            ((id: string) => id === '2d' ? contexte : null) as HTMLCanvasElement['getContext'],
        );
        vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
        vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('conserve les dés du même jet, puis anime un nouveau jet ou un changement de style', () => {
        const { rerender } = render(<DiceBox3D active lastRoll={jet} />);
        const coups = peindre.mock.calls.length;
        expect(coups).toBeGreaterThan(0);
        rerender(<DiceBox3D active lastRoll={{ ...jet, rolls: [...jet.rolls] }} />);
        expect(peindre).toHaveBeenCalledTimes(coups);
        rerender(<DiceBox3D active lastRoll={{ ...jet, id: 'jet-2' }} />);
        expect(peindre).toHaveBeenCalledTimes(coups * 2);
        rerender(<DiceBox3D active lastRoll={{ ...jet, id: 'jet-2' }} style="metal" />);
        expect(peindre).toHaveBeenCalledTimes(coups * 3);
    });

    it('utilise le dernier jet reçu pendant que la projection est inactive', () => {
        const { rerender } = render(<DiceBox3D active={false} lastRoll={jet} />);
        expect(peindre).not.toHaveBeenCalled();
        rerender(<DiceBox3D active={false} lastRoll={{ ...jet, id: 'jet-2', rolls: [] }} />);
        rerender(<DiceBox3D active lastRoll={{ ...jet, id: 'jet-2', rolls: [] }} />);
        expect(peindre).not.toHaveBeenCalled();
        rerender(<DiceBox3D active lastRoll={{ ...jet, id: 'jet-3' }} />);
        expect(peindre.mock.calls.length).toBeGreaterThan(0);
    });
});
