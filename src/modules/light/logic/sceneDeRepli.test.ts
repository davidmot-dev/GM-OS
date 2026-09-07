import { describe, it, expect, beforeEach } from 'vitest';
import { sceneDeRepli } from './sceneDeRepli';
import type { LightScene } from '../useLightStore';
import { useLightStore } from '../useLightStore';

/**
 * Ce que ces tests protègent : **la pièce ne tombe pas dans le noir sans qu'on
 * l'ait demandé.**
 *
 * La lumière de la table est aussi celle où le meneur lit ses notes. Le défaut
 * que ce repli répare se voyait ainsi : une soirée où aucune scène n'avait été
 * cliquée, un pad sonore qui se termine, et la pièce s'éteint — parce que la
 * dernière scène manuelle était vide et qu'`applyScene(null)` éteint.
 *
 * *Un repli qui vise une tuile vide est pire qu'un repli absent : il consomme
 * le tour de celui qui aurait marché.*
 */

const scenePleine = (id: string): LightScene => ({
    id,
    name: id,
    icon: 'wb_incandescent',
    color: '#334155',
    lightStates: { '1': { on: true, bri: 200 } },
});

const sceneVide = (id: string): LightScene => ({
    id,
    name: id,
    icon: 'wb_incandescent',
    color: '#334155',
    lightStates: {},
});

const catalogue = {
    PLEINE_A: scenePleine('PLEINE_A'),
    PLEINE_B: scenePleine('PLEINE_B'),
    VIDE: sceneVide('VIDE'),
};

describe('la scène de repli', () => {
    it('prend le premier candidat qui éclaire quelque chose', () => {
        expect(sceneDeRepli(catalogue, ['PLEINE_A', 'PLEINE_B'])).toBe('PLEINE_A');
    });

    /** Le cas de David : rien n'a été cliqué, l'éclairage normal prend le relais. */
    it('passe au suivant quand le premier candidat est absent', () => {
        expect(sceneDeRepli(catalogue, [null, 'PLEINE_B'])).toBe('PLEINE_B');
    });

    /** Une tuile désignée puis effacée, ou héritée d'une autre table. */
    it('passe au suivant quand le premier candidat ne porte aucune lampe', () => {
        expect(sceneDeRepli(catalogue, ['VIDE', 'PLEINE_B'])).toBe('PLEINE_B');
    });

    it('passe au suivant quand le premier candidat n’existe plus', () => {
        expect(sceneDeRepli(catalogue, ['SCENE_DISPARUE', 'PLEINE_B'])).toBe('PLEINE_B');
    });

    /**
     * **`null` veut dire « éteindre », et c'est le comportement d'avant.** Qui ne
     * désigne pas d'éclairage normal ne doit rien voir changer.
     */
    it('rend null quand aucun candidat ne tient', () => {
        expect(sceneDeRepli(catalogue, [null, null])).toBeNull();
        expect(sceneDeRepli(catalogue, ['VIDE', undefined])).toBeNull();
        expect(sceneDeRepli(catalogue, [])).toBeNull();
    });
});

describe('la désignation de l’éclairage normal', () => {
    beforeEach(() => {
        useLightStore.getState().reset();
        useLightStore.getState().saveSceneSnapshot('SCENE_01', {
            '1': { id: '1', name: 'L1', type: 'Color', state: { on: true, bri: 200 } },
        });
    });

    it('n’existe pas tant que le meneur n’a rien désigné', () => {
        expect(useLightStore.getState().defaultSceneId).toBeNull();
    });

    it('se pose, et se retire d’un second clic sur la même tuile', () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        expect(useLightStore.getState().defaultSceneId).toBe('SCENE_01');

        useLightStore.getState().setDefaultScene('SCENE_01');
        expect(useLightStore.getState().defaultSceneId).toBeNull();
    });

    it('se retire aussi explicitement, depuis la barre latérale', () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().setDefaultScene(null);
        expect(useLightStore.getState().defaultSceneId).toBeNull();
    });

    it('ignore une scène qui n’existe pas', () => {
        useLightStore.getState().setDefaultScene('SCENE_99');
        expect(useLightStore.getState().defaultSceneId).toBeNull();
    });

    /**
     * *Effacer la tuile désignée retire la désignation.* Sinon le repli
     * viserait une scène vide — et ne ferait rien, silencieusement.
     */
    it('tombe quand la tuile désignée est effacée', () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().clearScene('SCENE_01');
        expect(useLightStore.getState().defaultSceneId).toBeNull();
    });

    it('ne tombe pas quand on efface une AUTRE tuile', () => {
        useLightStore.getState().setDefaultScene('SCENE_01');
        useLightStore.getState().clearScene('SCENE_02');
        expect(useLightStore.getState().defaultSceneId).toBe('SCENE_01');
    });
});
