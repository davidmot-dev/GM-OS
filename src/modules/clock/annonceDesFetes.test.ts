import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClockStore } from '../../store/useClockStore';
import { horodatageDeLaDate, type CalendrierDatable } from './logic/formeDuCalendrier';

/**
 * **Une fête qui commence entre au journal — et une seule fois.**
 *
 * *Demandé par David le 2026-09-15 avec les jours de fête.* Une fête qu'on
 * déclare et qui ne se signale jamais n'est qu'une étiquette : *c'est le motif
 * que ce dépôt a déjà payé quatre fois — la chaîne complète sans bouton au
 * bout.*
 *
 * ⛔ **Le piège que ces essais tiennent : une fête de quatre jours ne doit
 * écrire qu'UNE entrée.** La mention passe de « (1/4) » à « (4/4) » ; comparer
 * la mention en écrirait quatre. *Entrer dans une fête est un événement ; y
 * rester n'en est pas un.*
 */

const CAL: CalendrierDatable = {
    id: 'essai',
    name: 'Essai',
    daysPerWeek: 7,
    daysOfWeek: ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept'],
    hoursPerDay: 24,
    minutesPerHour: 60,
    months: [
        {
            name: 'Hammer',
            days: 30,
            fetes: [
                { nom: 'Fête du Marteau', jour: 15, description: 'On bat le fer froid.' },
                { nom: 'Nuits du Marteau', jour: 20, duree: 4 },
            ],
        },
        { name: 'Alturiak', days: 30 },
    ],
};

const entrees: { type: string; title: string; content: string }[] = [];

const journal = {
    isRecording: true,
    addEvent: vi.fn((e: { type: string; title: string; content: string }) => { entrees.push(e); }),
};

/** Pose la date sans passer par les actions, pour ne rien annoncer en installant. */
const poserLaDate = (monthIndex: number, day: number) => {
    useClockStore.setState({
        timestamp: horodatageDeLaDate(CAL, {
            year: 1, monthIndex, day, hour: 12, minute: 0, second: 0,
        })!,
    });
};

beforeEach(() => {
    entrees.length = 0;
    journal.addEvent.mockClear();
    journal.isRecording = true;
    (window as unknown as Record<string, unknown>).useJournalStore = { getState: () => journal };

    useClockStore.setState({
        calendars: { essai: CAL },
        activeCalendarId: 'essai',
        mode: 'fantasy',
    });
    poserLaDate(0, 1);
});

describe('⭐ une fête qui commence entre au journal', () => {
    it('s’annonce quand le temps arrive dessus', () => {
        poserLaDate(0, 14);
        useClockStore.getState().addTime(24 * 3600);

        expect(entrees).toHaveLength(1);
        expect(entrees[0].title).toContain('Fête du Marteau');
    });

    it('emporte la description quand il y en a une', () => {
        poserLaDate(0, 14);
        useClockStore.getState().addTime(24 * 3600);

        expect(entrees[0].content).toContain('On bat le fer froid.');
    });

    /** ⛔ Le test qui justifie la comparaison par NOM. */
    it('n’écrit PAS une entrée par jour d’une fête de quatre jours', () => {
        poserLaDate(0, 19);

        for (let n = 0; n < 4; n++) useClockStore.getState().addTime(24 * 3600);

        expect(useClockStore.getState().getFantasyDate()?.fete?.nom).toBe('Nuits du Marteau');
        expect(entrees, 'entrer dans une fête est un événement ; y rester n’en est pas un')
            .toHaveLength(1);
    });

    it('s’annonce de nouveau si on en sort et qu’on y revient', () => {
        poserLaDate(0, 14);
        useClockStore.getState().addTime(24 * 3600);   // → 15, la fête
        useClockStore.getState().addTime(24 * 3600);   // → 16, dehors
        poserLaDate(0, 14);
        useClockStore.getState().addTime(24 * 3600);   // → 15 de nouveau

        expect(entrees).toHaveLength(2);
    });

    it('ne dit rien les jours ordinaires', () => {
        useClockStore.getState().addTime(24 * 3600);
        useClockStore.getState().addTime(24 * 3600);

        expect(entrees).toEqual([]);
    });

    it('la mention porte le rang quand la fête dure', () => {
        poserLaDate(0, 19);
        useClockStore.getState().addTime(24 * 3600);

        expect(entrees[0].content).toContain('(1/4)');
    });

    it('n’écrit pas le rang d’une fête d’un seul jour', () => {
        poserLaDate(0, 14);
        useClockStore.getState().addTime(24 * 3600);

        expect(entrees[0].content).not.toContain('/1');
    });
});

describe('les trois gestes qui déplacent le temps l’annoncent', () => {
    it('depuis setFantasyDate', () => {
        useClockStore.getState().setFantasyDate({ day: 15 });

        expect(entrees).toHaveLength(1);
    });

    it('depuis setTimestamp', () => {
        useClockStore.getState().setTimestamp(horodatageDeLaDate(CAL, {
            year: 1, monthIndex: 0, day: 15, hour: 12, minute: 0, second: 0,
        })!);

        expect(entrees).toHaveLength(1);
    });
});

describe('⚠️ ce qui ne doit PAS écrire au journal', () => {
    /** *Le hub ne doit pas consigner ce que le meneur a déjà consigné.* */
    it('la synchronisation entre fenêtres, qui écrit par setState', () => {
        poserLaDate(0, 15);

        expect(useClockStore.getState().getFantasyDate()?.fete?.nom).toBe('Fête du Marteau');
        expect(entrees).toEqual([]);
    });

    it('une séance qui n’enregistre pas', () => {
        journal.isRecording = false;
        poserLaDate(0, 14);
        useClockStore.getState().addTime(24 * 3600);

        expect(entrees).toEqual([]);
    });

    it('et rien ne lève quand le journal n’existe pas', () => {
        delete (window as unknown as Record<string, unknown>).useJournalStore;
        poserLaDate(0, 14);

        expect(() => useClockStore.getState().addTime(24 * 3600)).not.toThrow();
    });
});
