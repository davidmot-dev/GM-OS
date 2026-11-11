import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '../../i18n';

/**
 * **Les rappels des jauges, au cockpit** — lot 2 (`2026-11-11-rappel-de-jet-du.md`,
 * T4 ; C2, C4). Paraît au bout ; « Fait » l'éteint et l'inscrit au journal,
 * « Écarter » l'éteint sans rien écrire ; revient au passage suivant.
 */

const evenements: { type: string; title: string; content: string }[] = [];
vi.mock('../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => ({ isRecording: true, addEvent: (e: { type: string; title: string; content: string }) => evenements.push(e) }) },
}));

const { default: RappelsDesJauges } = await import('./components/RappelsDesJauges');
const { useClockStore } = await import('../../store/useClockStore');

const AIR = { id: 'air', name: 'Air respirable', totalSegments: 3, filledSegments: 1, sens: 'epuisement' as const,
    rappel: { texte: "Jet d'Endurance, tout le monde" } };
const ligne = () => screen.queryByRole('list', { name: 'Rappels des jauges' });
const vider = () => act(() => useClockStore.getState().updateTensionSegments('air', -1));

beforeEach(() => {
    evenements.length = 0;
    useClockStore.setState({ tensions: [{ ...AIR, rappel: { ...AIR.rappel } }] });
});

describe('les rappels au cockpit', () => {
    it('rien tant que la jauge n’est pas au bout ; au bout, la ligne paraît', () => {
        render(<RappelsDesJauges />);
        expect(ligne()).toBeNull();
        vider();
        expect(ligne()!.textContent).toContain('Air respirable');
        expect(ligne()!.textContent).toContain('à vide');
        expect(ligne()!.textContent).toContain("Jet d'Endurance, tout le monde");
    });

    it('« Fait » l’éteint et l’inscrit au journal', () => {
        render(<RappelsDesJauges />);
        vider();
        fireEvent.click(screen.getByRole('button', { name: 'Fait' }));
        expect(ligne()).toBeNull();
        expect(evenements).toEqual([{ type: 'SYSTEM', title: 'Rappel — Air respirable', content: "Jet d'Endurance, tout le monde" }]);
    });

    it('« Écarter » l’éteint sans rien écrire ; il revient au passage suivant', () => {
        render(<RappelsDesJauges />);
        vider();
        fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
        expect(ligne()).toBeNull();
        expect(evenements).toEqual([]);
        act(() => useClockStore.getState().updateTensionSegments('air', 1));
        expect(ligne()).toBeNull();
        vider();
        expect(ligne()).not.toBeNull();
    });
});
