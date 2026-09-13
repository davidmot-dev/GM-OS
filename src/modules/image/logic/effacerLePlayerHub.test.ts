import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * **Vider l'écran des joueurs d'un geste — demande de David du 2026-09-13.**
 *
 * *« Je voudrais la possibilité de fermer [la fenêtre du Player Hub] avec un
 * raccourci dédié, car en tant que MJ je ne vois pas toujours l'écran Player
 * Hub. »*
 *
 * ⭐ Sa raison décide de la conception : le geste part de la fenêtre du meneur,
 * et efface **sans qu'on ait à savoir ce qui était affiché**.
 */

const envoyerLeTitre = vi.hoisted(() => vi.fn());
vi.mock('../../storyboard/titreProjete', () => ({
    envoyerLeTitre,
    normaliserLeTitre: (t: unknown) => t,
}));

import { effacerLePlayerHub } from './effacerLePlayerHub';

const sendSync = vi.fn();
const setProjection = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (window as never as { useImageStore: unknown }).useImageStore = {
        getState: () => ({ setProjection }),
    };
});

afterEach(() => {
    delete (window as never as { useImageStore?: unknown }).useImageStore;
});

describe('effacer le Player Hub', () => {
    /*
      ⛔ **`FULL_RESET` était reçu par `useHubSync` et émis par PERSONNE** —
      aucune occurrence dans tout le dépôt. *Sixième « chaîne complète sans
      bouton au bout » de ce projet.* Ce test est le bouton.
    */
    it('envoie la remise à zéro que le Hub attendait', () => {
        const rapport = effacerLePlayerHub({ remote: { sendSync } });

        expect(sendSync).toHaveBeenCalledWith({ type: 'FULL_RESET' });
        expect(rapport.reinitialisationEnvoyee).toBe(true);
    });

    /*
      ⚠️ **Sans rôle : tout le monde reçoit.** Une tablette qui afficherait la
      même fiche doit se vider aussi — *le geste dit « on ne montre plus rien »,
      pas « on ne montre plus rien ici ».*
    */
    it('sans rôle, pour que tout le monde se vide', () => {
        effacerLePlayerHub({ remote: { sendSync } });

        expect(sendSync.mock.calls[0][1], 'un rôle limiterait la portée du geste').toBeUndefined();
    });

    /*
      ⛔ **Le titre part par un autre canal**, que `FULL_RESET` ne couvre pas :
      un titre permanent resterait seul sur un écran vide.
    */
    it('retire aussi le titre projeté', () => {
        const rapport = effacerLePlayerHub({ remote: { sendSync } });

        expect(envoyerLeTitre).toHaveBeenCalledWith(expect.objectContaining({ cible: 'hub', texte: '' }));
        expect(rapport.titreRetire).toBe(true);
    });

    /*
      ⛔ **Et l'écran du meneur l'apprend aussi.** Sans cela, le Hub se vide et
      Image-OS continue d'annoncer une projection : *le meneur croirait montrer
      une image que personne ne voit.*
    */
    it('et l’écran du meneur ne croit plus projeter', () => {
        const rapport = effacerLePlayerHub({ remote: { sendSync } });

        expect(setProjection).toHaveBeenCalledWith('hub', null);
        expect(rapport.projectionOubliee).toBe(true);
    });
});

describe('⚠️ quand le pont manque', () => {
    /*
      Un raccourci qui plante en séance serait pire que l'image qu'il devait
      retirer. *Ce qui accompagne ne fait jamais tomber ce qui est demandé.*
    */
    it('sans pont du tout, rien ne lève', () => {
        expect(() => effacerLePlayerHub(undefined)).not.toThrow();
    });

    it('sans `sendSync`, le titre part quand même', () => {
        const rapport = effacerLePlayerHub({ remote: {} });

        expect(rapport.reinitialisationEnvoyee).toBe(false);
        expect(rapport.titreRetire, 'le reste du geste doit se faire').toBe(true);
    });

    it('sans magasin d’image, le reste se fait aussi', () => {
        delete (window as never as { useImageStore?: unknown }).useImageStore;

        const rapport = effacerLePlayerHub({ remote: { sendSync } });

        expect(rapport.reinitialisationEnvoyee).toBe(true);
        expect(rapport.projectionOubliee).toBe(false);
    });

    /*
      ⭐ Le rapport sert à ça : dire ce qui a **réellement** eu lieu, plutôt que
      de laisser croire que tout est parti. *Un geste qui ne rend rien ne peut
      pas se diagnostiquer.*
    */
    it('le rapport distingue ce qui a marché de ce qui n’a pas marché', () => {
        delete (window as never as { useImageStore?: unknown }).useImageStore;

        expect(effacerLePlayerHub({ remote: {} })).toEqual({
            reinitialisationEnvoyee: false,
            titreRetire: true,
            projectionOubliee: false,
        });
    });
});
