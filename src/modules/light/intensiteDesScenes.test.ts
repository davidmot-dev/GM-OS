import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { brillanceEffective } from './HueEngine';
import {
    INTENSITE_SCENE_DEFAUT,
    INTENSITE_SCENE_MAX,
    INTENSITE_SCENE_MIN,
    bornerIntensite,
    useLightStore,
} from './useLightStore';
import { creerLimiteur } from './logic/limiterLaCadence';

/**
 * Ce que ces tests protègent : **régler l'intensité d'une tuile ne doit ni
 * abîmer la scène capturée, ni faire refuser la commande par le pont.**
 *
 * Le curseur d'une tuile multiplie une brillance qu'il ne réécrit pas, et il
 * s'ajoute à un curseur global qui existait déjà. Deux facteurs sur la même
 * valeur, c'est deux façons de sortir des clous — au-delà de 254 le pont refuse
 * la commande entière, et une valeur illisible venue d'une vieille sauvegarde
 * éteindrait la pièce sans rien dire.
 */

describe('la brillance que donnent les deux curseurs', () => {
    it('rend la brillance capturée quand aucun des deux ne bouge', () => {
        expect(brillanceEffective(200, 100, 100)).toBe(200);
    });

    /** *Le global dit « toute la pièce », la tuile dit « cette ambiance ».* */
    it('compose les deux curseurs au lieu d’en choisir un', () => {
        expect(brillanceEffective(200, 50, 50)).toBe(50);
        expect(brillanceEffective(200, 100, 50)).toBe(100);
        expect(brillanceEffective(200, 50, 100)).toBe(100);
    });

    /**
     * Le curseur d'une tuile monte à 150 %. *Une lampe déjà pleine resterait
     * pleine — mais elle emmènerait les autres dans le refus du pont.*
     */
    it('ne dépasse jamais la brillance maximale du protocole', () => {
        expect(brillanceEffective(254, 100, INTENSITE_SCENE_MAX)).toBe(254);
        expect(brillanceEffective(200, 100, 150)).toBe(254);
    });

    it('monte vraiment ce qui a été capturé bas', () => {
        expect(brillanceEffective(100, 100, 150)).toBe(150);
    });

    /** Un curseur global à zéro voulait déjà dire « rien » : on ne le trahit pas. */
    it('laisse le global à zéro éteindre', () => {
        expect(brillanceEffective(254, 0, 100)).toBe(0);
    });

    /**
     * Une scène enregistrée avant ce réglage n'a pas d'intensité, et une
     * sauvegarde peut en remonter une abîmée. **Dans les deux cas on joue la
     * scène telle qu'elle a été capturée.**
     */
    it('retombe sur la scène capturée si l’intensité n’est pas lisible', () => {
        expect(brillanceEffective(200, 100, Number.NaN)).toBe(200);
        expect(brillanceEffective(200, 100)).toBe(200);
    });
});

describe('les bornes de l’intensité', () => {
    it('refuse ce qui n’est pas un nombre', () => {
        expect(bornerIntensite(Number.NaN)).toBe(INTENSITE_SCENE_DEFAUT);
        expect(bornerIntensite(Number.POSITIVE_INFINITY)).toBe(INTENSITE_SCENE_DEFAUT);
    });

    /** *Zéro n'est pas une intensité : une tuile qui n'allume rien se lit comme une panne.* */
    it('ramène les débordements dans l’intervalle', () => {
        expect(bornerIntensite(999)).toBe(INTENSITE_SCENE_MAX);
        expect(bornerIntensite(0)).toBe(INTENSITE_SCENE_MIN);
    });
});

describe('l’intensité d’une scène', () => {
    beforeEach(() => {
        useLightStore.getState().reset();
    });

    it('n’est pas réglée tant que le meneur n’y a pas touché', () => {
        expect(useLightStore.getState().scenes.SCENE_01.sceneBrightness).toBeUndefined();
    });

    it('se retient, bornée', () => {
        useLightStore.getState().setSceneBrightness('SCENE_01', 60);
        expect(useLightStore.getState().scenes.SCENE_01.sceneBrightness).toBe(60);

        useLightStore.getState().setSceneBrightness('SCENE_01', 900);
        expect(useLightStore.getState().scenes.SCENE_01.sceneBrightness).toBe(INTENSITE_SCENE_MAX);
    });

    /** Chaque tuile a la sienne : une veillée baissée ne baisse pas l'incendie. */
    it('ne déborde pas sur les autres scènes', () => {
        useLightStore.getState().setSceneBrightness('SCENE_01', 40);
        expect(useLightStore.getState().scenes.SCENE_02.sceneBrightness).toBeUndefined();
    });

    it('ignore une scène qui n’existe pas', () => {
        const avant = useLightStore.getState().scenes;
        useLightStore.getState().setSceneBrightness('SCENE_99', 50);
        expect(useLightStore.getState().scenes).toBe(avant);
    });

    /** Effacer une tuile rend la scène neuve — son intensité comprise. */
    it('revient au défaut quand la scène est effacée', () => {
        useLightStore.getState().setSceneBrightness('SCENE_01', 40);
        useLightStore.getState().clearScene('SCENE_01');
        expect(useLightStore.getState().scenes.SCENE_01.sceneBrightness).toBe(INTENSITE_SCENE_DEFAUT);
    });

    /**
     * **Le curseur ne touche pas à ce qui a été capturé.** C'est toute la
     * différence avec la brillance réglée lampe par lampe : on baisse une
     * ambiance pour la soirée, et 100 % rend la scène d'origine.
     */
    it('ne réécrit pas la brillance enregistrée des lampes', () => {
        const lampes = {
            '1': { id: '1', name: 'L1', type: 'Color', state: { on: true, bri: 200 } },
        };
        useLightStore.getState().saveSceneSnapshot('SCENE_01', lampes);
        useLightStore.getState().setSceneBrightness('SCENE_01', 40);

        expect(useLightStore.getState().scenes.SCENE_01.lightStates['1'].bri).toBe(200);
    });
});

/**
 * Ce que ces tests protègent : **le pont Hue tient une dizaine de commandes par
 * seconde**, et un curseur traîné en émet une par pixel. Ce qui compte pour un
 * curseur, c'est la valeur où la main s'arrête — jamais celles du milieu.
 */
describe('le limiteur de cadence', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('laisse passer le premier geste tout de suite', () => {
        const envoyer = vi.fn();
        const limiter = creerLimiteur(150);

        limiter('1', () => envoyer(10));

        expect(envoyer).toHaveBeenCalledWith(10);
    });

    it('ne garde qu’un envoi par intervalle, et c’est le dernier demandé', () => {
        const envoyer = vi.fn();
        const limiter = creerLimiteur(150);

        limiter('1', () => envoyer(10));
        vi.advanceTimersByTime(20);
        limiter('1', () => envoyer(20));
        vi.advanceTimersByTime(20);
        limiter('1', () => envoyer(30));

        expect(envoyer).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(150);
        expect(envoyer).toHaveBeenCalledTimes(2);
        expect(envoyer).toHaveBeenLastCalledWith(30);
    });

    /** Deux lampes réglées coup sur coup ne se volent pas leur tour. */
    it('compte par clé', () => {
        const envoyer = vi.fn();
        const limiter = creerLimiteur(150);

        limiter('1', () => envoyer('lampe 1'));
        limiter('2', () => envoyer('lampe 2'));

        expect(envoyer).toHaveBeenCalledTimes(2);
    });

    /** *Un écran qui disparaît ne doit pas commander le pont depuis l'au-delà.* */
    it('oublie ce qui attend quand on l’annule', () => {
        const envoyer = vi.fn();
        const limiter = creerLimiteur(150);

        limiter('1', () => envoyer(10));
        limiter('1', () => envoyer(20));
        limiter.annuler();
        vi.advanceTimersByTime(500);

        expect(envoyer).toHaveBeenCalledTimes(1);
    });
});
