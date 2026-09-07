import { describe, it, expect, beforeEach } from 'vitest';
import { useLightStore } from '../useLightStore';
import { toucheLisible } from '../useLightKeyboardControls';

/**
 * Ce que ces tests protègent : **une touche ne lance qu'une scène, et une tuile
 * vide ne garde pas la sienne.**
 *
 * `keyCode` existait dans le type depuis toujours, **sans un seul lecteur ni
 * écrivain** — le guide promettait un « Key Learn » que rien ne tenait. Branché
 * le 2026-09-07 sur le modèle de Sound-OS et Music-OS.
 *
 * ⚠️ La règle « une touche, une scène » ne vaut **qu'à l'intérieur de
 * Light-OS**. Les trois écouteurs de clavier de l'application sont
 * indépendants : la même touche peut lancer un son **et** sa lumière, ce qui est
 * un cumul voulu.
 */

const LAMPE = { '1': { id: '1', name: 'L1', type: 'Color', state: { on: true, bri: 200 } } };

beforeEach(() => {
    useLightStore.getState().reset();
    useLightStore.getState().saveSceneSnapshot('SCENE_01', LAMPE);
    useLightStore.getState().saveSceneSnapshot('SCENE_02', LAMPE);
});

describe('l’apprentissage d’une touche', () => {
    it('n’attend rien tant qu’on ne l’a pas demandé', () => {
        expect(useLightStore.getState().sceneEnApprentissage).toBeNull();
    });

    it('met une tuile en attente, et un second clic annule', () => {
        useLightStore.getState().apprendreUneTouche('SCENE_01');
        expect(useLightStore.getState().sceneEnApprentissage).toBe('SCENE_01');

        useLightStore.getState().apprendreUneTouche('SCENE_01');
        expect(useLightStore.getState().sceneEnApprentissage).toBeNull();
    });

    it('passe l’attente d’une tuile à une autre', () => {
        useLightStore.getState().apprendreUneTouche('SCENE_01');
        useLightStore.getState().apprendreUneTouche('SCENE_02');
        expect(useLightStore.getState().sceneEnApprentissage).toBe('SCENE_02');
    });

    it('se referme dès que la touche est apprise', () => {
        useLightStore.getState().apprendreUneTouche('SCENE_01');
        useLightStore.getState().setSceneKeyCode('SCENE_01', 'KeyA');
        expect(useLightStore.getState().sceneEnApprentissage).toBeNull();
    });

    /**
     * Un mode ne se restaure pas : rouvrir en attente laisserait le clavier muet.
     *
     * *La touche, elle, DOIT survivre* — et c'est ce que vérifie la première
     * assertion : sans elle, ce test passerait aussi bien si rien n'était écrit
     * du tout, et ne prouverait rien.
     */
    it('n’est pas persisté, là où la touche l’est', () => {
        useLightStore.getState().setSceneKeyCode('SCENE_01', 'KeyA');
        useLightStore.getState().apprendreUneTouche('SCENE_02');

        const persiste = JSON.parse(localStorage.getItem('gm-os-light-storage-v1') ?? '{}');
        expect(persiste.state?.scenes?.SCENE_01?.keyCode).toBe('KeyA');
        expect(persiste.state?.sceneEnApprentissage).toBeUndefined();
    });
});

describe('l’attribution d’une touche', () => {
    it('pose la touche sur la scène', () => {
        useLightStore.getState().setSceneKeyCode('SCENE_01', 'KeyA');
        expect(useLightStore.getState().scenes.SCENE_01.keyCode).toBe('KeyA');
    });

    /**
     * **Une touche ne commande qu'une scène.** Sinon deux tuiles répondraient à
     * la même frappe, et la gagnante serait celle que l'ordre de parcours
     * désigne — c'est-à-dire personne en particulier.
     */
    it('la retire à la scène qui l’avait', () => {
        useLightStore.getState().setSceneKeyCode('SCENE_01', 'KeyA');
        useLightStore.getState().setSceneKeyCode('SCENE_02', 'KeyA');

        expect(useLightStore.getState().scenes.SCENE_02.keyCode).toBe('KeyA');
        expect(useLightStore.getState().scenes.SCENE_01.keyCode).toBeUndefined();
    });

    it('se retire avec null', () => {
        useLightStore.getState().setSceneKeyCode('SCENE_01', 'KeyA');
        useLightStore.getState().setSceneKeyCode('SCENE_01', null);
        expect(useLightStore.getState().scenes.SCENE_01.keyCode).toBeUndefined();
    });

    it('ignore une scène qui n’existe pas', () => {
        const avant = useLightStore.getState().scenes;
        useLightStore.getState().setSceneKeyCode('SCENE_99', 'KeyA');
        expect(useLightStore.getState().scenes).toBe(avant);
    });

    /** *Une tuile vide répondrait par un geste sans effet.* */
    it('tombe quand la tuile est effacée', () => {
        useLightStore.getState().setSceneKeyCode('SCENE_01', 'KeyA');
        useLightStore.getState().clearScene('SCENE_01');
        expect(useLightStore.getState().scenes.SCENE_01.keyCode).toBeUndefined();
    });
});

describe('la touche telle qu’elle est gravée', () => {
    /** *`KeyA` sur une tuile ne se lit pas.* */
    it('rend la lettre, le chiffre, le pavé', () => {
        expect(toucheLisible('KeyA')).toBe('A');
        expect(toucheLisible('Digit7')).toBe('7');
        expect(toucheLisible('Numpad3')).toBe('⌨3');
    });

    it('laisse passer ce qu’elle ne sait pas raccourcir', () => {
        expect(toucheLisible('Space')).toBe('Space');
        expect(toucheLisible(undefined)).toBe('');
    });
});
