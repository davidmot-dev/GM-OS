import { describe, it, expect } from 'vitest';
import { nombreOuRepli, listeOuVide, objetOuVide } from './HealthInterpreter';

/**
 * **Les trois lecteurs de `HealthSystem.data`.**
 *
 * `data` est un `Record<string, unknown>` rempli par le pilote du jeu : un champ
 * attendu peut être absent, et c'est un cas normal, pas une anomalie. Ces trois
 * fonctions sont le seul endroit qui décide quoi faire dans ce cas.
 *
 * Elles existent parce que `HealthManager` s'était écrit sa propre parade et
 * qu'elle était fausse : `Number(data.current) ?? repli` ne peut jamais
 * atteindre son repli, `Number()` rendant `NaN` et non `null`. La barre de vie
 * affichait `NaN` là où elle devait retomber sur les PV de la fiche.
 */
describe('nombreOuRepli', () => {
    it('rend le nombre quand il y en a un', () => {
        expect(nombreOuRepli(7, 10)).toBe(7);
        expect(nombreOuRepli(0, 10)).toBe(0);
        expect(nombreOuRepli(-3, 10)).toBe(-3);
    });

    it('rend le repli quand le champ est absent', () => {
        expect(nombreOuRepli(undefined, 10)).toBe(10);
    });

    /*
      **Le piège qui a motivé le tri par type.**

      `Number(null)` vaut 0, et `Number('')` aussi. Un lecteur écrit avec
      `Number.isFinite` seul rendrait donc 0 — soit, pour `max`, une division par
      zéro, et pour `current`, un personnage annoncé mort. Le repli est la seule
      réponse juste, et il ne s'obtient qu'en écartant ces valeurs AVANT de
      convertir.
    */
    it('rend le repli pour null et la chaîne vide, que Number() convertirait en 0', () => {
        expect(nombreOuRepli(null, 10)).toBe(10);
        expect(nombreOuRepli('', 10)).toBe(10);
        expect(nombreOuRepli('   ', 10)).toBe(10);
    });

    it('rend le repli pour ce qui n’est pas un nombre', () => {
        expect(nombreOuRepli('abc', 10)).toBe(10);
        expect(nombreOuRepli(NaN, 10)).toBe(10);
        expect(nombreOuRepli(Infinity, 10)).toBe(10);
        expect(nombreOuRepli({}, 10)).toBe(10);
        expect(nombreOuRepli([], 10)).toBe(10);
        expect(nombreOuRepli(true, 10)).toBe(10);
    });

    /* Les fiches importées écrivent parfois les PV en toutes lettres. */
    it('accepte un nombre écrit en chaîne', () => {
        expect(nombreOuRepli('7', 10)).toBe(7);
        expect(nombreOuRepli('  7  ', 10)).toBe(7);
    });
});

describe('listeOuVide', () => {
    it('rend la liste telle quelle', () => {
        const paliers = ['Indemne', 'Blessé'];
        expect(listeOuVide<string>(paliers)).toBe(paliers);
    });

    /*
      Le vrai enjeu : `WoundLevelsDriver` et `HarmBoxesDriver` appellent `.map()`
      sur ce qu'ils reçoivent. Un `undefined` n'y affichait pas une liste vide,
      il levait une TypeError et emportait le panneau.
    */
    it('rend une liste vide plutôt que undefined, que .map() ferait exploser', () => {
        expect(listeOuVide(undefined)).toEqual([]);
        expect(listeOuVide(null)).toEqual([]);
        expect(listeOuVide('Indemne')).toEqual([]);
        expect(listeOuVide({ 0: 'Indemne' })).toEqual([]);
    });
});

describe('objetOuVide', () => {
    it('rend l’objet tel quel', () => {
        const zones = { torso: { status: 'healthy' } };
        expect(objetOuVide(zones)).toBe(zones);
    });

    /* `typeof null === 'object'` : sans ce test, la garde laisserait passer null. */
    it('rend un objet vide pour null, dont le typeof ment', () => {
        expect(objetOuVide(null)).toEqual({});
    });

    it('rend un objet vide pour ce qui n’est pas une table de zones', () => {
        expect(objetOuVide(undefined)).toEqual({});
        expect(objetOuVide(['torso'])).toEqual({});
        expect(objetOuVide('torso')).toEqual({});
    });
});
