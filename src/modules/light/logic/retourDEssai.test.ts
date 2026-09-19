import { describe, it, expect } from 'vitest';
import { photographierLaPiece, retourDeLEssai } from './retourDEssai';
import type { HueLight } from '../useLightStore';

/**
 * Ce que ces essais protègent : **essayer une ambiance ne laisse pas la pièce
 * ailleurs qu'on l'a trouvée.**
 *
 * ⛔ Le piège qui a motivé ce fichier : les trois portes du retour existantes
 * visent toutes une *scène*, et **éteignent** quand il n'y en a aucune. On
 * essaie une ambiance en préparant une séance, pas à la table — la pièce est
 * allumée, quelqu'un lit à côté.
 */

const lampe = (id: string, bri: number, effect?: string): HueLight => ({
    id,
    name: `L${id}`,
    type: 'Extended color light',
    state: { on: true, bri, ...(effect ? { effect } : {}) },
});

const PIECE = { '1': lampe('1', 200), '2': lampe('2', 120, 'candle') };

describe('la photographie de la pièce', () => {
    it('garde l’état de chaque lampe', () => {
        const avant = photographierLaPiece(PIECE, null);

        expect(avant.etats['1'].bri).toBe(200);
        expect(avant.etats['2'].effect).toBe('candle');
    });

    /**
     * ⛔ **Le défaut que ce test interdit.** L'essai pose ses lampes une à une,
     * et chaque pose écrit dans le miroir du magasin. Une photographie qui
     * garderait les mêmes objets suivrait l'essai, et « Revenir » rendrait
     * l'ambiance dont on voulait sortir.
     */
    it('COPIE les états au lieu de les emprunter', () => {
        const piece = { '1': lampe('1', 200) };
        const avant = photographierLaPiece(piece, null);

        /* L'essai écrit dans le miroir, comme le fait `updateLightState`. */
        piece['1'].state.bri = 12;

        expect(avant.etats['1'].bri, 'la photographie a suivi son sujet').toBe(200);
    });

    it('retient la scène qui jouait', () => {
        expect(photographierLaPiece(PIECE, 'SCENE_03').sceneActive).toBe('SCENE_03');
    });
});

describe('ce qu’il faut rejouer pour rendre la pièce', () => {
    /** Elle seule rallume les effets : reposer un état figerait la bougie. */
    it('rejoue la scène qui jouait', () => {
        const avant = photographierLaPiece(PIECE, 'SCENE_03');

        expect(retourDeLEssai(avant, { SCENE_03: {} })).toEqual({ rejouer: 'SCENE_03' });
    });

    it('repose le miroir quand aucune scène ne jouait', () => {
        const avant = photographierLaPiece(PIECE, null);

        const retour = retourDeLEssai(avant, { SCENE_03: {} });

        expect(retour).toHaveProperty('reposer');
        expect('reposer' in retour && retour.reposer['1'].bri).toBe(200);
    });

    /**
     * ⚠️ Rien n'interdit d'effacer une tuile pendant qu'un essai tourne.
     * `applyScene` sur une scène disparue ne fait **rien**, et la pièce
     * resterait sur l'essai sans un mot.
     */
    it('repose le miroir quand la scène a disparu entre-temps', () => {
        const avant = photographierLaPiece(PIECE, 'SCENE_03');

        expect(retourDeLEssai(avant, {})).toHaveProperty('reposer');
    });
});
