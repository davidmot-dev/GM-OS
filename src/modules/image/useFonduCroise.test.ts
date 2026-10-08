import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, StrictMode, useLayoutEffect } from 'react';
import { chargerLImage, useFonduCroise, type ChargeurDImage, type FonduCroise } from './useFonduCroise';

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
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

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

describe('l’extinction et les transitions interrompues', () => {
    it('éteint dès le premier commit, avant les effets', async () => {
        const p = chargeurPilote();
        const rendus: FonduCroise[] = [];
        const { rerender } = renderHook(({ url }: { url: string | null }) => {
            const fondu = useFonduCroise(url, DUREE, p.charger);
            useLayoutEffect(() => { rendus.push(fondu); });
            return fondu;
        }, { initialProps: { url: 'a.jpg' as string | null } });
        await p.pret('a.jpg');
        rendus.length = 0;
        rerender({ url: null });
        expect(rendus).toEqual([{ entrante: null, sortante: 'a.jpg' }]);
    });

    it('ne rallume pas une première image décodée après l’extinction', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }: { url: string | null }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' as string | null } },
        );
        rerender({ url: null });
        await p.pret('a.jpg');
        expect(result.current).toEqual({ entrante: null, sortante: null });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('ignore le décodage dépassé et termine le fondu de l’image déjà montrée', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }: { url: string | null }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' as string | null } },
        );
        await p.pret('a.jpg');
        rerender({ url: 'b.jpg' });
        rerender({ url: null });
        await p.pret('b.jpg');
        expect(result.current).toEqual({ entrante: null, sortante: 'a.jpg' });
        act(() => vi.advanceTimersByTime(DUREE - 1));
        expect(result.current.sortante).toBe('a.jpg');
        act(() => vi.advanceTimersByTime(1));
        expect(result.current).toEqual({ entrante: null, sortante: null });
    });

    it('ne prolonge pas l’extinction quand null devient undefined', async () => {
        const p = chargeurPilote();
        const charger = vi.fn(p.charger);
        const { result, rerender } = renderHook(
            ({ url }: { url: string | null | undefined }) => useFonduCroise(url, DUREE, charger),
            { initialProps: { url: 'a.jpg' as string | null | undefined } },
        );
        await p.pret('a.jpg');
        rerender({ url: null });
        act(() => vi.advanceTimersByTime(DUREE / 2));
        rerender({ url: undefined });
        act(() => vi.advanceTimersByTime(DUREE / 2));
        expect(result.current).toEqual({ entrante: null, sortante: null });
        expect(charger).toHaveBeenCalledExactlyOnceWith('a.jpg');
    });

    it('éteint l’entrante et remplace le minuteur du croisement précédent', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }: { url: string | null }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' as string | null } },
        );
        await p.pret('a.jpg');
        rerender({ url: 'b.jpg' });
        await p.pret('b.jpg');
        act(() => vi.advanceTimersByTime(DUREE / 2));
        rerender({ url: null });
        expect(result.current).toEqual({ entrante: null, sortante: 'b.jpg' });
        act(() => vi.advanceTimersByTime(DUREE / 2));
        expect(result.current.sortante).toBe('b.jpg');
        act(() => vi.advanceTimersByTime(DUREE / 2));
        expect(result.current.sortante).toBeNull();
    });

    it('attend le décodage après l’extinction, même si son minuteur expire entretemps', async () => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url }: { url: string | null }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' as string | null } },
        );
        await p.pret('a.jpg');
        rerender({ url: null });
        rerender({ url: 'b.jpg' });
        expect(result.current).toEqual({ entrante: null, sortante: 'a.jpg' });
        act(() => vi.advanceTimersByTime(DUREE));
        expect(result.current).toEqual({ entrante: null, sortante: null });
        await p.pret('b.jpg');
        expect(result.current).toEqual({ entrante: 'b.jpg', sortante: null });
    });

    it.each([null, 'b.jpg'])('garde la durée de départ du fondu vers %s', async cible => {
        const p = chargeurPilote();
        const { result, rerender } = renderHook(
            ({ url, duree }: { url: string | null; duree: number }) => useFonduCroise(url, duree, p.charger),
            { initialProps: { url: 'a.jpg' as string | null, duree: DUREE } },
        );
        await p.pret('a.jpg');
        rerender({ url: cible, duree: DUREE });
        if (cible) await p.pret(cible);
        act(() => vi.advanceTimersByTime(DUREE / 2));
        rerender({ url: cible, duree: DUREE * 4 });
        act(() => vi.advanceTimersByTime(DUREE / 2 - 1));
        expect(result.current.sortante).toBe('a.jpg');
        act(() => vi.advanceTimersByTime(1));
        expect(result.current.sortante).toBeNull();
    });

    it('annule le minuteur et le chargement au démontage', async () => {
        const p = chargeurPilote();
        const { result, rerender, unmount } = renderHook(
            ({ url }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' } },
        );
        await p.pret('a.jpg');
        rerender({ url: 'b.jpg' });
        await p.pret('b.jpg');
        expect(vi.getTimerCount()).toBe(1);
        rerender({ url: 'c.jpg' });
        unmount();
        expect(vi.getTimerCount()).toBe(0);
        await p.pret('c.jpg');
        expect(result.current).toEqual({ entrante: 'b.jpg', sortante: 'a.jpg' });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('ne laisse qu’un minuteur en mode strict et le nettoie à la fermeture', async () => {
        const p = chargeurPilote();
        const { result, rerender, unmount } = renderHook(
            ({ url }: { url: string | null }) => useFonduCroise(url, DUREE, p.charger),
            { initialProps: { url: 'a.jpg' as string | null }, wrapper: ({ children }) => createElement(StrictMode, null, children) },
        );
        await p.pret('a.jpg');
        rerender({ url: null });
        expect(result.current).toEqual({ entrante: null, sortante: 'a.jpg' });
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('le chargement réel attend les pixels', () => {
    function imagePilote(decode: () => Promise<void>) {
        const images: Array<{ onload: (() => void) | null; onerror: (() => void) | null; decoding: string; src: string }> = [];
        vi.stubGlobal('Image', class {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            decoding = '';
            src = '';
            decode = decode;
            constructor() { images.push(this); }
        });
        return images;
    }

    it('ne résout pas à onload tant que decode attend', async () => {
        let resoudre!: () => void;
        const decode = vi.fn(() => new Promise<void>(resolve => { resoudre = resolve; }));
        const images = imagePilote(decode);
        const fini = vi.fn();
        const lecture = chargerLImage('a.jpg').then(fini);
        expect(images[0].src).toBe('a.jpg');
        expect(images[0].decoding).toBe('async');
        images[0].onload!();
        await Promise.resolve();
        expect(fini).not.toHaveBeenCalled();
        resoudre();
        await lecture;
        expect(fini).toHaveBeenCalledOnce();
    });

    it('termine malgré une erreur de téléchargement', async () => {
        const decode = vi.fn<() => Promise<void>>();
        const images = imagePilote(decode);
        const lecture = chargerLImage('absente.jpg');
        images[0].onerror!();
        await expect(lecture).resolves.toBeUndefined();
        expect(decode).not.toHaveBeenCalled();
    });

    it('termine malgré un rejet du décodage', async () => {
        const images = imagePilote(() => Promise.reject(new Error('image corrompue')));
        const lecture = chargerLImage('abimee.jpg');
        images[0].onload!();
        await expect(lecture).resolves.toBeUndefined();
    });
});
