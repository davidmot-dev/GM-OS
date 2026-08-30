import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

/**
 * **Les aiguilles du cadran « old style » ne pivotaient pas sur l'axe.**
 *
 * Signalé par David le 2026-08-30. Chacune était posée par
 * `top: calc(50% - Npx)`, où N valait sa hauteur **supposée** — 96 px pour
 * `h-24`, 144 pour `h-36`, 160 pour `h-40`. Mais `h-24` vaut 6 rem, et
 * `:root { font-size: 85% }` fait valoir un rem 13,6 px : le bas de l'aiguille
 * tombait 14 px au-dessus du centre, 22 pour la minute, 24 pour la seconde.
 * Trois pivots différents, aucun sur l'axe.
 *
 * Le remède n'a pas été de recalculer les trois nombres mais de n'en garder
 * aucun : `bottom: 50%` pose le bas de l'aiguille sur l'axe quelle que soit sa
 * hauteur. **C'est cette absence d'arithmétique que le premier test garde** —
 * un `calc(… px)` qui reviendrait ramènerait le défaut à l'identique.
 *
 * Le second garde les angles, qui ne se vérifient pas à l'œil : une aiguille
 * branchée sur la mauvaise unité donne une heure fausse, et une heure fausse à
 * l'écran d'un joueur est crue.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

const { default: ClockVisualizer } = await import('./components/ClockVisualizer');

const AIGUILLES = ['heure', 'minute', 'seconde'] as const;

const cadran = (heures: number, minutes: number, secondes: number) =>
    render(
        <ClockVisualizer
            theme="oldstyle"
            mode="static"
            timestamp={new Date(2026, 7, 30, heures, minutes, secondes).getTime()}
        />,
    ).container;

const aiguille = (conteneur: HTMLElement, nom: string) =>
    conteneur.querySelector(`[data-aiguille="${nom}"]`) as HTMLElement;

const angle = (element: HTMLElement) =>
    Number(/rotate\(([-\d.]+)deg\)/.exec(element.style.transform)?.[1]);

describe('l’ancrage des aiguilles', () => {
    it.each(AIGUILLES)('pose le bas de l’aiguille des %s sur l’axe', (nom) => {
        const main = aiguille(cadran(3, 0, 0), nom);

        expect(main.style.bottom).toBe('50%');
        expect(main.style.left).toBe('50%');
        expect(main.style.transformOrigin).toBe('bottom center');
        expect(main.style.transform).toContain('translateX(-50%)');
    });

    /**
     * **Le défaut ramené par la porte de service.** Toute cote en pixels dans
     * le placement d'un élément dimensionné en `rem` est fausse par
     * construction, tant que la racine n'est pas à 100 %.
     */
    it.each(AIGUILLES)('ne place plus l’aiguille des %s au pixel près', (nom) => {
        const main = aiguille(cadran(3, 0, 0), nom);

        expect(main.style.top).toBe('');
        expect(`${main.style.left} ${main.style.bottom}`).not.toContain('px');
    });
});

describe('les angles des aiguilles', () => {
    it('à trois heures pile, l’heure est au quart de tour et les autres à zéro', () => {
        const c = cadran(3, 0, 0);

        expect(angle(aiguille(c, 'heure'))).toBe(90);
        expect(angle(aiguille(c, 'minute'))).toBe(0);
        expect(angle(aiguille(c, 'seconde'))).toBe(0);
    });

    /** L'aiguille des heures avance avec les minutes, sinon elle saute d'heure en heure. */
    it('à neuf heures et demie, l’heure a dépassé le neuf', () => {
        const c = cadran(9, 30, 0);

        expect(angle(aiguille(c, 'heure'))).toBe(285);
        expect(angle(aiguille(c, 'minute'))).toBe(180);
    });

    it('à midi comme à minuit, tout revient à zéro', () => {
        for (const heure of [0, 12]) {
            const c = cadran(heure, 0, 0);
            expect(angle(aiguille(c, 'heure')), `${heure}h`).toBe(0);
        }
    });

    it('la seconde fait six degrés par seconde', () => {
        expect(angle(aiguille(cadran(3, 0, 15), 'seconde'))).toBe(90);
    });
});
