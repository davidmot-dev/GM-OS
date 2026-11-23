// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiceEngine } from '../../dice/DiceEngine';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AppliquerALaCible } from './AppliquerALaCible';
import { useCombatStore } from '../useCombatStore';

/**
 * **« Appliquer à [cible] »** — registre § 263, T7 (19/11/2026). Le coup d'un adversaire part sur
 * la cible de la carte en un geste, par le seul écrivain de la santé, `applyDamage` (C9).
 */

const pv = (current: number, max: number) => ({ type: 'hp' as const, data: { current, max }, state: 'healthy' as never, badges: [] });
const reserve = (n: number) => ({ total: n, successes: n, compte: 'reussites' as const });
// Un jeu à la règle de Year Zero (§ 267, T0 : la règle vient du jeu, ici Blade Runner).
const PILOTE = { jet: { bladeRunner: {}, desEchelonnes: { composantes: [] } }, combat: { damageTypes: ['physique'] } } as never;
// Un jeu que la table ne connaît pas (Shadowrun l'était jusqu'à T10, 23/11).
const AUTRE_JEU = { jet: { jeuInconnu: {} }, combat: { damageTypes: ['physique'] } } as never;
const VAMPIRE = { jet: { vampire: {} }, combat: { damageTypes: ['Superficiels', 'Aggravés'] } } as never;
const BARBARIANS = { jet: { barbarians: {} }, combat: {} } as never;

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

    it('§ 267, T0 : un jet en réussites d’un jeu sans la règle de Year Zero demande le montant', () => {
        render(<AppliquerALaCible cible={cultiste()} resultat={reserve(3)} driver={AUTRE_JEU} />);
        expect(screen.queryByLabelText('Dégâts de l’arme')).toBeNull();
        fireEvent.change(screen.getByLabelText('Dégâts'), { target: { value: '4' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 4 à Cultiste' }));
        expect(cultiste().hp).toBe(8);
    });

    it('§ 267, T1 : Vampire — marge 2 + pistolet 9 mm (+3) = 5, le type choisi, sans armure retirée (p. 126, 303)', () => {
        const armes = [{ libelle: 'Improvisée, pieu', degats: 0 }, { libelle: 'À feu moyenne (pistolet 9 mm)', degats: 3 }];
        render(<AppliquerALaCible cible={cultiste()} resultat={{ total: 4, successes: 4, vampire: { marge: 2 } }} driver={VAMPIRE} armes={armes} />);
        expect(screen.queryByLabelText('Protection retirée')).toBeNull();
        expect(document.querySelector('[data-types-de-vampire]')).toBeTruthy();
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toBe('marge 2 + arme 0 = 2');
        fireEvent.change(screen.getByLabelText('Arme'), { target: { value: 'À feu moyenne (pistolet 9 mm)' } });
        expect((screen.getByLabelText('Bonus de l’arme') as HTMLInputElement).value).toBe('3');
        fireEvent.change(screen.getByLabelText('Type de dégâts'), { target: { value: 'Aggravés' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 5 à Cultiste' }));
        expect(cultiste().hp).toBe(7);
    });

    it('§ 267, T1 : Vampire — un jet sans marge ne porte pas', () => {
        render(<AppliquerALaCible cible={cultiste()} resultat={{ total: 1, successes: 1, vampire: { marge: 0 } }} driver={VAMPIRE} />);
        expect(document.querySelector('[data-coup-nul]')!.textContent).toContain('Rien à appliquer à Cultiste');
    });

    it('un autre jet : le montant se saisit', () => {
        render(<AppliquerALaCible cible={cultiste()} resultat={{ total: 14 }} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Dégâts'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 5 à Cultiste' }));
        expect(cultiste().hp).toBe(7);
    });

    it('§ 267, T4 : Barbarians — hache d6B + Vigueur 2, moins l’armure 1 ; le Coup dévastateur offert sur un succès héroïque', () => {
        const de = vi.spyOn(DiceEngine, 'roll').mockReturnValueOnce(3).mockReturnValueOnce(5);
        try {
            render(<AppliquerALaCible cible={cultiste()} driver={BARBARIANS}
                resultat={{ total: 12, successes: 1, barbarians: { bilan: 'succes-heroique' } }}
                barbarians={{ armes: [{ libelle: 'Hache', formule: 'd6B', distance: false }], vigueur: 2 }} />);
            expect((screen.getByLabelText('Dé de l’arme') as HTMLInputElement).value).toBe('d6B');
            fireEvent.click(screen.getByRole('checkbox', { name: /Coup dévastateur/ }));
            fireEvent.change(screen.getByLabelText('Protection retirée'), { target: { value: '1' } });
            fireEvent.click(screen.getByText('Lancer les dégâts'));
            expect(document.querySelector('[data-degats-lances-bol]')!.textContent).toContain('d6B (3, 5 → 5) + Vigueur 2 + 6 Coup dévastateur = 13');
            fireEvent.click(screen.getByText('Appliquer 12 à Cultiste'));
            expect(cultiste().hp).toBe(0);
        } finally { de.mockRestore(); }
    });

    it('§ 267, T4 : Barbarians — une attaque manquée ne lance rien', () => {
        render(<AppliquerALaCible cible={cultiste()} driver={BARBARIANS} resultat={{ total: 6, successes: 0, barbarians: { bilan: 'echec' } }}
            barbarians={{ armes: [], vigueur: 1 }} />);
        expect(screen.queryByText('Lancer les dégâts')).toBeNull();
        expect(screen.queryByRole('checkbox', { name: /Coup dévastateur/ })).toBeNull();
        expect(document.querySelector('[data-coup-nul]')).toBeTruthy();
    });
});
