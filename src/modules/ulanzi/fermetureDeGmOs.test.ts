import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUlanziStore } from './useUlanziStore';
import { useBattementUlanzi, NOM_DU_WIDGET } from './useBattementUlanzi';

/**
 * **Rendre l'afficheur quand GM-OS se ferme.**
 *
 * *Signalé par David le 2026-08-30, après le premier essai en conditions :*
 * **« le défilé des quarts est très bon, par contre quand je ferme
 * l'application, le Ulanzi ne reprend pas sa routine »**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT, ET POURQUOI IL NE SE VOYAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La restitution vivait dans un **nettoyage d'effet React**. Deux choses la
 * condamnaient, et elles se cumulent :
 *
 * 1. **Fermer une fenêtre Electron ne démonte pas l'arbre React** — le nettoyage
 *    n'était même pas appelé ;
 * 2. quand bien même, il tire **quatre requêtes HTTP sans les attendre** dans un
 *    rendu qu'on est en train de détruire.
 *
 * D'où le symptôme exact : fermer la **séance** marchait — le rendu est vivant,
 * l'effet rejoue normalement — et fermer l'**application** non. *Une restitution
 * ne peut pas vivre dans un processus qui meurt avant elle.*
 *
 * Ces tests gardent le rail de remplacement : le principal retient la fermeture,
 * le rendu rend la main, **et répond toujours** — sans réponse, chaque fermeture
 * de GM-OS attendrait le délai de sécurité de quatre secondes.
 */

const rendreLaMain = vi.fn(async () => undefined);
const prendreLaMain = vi.fn(async () => ({ ATIME: 7, TIM: true, HUM: true, TEMP: true, BAT: true }));
const estJoignable = vi.fn(async () => ({ ok: true as const }));
const pousserWidget = vi.fn(async () => undefined);

vi.mock('./UlanziService', async (importOriginal) => {
    const vrai = await importOriginal<typeof import('./UlanziService')>();
    return {
        ...vrai,
        UlanziService: class {
            estJoignable = estJoignable;
            prendreLaMain = prendreLaMain;
            pousserWidget = pousserWidget;
            rendreLaMain = rendreLaMain;
        },
    };
});

/** Ce que le process principal demande, et ce que le rendu lui répond. */
let demanderLaFermeture: (() => void) | null = null;
const fermetureTerminee = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    demanderLaFermeture = null;
    useUlanziStore.setState({ actif: false, routine: null, silencerLesNatives: false });

    (window as unknown as { appBridge: unknown }).appBridge = {
        ulanzi: {
            request: vi.fn(),
            surDemandeDeFermeture: (rappel: () => void) => { demanderLaFermeture = rappel; },
            fermetureTerminee,
        },
    };
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

describe('GM-OS se ferme', () => {
    it('s’abonne à la demande de fermeture du process principal', () => {
        renderHook(() => useBattementUlanzi(false));
        expect(demanderLaFermeture).toBeTypeOf('function');
    });

    /**
     * **Le test qui garde le défaut de David.** Sans ce chemin, l'afficheur
     * gardait ses natives éteintes et son widget expirait : il restait noir
     * toute la nuit.
     */
    it('rend la main quand il tient l’afficheur', async () => {
        useUlanziStore.setState({ actif: true });
        renderHook(() => useBattementUlanzi(true));

        // La prise de main doit avoir eu lieu, sinon on ne tient rien à rendre.
        await waitFor(() => expect(prendreLaMain).toHaveBeenCalled());

        demanderLaFermeture!();
        await waitFor(() => expect(rendreLaMain).toHaveBeenCalled());

        expect(rendreLaMain).toHaveBeenCalledWith(expect.anything(), [NOM_DU_WIDGET]);
        await waitFor(() => expect(fermetureTerminee).toHaveBeenCalled());
    });

    /**
     * *Sans réponse, chaque fermeture de GM-OS attendrait quatre secondes.* Le
     * cas est le plus courant de tous : l'afficheur n'est pas enrôlé.
     */
    it('répond tout de suite quand il ne tient rien', async () => {
        renderHook(() => useBattementUlanzi(false));

        demanderLaFermeture!();

        await waitFor(() => expect(fermetureTerminee).toHaveBeenCalled());
        expect(rendreLaMain).not.toHaveBeenCalled();
    });

    /**
     * **Un échec ne doit pas retenir la fermeture** — afficheur débranché,
     * réseau coupé. La routine reste persistée pour que le rattrapage du
     * prochain démarrage ait de quoi rendre.
     */
    it('répond même si la restitution échoue', async () => {
        rendreLaMain.mockRejectedValueOnce(new Error('afficheur injoignable'));
        useUlanziStore.setState({ actif: true });
        renderHook(() => useBattementUlanzi(true));
        await waitFor(() => expect(prendreLaMain).toHaveBeenCalled());

        demanderLaFermeture!();

        await waitFor(() => expect(fermetureTerminee).toHaveBeenCalled());
        expect(useUlanziStore.getState().routine).not.toBeNull();
    });

    /**
     * **La course qui a rendu l'écran noir une seconde fois, le 2026-08-30.**
     *
     * React tourne en `StrictMode` (`src/main.tsx`) : il monte chaque effet
     * **deux fois**. Deux abonnés recevaient donc la demande de fermeture. Le
     * premier partait rendre la main et posait `enMain` à faux ; le second
     * voyait ce faux, croyait n'avoir rien à faire, et **répondait aussitôt**.
     *
     * Le process principal ne retient la fermeture que jusqu'à la **première**
     * réponse : il quittait pendant que la restitution était encore en vol, et
     * la tuait. Relevé sur l'appareil : `loop={}`, natives éteintes.
     *
     * *Quand plusieurs répondent pour un seul travail, c'est le plus rapide qui
     * décide — et le plus rapide est celui qui n'a rien fait.*
     */
    it('ne répond qu’une fois la main réellement rendue, même sollicité deux fois', async () => {
        let acheverLaRestitution: () => void = () => undefined;
        rendreLaMain.mockImplementationOnce(
            () => new Promise<undefined>(resoudre => {
                acheverLaRestitution = () => resoudre(undefined);
            }),
        );

        useUlanziStore.setState({ actif: true });
        renderHook(() => useBattementUlanzi(true));
        await waitFor(() => expect(prendreLaMain).toHaveBeenCalled());

        // Les deux abonnés de StrictMode reçoivent la même demande.
        demanderLaFermeture!();
        demanderLaFermeture!();

        await waitFor(() => expect(rendreLaMain).toHaveBeenCalledTimes(1));
        expect(
            fermetureTerminee,
            'répondre ici laisse le principal quitter pendant la restitution',
        ).not.toHaveBeenCalled();

        acheverLaRestitution();

        await waitFor(() => expect(fermetureTerminee).toHaveBeenCalled());
        expect(rendreLaMain, 'un seul travail pour deux abonnés').toHaveBeenCalledTimes(1);
    });

    /** Un pont absent — application lancée hors Electron — ne casse rien. */
    it('ne casse pas sans le pont Electron', () => {
        delete (window as unknown as { appBridge?: unknown }).appBridge;
        expect(() => renderHook(() => useBattementUlanzi(false))).not.toThrow();
    });
});
