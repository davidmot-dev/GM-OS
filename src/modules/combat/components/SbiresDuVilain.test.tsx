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
const { useCombatStore } = await import('../useCombatStore');

const PILOTE = {
    id: 'torg', name: 'Torg',
    torg: { capacites: { sbires: 'sbires' } },
    jet: { torg: { annulation: { attribut: 'esprit', competence: 'realite' } } },
    combat: { dommages: { mecanique: 'torg', resistance: 'resistance', choc: 'choc' } },
};
const cases = (n: number, cochees: number) => ({ type: 'boxes', state: 'healthy', data: { boxes: Array.from({ length: n }, (_, i) => ({ label: '', filled: i < cochees })) } });
const VILAIN = { id: 'v', name: 'Baruk Kaah', init: 0, isPlayer: false, faction: 'enemy', statuses: [], healthSystem: cases(4, 2) };
const VALEURS = { esprit: 9, realite: 3, sbires: true, resistance: 10, choc: 0 };

beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    useSessionOSStore.setState({ getActiveDriver: () => PILOTE } as never);
    useCombatStore.setState({ combatants: [
        { ...VILAIN, sheetData: VALEURS },
        { id: 'laquais', name: 'Laquais', init: 0, isPlayer: false, faction: 'enemy', statuses: [], healthSystem: cases(1, 0), sheetData: { resistance: 8, choc: 0, esprit: 7 } },
    ] } as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const choisirLeLaquais = () => {
    fireEvent.change(screen.getByLabelText('Sbire qui reçoit le coup'), { target: { value: 'laquais' } });
    fireEvent.click(screen.getByLabelText(/Le meneur confirme/));
    fireEvent.change(screen.getByLabelText('Total de dommages'), { target: { value: '17' } });
};

describe('les sbires, boucliers vivants', () => {
    it('Réalité 12, deux Blessures : 15 au dé donne +2, total 12 contre ND 10 — l’attaque passe à un sbire', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(15);
        render(<SbiresDuVilain combatant={VILAIN as never} valeurs={VALEURS} />);
        choisirLeLaquais();
        fireEvent.click(screen.getByRole('button', { name: /Sbires · Réalité ND 10/ }));
        const jet = useDiceStore.getState().lastRoll;
        expect(jet?.title).toBe('Baruk Kaah — Sbires (Réalité)');
        expect(jet?.total).toBe(12);
        expect(jet?.totalDisplay).toContain('l’attaque passe à Laquais');
        fireEvent.click(screen.getByRole('button', { name: 'Confirmer le coup' }));
        const combattants = useCombatStore.getState().combatants;
        expect((combattants.find(c => c.id === 'laquais')?.healthSystem?.data.boxes as { filled: boolean }[])[0].filled).toBe(true);
        expect((combattants.find(c => c.id === 'v')?.healthSystem?.data.boxes as { filled: boolean }[]).filter(b => b.filled)).toHaveLength(2);
        expect((screen.getByRole('button', { name: 'Coup appliqué' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('échoué, le vilain encaisse', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(4);
        render(<SbiresDuVilain combatant={VILAIN as never} valeurs={VALEURS} />);
        choisirLeLaquais();
        fireEvent.click(screen.getByRole('button', { name: /Sbires/ }));
        expect(useDiceStore.getState().lastRoll?.totalDisplay).toContain('le vilain encaisse l’attaque');
    });
    it('un vilain sans case Sbires n’obtient aucun geste', () => {
        const { container } = render(<SbiresDuVilain combatant={VILAIN as never} valeurs={{ ...VALEURS, sbires: false }} />);
        expect(container.innerHTML).toBe('');
    });

    it('ni sur un sbire, ni sur une horde, ni sur un Héros', () => {
        for (const c of [{ ...VILAIN, healthSystem: cases(1, 0) }, { ...VILAIN, horde: { membres: 3 } }, { ...VILAIN, isPlayer: true }]) {
            const { container } = render(<SbiresDuVilain combatant={c as never} valeurs={VALEURS} />);
            expect(container.innerHTML).toBe('');
            cleanup();
        }
    });
});
