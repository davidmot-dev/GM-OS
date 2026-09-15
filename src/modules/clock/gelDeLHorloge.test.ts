import { describe, it, expect, beforeEach } from 'vitest';
import { useClockStore } from '../../store/useClockStore';
import type { CalendrierDatable } from './logic/formeDuCalendrier';

/**
 * ⛔⛔ **Le calendrier qui gèle GM-OS.**
 *
 * *Mesuré le 2026-09-15, avant d'écrire une ligne de l'Atelier.*
 * `getFantasyDate` avance d'année en année par soustraction :
 *
 * ```ts
 * while (totalSeconds >= daysInYear * secondsPerDay) { totalSeconds -= …; year++; }
 * ```
 *
 * Si une année dure **zéro seconde** — aucun mois, ou `hoursPerDay: 0` — la
 * condition reste vraie, la soustraction ne retire rien, **et la boucle ne
 * s'arrête jamais**. Cinquante millions de tours sans sortir. *Ce n'est pas une
 * date fausse : c'est l'application figée, sans message et sans trace.*
 *
 * ⛔ **Éprouvé par dégradation, et la dégradation N'A PAS ROUGI : elle a PENDU.**
 * Garde retirée, la suite de tests ne rend jamais la main — il a fallu tuer
 * vitest de l'extérieur après deux minutes.
 *
 * ⚠️ **Et c'est la leçon** : le `timeout` posé sur chaque essai ci-dessous **ne
 * sauve de rien**. Une boucle synchrone ne rend pas la main à l'ordonnanceur, donc
 * aucun délai ne peut l'interrompre — ni celui de vitest, ni celui d'un
 * navigateur. *Un gel n'est pas une lenteur : c'est le seul mode d'échec qu'aucun
 * garde-fou d'exécution ne rattrape.* On ne peut que l'empêcher d'entrer, ce que
 * fait `leCalendrierEstFautif` — d'où son rang de **condition** du module et non
 * de confort.
 *
 * Le délai reste écrit : il ne protège pas, mais il documente l'intention et
 * borne les cas où la lenteur, elle, serait rattrapable.
 *
 * ⚠️ **La garde vit dans le MAGASIN et pas seulement dans l'Atelier** : les
 * calendriers arrivent aussi par un fichier JSON posé à la main dans
 * `databases/calendars/`, et c'est même le seul chemin qui ait jamais existé.
 * *Une garde qui ne tient que dans l'écran laisse entrer tout ce qui ne passe
 * pas par l'écran.*
 */

const poser = (cal: Partial<CalendrierDatable>) => {
    const complet = {
        id: 'essai', name: 'Essai', daysPerWeek: 7,
        hoursPerDay: 24, minutesPerHour: 60,
        months: [{ name: 'Unique', days: 30 }],
        ...cal,
    } as CalendrierDatable;

    useClockStore.setState({
        calendars: { essai: complet },
        activeCalendarId: 'essai',
        timestamp: Date.now(),
    });
};

beforeEach(() => {
    useClockStore.setState({ calendars: {}, activeCalendarId: null });
});

describe('⛔ getFantasyDate face à un calendrier qui ne tient pas debout', () => {
    it('rend null sur un calendrier SANS MOIS, au lieu de boucler sans fin', { timeout: 3_000 }, () => {
        poser({ months: [] });
        expect(useClockStore.getState().getFantasyDate()).toBeNull();
    });

    it('rend null quand le jour dure zéro seconde', { timeout: 3_000 }, () => {
        poser({ hoursPerDay: 0 });
        expect(useClockStore.getState().getFantasyDate()).toBeNull();

        poser({ minutesPerHour: 0 });
        expect(useClockStore.getState().getFantasyDate()).toBeNull();
    });

    it('rend null quand tous les mois sont vides', { timeout: 3_000 }, () => {
        poser({ months: [{ name: 'Creux', days: 0 }, { name: 'Vide', days: 0 }] });
        expect(useClockStore.getState().getFantasyDate()).toBeNull();
    });

    /** ⚠️ Et la porte d'écriture se ferme aussi : rien ne doit ressortir par là. */
    it('ne pose aucune date sur un calendrier fautif', { timeout: 3_000 }, () => {
        poser({ months: [] });
        const avant = useClockStore.getState().timestamp;

        useClockStore.getState().setFantasyDate({ year: 1492 });

        expect(useClockStore.getState().timestamp).toBe(avant);
    });
});

describe('et un calendrier sain répond toujours', () => {
    it('rend une date lisible', { timeout: 3_000 }, () => {
        poser({});
        const date = useClockStore.getState().getFantasyDate();

        expect(date).not.toBeNull();
        expect(Number.isFinite(date!.year)).toBe(true);
        expect(date!.day).toBeGreaterThanOrEqual(1);
    });

    /** ⭐ La date de départ, qui n'avait jamais eu de lecteur. */
    it('se laisse poser à l’année déclarée', { timeout: 3_000 }, () => {
        poser({});
        useClockStore.getState().setFantasyDate({ year: 1492 });

        expect(useClockStore.getState().getFantasyDate()!.year).toBe(1492);
    });
});
