// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppliquerALaCible } from './AppliquerALaCible';
import { useCombatStore } from '../useCombatStore';

/**
 * **« Appliquer à [cible] »** — registre § 263, T7 (19/11/2026). Le coup d'un adversaire part sur
 * la cible de la carte en un geste, par le seul écrivain de la santé, `applyDamage` (C9).
 */

const pv = (current: number, max: number) => ({ type: 'hp' as const, data: { current, max }, state: 'healthy' as never, badges: [] });
const reserve = (n: number) => ({ total: n, successes: n, compte: 'reussites' as const });
const PILOTE = { combat: { damageTypes: ['physique'] } } as never;

beforeEach(() => {
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({
        name: 'Cultiste', init: 8, hp: 12, hpMax: 12, isPlayer: false, faction: 'enemy', statuses: [], healthSystem: pv(12, 12),
    } as never);
});
afterEach(() => cleanup());

const cultiste = () => useCombatStore.getState().combatants[0];

describe('« Appliquer à [cible] »', () => {
    it('jet à réserve : l’arme saisie, le calcul dit, le coup porté une fois', () => {
        const { rerender } = render(<AppliquerALaCible cible={cultiste()} resultat={reserve(3)} driver={PILOTE} />);
        expect(screen.getByRole('button', { name: /Appliquer … à Cultiste/ }).hasAttribute('disabled')).toBe(true);
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toContain('saisir les dégâts de l’arme');

        fireEvent.change(screen.getByLabelText('Dégâts de l’arme'), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText('Protection retirée'), { target: { value: '1' } });
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toBe('arme 2 + 3 succès − 1 = 4, − protection 1 = 3');
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 3 à Cultiste' }));

        expect(cultiste().hp).toBe(9);
        expect(document.querySelector('[data-coup-applique]')!.textContent).toContain('3 dégâts appliqués à Cultiste');
        expect(screen.queryByRole('button', { name: /Appliquer/ }), 'pas de second coup sur le même résultat').toBeNull();

        // Un nouveau jet (un nouvel objet résultat) rouvre le geste.
        rerender(<AppliquerALaCible cible={cultiste()} resultat={reserve(1)} driver={PILOTE} />);
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 1 à Cultiste' }));
        expect(cultiste().hp).toBe(8);
    });

    it('aucun succès : rien à appliquer, et c’est dit', () => {
        render(<AppliquerALaCible cible={cultiste()} resultat={reserve(0)} driver={PILOTE} />);
        expect(document.querySelector('[data-coup-nul]')!.textContent).toContain('Rien à appliquer à Cultiste');
        expect(screen.queryByRole('button', { name: /Appliquer/ })).toBeNull();
    });

    it('un autre jet : le montant se saisit', () => {
        render(<AppliquerALaCible cible={cultiste()} resultat={{ total: 14 }} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Dégâts'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 5 à Cultiste' }));
        expect(cultiste().hp).toBe(7);
    });
});
