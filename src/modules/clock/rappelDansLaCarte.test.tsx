import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../i18n';
import { CarteDeJauge } from './components/CarteDeJauge';
import { useClockStore, type TensionClock } from '../../store/useClockStore';

/**
 * **Régler le rappel d'une jauge** — lot 2 (`2026-11-11-rappel-de-jet-du.md`,
 * T3 ; C1). Dans le menu « ⋮ » de la carte, avec le sens et le pas par scène ;
 * écrit en quittant le champ, effacé en le vidant ; une jauge qui en porte un le
 * montre sur sa carte.
 */

const journal: { title: string }[] = [];
vi.mock('../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => ({ isRecording: true, addEvent: (e: { title: string }) => journal.push(e) }) },
}));

const AIR: TensionClock = { id: 'air', name: 'Air respirable', totalSegments: 6, filledSegments: 4, sens: 'epuisement' };
const jauge = () => useClockStore.getState().tensions[0];
const carte = () => render(<CarteDeJauge clock={jauge()} theme="modern" />);

beforeEach(() => useClockStore.setState({ tensions: [{ ...AIR }] }));

describe('le rappel dans la carte de la jauge', () => {
    it('s’écrit en quittant le champ, et se lit ensuite sur la carte', () => {
        const { rerender } = carte();
        fireEvent.click(screen.getByLabelText('Réglages de la jauge'));
        const champ = screen.getByPlaceholderText("Jet d'Endurance, tout le monde");
        fireEvent.change(champ, { target: { value: 'Jet ' } });
        // Pendant la frappe, rien n'est écrit (l'espace qu'on vient de taper survit).
        expect(jauge().rappel).toBeUndefined();
        expect((champ as HTMLInputElement).value).toBe('Jet ');
        fireEvent.change(champ, { target: { value: "Jet d'Endurance " } });
        fireEvent.blur(champ);
        expect(jauge().rappel).toEqual({ texte: "Jet d'Endurance" });
        rerender(<CarteDeJauge clock={jauge()} theme="modern" />);
        expect(screen.getByTitle("Rappel au bout : Jet d'Endurance")).toBeTruthy();
    });

    it('Entrée valide ; vider le champ efface le rappel', () => {
        useClockStore.setState({ tensions: [{ ...AIR, rappel: { texte: 'Jet' } }] });
        carte();
        fireEvent.click(screen.getByLabelText('Réglages de la jauge'));
        const champ = screen.getByPlaceholderText("Jet d'Endurance, tout le monde");
        expect((champ as HTMLInputElement).value).toBe('Jet');
        fireEvent.change(champ, { target: { value: '' } });
        fireEvent.keyDown(champ, { key: 'Enter' });
        expect('rappel' in jauge()).toBe(false);
    });

    it('une jauge sans rappel n’en montre aucun', () => {
        carte();
        expect(screen.queryByTitle(/Rappel au bout/)).toBeNull();
    });

    it('au bout, le rappel se traite sur la carte même — « Fait » (David : « je ne vois pas de Fait »)', () => {
        journal.length = 0;
        useClockStore.setState({ tensions: [{ ...AIR, filledSegments: 0, rappel: { texte: "Jet d'Endurance" } }] });
        const { rerender } = carte();
        expect(document.querySelector('[data-rappel-au-bout]')!.textContent).toContain("Jet d'Endurance");
        fireEvent.click(screen.getByRole('button', { name: 'Fait' }));
        expect(jauge().rappel).toEqual({ texte: "Jet d'Endurance", traite: true });
        expect(journal.map(e => e.title)).toEqual(['Rappel — Air respirable']);
        rerender(<CarteDeJauge clock={jauge()} theme="modern" />);
        expect(document.querySelector('[data-rappel-au-bout]')).toBeNull();
        // La mention discrète revient : la jauge porte toujours son rappel.
        expect(screen.getByTitle("Rappel au bout : Jet d'Endurance")).toBeTruthy();
    });

    it('« Écarter » sur la carte : traité, sans journal', () => {
        journal.length = 0;
        useClockStore.setState({ tensions: [{ ...AIR, filledSegments: 0, rappel: { texte: 'Jet' } }] });
        carte();
        fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
        expect(jauge().rappel?.traite).toBe(true);
        expect(journal).toEqual([]);
    });
});
