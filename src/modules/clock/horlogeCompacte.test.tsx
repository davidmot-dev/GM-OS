import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useClockStore, type FantasyCalendar } from '../../store/useClockStore';
import { horodatageDeLaDate } from './logic/formeDuCalendrier';
import ClockVisualizer from './components/ClockVisualizer';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (_cle: string, repli: string) => repli, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

beforeEach(() => {
    cleanup();
    useClockStore.setState({ timerDuration: 0, timerRemaining: 0, timerIsRunning: false, timerLabel: '', activeCalendarId: null });
});

describe('la lecture compacte de la tablette', () => {
    it('conserve les secondes et la date de l’horloge statique', () => {
        const date = new Date(2026, 9, 3, 21, 36, 17);
        const vue = render(<ClockVisualizer compact theme="modern" mode="static" timestamp={date.getTime()} />);
        expect(vue.getByText('21:36', { exact: true })).toBeTruthy();
        expect(vue.getByText('17', { exact: true })).toBeTruthy();
        expect(vue.getByText(/3 octobre 2026/)).toBeTruthy();
    });

    it.each(['modern', 'cyberpunk', 'oldstyle'] as const)('lit le décompte et son nom en %s', theme => {
        useClockStore.setState({ timerDuration: 120, timerRemaining: 65, timerLabel: 'Porte du relais' });
        const vue = render(<ClockVisualizer compact theme={theme} mode="timer" timestamp={0} />);
        expect(vue.getByRole('timer').textContent).toBe('01:05');
        expect(vue.getByText('Porte du relais')).toBeTruthy();
    });

    it('garde le calendrier fantastique et le jour de la fête', () => {
        const calendrier: FantasyCalendar = {
            id: 'essai', name: 'Essai', daysPerWeek: 7,
            daysOfWeek: ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept'],
            hoursPerDay: 24, minutesPerHour: 60,
            months: [{ name: 'Hammer', days: 30, fetes: [{ nom: 'Nuits du Marteau', jour: 20, duree: 4 }] }],
        };
        const timestamp = horodatageDeLaDate(calendrier, { year: 1, monthIndex: 0, day: 21, hour: 7, minute: 15, second: 9 })!;
        useClockStore.setState({ calendars: { essai: calendrier }, activeCalendarId: 'essai', timestamp });
        const vue = render(<ClockVisualizer compact theme="oldstyle" mode="fantasy" timestamp={timestamp} />);
        expect(vue.getByText('07:15', { exact: true })).toBeTruthy();
        expect(vue.getByText(/21 Hammer 1 — Nuits du Marteau \(2\/4\)/)).toBeTruthy();
    });
});
