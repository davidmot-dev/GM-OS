import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DamageCalculator from './DamageCalculator';
import { useDiceStore, type RollRecord } from '../../../stores/useDiceStore';
import { useModalStore } from '../../../stores/useModalStore';
import { useCombatStore } from '../useCombatStore';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

const jet = (total: number, id = 'jet'): RollRecord => ({
    id, total, title: 'Dégâts', timestamp: new Date(), totalDisplay: String(total), rolls: [], modifier: 0,
});
const montant = () => (screen.getByRole('spinbutton') as HTMLInputElement).value;
beforeEach(() => {
    useDiceStore.setState({ lastRoll: null });
    useModalStore.getState().closeModal();
    useCombatStore.setState({ combatants: [] });
});

describe('le montant du calculateur de dégâts', () => {
    it('reprend le jet positif présent à l’ouverture et conserve une saisie au rafraîchissement', () => {
        useDiceStore.setState({ lastRoll: jet(17) });
        const { rerender } = render(<DamageCalculator />);
        expect(montant()).toBe('17');
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '6' } });
        act(() => useDiceStore.setState({ isDiceProjected: true }));
        rerender(<DamageCalculator />);
        expect(montant()).toBe('6');
    });

    it('reprend chaque nouveau jet positif, y compris un autre jet de même total', () => {
        render(<DamageCalculator />);
        expect(montant()).toBe('10');
        act(() => useDiceStore.setState({ lastRoll: jet(17, 'a') }));
        expect(montant()).toBe('17');
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '6' } });
        act(() => useDiceStore.setState({ lastRoll: jet(17, 'b') }));
        expect(montant()).toBe('17');
    });

    it('garde le montant sur zéro, un jet négatif ou l’effacement, et permet la reprise explicite de zéro', () => {
        render(<DamageCalculator />);
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '6' } });
        for (const lastRoll of [jet(0), jet(-2), null]) {
            act(() => useDiceStore.setState({ lastRoll }));
            expect(montant()).toBe('6');
        }
        act(() => useDiceStore.setState({ lastRoll: jet(0) }));
        fireEvent.click(screen.getByText('modules:combat.damage.last_roll'));
        expect(montant()).toBe('0');
    });
});
