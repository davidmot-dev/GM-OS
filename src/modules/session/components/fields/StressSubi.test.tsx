// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import StressSubi from './StressSubi';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useDiceStore } from '../../../../stores/useDiceStore';

/** **Le geste du stress subi** — Blade Runner, 2026-10-16. */
const REGLE = { champ: 'sangFroid', label: 'Stress', jet: ['empathie', 'psychologie'] };
beforeEach(() => useDiceStore.setState({ history: [], lastRoll: null }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Encaisser le stress', () => {
    it('le facteur choisi, les dés lancés, le Sang-froid écrit, l’historique dit le calcul', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValueOnce(7).mockReturnValueOnce(3);
        const ecrire = vi.fn();
        render(<StressSubi regle={REGLE} valeurs={{ empathie: 'B', psychologie: 'C', sangFroid: 4 }} nom="Kessler" ecrire={ecrire} />);
        fireEvent.change(screen.getByLabelText('Facteur de stress'), { target: { value: '3' } });
        fireEvent.click(screen.getByRole('button', { name: 'Encaisser' }));
        expect(ecrire).toHaveBeenCalledWith({ sangFroid: 2 });
        expect(useDiceStore.getState().history[0].totalDisplay).toBe('facteur 3 − 1 réussite (D10 7, D8 3) = −2 → 2');
    });

    it('tout réduit : rien à écrire ; à zéro, Brisé par le stress est dit', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(10);
        const ecrire = vi.fn();
        render(<StressSubi regle={REGLE} valeurs={{ empathie: 'A', psychologie: 'A', sangFroid: 2 }} nom="K" ecrire={ecrire} />);
        fireEvent.click(screen.getByRole('button', { name: 'Encaisser' }));
        expect(ecrire).not.toHaveBeenCalled();
        cleanup();
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(2);
        render(<StressSubi regle={REGLE} valeurs={{ empathie: 'D', psychologie: 'D', sangFroid: 1 }} nom="K" ecrire={ecrire} />);
        fireEvent.change(screen.getByLabelText('Facteur de stress'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Encaisser' }));
        expect(ecrire).toHaveBeenCalledWith({ sangFroid: 0 });
        expect(useDiceStore.getState().history[0].totalDisplay).toMatch(/— Brisé par le stress$/);
    });
});
