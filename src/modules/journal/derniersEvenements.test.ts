import { describe, it, expect } from 'vitest';
import { lesDerniersEvenements } from './derniersEvenements';
import type { JournalEvent } from './types';

/**
 * **Ce que ces tests protègent : l'Oracle reçoit la fin de la séance, pas le
 * début.**
 *
 * `AIService.getLiveSessionContext` composait sa section « Historique Récent »
 * avec `slice(-10)` sur un tableau que le journal empile **en tête**. Il envoyait
 * donc les dix plus ANCIENS événements, sous un intitulé qui annonce le
 * contraire — et trois heures de jeu plus tard, l'Oracle répondait sur les dix
 * premières minutes.
 *
 * **Rien ne pouvait le signaler** : ni erreur, ni vide, ni incohérence visible.
 * Une réponse plausible, simplement fondée sur ce qui ne se joue plus. C'est
 * pourquoi ce test existe : ce défaut-là n'a pas de symptôme.
 */

/** Le journal tel qu'il stocke : le plus récent d'abord. */
const journalEmpile = (titres: string[]): JournalEvent[] =>
    titres.map((title, i) => ({
        id: `e-${i}`, timestamp: titres.length - i, type: 'NOTE' as const, title, content: '',
    }));

describe('les derniers événements d\'un journal', () => {
    // Le plus récent est en tête : « dix » est le dernier fait de la séance.
    const seance = journalEmpile(['dix', 'neuf', 'huit', 'sept', 'six', 'cinq', 'quatre', 'trois', 'deux', 'un']);

    it('prend les plus récents, jamais les plus anciens', () => {
        // Le défaut exact : `slice(-3)` aurait rendu « trois, deux, un ».
        expect(lesDerniersEvenements(seance, 3).map(e => e.title))
            .toEqual(['huit', 'neuf', 'dix']);
    });

    it('les rend dans l\'ordre des faits', () => {
        // Un modèle à qui l'on donne une chronologie à l'envers en tire des
        // causes fausses.
        const rendus = lesDerniersEvenements(seance, 10).map(e => e.title);
        expect(rendus[0]).toBe('un');
        expect(rendus[rendus.length - 1]).toBe('dix');
    });

    it('ne touche pas au tableau qu\'on lui donne', () => {
        // `reverse` mute : il ne travaille que sur la copie rendue par `slice`.
        // Sans cela, lire le contexte réordonnerait le journal du meneur.
        const original = [...seance];
        lesDerniersEvenements(seance, 5);
        expect(seance.map(e => e.title)).toEqual(original.map(e => e.title));
    });

    it('rend tout quand on en demande plus qu\'il n\'y en a', () => {
        expect(lesDerniersEvenements(journalEmpile(['b', 'a']), 10).map(e => e.title))
            .toEqual(['a', 'b']);
    });

    it('ne se plaint pas d\'un journal absent ou vide', () => {
        // Une séance qui n'a rien enregistré n'est pas une panne.
        expect(lesDerniersEvenements(undefined, 10)).toEqual([]);
        expect(lesDerniersEvenements([], 10)).toEqual([]);
        expect(lesDerniersEvenements(seance, 0)).toEqual([]);
    });
});
