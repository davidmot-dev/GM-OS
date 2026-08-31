import { describe, it, expect, beforeEach } from 'vitest';
import { dateDuChamp, heureDuChamp } from './champsDeDate';
import { useClockStore, horodatageValide, HORODATAGE_MAX } from '../../../store/useClockStore';

/**
 * Ce que ces tests protègent : **le tableau de bord des horloges ne meurt plus
 * sur une saisie vide.**
 *
 * *Signalé par David le 2026-08-31, à l'écran* : `RangeError: Invalid time
 * value`, et tout `ClockDashboard` emporté par l'`ErrorBoundary`.
 *
 * Le chemin faisait trois pas et personne ne gardait aucun d'eux : vider le
 * champ de date donnait `new Date('')`, donc `getTime()` à `NaN` ; le magasin
 * l'acceptait sans regarder ; et au rendu suivant `toISOString()` — la seule
 * des trois conversions employées qui **lève** — tuait le composant.
 */

const MAINTENANT = new Date(2026, 7, 31, 21, 30, 15).getTime();

describe('le magasin refuse ce qui n’est pas un horodatage', () => {
    beforeEach(() => {
        useClockStore.setState({ timestamp: MAINTENANT });
    });

    it('reconnaît un horodatage utilisable', () => {
        expect(horodatageValide(MAINTENANT)).toBe(true);
        expect(horodatageValide(0)).toBe(true);
    });

    /**
     * `null` vient de la persistance : `JSON.stringify(NaN)` rend `null`, donc
     * un `NaN` écrit sur disque revient sous un autre visage.
     */
    it('écarte NaN, l’infini, null et le hors-bornes', () => {
        for (const mauvais of [NaN, Infinity, -Infinity, null, undefined, '2026-08-31', HORODATAGE_MAX + 1]) {
            expect(horodatageValide(mauvais), String(mauvais)).toBe(false);
        }
    });

    /**
     * **Le geste exact qui plantait** : le champ de date vidé.
     * `new Date('').getTime()` vaut `NaN`.
     */
    it('ignore le NaN que produisait un champ vidé', () => {
        useClockStore.getState().setTimestamp(new Date('').getTime());
        expect(useClockStore.getState().timestamp).toBe(MAINTENANT);
    });

    /**
     * On garde la valeur précédente plutôt que de retomber sur maintenant :
     * *refuser une saisie ne doit pas déplacer une horloge déjà posée.*
     */
    it('garde l’heure que le meneur avait posée', () => {
        useClockStore.getState().setTimestamp(NaN);
        expect(useClockStore.getState().timestamp).toBe(MAINTENANT);
    });

    it('empêche un décalage de propager une valeur fausse', () => {
        useClockStore.getState().addTime(NaN);
        expect(useClockStore.getState().timestamp).toBe(MAINTENANT);
    });

    /**
     * **La synchro entre fenêtres écrit par `setState` et contourne le
     * contrôle** : une valeur fausse peut donc encore entrer par là. Refuser
     * tous les décalages laisserait alors l'horloge morte jusqu'au prochain
     * démarrage — *un garde qui ne fait que refuser transforme une donnée
     * fausse en panne définitive.*
     */
    it('répare l’horloge au premier décalage si elle est déjà corrompue', () => {
        useClockStore.setState({ timestamp: NaN });
        useClockStore.getState().addTime(60);

        const apres = useClockStore.getState().timestamp;
        expect(horodatageValide(apres)).toBe(true);
        expect(apres).toBeGreaterThan(Date.now() - 5_000);
    });
});

describe('les champs de saisie', () => {
    /**
     * **Le test qui reproduit le crash.** Avant le correctif, cette ligne levait
     * `RangeError: Invalid time value` au lieu de rendre une chaîne.
     */
    it('ne lèvent jamais, même sur un horodatage impossible', () => {
        for (const mauvais of [NaN, Infinity, HORODATAGE_MAX * 2]) {
            expect(() => dateDuChamp(mauvais)).not.toThrow();
            expect(() => heureDuChamp(mauvais)).not.toThrow();
        }
    });

    it('rendent bien le format qu’attendent les deux champs', () => {
        expect(dateDuChamp(MAINTENANT)).toBe('2026-08-31');
        expect(heureDuChamp(MAINTENANT)).toBe('21:30:15');
    });

    /**
     * **Un second défaut, trouvé en corrigeant le premier.** `toISOString()`
     * convertit vers UTC : une soirée de jeu à 23 h en France s'y affichait au
     * lendemain. Le champ montrait donc parfois une date que le meneur n'avait
     * pas posée — *discret, et il vivait juste à côté de celui qui plantait.*
     */
    it('affichent la date LOCALE, et non celle d’UTC', () => {
        const tardDansLaSoiree = new Date(2026, 7, 31, 23, 30, 0);
        expect(dateDuChamp(tardDansLaSoiree.getTime())).toBe('2026-08-31');
        expect(heureDuChamp(tardDansLaSoiree.getTime())).toBe('23:30:00');
    });

    it('remplacent une valeur inutilisable par l’heure courante', () => {
        expect(dateDuChamp(NaN)).toBe(dateDuChamp(Date.now()));
    });
});
