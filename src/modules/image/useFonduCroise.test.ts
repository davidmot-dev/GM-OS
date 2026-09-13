import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFonduCroise, type ChargeurDImage } from './useFonduCroise';

/**
 * **Deux images à l'écran le temps d'un fondu — et rien ne bouge avant que la
 * nouvelle soit décodée.**
 *
 * ⛔ **Le défaut que ce crochet a fini par réparer**, signalé par David le
 * 2026-09-13 après essai : *« le mécanisme de fondu ne fonctionne pas bien »* —
 * **un temps mort, puis un saut**, sur les deux écrans.
 *
 * L'adresse d'une image arrive **avant l'image** : `useMediaUrl` rend un `data:`
 * base64 que le navigateur doit encore décoder. L'animation partait à la seconde
 * où l'adresse arrivait, donc sur un cadre vide. *Une transition qui démarre
 * avant son sujet n'est pas une transition trop courte, c'est une transition qui
 * joue à vide.*
 */

const DUREE = 700;

/** Un chargeur qu'on tient à la main : rien n'est prêt tant qu'on ne le dit pas. */
function chargeurPilote() {
    const attentes = new Map<string, () => void>();
    const charger: ChargeurDImage = (url) =>
        new Promise<void>((resolve) => { attentes.set(url, resolve); });
    return {
        charger,
        /** Déclare une image décodée, et laisse React appliquer ce qui s'ensuit. */
        pret: async (url: string) => {
            const resoudre = attentes.get(url);
            if (!resoudre) throw new Error(`personne n'attend « ${url} »`);
            attentes.delete(url);
            await act(async () => { resoudre(); });
        },
        estAttendue: (url: string) => attentes.has(url),
    };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('rien ne s’affiche avant d’être décodé', () => {
    /** **Le test de la régression.** L'écran ne doit rien montrer tant que rien n'est prêt. */
    it('ne montre rien tant que la première image n’est pas prête', async () => {
        const p = chargeurPilote();
        const { result } = renderHook(() => useFonduCroise('a.jpg', DUREE, p.charger));

        expect(result.current).toEqual({ entrante: null, sortante: null });

        await p.pret('a.jpg');

        expect(result.current).toEqual({ entrante: 'a.jpg', sortante: null });
    });

    /**
     * ⛔ **Le cœur du défaut.** Pendant le décodage de la suivante, c'est
     * **l'ancienne** qui reste à l'écran — et le fondu ne commence qu'après.
     */
    it('garde l’ancienne à l’écran pendant que la suivante se décode', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' } },
        );
        await p.pret('a.jpg');

        rerender({ url: 'b.jpg' });

        /* Le fondu n'a pas commencé : rien n'a changé à l'écran. */
        expect(result.current).toEqual({ entrante: 'a.jpg', sortante: null });

        await p.pret('b.jpg');

        expect(result.current).toEqual({ entrante: 'b.jpg', sortante: 'a.jpg' });
    });

    it('puis laisse partir l’ancienne au bout du fondu', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' } },
        );
        await p.pret('a.jpg');
        rerender({ url: 'b.jpg' });
        await p.pret('b.jpg');

        act(() => { vi.advanceTimersByTime(DUREE); });

        expect(result.current).toEqual({ entrante: 'b.jpg', sortante: null });
    });

    /** Un rendu de plus sur la même image ne relance ni chargement ni fondu. */
    it('ne recharge pas l’image déjà à l’écran', async () => {
        const p = chargeurPilote();
        const charger = vi.fn(p.charger);
        const { rerender } = renderHook(
            ({ url }) => useFonduCroise(url, DUREE, charger),
            { initialProps: { url: 'a.jpg' } },
        );
        await p.pret('a.jpg');

        rerender({ url: 'a.jpg' });

        expect(charger).toHaveBeenCalledTimes(1);
    });
});

describe('quand ça s’enchaîne trop vite', () => {
    /**
     * ⚠️ **Deux décodages peuvent finir dans le désordre.** Sans garde-fou, la
     * table verrait revenir une image qu'elle avait déjà quittée.
     */
    it('ignore une image dont on n’a plus besoin', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' } },
        );
        await p.pret('a.jpg');

        rerender({ url: 'b.jpg' });   // demandée…
        rerender({ url: 'c.jpg' });   // …puis abandonnée pour celle-ci

        await p.pret('b.jpg');        // « b » finit quand même de se décoder
        expect(result.current.entrante, '« b » n’est plus demandée').toBe('a.jpg');

        await p.pret('c.jpg');
        expect(result.current).toEqual({ entrante: 'c.jpg', sortante: 'a.jpg' });
    });

    /** *C'est toujours la dernière qui s'en va qu'on garde dessous.* */
    it('remplace la sortante quand une troisième arrive avant la fin du fondu', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' } },
        );
        await p.pret('a.jpg');
        rerender({ url: 'b.jpg' });
        await p.pret('b.jpg');

        act(() => { vi.advanceTimersByTime(DUREE / 2); });
        rerender({ url: 'c.jpg' });
        await p.pret('c.jpg');

        expect(result.current).toEqual({ entrante: 'c.jpg', sortante: 'b.jpg' });

        /* Et le minuteur de « a » ne doit pas emporter « b » en avance. */
        act(() => { vi.advanceTimersByTime(DUREE / 2); });
        expect(result.current.sortante).toBe('b.jpg');

        act(() => { vi.advanceTimersByTime(DUREE / 2); });
        expect(result.current.sortante).toBeNull();
    });
});

describe('quand il n’y a plus rien à montrer', () => {
    /**
     * L'extinction est une transition comme une autre : le Player Hub s'en sert
     * pour éteindre **en fondu**. Le projecteur, lui, ne dessine rien quand
     * `entrante` est nulle — *une valeur rendue n'oblige personne à la dessiner.*
     */
    it('vide l’entrante tout de suite et garde l’ancienne le temps du fondu', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }: { url: string | null }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' as string | null } },
        );
        await p.pret('a.jpg');

        act(() => { rerender({ url: null }); });

        expect(result.current).toEqual({ entrante: null, sortante: 'a.jpg' });

        act(() => { vi.advanceTimersByTime(DUREE); });

        expect(result.current).toEqual({ entrante: null, sortante: null });
    });

    it('ne garde rien quand il n’y avait rien avant', () => {
        const p = chargeurPilote();
        const { result } = renderHook(() => useFonduCroise(null, DUREE, p.charger));

        expect(result.current).toEqual({ entrante: null, sortante: null });
    });
});
