import { describe, it, expect, beforeEach } from 'vitest';
import { useClockStore } from '../../store/useClockStore';
import { controlerLeCalendrier, heureNommee, horodatageDeLaDate, mesurerLeCalendrier, type CalendrierDatable } from './logic/formeDuCalendrier';
import { HEURES_DRACONIQUES } from '../session/logic/ficheDeVoyageur';
import { momentDraconique } from '../session/logic/astrologieDuVoyageur';
import fichier from '../../../databases/calendars/reve-de-dragon.json';

/**
 * **Le calendrier de Rêve de Dragon** — 24/10/2026, demandé par David. Douze mois
 * lunaires de 28 jours, douze heures draconiques de 120 minutes (Livre des
 * Voyageurs 2.3.1, p. 78 ; Livre des Mondes, p. 314).
 */
const cal = { id: 'reve-de-dragon', ...fichier } as CalendrierDatable;
const poser = (timestamp: number) => useClockStore.setState({ calendars: { 'reve-de-dragon': cal }, activeCalendarId: 'reve-de-dragon', timestamp, mode: 'fantasy' });

beforeEach(() => useClockStore.setState({ calendars: {}, activeCalendarId: null }));

describe('le calendrier de Rêve de Dragon', () => {
    it('tient debout sans le moindre reproche : 336 jours, douze mois, douze heures nommées', () => {
        expect(controlerLeCalendrier(cal).filter(c => c.gravite !== 'note')).toEqual([]);
        const mesure = mesurerLeCalendrier(cal);
        expect(mesure.joursParAnneeOrdinaire).toBe(336);
        expect(mesure.joursParAnneeBissextile).toBeNull();
        expect(cal.months.map(m => m.name)).toEqual(HEURES_DRACONIQUES.map(h => h.replace(/^(Le |La |Les |L’)/, '')));
        expect(cal.nomsDesHeures).toEqual(HEURES_DRACONIQUES);
    });

    it('nomme l’heure par son rang : la troisième est le Faucon', () => {
        expect(heureNommee(cal, 2)).toEqual({ rang: 3, nom: 'Le Faucon' });
        expect(heureNommee(cal, 12)).toBeNull();
        expect(heureNommee({ ...cal, nomsDesHeures: ['Une'] }, 0)).toBeNull();
    });

    it('les minutes d’une heure de 120 minutes sont de vraies minutes', () => {
        // 14 du Vaisseau, an 1, au Faucon et 45 minutes.
        const quand = horodatageDeLaDate(cal, { year: 1, monthIndex: 0, day: 14, hour: 2, minute: 45, second: 30 })!;
        expect(quand).toBe(((336 + 13) * 86400 + 2 * 7200 + 45 * 60 + 30) * 1000);
        poser(quand);
        expect(useClockStore.getState().getFantasyDate()).toMatchObject({ year: 1, monthIndex: 0, day: 14, hour: 2, minute: 45, second: 30, fete: { nom: 'Pleine lune' } });
    });

    it('la journée dure 24 heures réelles : l’astrologie tombe sur la même heure', () => {
        const quand = horodatageDeLaDate(cal, { year: 1, monthIndex: 9, day: 1, hour: 9, minute: 10, second: 0 })!;
        poser(quand);
        expect(useClockStore.getState().getFantasyDate()?.fete?.nom).toBe('Premier jour de l’hiver');
        // Le repère calé sur le début du jour du calendrier.
        const debutDuJour = quand - (9 * 7200 + 10 * 60) * 1000;
        expect(momentDraconique(debutDuJour, quand)).toEqual({ jour: 0, heure: 10, nom: 'L’Araignée' });
    });

    it('n’a pas changé le calendrier d’Harptos, dont l’heure fait 60 minutes', () => {
        const harptos = { ...cal, hoursPerDay: 24, minutesPerHour: 60, nomsDesHeures: undefined } as CalendrierDatable;
        expect(horodatageDeLaDate(harptos, { year: 0, monthIndex: 0, day: 1, hour: 13, minute: 7, second: 5 })).toBe((13 * 3600 + 7 * 60 + 5) * 1000);
    });
});
