import { describe, it, expect, beforeEach } from 'vitest';
import { CADENCE_PLANCHER_MS, cadenceEffective } from './HueEngine';
import {
    VITESSE_EFFET_DEFAUT,
    VITESSE_EFFET_MAX,
    VITESSE_EFFET_MIN,
    bornerVitesse,
    useLightStore,
} from './useLightStore';

/**
 * Ce que ces tests protègent : **le curseur de vitesse d'une tuile ne peut ni
 * noyer le pont Hue, ni figer une scène.**
 *
 * Les cadences des effets sont écrites dans `HueEngine` — 100 ms pour un
 * stroboscope, 10 s pour un crépuscule. Les diviser par une vitesse est une
 * opération à deux dangers, et aucun des deux ne se verrait à l'écran : trop
 * rapide, le pont saturé rend une lumière en retard d'une demi-minute ; une
 * vitesse nulle ou absente donnerait une attente infinie, et l'effet
 * s'arrêterait sans rien dire.
 */

describe('la cadence que donne une vitesse', () => {
    it('laisse la cadence d’origine à la vitesse par défaut', () => {
        expect(cadenceEffective(2000, VITESSE_EFFET_DEFAUT)).toBe(2000);
    });

    it('accélère en divisant l’attente, ralentit en la multipliant', () => {
        expect(cadenceEffective(2000, 2)).toBe(1000);
        expect(cadenceEffective(2000, 0.5)).toBe(4000);
    });

    /**
     * *Le plancher est la seule protection du pont.* Chaque lampe en effet a sa
     * propre boucle : quatre lampes à 100 ms tiennent déjà tout le budget de
     * commandes du pont.
     */
    it('ne descend jamais sous le plancher, même poussée au maximum', () => {
        expect(cadenceEffective(150, VITESSE_EFFET_MAX)).toBe(CADENCE_PLANCHER_MS);
        expect(cadenceEffective(100, 10)).toBe(CADENCE_PLANCHER_MS);
    });

    /**
     * Une scène enregistrée avant ce réglage n'a pas de vitesse ; une valeur
     * abîmée pourrait aussi remonter d'une sauvegarde. **Dans les deux cas on
     * joue la cadence d'origine, on n'arrête pas l'effet.**
     */
    it('retombe sur la cadence d’origine si la vitesse n’est pas jouable', () => {
        expect(cadenceEffective(2000, 0)).toBe(2000);
        expect(cadenceEffective(2000, -1)).toBe(2000);
        expect(cadenceEffective(2000, Number.NaN)).toBe(2000);
    });
});

describe('les bornes de la vitesse', () => {
    it('refuse ce qui n’est pas un nombre', () => {
        expect(bornerVitesse(Number.NaN)).toBe(VITESSE_EFFET_DEFAUT);
        expect(bornerVitesse(Number.POSITIVE_INFINITY)).toBe(VITESSE_EFFET_DEFAUT);
    });

    it('ramène les débordements dans l’intervalle', () => {
        expect(bornerVitesse(99)).toBe(VITESSE_EFFET_MAX);
        expect(bornerVitesse(0)).toBe(VITESSE_EFFET_MIN);
    });
});

describe('la vitesse d’une scène', () => {
    beforeEach(() => {
        useLightStore.getState().reset();
    });

    it('n’est pas réglée tant que le meneur n’y a pas touché', () => {
        expect(useLightStore.getState().scenes.SCENE_01.effectSpeed).toBeUndefined();
    });

    it('se retient, bornée', () => {
        useLightStore.getState().setSceneEffectSpeed('SCENE_01', 2.5);
        expect(useLightStore.getState().scenes.SCENE_01.effectSpeed).toBe(2.5);

        useLightStore.getState().setSceneEffectSpeed('SCENE_01', 42);
        expect(useLightStore.getState().scenes.SCENE_01.effectSpeed).toBe(VITESSE_EFFET_MAX);
    });

    /** Chaque tuile a la sienne : un stroboscope pressé ne presse pas l'aube. */
    it('ne déborde pas sur les autres scènes', () => {
        useLightStore.getState().setSceneEffectSpeed('SCENE_01', 3);
        expect(useLightStore.getState().scenes.SCENE_02.effectSpeed).toBeUndefined();
    });

    it('ignore une scène qui n’existe pas', () => {
        const avant = useLightStore.getState().scenes;
        useLightStore.getState().setSceneEffectSpeed('SCENE_99', 2);
        expect(useLightStore.getState().scenes).toBe(avant);
    });

    /** Effacer une tuile rend la scène neuve — sa vitesse comprise. */
    it('revient au défaut quand la scène est effacée', () => {
        useLightStore.getState().setSceneEffectSpeed('SCENE_01', 3);
        useLightStore.getState().clearScene('SCENE_01');
        expect(useLightStore.getState().scenes.SCENE_01.effectSpeed).toBe(VITESSE_EFFET_DEFAUT);
    });
});
