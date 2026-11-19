// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RiposteDeCthulhuHack } from './RiposteDeCthulhuHack';
import { ripostePossible, attaqueSurLaCarte } from '../logic/jetDuCombattant';
import { armureDeLInvestigateur } from '../logic/attaqueDeLAdversaire';
import { useCombatStore } from '../useCombatStore';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';

/**
 * **« Riposte » — l'attaque d'un adversaire de Cthulhu Hack** (registre § 263, T16, 19/11/2026). Le
 * Garde du livre (p. 55, pilote 1.2.0) riposte contre Harvey, qui a raté sa Sauvegarde : dégâts fixes
 * moins son Armure ; sur un 20 naturel, deux fois les dégâts puis l'Armure (décision D5).
 */
const ARMURES = [1, 2].map(n => ({ de: `materiel_${n}`, nom: `materiel_${n}_nom`, protection: `materiel_${n}_pa` }));
const PILOTE = {
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'hp', label: 'PV', isMainHP: true }] },
    jet: { cthulhuHack: { pv: 'hp', fortune: 'fortune', physique: [], personnalite: [], armures: ARMURES } },
    bestiaire: { colonnes: [], creatures: [{ id: 'garde', nom: 'Garde', valeurs: {}, attaques: { lignes: [
        { de: '', nom: 'Revolver', effet: '', degats: 4 },
        { de: '', nom: 'Matraque', effet: '', degats: 2, fois: 2 },
    ] } }] },
} as unknown as GameDriver;

beforeEach(() => useCombatStore.getState().reset());
afterEach(() => cleanup());

const poser = () => {
    useCombatStore.getState().addCombatant({ name: 'Harvey', init: 10, hp: 9, hpMax: 9, isPlayer: false, faction: 'player', statuses: [],
        sheetData: { hp: 9, materiel_1_nom: 'Manteau de cuir', materiel_1_pa: 1 } } as never);
    useCombatStore.getState().addCombatant({ name: 'Garde 1', init: 0, isPlayer: false, faction: 'enemy', statuses: [],
        sheetData: { hp: 14 }, origineDuLivre: { creatureId: 'garde' } } as never);
    const [harvey, garde] = useCombatStore.getState().combatants;
    return { harvey: harvey as Combatant, garde: garde as Combatant };
};
const harveyApres = () => useCombatStore.getState().combatants.find(c => c.name === 'Harvey')!;

describe('« Riposte » de Cthulhu Hack (T16)', () => {
    it('paraît sur la carte d’un adversaire de Cthulhu Hack, jamais d’un PJ ni d’un autre jeu', () => {
        expect(ripostePossible({ isPlayer: false }, PILOTE)).toBe(true);
        expect(attaqueSurLaCarte({ isPlayer: false }, PILOTE, null)).toBe(true);
        expect(ripostePossible({ isPlayer: true }, PILOTE)).toBe(false);
        expect(ripostePossible({ isPlayer: false }, { jet: {} } as GameDriver)).toBe(false);
    });

    it('l’Armure de l’investigateur : les PA de son Matériel, additionnés', () => {
        expect(armureDeLInvestigateur(ARMURES, { materiel_1_nom: 'Manteau de cuir', materiel_1_pa: 1, materiel_2_pa: 2 }))
            .toEqual({ total: 3, pieces: [{ nom: 'Manteau de cuir', pa: 1 }, { nom: 'materiel_2_pa', pa: 2 }] });
        expect(armureDeLInvestigateur(ARMURES, {}).total).toBe(0);
    });

    it('le Revolver du Garde contre Harvey (Manteau de cuir, 1 PA) : 4 − 1 = 3, appliqué une fois', () => {
        const { harvey, garde } = poser();
        render(<RiposteDeCthulhuHack combattant={garde} cible={harvey} driver={PILOTE} />);
        expect(screen.getByText('Garde 1 riposte contre Harvey')).toBeTruthy();
        expect((screen.getByLabelText('Armure de la cible') as HTMLInputElement).value).toBe('1');
        expect(document.querySelector('[data-calcul-de-la-riposte]')!.textContent).toBe('4, − Armure 1 = 3');
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 3 à Harvey' }));
        expect(harveyApres().hp).toBe(6);
        expect(screen.queryByRole('button', { name: /Appliquer/ }), 'pas deux fois la même riposte').toBeNull();
    });

    it('sur un 20 naturel : deux fois les dégâts, puis l’Armure (D5) — 8 − 1 = 7', () => {
        const { harvey, garde } = poser();
        render(<RiposteDeCthulhuHack combattant={garde} cible={harvey} driver={PILOTE} />);
        fireEvent.click(screen.getByLabelText(/20 naturel/));
        expect(document.querySelector('[data-calcul-de-la-riposte]')!.textContent).toBe('4 × 2 (20 naturel) = 8, − Armure 1 = 7');
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 7 à Harvey' }));
        expect(harveyApres().hp).toBe(2);
    });

    it('la Matraque compte deux fois par round : c’est dit ; une Armure qui absorbe tout aussi', () => {
        const { harvey, garde } = poser();
        render(<RiposteDeCthulhuHack combattant={garde} cible={harvey} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Attaque'), { target: { value: '1' } });
        expect(screen.getByText(/compte 2 fois par round/)).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Armure de la cible'), { target: { value: '3' } });
        expect(document.querySelector('[data-riposte-nulle]')).toBeTruthy();
    });

    it('sans cible : on le dit ; un adversaire fabriqué fait saisir ses dégâts', () => {
        const { harvey, garde } = poser();
        const { unmount } = render(<RiposteDeCthulhuHack combattant={garde} cible={null} driver={PILOTE} />);
        expect(document.querySelector('[data-sans-cible]')).toBeTruthy();
        unmount();
        render(<RiposteDeCthulhuHack combattant={{ ...garde, origineDuLivre: undefined }} cible={harvey} driver={PILOTE} />);
        expect(screen.getByRole('button', { name: /Appliquer … à Harvey/ }).hasAttribute('disabled')).toBe(true);
        fireEvent.change(screen.getByLabelText('Dégâts de l’attaque'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 4 à Harvey' }));
        expect(harveyApres().hp).toBe(5);
    });
});
