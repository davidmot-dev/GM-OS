// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RemoteDicePad from './RemoteDicePad';
import type { DiceConfig } from '../../../types/drivers';

/**
 * **« Lancer Système » d'un jeu Year Zero, depuis la tablette** — essai T15 sur la vraie Fire
 * (25/11/2026, registre § 1 bis). Le pavé, ouvert sur une campagne Alien, restait en mode
 * « Standard » : sa case « Seuil » (6, le seuil du pilote) partait comme six dés d'équipement, et un
 * jet de trois dés en lançait neuf, sans que rien à l'écran ne le dise.
 */
const ALIEN = { engine: 'YZE', logic: 'count-success', successThreshold: 6 } as unknown as DiceConfig;

afterEach(() => cleanup());

describe('le pavé de dés de la télécommande', () => {
    it('ouvert sur un jeu Year Zero, il adopte son mode et n’ajoute aucun dé d’équipement', () => {
        const onRoll = vi.fn();
        render(<RemoteDicePad activeDiceConfig={ALIEN} onRoll={onRoll} onClear={() => {}} />);
        expect(screen.getByText('Dés Equip. (E)')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Augmenter la quantité' }));
        fireEvent.click(screen.getByRole('button', { name: 'Augmenter la quantité' }));
        fireEvent.click(screen.getByRole('button', { name: /Lancer Système/ }));
        expect(onRoll).toHaveBeenCalledWith(expect.objectContaining({ count: 3, gearCount: 0, useSystem: true }));
    });

    it('les dés d’équipement demandés partent, eux', () => {
        const onRoll = vi.fn();
        render(<RemoteDicePad activeDiceConfig={ALIEN} onRoll={onRoll} onClear={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: 'Augmenter l\'expertise' }));
        fireEvent.click(screen.getByRole('button', { name: /Lancer Système/ }));
        expect(onRoll).toHaveBeenCalledWith(expect.objectContaining({ gearCount: 1 }));
    });

    it('sur un autre jeu, le seuil reste un seuil et n’ajoute aucun dé', () => {
        const onRoll = vi.fn();
        const d20 = { engine: 'standard', logic: 'sum', successThreshold: 12 } as unknown as DiceConfig;
        render(<RemoteDicePad activeDiceConfig={d20} onRoll={onRoll} onClear={() => {}} />);
        expect(screen.getByText('Seuil (Target)')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Lancer Système/ }));
        expect(onRoll).toHaveBeenCalledWith(expect.objectContaining({ target: 12, gearCount: 0 }));
    });
});
