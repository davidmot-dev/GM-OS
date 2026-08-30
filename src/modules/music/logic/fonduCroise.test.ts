import { describe, it, expect } from 'vitest';
import {
    gainsALaPosition,
    courbeDuFonduCroise,
    positionDuFondu,
    platineDeDestination,
    platineOpposee,
    positionDeLaPlatine,
} from './fonduCroise';

/**
 * **Le fondu croisé de Music-OS.**
 *
 * Signalé par David le 2026-08-30 : *« les fade-in fade-out entre 2 morceaux ne
 * fonctionnent pas bien »*. Trois défauts se cumulaient ; ces tests gardent les
 * deux qui vivent dans la partie pure.
 */

/** La puissance perçue de deux sources sans rapport : la somme de leurs carrés. */
const puissance = (a: number, b: number) => a * a + b * b;

describe('la courbe du fondu', () => {
    /**
     * **Le défaut de fond.** L'ancien fondu était linéaire — `1 - v` et `v` — et
     * à mi-parcours la puissance tombait à 0,5, soit **−3 dB**. Un creux audible
     * au milieu de chaque transition, exactement ce qu'on entend.
     *
     * `cos² + sin² = 1` : la puissance vaut désormais 1 **en tout point**.
     */
    it('garde une puissance constante sur tout le trajet', () => {
        for (let i = 0; i <= 20; i++) {
            const { a, b } = gainsALaPosition(i / 20);
            expect(puissance(a, b), `position ${i / 20}`).toBeCloseTo(1, 6);
        }
    });

    /** La démonstration du défaut, pour que la raison du correctif reste lisible. */
    it('là où le fondu linéaire perdait 3 dB', () => {
        const lineaire = puissance(1 - 0.5, 0.5);
        expect(lineaire, 'l’ancien creux').toBeCloseTo(0.5, 6);
        expect(10 * Math.log10(lineaire), 'soit −3 dB').toBeCloseTo(-3.01, 1);

        const { a, b } = gainsALaPosition(0.5);
        expect(puissance(a, b), 'et le nouveau ne creuse plus').toBeCloseTo(1, 6);
    });

    it('donne bien A seule à 0 et B seule à 1', () => {
        expect(gainsALaPosition(0)).toEqual({ a: 1, b: 0 });
        const fin = gainsALaPosition(1);
        expect(fin.a).toBeCloseTo(0, 6);
        expect(fin.b).toBeCloseTo(1, 6);
    });

    it('borne les positions aberrantes au lieu de produire des gains négatifs', () => {
        expect(gainsALaPosition(-3)).toEqual(gainsALaPosition(0));
        expect(gainsALaPosition(42)).toEqual(gainsALaPosition(1));
    });
});

describe('la courbe envoyée à Web Audio', () => {
    it('part de la position courante et arrive à la cible', () => {
        const { a, b } = courbeDuFonduCroise(0.5, 1, 64);
        expect(a[0]).toBeCloseTo(Math.cos(Math.PI / 4), 6);
        expect(b[0]).toBeCloseTo(Math.sin(Math.PI / 4), 6);
        expect(a[63]).toBeCloseTo(0, 6);
        expect(b[63]).toBeCloseTo(1, 6);
    });

    /**
     * Un fondu déclenché alors que le crossfader traîne à mi-course doit repartir
     * d'où il est. *L'ancien code posait la valeur d'arrivée immédiatement, donc
     * le son sautait avant de glisser.*
     */
    it('ne saute jamais : la puissance reste constante même en repartant du milieu', () => {
        const { a, b } = courbeDuFonduCroise(0.3, 0, 32);
        for (let i = 0; i < a.length; i++) {
            expect(puissance(a[i], b[i]), `point ${i}`).toBeCloseTo(1, 6);
        }
    });

    it('refuse de produire une courbe dégénérée', () => {
        expect(courbeDuFonduCroise(0, 1, 1).a.length).toBeGreaterThanOrEqual(2);
    });
});

/**
 * **Une seule horloge : celle qui fait le son.**
 *
 * L'ancien mécanisme en avait trois — le gain Web Audio, la valeur du magasin
 * posée d'avance à 0 ou 1, et une boucle `requestAnimationFrame` du composant
 * `Mixer` qui animait un troisième nombre pour l'affichage.
 */
describe('où en est le fondu', () => {
    const fondu = { depart: 0, cible: 1, debutSec: 100, dureeSec: 6 };

    it('rend le départ avant de commencer', () => {
        expect(positionDuFondu(fondu, 99)).toBe(0);
    });

    it('interpole pendant', () => {
        expect(positionDuFondu(fondu, 103)).toBeCloseTo(0.5, 6);
    });

    it('rend la cible une fois fini, et n’overshoot pas', () => {
        expect(positionDuFondu(fondu, 106)).toBe(1);
        expect(positionDuFondu(fondu, 500)).toBe(1);
    });

    it('supporte une durée nulle', () => {
        expect(positionDuFondu({ ...fondu, dureeSec: 0 }, 100)).toBe(1);
    });
});

/**
 * ⚠ **Le défaut qui rendait le mécanisme dépendant d'un écran ouvert.**
 *
 * L'ancienne règle lisait d'abord `autoFadeTarget`, un drapeau posé par le
 * magasin et effacé par un `useEffect` du composant `Mixer`. Music-OS fermé,
 * personne ne l'effaçait, et le drapeau périmé choisissait la platine à
 * l'envers. La position du crossfader, elle, ne se périme pas.
 */
describe('la platine qui accueille le morceau suivant', () => {
    it('choisit celle qu’on n’entend pas', () => {
        expect(platineDeDestination(0), 'A joue seule → charger B').toBe('B');
        expect(platineDeDestination(0.2)).toBe('B');
        expect(platineDeDestination(1), 'B joue seule → charger A').toBe('A');
        expect(platineDeDestination(0.8)).toBe('A');
    });

    it('alterne : deux morceaux d’affilée ne tombent pas sur la même platine', () => {
        const premiere = platineDeDestination(0);
        const apres = positionDeLaPlatine(premiere);
        expect(platineDeDestination(apres)).toBe(platineOpposee(premiere));
    });

    it('nomme l’autre platine', () => {
        expect(platineOpposee('A')).toBe('B');
        expect(platineOpposee('B')).toBe('A');
    });

    it('sait où arrive un fondu vers chaque platine', () => {
        expect(positionDeLaPlatine('A')).toBe(0);
        expect(positionDeLaPlatine('B')).toBe(1);
    });
});
