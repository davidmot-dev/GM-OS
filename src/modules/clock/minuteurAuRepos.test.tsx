import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { ClockTheme } from '../../store/useClockStore';

/**
 * **L'apparence du minuteur — contrôle demandé par David le 2026-08-30, puis
 * accord avec les trois thèmes.**
 *
 * On ne teste ici que ce qui se dégrade **en silence**. Les teintes, la
 * graisse et la place des choses ne se jugent qu'à l'écran, et un test qui
 * recopie une liste de classes ne garde que lui-même.
 *
 * Ce qui reste : le repère du cadran, la distinction repos / épuisé, et les
 * deux pièges de thème qui ne lèvent aucune erreur — un `filter` qui reçoit un
 * nom de classe, et un anneau dont le rayon passe par-dessus son propre cadre.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

const { default: ClockVisualizer } = await import('./components/ClockVisualizer');
const { useClockStore } = await import('../../store/useClockStore');

const THEMES: ClockTheme[] = ['modern', 'cyberpunk', 'oldstyle'];

const afficher = (theme: ClockTheme = 'cyberpunk') =>
    render(<ClockVisualizer theme={theme} timestamp={0} mode="timer" />).container;

/**
 * jsdom normalise `#f43f5e` en `rgb(...)` : chercher la forme hexadécimale
 * rendait le test « au repos » vert quoi qu'il arrive, y compris rouge vif.
 * *Une assertion qui ne peut pas échouer ne garde rien.*
 */
const ROUGE_DE_FIN = 'rgb(244, 63, 94)';
const chiffres = (conteneur: HTMLElement) => conteneur.querySelector('[role="timer"]');
const styleDesChiffres = (conteneur: HTMLElement) =>
    chiffres(conteneur)?.getAttribute('style') ?? '';
const arc = (conteneur: HTMLElement) => conteneur.querySelectorAll('circle')[1];

beforeEach(() => {
    useClockStore.setState({ timerDuration: 0, timerRemaining: 0, timerIsRunning: false, timerLabel: '' });
});

describe('le cadran du minuteur', () => {
    it.each(THEMES)('porte un repère en %s, sans quoi l’anneau est coupé par sa boîte', (theme) => {
        expect(afficher(theme).querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 384 384');
    });

    /** Le pourtour doit valoir 2πr, sinon l'anneau ne se ferme pas à 100 %. */
    it.each(THEMES)('tire la longueur du trait du rayon en %s, et non d’un nombre écrit à la main', (theme) => {
        const trait = arc(afficher(theme));
        const rayon = Number(trait.getAttribute('r'));

        expect(Number(trait.getAttribute('stroke-dasharray'))).toBeCloseTo(2 * Math.PI * rayon, 3);
    });

    /**
     * **Le cadran « old style » est entouré d'un cadre de 12 px et de douze
     * index.** Un anneau au rayon des autres thèmes passerait par-dessus. La
     * marge se mesure dans le repère de 384 : demi-côté 192, moins le cadre et
     * les index.
     */
    it('rentre l’anneau à l’intérieur du cadre orné', () => {
        const rayonOrne = Number(arc(afficher('oldstyle')).getAttribute('r'));
        const rayonNu = Number(arc(afficher('modern')).getAttribute('r'));

        expect(rayonOrne).toBeLessThan(rayonNu);
        expect(rayonOrne).toBeLessThanOrEqual(150);
    });
});

describe('le halo de l’anneau', () => {
    /**
     * **Le défaut qui ne lève rien.** `filter: 'drop-shadow-glow-accent'` est
     * un nom de classe posé dans une propriété CSS : invalide, donc ignoré, et
     * deux thèmes sur trois n'avaient aucun halo sans que rien ne le dise.
     *
     * L'assertion doit être **inconditionnelle**. Écrite d'abord en
     * `if (halo) …`, elle ne se déclenchait jamais sur le cas fautif : une
     * valeur invalide est jetée par le moteur, donc `filter` est absent, donc
     * la condition est fausse. *Le test passait précisément quand il aurait dû
     * échouer* — vérifié en remettant le défaut.
     */
    it.each([['cyberpunk'], ['oldstyle']] as const)('brille vraiment en %s', (theme) => {
        expect(arc(afficher(theme)).getAttribute('style') ?? '').toMatch(/filter:\s*drop-shadow\(/);
    });

    /** *Le vide est la signature de « moderne ».* Un halo la nierait. */
    it('ne brille pas en moderne', () => {
        expect(arc(afficher('modern')).getAttribute('style') ?? '').not.toContain('filter:');
    });
});

describe('un minuteur qu’on n’a jamais lancé', () => {
    it('ne sautille pas', () => {
        expect(afficher().querySelector('.animate-bounce')).toBe(null);
    });

    it('n’annonce pas une fin qui n’a pas eu lieu', () => {
        expect(styleDesChiffres(afficher())).not.toContain(ROUGE_DE_FIN);
    });

    /** Une animation d'activité sur un décompte à l'arrêt ment de la même façon. */
    it('ne fait pas filer les barres du thème cyberpunk', () => {
        expect(afficher('cyberpunk').querySelector('.animate-shimmer')).toBe(null);
    });
});

describe('un minuteur arrivé au bout', () => {
    beforeEach(() => {
        useClockStore.setState({ timerDuration: 60, timerRemaining: 0, timerIsRunning: false });
    });

    it('sautille et passe au rouge', () => {
        const conteneur = afficher();
        expect(conteneur.querySelector('.animate-bounce')).not.toBe(null);
        expect(styleDesChiffres(conteneur)).toContain(ROUGE_DE_FIN);
    });
});

describe('un minuteur qui tourne', () => {
    beforeEach(() => {
        useClockStore.setState({ timerDuration: 60, timerRemaining: 42, timerIsRunning: true });
    });

    it('fait filer les barres en cyberpunk', () => {
        expect(afficher('cyberpunk').querySelector('.animate-shimmer')).not.toBe(null);
    });

    /** *Le vide est la signature de « moderne » : lui coller un décor le nierait.* */
    it('ne les emprunte pas pour le thème moderne', () => {
        expect(afficher('modern').querySelector('.animate-shimmer')).toBe(null);
    });
});
