// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));
const ecrire = vi.fn();
vi.mock('../ficheDesCombattants', () => ({ ecrireLaFicheDuCombattant: (...a: unknown[]) => ecrire(...a) }));

import HorsJeuDuCombattant from './HorsJeuDuCombattant';
import ProtectionDuCombattant from './ProtectionDuCombattant';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { lancerLEffetDuBrise, noterSurLaFiche } from '../../dice/systemes/yearZero';
import type { Combatant } from '../types';

/**
 * **Brisé en combat, et la protection** — Blade Runner, 2026-10-16 (carnet
 * « Blade Runner » : « BRISÉ PAR LES DÉGÂTS », « BRISÉ PAR LE STRESS »,
 * « ÉQUIPEMENT DE PROTECTION »).
 */
const T = (table: string) => ({ univers: 'Blade Runner', table });
const PILOTE = {
    jet: { brise: [
        { champ: 'sante', label: 'Brisé par les dégâts', rappel: 'Il s’effondre.' },
        { champ: 'sangFroid', label: 'Brisé par le stress', rappel: 'L’effet s’applique.', de: 'empathie',
          table: { ...T('stress_humain'), si: [{ si: { champ: 'nature', contient: ['réplicant'] }, table: 'stress_replicant' }] },
          perteDuMaximum: 'sangFroidMax', noterDans: 'stressCritique' },
    ] },
    combat: {
        statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true }, { fieldId: 'sangFroid', label: 'Sang-froid' }],
        horsJeu: {
            label: 'Brisé par les dégâts', rappel: 'Chaque nouveau coup est une blessure critique.',
            tables: [{ label: 'Percutant', table: T('percutant') }, { label: 'Perforant', table: T('perforant') }],
            desAuChoix: [6, 8, 10, 12], noterDans: 'blessuresCritiques', repetable: true,
        },
        protection: { champ: 'protection', nomSur: 'protectionNom', des: 2 },
    },
};
const loadTable = vi.fn(async (_u: string, table: string) => ({ name: table, dice: '1d12', entries: [
    { min: 1, max: 1, title: `${table} 1`, description: '', effect: 'Effet un.' },
    { min: 2, max: 12, title: `${table} haut`, description: '' }] }));
const initial = useSessionOSStore.getState();
beforeEach(() => {
    ecrire.mockReset(); loadTable.mockClear();
    useSessionOSStore.setState({ getActiveDriver: () => PILOTE } as never);
    useDiceStore.setState({ history: [], lastRoll: null });
    vi.stubGlobal('appBridge', { tables: { loadTable } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); useSessionOSStore.setState(initial, true); });

const deckard = (hp: number, isPlayer = true): Combatant => ({
    id: 'c1', name: 'Deckard', isPlayer, sourcePlayerId: isPlayer ? 'h' : undefined, sourceEntityId: isPlayer ? undefined : 'e', hp, maxHp: 4,
    healthSystem: { type: 'hp', data: { current: hp, max: 4 }, state: hp <= 0 ? 'dead' : 'healthy', badges: [] },
} as unknown as Combatant);

describe('Brisé par les dégâts', () => {
    it('le rappel, la table et le dé au choix, chaque blessure notée à la suite', async () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(1);
        render(<HorsJeuDuCombattant combatant={deckard(0)} valeurs={{ blessuresCritiques: 'Nez cassé' }} />);
        expect(screen.getByText('Chaque nouveau coup est une blessure critique.')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('Table'), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText('Dé de critique'), { target: { value: '8' } });
        await act(async () => { fireEvent.click(screen.getByText('Blessure critique')); });
        expect(loadTable).toHaveBeenCalledWith('Blade Runner', 'perforant');
        expect(DiceEngine.roll).toHaveBeenCalledWith(8);
        expect(ecrire).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }), { blessuresCritiques: 'Nez cassé\nperforant 1 (Perforant)' });
        expect(useDiceStore.getState().history[0].totalDisplay).toBe('1 — perforant 1 : Effet un. (D8, Perforant)');
        // Répétable : chaque nouveau coup à zéro en est une autre.
        expect(screen.getByText('Encore une blessure critique')).toBeTruthy();
    });

    it('un adversaire tombé aussi, puisque sa blessure se note', () => {
        render(<HorsJeuDuCombattant combatant={deckard(0, false)} valeurs={{}} />);
        expect(screen.getByText('Blessure critique')).toBeTruthy();
    });
});

describe('Brisé par le stress, sur la carte', () => {
    it('Sang-froid à zéro : le dé d’Empathie, la table du réplicant, et un 1 coûte le maximum', async () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValue(1);
        render(<HorsJeuDuCombattant combatant={deckard(3)} valeurs={{ sangFroid: 0, sangFroidMax: 3, empathie: 'B', nature: 'Réplicant Nexus-9' }} />);
        expect(screen.queryByText('Blessure critique')).toBeNull();
        await act(async () => { fireEvent.click(screen.getByText("Lancer l'effet critique")); });
        expect(DiceEngine.roll).toHaveBeenCalledWith(10);
        expect(loadTable).toHaveBeenCalledWith('Blade Runner', 'stress_replicant');
        expect(ecrire).toHaveBeenCalledWith(expect.anything(), { sangFroidMax: 2, stressCritique: 'stress_replicant 1' });
        expect(screen.getByText(/maximum −1 à vie → 2/)).toBeTruthy();
    });

    it('rien tant que le Sang-froid tient', () => {
        render(<HorsJeuDuCombattant combatant={deckard(3)} valeurs={{ sangFroid: 1 }} />);
        expect(screen.queryByText("Lancer l'effet critique")).toBeNull();
    });
});

describe('la protection', () => {
    it('deux dés du niveau, chaque réussite retire un dégât', () => {
        vi.spyOn(DiceEngine, 'roll').mockReturnValueOnce(7).mockReturnValueOnce(3);
        render(<ProtectionDuCombattant combatant={deckard(3)} valeurs={{ protection: 'c', protectionNom: 'Gilet pare-balles' }} />);
        fireEvent.click(screen.getByText(/Gilet pare-balles C : 2D8/));
        expect(useDiceStore.getState().history[0].totalDisplay).toMatch(/: −1 dégât ; ramenés à 0, la blessure critique est annulée$/);
    });
    it('sans niveau sur la fiche, pas de bouton — « Aucune » n’est pas un A', () => {
        for (const protection of ['', 'Aucune', 'Sans protection', 'E']) {
            render(<ProtectionDuCombattant combatant={deckard(3)} valeurs={{ protection }} />);
            expect(screen.queryByText(/2D/), protection).toBeNull();
            cleanup();
        }
        render(<ProtectionDuCombattant combatant={deckard(3)} valeurs={{ protection: 'B (D10)' }} />);
        expect(screen.getByText(/B \(D10\) : 2D10/)).toBeTruthy();
    });
});

describe('l’effet critique, partagé avec le panneau de jet', () => {
    it('le dé de la fiche, et le maximum qui perd un point sur un 1', () => {
        const lire = (champ: string) => ({ sangFroidMax: 4 } as Record<string, number>)[champ] ?? 0;
        expect(lancerLEffetDuBrise({ de: 'empathie', perteDuMaximum: 'sangFroidMax' }, { empathie: 'A' }, lire, () => 1))
            .toEqual({ faces: 12, tire: 1, perte: { champ: 'sangFroidMax', reste: 3 } });
        expect(lancerLEffetDuBrise({ de: 'empathie' }, { empathie: '?' }, lire, () => 4)).toEqual({ faces: 6, tire: 4, perte: undefined });
    });
    it('une note s’ajoute sans effacer', () => {
        expect(noterSurLaFiche(undefined, 'A')).toBe('A');
        expect(noterSurLaFiche(' B ', 'A')).toBe('B\nA');
    });
});
