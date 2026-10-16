import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * **La capacité « Sbires »** — Torg, p. 265, 2026-10-16 : le vilain touché fait
 * un test de Réalité contre ND 10, avec le malus de ses Blessures ; réussi,
 * l'attaque passe à un laquais proche.
 */

vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { default: SbiresDuVilain } = await import('./SbiresDuVilain');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useDiceStore } = await import('../../../stores/useDiceStore');
const { DiceEngine } = await import('../../dice/DiceEngine');

const PILOTE = {
    id: 'torg', name: 'Torg',
    jet: { torg: { annulation: { attribut: 'esprit', competence: 'realite' } } },
    combat: { dommages: { mecanique: 'torg', resistance: 'resistance', choc: 'choc' } },
};
const cases = (n: number, cochees: number) => ({ type: 'boxes', state: 'healthy', data: { boxes: Array.from({ length: n }, (_, i) => ({ label: '', filled: i < cochees })) } });
const VILAIN = { id: 'v', name: 'Baruk Kaah', init: 0, isPlayer: false, faction: 'enemy', statuses: [], healthSystem: cases(4, 2) };
const VALEURS = { esprit: 9, realite: 3 };

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({ getActiveDriver: () => PILOTE } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('les sbires, boucliers vivants', () => {
    it('Réalité 12, deux Blessures : 15 au dé donne +2, total 12 contre ND 10 — l’attaque passe à un sbire', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(15);
        render(<SbiresDuVilain combatant={VILAIN as never} valeurs={VALEURS} />);
        fireEvent.click(screen.getByRole('button', { name: /Sbires · Réalité ND 10/ }));
        const jet = useDiceStore.getState().lastRoll;
        expect(jet?.title).toBe('Baruk Kaah — Sbires (Réalité)');
        expect(jet?.total).toBe(12);
        expect(jet?.totalDisplay).toMatch(/^l'attaque passe à un sbire proche/);
    });

    it('échoué, le vilain encaisse', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(4);
        render(<SbiresDuVilain combatant={VILAIN as never} valeurs={VALEURS} />);
        fireEvent.click(screen.getByRole('button', { name: /Sbires/ }));
        expect(useDiceStore.getState().lastRoll?.totalDisplay).toMatch(/^le vilain encaisse l'attaque/);
    });

    it('ni sur un sbire, ni sur une horde, ni sur un Héros', () => {
        for (const c of [{ ...VILAIN, healthSystem: cases(1, 0) }, { ...VILAIN, horde: { membres: 3 } }, { ...VILAIN, isPlayer: true }]) {
            const { container } = render(<SbiresDuVilain combatant={c as never} valeurs={VALEURS} />);
            expect(container.innerHTML).toBe('');
            cleanup();
        }
    });
});
