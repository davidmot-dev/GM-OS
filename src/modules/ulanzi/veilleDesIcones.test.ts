import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUlanziStore } from './useUlanziStore';
import { useBattementUlanzi, BATTEMENT_MS, VEILLE_DES_ICONES_MS } from './useBattementUlanzi';

/**
 * **La veille des icônes du signal — le défaut du 2026-08-31 au soir.**
 *
 * *David : « le signal Voight-Kampff de l'Ulanzi ne fonctionne pas ».* Relevé
 * sur l'appareil : `/api/loop` montrait bien `gmos_vk` poussé, et
 * `/list?dir=/ICONS` rendait **`[]`**. L'application publiait un widget qui
 * pointe vers une icône absente — donc un cadre noir au milieu de la table.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE J'AVAIS DÉDUIT DE TRAVERS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les icônes vivent en flash et **restent** sur l'appareil : j'en avais conclu
 * qu'un dépôt à la prise de main suffisait, une fois pour toutes. *« Elles
 * restent » ne veut pas dire « elles seront là ».* Deux chemins le démentent :
 *
 * 1. **Le flash s'efface** — remise à zéro, mise à jour, ménage dans le portail.
 * 2. **La prise de main peut rater** : l'appareil qui démarre refuse les
 *    écritures (`500 CREATE FAILED`) pendant quelques minutes. GM-OS avait
 *    démarré trente secondes après l'afficheur, et plus rien ne reprenait —
 *    le rattrapage du battement reprend la main, mais ne déposait rien.
 *
 * *Un geste d'ouverture ne répare que ce qui casse avant l'ouverture.* Le dépôt
 * est donc devenu une veille, et ces essais gardent ses trois règles.
 */

const rendreLaMain = vi.fn(async () => undefined);
const prendreLaMain = vi.fn(async () => ({ ATIME: 7, TIM: true, HUM: true, TEMP: true, BAT: true }));
const estJoignable = vi.fn(async () => ({ ok: true as const }));
const pousserWidget = vi.fn(async () => undefined);
const retirerWidget = vi.fn(async () => undefined);

vi.mock('./UlanziService', async (importOriginal) => {
    const vrai = await importOriginal<typeof import('./UlanziService')>();
    return {
        ...vrai,
        UlanziService: class {
            estJoignable = estJoignable;
            prendreLaMain = prendreLaMain;
            pousserWidget = pousserWidget;
            retirerWidget = retirerWidget;
            rendreLaMain = rendreLaMain;
        },
    };
});

/** Ce que le processus principal répond au dépôt. */
let depot: { deposees: string[]; manquantes: string[] };
const deposerLesIcones = vi.fn(async () => depot);

beforeEach(() => {
    vi.clearAllMocks();
    depot = { deposees: [], manquantes: [] };
    useUlanziStore.setState({
        actif: true,
        routine: null,
        silencerLesNatives: false,
        selection: { 'blade-runner': [{ widgetId: 'vk', secondes: 25 }] },
    });

    (window as unknown as { appBridge: unknown }).appBridge = {
        ulanzi: { request: vi.fn(), deposerLesIcones },
    };
});

afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { appBridge?: unknown }).appBridge;
    useUlanziStore.setState({ actif: false, selection: {} });
});

describe('la veille des icônes', () => {
    it('vérifie l’appareil dès que le signal est affiché', async () => {
        renderHook(() => useBattementUlanzi(true, 'blade-runner'));
        await waitFor(() => expect(deposerLesIcones).toHaveBeenCalled());
    });

    /**
     * *Une table qui ne coche pas le widget n'a aucune raison de recevoir six
     * GIF* — et c'est aussi ce qui rend la veille gratuite pour tous les autres
     * jeux.
     */
    it('ne demande rien quand le signal n’est pas affiché', async () => {
        renderHook(() => useBattementUlanzi(true, 'dune'));
        // La prise de main a bien eu lieu : c'est le dépôt, et lui seul, qui
        // n'est pas demandé.
        await waitFor(() => expect(prendreLaMain).toHaveBeenCalled());
        expect(deposerLesIcones).not.toHaveBeenCalled();
    });

    /** **Le défaut de David, gardé** : tant qu'il en manque, on retente. */
    it('retente au battement suivant tant qu’une icône manque', async () => {
        depot = { deposees: [], manquantes: ['gmosvk1'] };
        vi.useFakeTimers();
        renderHook(() => useBattementUlanzi(true, 'blade-runner'));

        await vi.advanceTimersByTimeAsync(0);
        expect(deposerLesIcones).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(BATTEMENT_MS);
        expect(deposerLesIcones).toHaveBeenCalledTimes(2);
    });

    /**
     * Une fois les six vues, on espace : le cas courant ne doit pas coûter une
     * lecture toutes les trente secondes pour dire chaque fois la même chose.
     */
    it('espace les vérifications une fois les six présentes', async () => {
        vi.useFakeTimers();
        renderHook(() => useBattementUlanzi(true, 'blade-runner'));

        await vi.advanceTimersByTimeAsync(0);
        expect(deposerLesIcones).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(BATTEMENT_MS);
        expect(deposerLesIcones).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(VEILLE_DES_ICONES_MS);
        expect(deposerLesIcones).toHaveBeenCalledTimes(2);
    });

    /**
     * Un appareil injoignable rend « tout manque » — donc on ne s'endort pas
     * dessus. C'est la traduction que fait le handler du processus principal.
     */
    it('ne se croit pas complète quand le dépôt échoue', async () => {
        deposerLesIcones.mockRejectedValueOnce(new Error('injoignable'));
        vi.useFakeTimers();
        renderHook(() => useBattementUlanzi(true, 'blade-runner'));

        await vi.advanceTimersByTimeAsync(0);
        expect(deposerLesIcones).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(BATTEMENT_MS);
        expect(deposerLesIcones).toHaveBeenCalledTimes(2);
    });
});
